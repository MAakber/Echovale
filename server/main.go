package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	_ "modernc.org/sqlite"
)

// Memory 模型定义
type Memory struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Title             string  `json:"title"`
	Category          string  `json:"category"`
	Description       string  `json:"description"`
	AIPolishedStory   string  `json:"ai_polished_story"`
	Location          string  `json:"location"`
	Latitude          float64 `json:"latitude"`
	Longitude         float64 `json:"longitude"`
	Year              int     `json:"year"`
	OriginalImagePath string  `json:"original_image_path"`
	RestoredImagePath string  `json:"restored_image_path"`
	Author            string  `json:"author"`
	Tags              string  `json:"tags"` // 以逗号分隔
}

var db *gorm.DB

const aiProviderConfigPath = "ai_provider_config.json"

type openRouterConfig struct {
	ProviderName string `json:"provider_name"`
	APIKey       string `json:"api_key"`
	Model        string `json:"model"`
	BaseURL      string `json:"base_url"`
	SiteURL      string `json:"site_url"`
	SiteName     string `json:"site_name"`
}

type aiProviderSettings struct {
	Text      openRouterConfig      `json:"text"`
	Image     imageGenerationConfig `json:"image"`
	UpdatedAt time.Time             `json:"updated_at"`
}

var (
	aiProviderSettingsState aiProviderSettings
	aiProviderSettingsMu    sync.RWMutex
)

type imageGenerationConfig struct {
	ProviderName string `json:"provider_name"`
	APIKey       string `json:"api_key"`
	BaseURL      string `json:"base_url"`
	Model        string `json:"model"`
	Width        string `json:"width"`
	Height       string `json:"height"`
}

type openRouterMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openRouterRequest struct {
	Model       string              `json:"model"`
	Messages    []openRouterMessage `json:"messages"`
	Temperature float64             `json:"temperature,omitempty"`
	MaxTokens   int                 `json:"max_tokens,omitempty"`
}

type openRouterImageRequest struct {
	Model       string                   `json:"model"`
	Messages    []openRouterImageMessage `json:"messages"`
	Modalities  []string                 `json:"modalities,omitempty"`
	ImageConfig map[string]any           `json:"image_config,omitempty"`
	MaxTokens   int                      `json:"max_tokens,omitempty"`
}

type openRouterImageMessage struct {
	Role    string                       `json:"role"`
	Content []openRouterImageContentItem `json:"content"`
}

type openRouterImageContentItem struct {
	Type     string                    `json:"type"`
	Text     string                    `json:"text,omitempty"`
	ImageURL *openRouterImageURLObject `json:"image_url,omitempty"`
}

type openRouterImageURLObject struct {
	URL    string `json:"url"`
	Detail string `json:"detail,omitempty"`
}

type openRouterResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message  string `json:"message"`
		Metadata *struct {
			Raw          string `json:"raw"`
			ProviderName string `json:"provider_name"`
		} `json:"metadata"`
	} `json:"error"`
}

type openRouterImageResponse struct {
	Choices []struct {
		Message struct {
			Images []struct {
				ImageURL struct {
					URL string `json:"url"`
				} `json:"image_url"`
			} `json:"images"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message  string `json:"message"`
		Metadata *struct {
			Raw          string `json:"raw"`
			ProviderName string `json:"provider_name"`
		} `json:"metadata"`
	} `json:"error"`
}

type siliconFlowImageRequest struct {
	Model             string  `json:"model"`
	Prompt            string  `json:"prompt"`
	ImageSize         string  `json:"image_size"`
	BatchSize         int     `json:"batch_size,omitempty"`
	NumInferenceSteps int     `json:"num_inference_steps,omitempty"`
	GuidanceScale     float64 `json:"guidance_scale,omitempty"`
}

type siliconFlowImageResponse struct {
	Images []struct {
		URL string `json:"url"`
	} `json:"images"`
	Code    int    `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
}

func buildOpenRouterErrorMessage(message string, metadataRaw string, providerName string) string {
	message = strings.TrimSpace(message)
	metadataRaw = strings.TrimSpace(metadataRaw)
	providerName = strings.TrimSpace(providerName)

	if metadataRaw != "" {
		if providerName != "" {
			return fmt.Sprintf("%s (%s)", metadataRaw, providerName)
		}
		return metadataRaw
	}

	if providerName != "" && message != "" {
		return fmt.Sprintf("%s (%s)", message, providerName)
	}

	if message != "" {
		return message
	}

	return "unknown openrouter error"
}

func isSiliconFlowImageProvider(config imageGenerationConfig) bool {
	providerName := strings.ToLower(strings.TrimSpace(config.ProviderName))
	baseURL := strings.ToLower(strings.TrimSpace(config.BaseURL))
	model := strings.ToLower(strings.TrimSpace(config.Model))

	return strings.Contains(providerName, "siliconflow") ||
		strings.Contains(providerName, "硅基") ||
		strings.Contains(baseURL, "api.siliconflow.cn") ||
		strings.Contains(model, "kolors")
}

func buildSiliconFlowImageEndpoint(baseURL string) string {
	trimmed := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if strings.HasSuffix(strings.ToLower(trimmed), "/images/generations") {
		return trimmed
	}
	if strings.HasSuffix(strings.ToLower(trimmed), "/v1") {
		return trimmed + "/images/generations"
	}
	return trimmed + "/v1/images/generations"
}

func buildImageSize(config imageGenerationConfig) string {
	width := strings.TrimSpace(config.Width)
	height := strings.TrimSpace(config.Height)
	if width == "" || height == "" {
		return "1024x1024"
	}
	return width + "x" + height
}

func validateSiliconFlowImageConfig(config imageGenerationConfig) error {
	if !strings.Contains(strings.ToLower(strings.TrimSpace(config.Model)), "kolors") {
		return nil
	}

	imageSize := buildImageSize(config)
	allowedSizes := map[string]bool{
		"1024x1024": true,
		"960x1280":  true,
		"768x1024":  true,
		"720x1440":  true,
		"720x1280":  true,
	}

	if !allowedSizes[imageSize] {
		return fmt.Errorf("Kwai-Kolors/Kolors 当前不建议使用 %s；请改成 1024x1024、960x1280、768x1024、720x1440 或 720x1280", imageSize)
	}

	return nil
}

func generateVisualAssetWithSiliconFlow(ctx context.Context, config imageGenerationConfig, prompt, imageURL, mode string) (string, error) {
	if strings.TrimSpace(config.APIKey) == "" {
		return "", fmt.Errorf("SiliconFlow image api key is not configured")
	}
	if strings.TrimSpace(config.Model) == "" {
		return "", fmt.Errorf("SiliconFlow image model is not configured")
	}
	if err := validateSiliconFlowImageConfig(config); err != nil {
		return "", err
	}

	payload := siliconFlowImageRequest{
		Model:             config.Model,
		Prompt:            buildVisualGenerationPrompt(prompt, imageURL, mode),
		ImageSize:         buildImageSize(config),
		BatchSize:         1,
		NumInferenceSteps: 20,
		GuidanceScale:     7.5,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal siliconflow image request failed: %w", err)
	}

	endpoint := buildSiliconFlowImageEndpoint(config.BaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create siliconflow image request failed: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.APIKey)

	resp, responseBody, err := doJSONRequestWithRetry(&http.Client{Timeout: 120 * time.Second}, req, 2, "SiliconFlow")
	if err != nil {
		return "", fmt.Errorf("siliconflow image request failed: %w", err)
	}
	defer resp.Body.Close()

	var result siliconFlowImageResponse
	if err := json.Unmarshal(responseBody, &result); err != nil {
		return "", buildJSONDecodeError("decode siliconflow image response", resp.StatusCode, responseBody, err)
	}

	if resp.StatusCode >= http.StatusBadRequest {
		if strings.TrimSpace(result.Message) != "" {
			return "", fmt.Errorf("siliconflow image error: %s", strings.TrimSpace(result.Message))
		}
		return "", fmt.Errorf("siliconflow image error: status %d body %s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	if len(result.Images) == 0 || strings.TrimSpace(result.Images[0].URL) == "" {
		return "", fmt.Errorf("siliconflow returned no generated images")
	}

	return saveOpenRouterImageResult(ctx, result.Images[0].URL)
}

func buildJSONDecodeError(contextLabel string, statusCode int, responseBody []byte, err error) error {
	bodyText := strings.TrimSpace(string(responseBody))
	if len(bodyText) > 240 {
		bodyText = bodyText[:240] + "..."
	}

	if bodyText == "" {
		bodyText = "<empty body>"
	}

	return fmt.Errorf("%s failed: provider returned invalid or incomplete JSON (status %d, body %s): %w", contextLabel, statusCode, bodyText, err)
}

func isRetryableHTTPStatus(statusCode int) bool {
	switch statusCode {
	case http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout, 524:
		return true
	default:
		return false
	}
}

func buildUpstreamStatusError(providerName string, statusCode int, responseBody []byte) error {
	bodyText := strings.TrimSpace(string(responseBody))
	providerName = strings.TrimSpace(providerName)
	if providerName == "" {
		providerName = "上游服务"
	}

	if bodyText == "" {
		bodyText = "<empty body>"
	}

	if statusCode == 524 {
		return fmt.Errorf("%s 请求超时，上游长时间未返回有效响应 (status %d, body %s)", providerName, statusCode, bodyText)
	}

	return fmt.Errorf("%s 返回异常状态 (status %d, body %s)", providerName, statusCode, bodyText)
}

func doJSONRequestWithRetry(client *http.Client, req *http.Request, attempts int, providerName string) (*http.Response, []byte, error) {
	if attempts <= 0 {
		attempts = 1
	}

	var lastErr error
	for attempt := 1; attempt <= attempts; attempt++ {
		resp, err := doRequestWithRetry(client, req, 1, providerName)
		if err != nil {
			lastErr = err
			if attempt == attempts {
				break
			}
			time.Sleep(time.Duration(attempt) * 400 * time.Millisecond)
			continue
		}

		responseBody, readErr := io.ReadAll(resp.Body)
		resp.Body.Close()
		if readErr != nil {
			lastErr = fmt.Errorf("read response failed: %w", readErr)
			if attempt == attempts {
				break
			}
			time.Sleep(time.Duration(attempt) * 400 * time.Millisecond)
			continue
		}

		if isRetryableHTTPStatus(resp.StatusCode) {
			lastErr = buildUpstreamStatusError(providerName, resp.StatusCode, responseBody)
			if attempt == attempts {
				break
			}
			time.Sleep(time.Duration(attempt) * 600 * time.Millisecond)
			continue
		}

		resp.Body = io.NopCloser(bytes.NewReader(responseBody))
		return resp, responseBody, nil
	}

	return nil, nil, lastErr
}

type aiProcessRequest struct {
	ImageURL string `json:"image_url"`
	Prompt   string `json:"prompt"`
	Mode     string `json:"mode"`
}

type aiProcessResponse struct {
	RestoredURL   string `json:"restored_url"`
	PolishedStory string `json:"polished_story"`
}

type aiProviderTestRequest struct {
	Text     openRouterConfig      `json:"text"`
	Image    imageGenerationConfig `json:"image"`
	TestMode string                `json:"test_mode,omitempty"`
	ImageURL string                `json:"image_url,omitempty"`
}

type aiProviderTestResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	ProviderName string `json:"provider_name,omitempty"`
	Model        string `json:"model,omitempty"`
	SampleOutput string `json:"sample_output,omitempty"`
	PreviewURL   string `json:"preview_url,omitempty"`
	TestMode     string `json:"test_mode,omitempty"`
}

func loadEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("failed to open env file %s: %v", path, err)
		}
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		value = strings.Trim(value, "\"'")

		if key == "" || os.Getenv(key) != "" {
			continue
		}

		if err := os.Setenv(key, value); err != nil {
			log.Printf("failed to set env %s: %v", key, err)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("failed to read env file %s: %v", path, err)
	}
}

func defaultTextProviderConfig() openRouterConfig {
	model := os.Getenv("OPENROUTER_MODEL")
	if model == "" {
		model = "deepseek/deepseek-chat-v3-0324:free"
	}

	baseURL := os.Getenv("OPENROUTER_BASE_URL")
	if baseURL == "" {
		baseURL = "https://openrouter.ai/api/v1/chat/completions"
	}

	siteURL := os.Getenv("OPENROUTER_SITE_URL")
	if siteURL == "" {
		siteURL = "http://localhost:3000"
	}

	siteName := os.Getenv("OPENROUTER_SITE_NAME")
	if siteName == "" {
		siteName = "乡村回响"
	}

	return openRouterConfig{
		ProviderName: "OpenRouter",
		APIKey:       strings.TrimSpace(os.Getenv("OPENROUTER_API_KEY")),
		Model:        model,
		BaseURL:      baseURL,
		SiteURL:      siteURL,
		SiteName:     siteName,
	}
}

func defaultImageGenerationConfig() imageGenerationConfig {
	baseURL := strings.TrimSpace(os.Getenv("AI_IMAGE_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://image.pollinations.ai/prompt"
	}

	apiKey := strings.TrimSpace(os.Getenv("AI_IMAGE_API_KEY"))

	model := strings.TrimSpace(os.Getenv("AI_IMAGE_MODEL"))
	if model == "" {
		model = "flux"
	}

	width := strings.TrimSpace(os.Getenv("AI_IMAGE_WIDTH"))
	if width == "" {
		width = "1024"
	}

	height := strings.TrimSpace(os.Getenv("AI_IMAGE_HEIGHT"))
	if height == "" {
		height = "768"
	}

	return imageGenerationConfig{
		ProviderName: "Pollinations",
		APIKey:       apiKey,
		BaseURL:      baseURL,
		Model:        model,
		Width:        width,
		Height:       height,
	}
}

func normalizeTextProviderConfig(config openRouterConfig) openRouterConfig {
	defaultConfig := defaultTextProviderConfig()
	config.ProviderName = strings.TrimSpace(config.ProviderName)
	if config.ProviderName == "" {
		config.ProviderName = defaultConfig.ProviderName
	}
	config.APIKey = strings.TrimSpace(config.APIKey)
	config.Model = strings.TrimSpace(config.Model)
	if config.Model == "" {
		config.Model = defaultConfig.Model
	}
	config.BaseURL = strings.TrimSpace(config.BaseURL)
	if config.BaseURL == "" {
		config.BaseURL = defaultConfig.BaseURL
	}
	config.SiteURL = strings.TrimSpace(config.SiteURL)
	if config.SiteURL == "" {
		config.SiteURL = defaultConfig.SiteURL
	}
	config.SiteName = strings.TrimSpace(config.SiteName)
	if config.SiteName == "" {
		config.SiteName = defaultConfig.SiteName
	}
	return config
}

func normalizeImageGenerationConfig(config imageGenerationConfig) imageGenerationConfig {
	defaultConfig := defaultImageGenerationConfig()
	config.ProviderName = strings.TrimSpace(config.ProviderName)
	if config.ProviderName == "" {
		config.ProviderName = defaultConfig.ProviderName
	}
	config.APIKey = strings.TrimSpace(config.APIKey)
	if config.APIKey == "" && isOpenRouterImageProvider(config) {
		config.APIKey = defaultConfig.APIKey
	}
	config.BaseURL = strings.TrimSpace(config.BaseURL)
	if config.BaseURL == "" {
		config.BaseURL = defaultConfig.BaseURL
	}
	config.Model = strings.TrimSpace(config.Model)
	if config.Model == "" {
		config.Model = defaultConfig.Model
	}
	config.Width = strings.TrimSpace(config.Width)
	if config.Width == "" {
		config.Width = defaultConfig.Width
	}
	config.Height = strings.TrimSpace(config.Height)
	if config.Height == "" {
		config.Height = defaultConfig.Height
	}
	return config
}

func normalizeAIProviderSettings(config aiProviderSettings) aiProviderSettings {
	config.Text = normalizeTextProviderConfig(config.Text)
	config.Image = normalizeImageGenerationConfig(config.Image)
	if config.UpdatedAt.IsZero() {
		config.UpdatedAt = time.Now()
	}
	return config
}

func defaultAIProviderSettings() aiProviderSettings {
	return normalizeAIProviderSettings(aiProviderSettings{
		Text:  defaultTextProviderConfig(),
		Image: defaultImageGenerationConfig(),
	})
}

func saveAIProviderSettings(config aiProviderSettings) error {
	normalized := normalizeAIProviderSettings(config)
	encoded, err := json.MarshalIndent(normalized, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal ai provider settings failed: %w", err)
	}
	if err := os.WriteFile(aiProviderConfigPath, encoded, 0o600); err != nil {
		return fmt.Errorf("write ai provider settings failed: %w", err)
	}
	return nil
}

func loadAIProviderSettings() {
	defaults := defaultAIProviderSettings()
	content, err := os.ReadFile(aiProviderConfigPath)
	if err != nil {
		if os.IsNotExist(err) {
			aiProviderSettingsState = defaults
			if err := saveAIProviderSettings(defaults); err != nil {
				log.Printf("failed to initialize ai provider config: %v", err)
			}
			return
		}
		log.Printf("failed to read ai provider config, using defaults: %v", err)
		aiProviderSettingsState = defaults
		return
	}

	var config aiProviderSettings
	if err := json.Unmarshal(content, &config); err != nil {
		log.Printf("failed to parse ai provider config, using defaults: %v", err)
		aiProviderSettingsState = defaults
		return
	}

	aiProviderSettingsState = normalizeAIProviderSettings(config)
}

func getAIProviderSettings() aiProviderSettings {
	aiProviderSettingsMu.RLock()
	defer aiProviderSettingsMu.RUnlock()
	return aiProviderSettingsState
}

func updateAIProviderSettings(config aiProviderSettings) error {
	normalized := normalizeAIProviderSettings(config)
	if err := saveAIProviderSettings(normalized); err != nil {
		return err
	}
	aiProviderSettingsMu.Lock()
	aiProviderSettingsState = normalized
	aiProviderSettingsMu.Unlock()
	return nil
}

func getOpenRouterConfig() openRouterConfig {
	return getAIProviderSettings().Text
}

func getImageGenerationConfig() imageGenerationConfig {
	return getAIProviderSettings().Image
}

func getServerPort() string {
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		return "8080"
	}
	return port
}

func buildMemoryPolishPrompt(rawText string) string {
	return fmt.Sprintf(`请将以下乡村记忆素材整理并润色为一段适合公开展示的中文叙事文本。

要求：
1. 保留原始事实，不捏造具体人物、年份、地名等未提供的信息。
2. 风格自然、真诚、有文学感，但不要浮夸。
3. 输出 180 到 320 字。
4. 只输出润色后的正文，不要标题、注释、分点或免责声明。

原始素材：
%s`, strings.TrimSpace(rawText))
}

func normalizeCreativeMode(mode string) string {
	switch strings.TrimSpace(mode) {
	case "deepseek", "tongyi", "spark":
		return strings.TrimSpace(mode)
	default:
		return "deepseek"
	}
}

func buildVisualGenerationPrompt(rawText, imageURL, mode string) string {
	basePrompt := strings.TrimSpace(rawText)
	if basePrompt == "" {
		basePrompt = "乡村文化记忆视觉重构"
	}

	stylePrompt := "documentary photography, rural China, cinematic light, detailed textures, authentic atmosphere"
	switch normalizeCreativeMode(mode) {
	case "tongyi":
		stylePrompt = "visual reconstruction, rural China, restored old photo, cinematic realism, warm natural light, highly detailed"
	case "spark":
		stylePrompt = "folk storytelling illustration, rural China, oral history mood, warm atmosphere, handcrafted details, expressive composition"
	}

	if imageURL != "" {
		return fmt.Sprintf("%s. Inspired by an uploaded archival image. %s", basePrompt, stylePrompt)
	}

	return fmt.Sprintf("%s. %s", basePrompt, stylePrompt)
}

func isOpenRouterImageProvider(config imageGenerationConfig) bool {
	providerName := strings.ToLower(strings.TrimSpace(config.ProviderName))
	baseURL := strings.ToLower(strings.TrimSpace(config.BaseURL))
	return strings.Contains(providerName, "openrouter") || strings.Contains(baseURL, "openrouter.ai")
}

func supportsNativeImageToImage(config imageGenerationConfig) bool {
	return isOpenRouterImageProvider(config)
}

func buildAspectRatio(width, height string) string {
	widthValue, err := strconv.Atoi(strings.TrimSpace(width))
	if err != nil || widthValue <= 0 {
		return ""
	}

	heightValue, err := strconv.Atoi(strings.TrimSpace(height))
	if err != nil || heightValue <= 0 {
		return ""
	}

	divisor := greatestCommonDivisor(widthValue, heightValue)
	if divisor <= 0 {
		return ""
	}

	return fmt.Sprintf("%d:%d", widthValue/divisor, heightValue/divisor)
}

func greatestCommonDivisor(left, right int) int {
	for right != 0 {
		left, right = right, left%right
	}
	if left < 0 {
		return -left
	}
	return left
}

func buildOpenRouterImageConfig(config imageGenerationConfig) map[string]any {
	imageConfig := map[string]any{}

	if aspectRatio := buildAspectRatio(config.Width, config.Height); aspectRatio != "" {
		imageConfig["aspect_ratio"] = aspectRatio
	}

	if widthValue, err := strconv.Atoi(strings.TrimSpace(config.Width)); err == nil && widthValue > 0 {
		imageConfig["width"] = widthValue
	}

	if heightValue, err := strconv.Atoi(strings.TrimSpace(config.Height)); err == nil && heightValue > 0 {
		imageConfig["height"] = heightValue
	}

	if len(imageConfig) == 0 {
		return nil
	}

	return imageConfig
}

func buildOpenRouterImageMessages(prompt, imageURL, mode string) []openRouterImageMessage {
	content := []openRouterImageContentItem{
		{
			Type: "text",
			Text: buildVisualGenerationPrompt(prompt, imageURL, mode),
		},
	}

	if strings.TrimSpace(imageURL) != "" {
		content = append(content, openRouterImageContentItem{
			Type: "image_url",
			ImageURL: &openRouterImageURLObject{
				URL:    imageURL,
				Detail: "high",
			},
		})
	}

	return []openRouterImageMessage{{
		Role:    "user",
		Content: content,
	}}
}

func detectImageExtension(contentType string) string {
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		mediaType = contentType
	}

	switch mediaType {
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/jpeg":
		return ".jpg"
	default:
		return ".jpg"
	}
}

func saveGeneratedImage(contentType string, imageBytes []byte) (string, error) {
	if len(imageBytes) == 0 {
		return "", fmt.Errorf("image generation returned empty body")
	}

	uploadDir := filepath.Join("..", "client", "public", "uploads")
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return "", fmt.Errorf("create uploads directory failed: %w", err)
	}

	fileName := "ai-" + uuid.New().String() + detectImageExtension(contentType)
	filePath := filepath.Join(uploadDir, fileName)
	if err := os.WriteFile(filePath, imageBytes, 0o644); err != nil {
		return "", fmt.Errorf("save generated image failed: %w", err)
	}

	return "/uploads/" + fileName, nil
}

func decodeDataURLImage(dataURL string) (string, []byte, error) {
	parts := strings.SplitN(dataURL, ",", 2)
	if len(parts) != 2 {
		return "", nil, fmt.Errorf("invalid data url")
	}

	metadata := parts[0]
	if !strings.HasPrefix(metadata, "data:") {
		return "", nil, fmt.Errorf("invalid data url metadata")
	}

	contentType := "image/png"
	mediaDescriptor := strings.TrimPrefix(metadata, "data:")
	if separator := strings.Index(mediaDescriptor, ";"); separator >= 0 {
		if strings.TrimSpace(mediaDescriptor[:separator]) != "" {
			contentType = strings.TrimSpace(mediaDescriptor[:separator])
		}
	} else if strings.TrimSpace(mediaDescriptor) != "" {
		contentType = strings.TrimSpace(mediaDescriptor)
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", nil, fmt.Errorf("decode image data failed: %w", err)
	}

	return contentType, decoded, nil
}

func downloadRemoteImage(ctx context.Context, imageURL string) (string, []byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return "", nil, fmt.Errorf("create image download request failed: %w", err)
	}

	resp, err := (&http.Client{Timeout: 90 * time.Second}).Do(req)
	if err != nil {
		return "", nil, fmt.Errorf("download generated image failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		responseBody, _ := io.ReadAll(resp.Body)
		return "", nil, fmt.Errorf("download generated image error: status %d body %s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	imageBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, fmt.Errorf("read downloaded image failed: %w", err)
	}

	return resp.Header.Get("Content-Type"), imageBytes, nil
}

func saveOpenRouterImageResult(ctx context.Context, rawURL string) (string, error) {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return "", fmt.Errorf("openrouter returned empty image url")
	}

	if strings.HasPrefix(rawURL, "data:image/") {
		contentType, imageBytes, err := decodeDataURLImage(rawURL)
		if err != nil {
			return "", err
		}
		return saveGeneratedImage(contentType, imageBytes)
	}

	contentType, imageBytes, err := downloadRemoteImage(ctx, rawURL)
	if err != nil {
		return "", err
	}
	return saveGeneratedImage(contentType, imageBytes)
}

func isTransientUpstreamError(err error) bool {
	if err == nil {
		return false
	}

	message := strings.ToLower(err.Error())
	return strings.Contains(message, "eof") ||
		strings.Contains(message, "connection reset") ||
		strings.Contains(message, "forcibly closed") ||
		strings.Contains(message, "timeout") ||
		strings.Contains(message, "unexpected eof")
}

func describeUpstreamRequestError(providerName string, err error) error {
	if err == nil {
		return nil
	}

	providerName = strings.TrimSpace(providerName)
	if providerName == "" {
		providerName = "上游服务"
	}

	if isTransientUpstreamError(err) {
		return fmt.Errorf("%s 连接被提前关闭，通常是代理、网络抖动或上游服务瞬时中断: %w", providerName, err)
	}

	return err
}

func doRequestWithRetry(client *http.Client, req *http.Request, attempts int, providerName string) (*http.Response, error) {
	if attempts <= 0 {
		attempts = 1
	}

	var lastErr error
	for attempt := 1; attempt <= attempts; attempt++ {
		resp, err := client.Do(req)
		if err == nil {
			return resp, nil
		}

		lastErr = err
		if !isTransientUpstreamError(err) || attempt == attempts {
			break
		}

		time.Sleep(time.Duration(attempt) * 400 * time.Millisecond)
	}

	return nil, describeUpstreamRequestError(providerName, lastErr)
}

func generateVisualAssetWithOpenRouter(ctx context.Context, config imageGenerationConfig, prompt, imageURL, mode string) (string, error) {
	if config.APIKey == "" {
		return "", fmt.Errorf("OPENROUTER image api key is not configured")
	}
	if strings.TrimSpace(config.Model) == "" {
		return "", fmt.Errorf("OPENROUTER image model is not configured")
	}

	payload := openRouterImageRequest{
		Model:      config.Model,
		Messages:   buildOpenRouterImageMessages(prompt, imageURL, mode),
		Modalities: []string{"text", "image"},
		MaxTokens:  300,
	}

	if imageConfig := buildOpenRouterImageConfig(config); imageConfig != nil {
		payload.ImageConfig = imageConfig
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal openrouter image request failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, config.BaseURL, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create openrouter image request failed: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.APIKey)
	req.Header.Set("HTTP-Referer", getOpenRouterConfig().SiteURL)
	req.Header.Set("X-Title", getOpenRouterConfig().SiteName)

	resp, responseBody, err := doJSONRequestWithRetry(&http.Client{Timeout: 120 * time.Second}, req, 2, "OpenRouter")
	if err != nil {
		return "", fmt.Errorf("openrouter image request failed: %w", err)
	}
	defer resp.Body.Close()

	var result openRouterImageResponse
	if err := json.Unmarshal(responseBody, &result); err != nil {
		return "", buildJSONDecodeError("decode openrouter image response", resp.StatusCode, responseBody, err)
	}

	if resp.StatusCode >= http.StatusBadRequest {
		if result.Error != nil && result.Error.Message != "" {
			return "", fmt.Errorf("openrouter image error: %s", buildOpenRouterErrorMessage(result.Error.Message, result.Error.Metadata.Raw, result.Error.Metadata.ProviderName))
		}
		return "", fmt.Errorf("openrouter image error: status %d body %s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	if len(result.Choices) == 0 || len(result.Choices[0].Message.Images) == 0 {
		return "", fmt.Errorf("openrouter returned no generated images")
	}

	return saveOpenRouterImageResult(ctx, result.Choices[0].Message.Images[0].ImageURL.URL)
}

func generateVisualAsset(ctx context.Context, prompt, imageURL, mode string) (string, error) {
	config := getImageGenerationConfig()
	return generateVisualAssetWithConfig(ctx, config, prompt, imageURL, mode)
}

func generateVisualAssetWithConfig(ctx context.Context, config imageGenerationConfig, prompt, imageURL, mode string) (string, error) {
	if isOpenRouterImageProvider(config) {
		return generateVisualAssetWithOpenRouter(ctx, config, prompt, imageURL, mode)
	}
	if isSiliconFlowImageProvider(config) {
		return generateVisualAssetWithSiliconFlow(ctx, config, prompt, imageURL, mode)
	}

	visualPrompt := buildVisualGenerationPrompt(prompt, imageURL, mode)
	requestURL := fmt.Sprintf("%s/%s?model=%s&width=%s&height=%s&nologo=true", strings.TrimRight(config.BaseURL, "/"), url.PathEscape(visualPrompt), url.QueryEscape(config.Model), url.QueryEscape(config.Width), url.QueryEscape(config.Height))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return "", fmt.Errorf("create image request failed: %w", err)
	}
	req.Header.Set("Accept", "image/*")
	if config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+config.APIKey)
	}

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := doRequestWithRetry(client, req, 2, config.ProviderName)
	if err != nil {
		return "", fmt.Errorf("image generation request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		responseBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("image generation error: status %d body %s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	imageBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read image response failed: %w", err)
	}
	if len(imageBytes) == 0 {
		return "", fmt.Errorf("image generation returned empty body")
	}

	return saveGeneratedImage(resp.Header.Get("Content-Type"), imageBytes)
}

func polishMemoryStoryWithOpenRouter(ctx context.Context, prompt string) (string, error) {
	config := getOpenRouterConfig()
	return polishMemoryStoryWithConfig(ctx, config, prompt)
}

func polishMemoryStoryWithConfig(ctx context.Context, config openRouterConfig, prompt string) (string, error) {
	if config.APIKey == "" {
		return "", fmt.Errorf("OPENROUTER_API_KEY is not configured")
	}

	payload := openRouterRequest{
		Model: config.Model,
		Messages: []openRouterMessage{
			{
				Role:    "system",
				Content: "你是乡村文化记忆整理助手，擅长把口述与碎片化素材整理成适合展示的中文叙事文本。",
			},
			{
				Role:    "user",
				Content: buildMemoryPolishPrompt(prompt),
			},
		},
		Temperature: 0.7,
		MaxTokens:   500,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal request failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, config.BaseURL, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create request failed: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.APIKey)
	req.Header.Set("HTTP-Referer", config.SiteURL)
	req.Header.Set("X-Title", config.SiteName)

	client := &http.Client{Timeout: 45 * time.Second}
	resp, responseBody, err := doJSONRequestWithRetry(client, req, 2, config.ProviderName)
	if err != nil {
		return "", fmt.Errorf("openrouter request failed: %w", err)
	}
	defer resp.Body.Close()

	var result openRouterResponse
	if err := json.Unmarshal(responseBody, &result); err != nil {
		return "", buildJSONDecodeError("decode response", resp.StatusCode, responseBody, err)
	}

	if resp.StatusCode >= http.StatusBadRequest {
		if result.Error != nil && result.Error.Message != "" {
			return "", fmt.Errorf("openrouter error: %s", buildOpenRouterErrorMessage(result.Error.Message, result.Error.Metadata.Raw, result.Error.Metadata.ProviderName))
		}
		return "", fmt.Errorf("openrouter error: status %d", resp.StatusCode)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("openrouter returned no choices")
	}

	content := strings.TrimSpace(result.Choices[0].Message.Content)
	if content == "" {
		return "", fmt.Errorf("openrouter returned empty content")
	}

	return content, nil
}

func initDB() {
	var err error
	// 使用绝对路径，确保数据库文件在项目目录下
	dbPath := filepath.Join("..", "server", "cultural_memory.db")
	db, err = gorm.Open(sqlite.Dialector{
		DriverName: "sqlite",
		DSN:        dbPath,
	}, &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// 自动迁移
	db.AutoMigrate(&Memory{})
	seedDefaultMemories(db)
}

func main() {
	loadEnvFile(".env")
	loadAIProviderSettings()
	initDB()
	config := getAIProviderSettings()
	port := getServerPort()

	r := gin.Default()

	// 配置 CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API 分组
	v1 := r.Group("/api/v1")
	{
		v1.GET("/memories", getMemories)
		v1.GET("/memories/:id", getMemoryDetail)
		v1.POST("/memories", createMemory)
		v1.PUT("/memories/:id", updateMemory)
		v1.DELETE("/memories/:id", deleteMemory)
		v1.POST("/upload", uploadFile)
		v1.POST("/process-ai", processAIMemory)
		v1.GET("/admin/ai-providers", getAIProviders)
		v1.PUT("/admin/ai-providers", updateAIProviders)
		v1.POST("/admin/ai-providers/test-text", testTextAIProvider)
		v1.POST("/admin/ai-providers/test-image", testImageAIProvider)
	}

	// 静态文件服务
	r.Static("/gallery", "./public/gallery")
	r.Static("/placeholders", "./public/placeholders")
	r.Static("/uploads", "../client/public/uploads")

	log.Printf("Text provider configured: %s / %s", config.Text.ProviderName, config.Text.Model)
	log.Printf("Image provider configured: %s / %s", config.Image.ProviderName, config.Image.Model)
	log.Printf("Server starting on http://localhost:%s...", port)
	r.Run(":" + port)
}

func getAIProviders(c *gin.Context) {
	c.JSON(http.StatusOK, getAIProviderSettings())
}

func updateAIProviders(c *gin.Context) {
	var payload aiProviderSettings
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := updateAIProviderSettings(payload); err != nil {
		log.Printf("failed to update ai provider settings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存 AI 配置失败"})
		return
	}

	c.JSON(http.StatusOK, getAIProviderSettings())
}

func testTextAIProvider(c *gin.Context) {
	var payload aiProviderTestRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config := normalizeTextProviderConfig(payload.Text)
	ctx, cancel := context.WithTimeout(c.Request.Context(), 45*time.Second)
	defer cancel()

	story, err := polishMemoryStoryWithConfig(ctx, config, "这是一次 AI 文本供应商测试。请只输出一句简短中文，明确说明接口可用。")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, aiProviderTestResponse{
		Success:      true,
		Message:      "文本供应商测试成功",
		ProviderName: config.ProviderName,
		Model:        config.Model,
		SampleOutput: story,
	})
}

func testImageAIProvider(c *gin.Context) {
	var payload aiProviderTestRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config := normalizeImageGenerationConfig(payload.Image)
	testMode := strings.TrimSpace(strings.ToLower(payload.TestMode))
	if testMode == "" {
		testMode = "text-to-image"
	}

	testPrompt := "乡村田野、白墙黛瓦、晴天、真实摄影感"
	imageURL := strings.TrimSpace(payload.ImageURL)
	if testMode == "image-to-image" {
		if !supportsNativeImageToImage(config) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "当前图片供应商不支持原生图生图测试。请改用支持参考图输入的供应商，例如 OpenRouter 图片模型。"})
			return
		}
		if imageURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "图生图测试需要先上传一张参考图片"})
			return
		}
		testPrompt = "请参考上传的乡村老照片，生成一张保留原始场景气质、构图更完整、细节更清晰的乡村画面"
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 120*time.Second)
	defer cancel()

	previewURL, err := generateVisualAssetWithConfig(ctx, config, testPrompt, imageURL, "deepseek")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := "图片供应商测试成功"
	if testMode == "image-to-image" {
		message = "图生图测试成功"
	}

	c.JSON(http.StatusOK, aiProviderTestResponse{
		Success:      true,
		Message:      message,
		ProviderName: config.ProviderName,
		Model:        config.Model,
		PreviewURL:   previewURL,
		TestMode:     testMode,
	})
}

func getMemories(c *gin.Context) {
	category := c.Query("category")
	var memories []Memory
	query := db.Order("created_at desc")
	if category != "" && category != "全部" {
		query = query.Where("category = ?", category)
	}
	query.Find(&memories)
	c.JSON(http.StatusOK, memories)
}

func getMemoryDetail(c *gin.Context) {
	id := c.Param("id")
	var memory Memory
	if err := db.First(&memory, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Memory not found"})
		return
	}
	c.JSON(http.StatusOK, memory)
}

func createMemory(c *gin.Context) {
	var memory Memory
	if err := c.ShouldBindJSON(&memory); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Create(&memory)
	c.JSON(http.StatusCreated, memory)
}

func updateMemory(c *gin.Context) {
	id := c.Param("id")

	var existing Memory
	if err := db.First(&existing, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Memory not found"})
		return
	}

	var payload Memory
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing.Title = payload.Title
	existing.Category = payload.Category
	existing.Description = payload.Description
	existing.AIPolishedStory = payload.AIPolishedStory
	existing.Location = payload.Location
	existing.Latitude = payload.Latitude
	existing.Longitude = payload.Longitude
	existing.Year = payload.Year
	existing.OriginalImagePath = payload.OriginalImagePath
	existing.RestoredImagePath = payload.RestoredImagePath
	existing.Author = payload.Author
	existing.Tags = payload.Tags

	if err := db.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update memory"})
		return
	}

	c.JSON(http.StatusOK, existing)
}

func deleteMemory(c *gin.Context) {
	id := c.Param("id")

	var memory Memory
	if err := db.First(&memory, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Memory not found"})
		return
	}

	if err := db.Delete(&memory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete memory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

func uploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file is received"})
		return
	}

	// 生成唯一文件名
	extension := filepath.Ext(file.Filename)
	newFileName := uuid.New().String() + extension

	// 设置保存路径
	path := filepath.Join("../client/public/uploads", newFileName)

	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save the file"})
		return
	}

	// 返回可访问的 URL
	// 注意：在前端访问时可以是 /uploads/filename
	c.JSON(http.StatusOK, gin.H{
		"url": fmt.Sprintf("/uploads/%s", newFileName),
	})
}

func processAIMemory(c *gin.Context) {
	var req aiProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if strings.TrimSpace(req.Prompt) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prompt is required"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 120*time.Second)
	defer cancel()

	generatedImageURL, err := generateVisualAsset(ctx, req.Prompt, req.ImageURL, req.Mode)
	if err != nil {
		log.Printf("AI image generation failed: %v", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI 图片创作失败，请稍后重试"})
		return
	}

	polishedStory, err := polishMemoryStoryWithOpenRouter(ctx, req.Prompt)
	if err != nil {
		log.Printf("AI processing failed: %v", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI 文本创作失败，请检查供应商配置或稍后重试"})
		return
	}

	c.JSON(http.StatusOK, aiProcessResponse{
		RestoredURL:   generatedImageURL,
		PolishedStory: polishedStory,
	})
}
