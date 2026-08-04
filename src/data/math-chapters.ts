/**
 * 考研数学基础阶段章节目录
 * 教辅：张宇基础30讲（高数18讲 + 线代6章）+ 方浩概率论就这点事基础篇
 * 数据文件：src/config/mathChaptersData.json（通过 Keystatic 后台管理）
 */
import mathChaptersData from "@/config/mathChaptersData.json";

export type ChapterStatus = "not_started" | "in_progress" | "completed";

export interface ReviewChapter {
	id: string;
	subject: string;
	subjectLabel: string;
	source: string;
	index: number;
	title: string;
	status: ChapterStatus;
	notesUrl?: string;
	errorsUrl?: string;
	completedAt?: string;
	subChapters?: SubChapter[];
}

export interface SubChapter {
	id: string;
	title: string;
	status: ChapterStatus;
	notesUrl?: string;
}

export interface ReviewStage {
	id: string;
	name: string;
	active: boolean;
}

export const mathChapters: ReviewChapter[] = mathChaptersData.chapters as ReviewChapter[];
export const mathStages: ReviewStage[] = mathChaptersData.stages as ReviewStage[];
