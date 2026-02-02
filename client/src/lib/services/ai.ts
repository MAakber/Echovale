/**
 * AI 服务封装类 - 适配大赛规定的国产 AI 工具
 * 以 DeepSeek 为例，其 API 格式通常与 OpenAI 兼容
 */

export interface AIServiceResponse {
  content: string;
  error?: string;
}

export class AIService {
  private static apiKey = process.env.AI_API_KEY || "";
  private static baseUrl = process.env.AI_BASE_URL || "https://api.deepseek.com/v1"; // 示例地址

  /**
   * 润色记忆描述/故事
   * @param rawText 原始口述或简单记录
   */
  static async polishMemoryStory(rawText: string): Promise<AIServiceResponse> {
    try {
      // 这里的实现逻辑后续可以根据具体的 API 文档进行调整
      // 大赛评审重点在于作者如何组合与优化 AI 工具的技能
      const prompt = `你是一位乡村文化研究专家。请将以下这段关于乡村记忆的碎片化文字，润色成一段优美、生动且富有文化底蕴的文字描述：\n\n${rawText}`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat", // 使用 DeepSeek 示例模型
          messages: [
            { role: "system", content: "你是一个专业的文学修饰助手。" },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return { content: data.choices[0].message.content };
    } catch (error) {
      console.error("AI Service Error:", error);
      return { content: "", error: "AI 处理失败，请检查网络或配置" };
    }
  }

  /**
   * 模拟图像生成请求 (如通义万相或文心一格)
   */
  static async generateCultureImage(description: string): Promise<AIServiceResponse> {
    // 实际代码中需要调用阿里通义或百度文心的图像生成 API
    return { content: "Image generation logic placeholder" };
  }
}
