import type { MaimemoConfig } from "@/types/maimemoConfig";

/**
 * 墨墨背单词配置
 * 用于在博客中展示学习进度和单词卡片
 */
export const maimemoConfig: MaimemoConfig = {
	// 是否启用墨墨背单词功能
	enable: true,
	// API Token（从墨墨背单词 App 获取）
	// 获取方式：我的 -> 更多设置 -> 实验功能 -> 开放 API
	apiToken: import.meta.env.MAIMEMO_API_TOKEN || "",
	// API 基础 URL
	apiBaseUrl: "https://open.maimemo.com/open",
	// 考研词汇目标总量
	goalWords: 5500,
};
