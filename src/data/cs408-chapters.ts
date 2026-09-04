/**
 * 考研408基础阶段章节目录
 * 教辅：2027王道（数据结构 + 计算机组成原理 + 操作系统 + 计算机网络）
 * 408只提交笔记PDF，不提交错题（错题通过王道小程序复习）
 * 含二级目录，笔记和统计按小节（二级目录）管理
 * 数据文件：src/config/cs408ChaptersData.json（通过 Keystatic 后台管理）
 */
import cs408ChaptersData from "@/config/cs408ChaptersData.json";
import type { ReviewChapter, ReviewStage } from "./math-chapters";

export const cs408Chapters: ReviewChapter[] = cs408ChaptersData.chapters as ReviewChapter[];
export const cs408EnhanceChapters: ReviewChapter[] = (cs408ChaptersData as any).enhanceChapters as ReviewChapter[];
export const cs408Stages: ReviewStage[] = cs408ChaptersData.stages as ReviewStage[];
