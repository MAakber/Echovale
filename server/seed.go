package main

import (
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

const legacyOriginalImagePlaceholderPath = "/placeholders/rural-memory.jpg"

func seedDefaultMemories(database *gorm.DB) {
	seedMemories := []Memory{
		{
			Title:             "古村落的晨曦",
			Category:          "建筑",
			Description:       "徽派建筑的独特韵律，在现代 AI 的笔触下焕发新生。白墙黑瓦，倒映在南湖的晨光中。",
			AIPolishedStory:   "宏村坐落于黄山西南麓，白墙黑瓦与月沼水系构成了典型的徽派村落景观。数字采集中，我们重点保留了马头墙、巷道尺度与水口空间的肌理，让这座古村在屏幕上依然保持晨曦初照时的宁静质感。\n\n借助 AI 图像增强与细节重建，原本模糊的屋檐线条、粉墙阴影和湖面倒影被重新整理，既还原了古村的空间秩序，也让人更容易理解传统聚落与自然环境之间的共生关系。",
			Location:          "安徽 宏村",
			Latitude:          30.2722,
			Longitude:         117.9922,
			Year:              2024,
			OriginalImagePath: "",
			RestoredImagePath: "/gallery/hongcun.jpg",
			Author:            "记忆守护者 - 小林",
			Tags:              "徽派建筑,世界文化遗产,数字修复",
			CreatedAt:         mustParseSeedTime("2024-03-20T09:00:00+08:00"),
		},
		{
			Title:             "皮影戏：光影传说",
			Category:          "非遗",
			Description:       "跳动的指尖，诉说着千年的故事。数字修复让模糊的皮影纹理重新清晰，留住这门艺术的灵魂。",
			AIPolishedStory:   "皮影戏在一方幕布之后展开山河人物，也承载着地方语言、民间唱腔与口述传统。对这类非遗记忆的数字化，不只是保存一个演出场景，更是在保存一种代际传承的叙事方式。\n\n这组图像修复重点提升了人物剪影、镂空纹样和灯光层次，使幕后操偶与台前表演的关系更清晰，也让年轻观众能通过屏幕重新感受到光影戏的节奏与张力。",
			Location:          "陕西 华县",
			Latitude:          34.5111,
			Longitude:         109.7614,
			Year:              2024,
			OriginalImagePath: "",
			RestoredImagePath: "/gallery/shadow-play.jpg",
			Author:            "记忆守护者 - 阿禾",
			Tags:              "皮影戏,非遗保护,光影表演",
			CreatedAt:         mustParseSeedTime("2024-04-02T09:00:00+08:00"),
		},
		{
			Title:             "梯田上的歌谣",
			Category:          "民俗",
			Description:       "层层叠叠的梯田，是大地最美的指纹。哈尼族先民的智慧，在数字三维建模中展现无遗。",
			AIPolishedStory:   "元阳梯田是人与山地环境长期协作形成的复合景观，田埂、水渠、村寨和森林共同构成完整的生产生活系统。数字记忆的意义，在于把这种整体性的生态智慧以更直观的方式呈现出来。\n\n通过多帧拼接与色彩校正，晨雾、水面反光和坡地层次被稳定保留下来，既展示了梯田的几何之美，也记录了劳动与节令在乡村日常中的位置。",
			Location:          "云南 元阳",
			Latitude:          23.1281,
			Longitude:         102.7426,
			Year:              2024,
			OriginalImagePath: "",
			RestoredImagePath: "/gallery/yuanyang-terrace.jpg",
			Author:            "记忆守护者 - 山禾",
			Tags:              "哈尼梯田,农耕文明,景观记忆",
			CreatedAt:         mustParseSeedTime("2024-05-18T09:00:00+08:00"),
		},
		{
			Title:             "老街的旧时光",
			Category:          "建筑",
			Description:       "红砖厝里，藏着下南洋的故事。AI 对老街色彩的精准还原，带你回到那个红火的时代。",
			AIPolishedStory:   "泉州老城的街巷保留着海丝贸易留下的城市纹理，燕尾脊、红砖墙与骑楼空间共同构成了闽南建筑的鲜明气质。数字化采集不仅关注建筑立面，也关注街道如何组织商业、宗教与邻里交往。\n\n本次修复重点提升了砖石质感、檐口线条和街道纵深，使老街从单纯的旧照片变成可被阅读的空间档案，帮助观者理解一座沿海城市与乡土文化之间的联系。",
			Location:          "福建 泉州",
			Latitude:          24.8741,
			Longitude:         118.6757,
			Year:              2024,
			OriginalImagePath: "",
			RestoredImagePath: "/gallery/quanzhou-old-street.jpg",
			Author:            "记忆守护者 - 清越",
			Tags:              "闽南建筑,海丝文化,街巷更新",
			CreatedAt:         mustParseSeedTime("2024-06-09T09:00:00+08:00"),
		},
		{
			Title:             "苗寨银饰盛装",
			Category:          "非遗",
			Description:       "精美绝伦的银饰，承载着民族的信仰。超清晰影像建模，让每一处錾刻纹样都清晰可见。",
			AIPolishedStory:   "西江千户苗寨不仅保留了聚落形态，也延续着服饰、银饰与节庆礼仪的审美系统。银角、项圈与胸牌等饰件在节日盛装中层层叠加，折射出苗族工艺的复杂度与象征意义。\n\n在数字整理过程中，我们把注意力放在服饰层次、寨坡轮廓和典型木构民居的背景关系上，使人物与村寨空间能够共同呈现，形成更完整的文化记忆画面。",
			Location:          "贵州 西江",
			Latitude:          26.4980,
			Longitude:         108.1917,
			Year:              2024,
			OriginalImagePath: "",
			RestoredImagePath: "/gallery/xijiang-miao-village.jpg",
			Author:            "记忆守护者 - 阿锦",
			Tags:              "苗族银饰,西江千户苗寨,服饰非遗",
			CreatedAt:         mustParseSeedTime("2024-07-01T09:00:00+08:00"),
		},
		{
			Title:             "窑火传承：寻找瓷魂",
			Category:          "非遗",
			Description:       "炉火纯青的背后，是匠人一生的坚守。数字孪生技术记录了瓷源的演化与重构过程。",
			AIPolishedStory:   "景德镇的陶瓷传统连接着原料开采、成型绘制、入窑烧造到流通传播的完整链条。对窑火文化进行数字记忆整理，不只是拍下器物成品，更要呈现工艺背后的时间感与劳动密度。\n\n这张图像以城市文化地标为入口，延伸到瓷都工艺的历史脉络。通过局部清晰化与色彩平衡，画面更适合作为展陈封面，也为后续补充陶瓷器物、窑址和匠人影像留出了统一的视觉基调。",
			Location:          "江西 景德镇",
			Latitude:          29.2687,
			Longitude:         117.1784,
			Year:              2024,
			OriginalImagePath: "",
			RestoredImagePath: "/gallery/jingdezhen.jpg",
			Author:            "记忆守护者 - 景澄",
			Tags:              "景德镇,制瓷工艺,窑火文化",
			CreatedAt:         mustParseSeedTime("2024-08-11T09:00:00+08:00"),
		},
	}

	titles := make([]string, 0, len(seedMemories))
	for _, memory := range seedMemories {
		titles = append(titles, memory.Title)
	}

	existingTitles := make([]string, 0, len(seedMemories))
	if err := database.Model(&Memory{}).Where("title IN ?", titles).Pluck("title", &existingTitles).Error; err != nil {
		log.Printf("failed to query existing seed memories: %v", err)
		return
	}

	existingTitleSet := make(map[string]struct{}, len(existingTitles))
	for _, title := range existingTitles {
		existingTitleSet[title] = struct{}{}
	}

	for _, memory := range seedMemories {
		if _, exists := existingTitleSet[memory.Title]; exists {
			continue
		}

		if err := database.Create(&memory).Error; err != nil {
			log.Printf("failed to seed memory %q: %v", memory.Title, err)
			continue
		}

		existingTitleSet[memory.Title] = struct{}{}
	}
}

func cleanupLegacyOriginalImagePlaceholders(database *gorm.DB) {
	result := database.Model(&Memory{}).
		Where(
			"original_image_path = ? OR original_image_path LIKE ?",
			legacyOriginalImagePlaceholderPath,
			"%"+legacyOriginalImagePlaceholderPath+"%",
		).
		Update("original_image_path", "")

	if result.Error != nil {
		log.Printf("failed to cleanup legacy original image placeholders: %v", result.Error)
		return
	}

	if result.RowsAffected > 0 {
		log.Printf("cleaned up %d legacy original image placeholder records", result.RowsAffected)
	}
}

func mustParseSeedTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		panic(fmt.Errorf("invalid seed time %q: %w", value, err))
	}

	return parsed
}
