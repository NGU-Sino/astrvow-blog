/**
 * 墨墨背单词 API 配置类型
 */
export type MaimemoConfig = {
	/** 是否启用墨墨背单词功能 */
	enable: boolean;
	/** API Token（从墨墨背单词 App 获取） */
	apiToken?: string;
	/** API 基础 URL */
	apiBaseUrl?: string;
	/** 考研词汇目标总量（默认 5500） */
	goalWords?: number;
};

/**
 * 墨墨学习进度数据
 */
export interface MaimemoStudyProgress {
	/** 今日已完成单词数 */
	today_finished: number;
	/** 今日应完成单词数 */
	today_total: number;
	/** 今日新学单词数 */
	today_new: number;
	/** 今日复习单词数 */
	today_review: number;
	/** 今日学习时长（毫秒） */
	study_time_ms: number;
	/** 今日学习时长（分钟） */
	study_time_minutes: number;
	/** 已加入学习计划的单词总量 */
	total_planned: number;
}
