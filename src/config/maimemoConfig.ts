import type { MaimemoConfig } from "@/types/maimemoConfig";

// 读取环境变量：必须用直接的 import.meta.env.XXX 形式，Vite 才能在构建时静态替换
// 包 try/catch 是为了兼容 tsx 脚本（subset-fonts.ts）运行时 import.meta.env 为 undefined 的情况
let apiToken = "";
try {
	apiToken = import.meta.env.MAIMEMO_API_TOKEN || "";
} catch {
	// tsx 运行时 fallback
}

/**
 * 墨墨背单词配置
 * 用于在博客中展示学习进度和单词卡片
 */
export const maimemoConfig: MaimemoConfig = {
	// 是否启用墨墨背单词功能
	enable: true,
	// API Token（从墨墨背单词 App 获取）
	// 获取方式：我的 -> 更多设置 -> 实验功能 -> 开放 API
	apiToken,
	// API 基础 URL
	apiBaseUrl: "https://open.maimemo.com/open",
	// 考研词汇目标总量
	goalWords: 5500,
};
