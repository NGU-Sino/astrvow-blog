import type { SiteConfig } from "@/types/siteConfig";
import siteConfigData from "./siteConfigData.json";

// 定义站点语言
// 语言代码，例如：'zh_CN', 'zh_TW', 'en', 'ja', 'ru', 'ko'。
const SITE_LANG = "zh_CN";

export const siteConfig: SiteConfig = {
	// === 从 siteConfigData.json 导入的可编辑配置 ===
	// 包括：title, subtitle, description, keywords, themeColor, pageWidth,
	// card, navbar(部分), siteStartDate, pages, categoryBar, foldArticle,
	// postListLayout, post(部分), pagination
	...siteConfigData,

	// === 以下为不可在线编辑的配置（保留在 .ts 中） ===

	// 站点 URL
	site_url: "https://blog.astrvow.com/",

	// Favicon 配置
	favicon: [
		{
			src: "/favicon/favicon.ico",
		},
	],

	// 导航栏配置（合并 JSON 数据 + Logo）
	navbar: {
		logo: {
			type: "image",
			value: "assets/images/logo.png",
			alt: "Logo",
		},
		...siteConfigData.navbar,
	},

	// 站点时区
	timezone: "Asia/Shanghai",

	// bangumi配置
	bangumi: {
		userId: "",
		mode: "dynamic",
		apiUrl: "https://bgmapi.anibt.net",
		subjectBaseUrl: "https://bgmmi.anibt.net/subject/",
		categoryOrder: ["anime", "book", "music", "game"],
	},

	// 追番配置（Bilibili + TMDB）
	anime: {
		bilibili: {
			uid: "2002388434",
		},
	},

	// 图像优化及响应式配置
	imageOptimization: {
		formats: "webp",
		quality: 85,
		noReferrerDomains: ["*.hdslb.com", "*.bilibili.com"],
	},

	// 站点语言
	lang: SITE_LANG,
} as SiteConfig;