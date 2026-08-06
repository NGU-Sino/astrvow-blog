import type { APIRoute } from "astro";
import { maimemoConfig } from "@/config";

// 必须设为 SSR：否则在默认 static 模式下会被 prerender 成静态 JSON 文件，
// 构建时调用一次墨墨 API 后写死，部署后数据永不更新
export const prerender = false;

// === 服务端内存缓存（5 分钟 TTL）===
// 目的：控制对墨墨 API 的调用频率，避免触发限流
// 注意：仅当前 Node 进程有效，PM2 重启或多实例时缓存独立
// 修复历史：原先用 Cache-Control: public, max-age=300 让 Nginx 缓存，
// 但宝塔面板的 Nginx proxy_cache 配置异常导致响应被锁死 14 小时不刷新。
// 改为内存缓存后，Nginx 不再缓存（Cache-Control: no-store），缓存逻辑完全在代码内可控。
const CACHE_TTL_MS = 5 * 60 * 1000;
type CachedEntry = { body: unknown; ts: number };
let cachedEntry: CachedEntry | null = null;

function getCached(): CachedEntry | null {
	if (!cachedEntry) return null;
	if (Date.now() - cachedEntry.ts > CACHE_TTL_MS) return null;
	return cachedEntry;
}

function setCached(body: unknown) {
	cachedEntry = { body, ts: Date.now() };
}

const NO_STORE_HEADERS = {
	"Content-Type": "application/json",
	// 禁止任何中间层缓存：Nginx、CDN、浏览器都不缓存
	// 缓存由本进程内存管理（5 分钟 TTL）
	"Cache-Control": "no-store, max-age=0",
	"Surrogate-Control": "no-store",
	Pragma: "no-cache",
} as const;

export const GET: APIRoute = async () => {
	if (!maimemoConfig.enable || !maimemoConfig.apiToken) {
		return new Response(
			JSON.stringify({
				success: false,
				error: "Maimemo API not configured",
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	// 1. 命中内存缓存直接返回（不调用墨墨 API）
	const cached = getCached();
	if (cached) {
		return new Response(
			JSON.stringify({ success: true, data: cached.body }),
			{
				status: 200,
				headers: { ...NO_STORE_HEADERS, "X-Cache": "HIT" },
			}
		);
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${maimemoConfig.apiToken}`,
		"Content-Type": "application/json",
		Accept: "application/json",
	};

	async function callMaimemoAPI(path: string, body: object) {
		const res = await fetch(`${maimemoConfig.apiBaseUrl}${path}`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const errText = await res.text();
			throw new Error(`API error ${res.status}: ${errText}`);
		}
		return res.json();
	}

	function getBeijingDateString(date: Date) {
		return new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Shanghai",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	}

	const dayStart = (s: string) => `${s}T00:00:00+08:00`;
	const dayEnd = (s: string) => `${s}T23:59:59+08:00`;

	try {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = getBeijingDateString(tomorrow);
		const future7 = new Date(today);
		future7.setDate(future7.getDate() + 7);
		const future7Str = getBeijingDateString(future7);

		// === 基础数据 + 未来 7 天记录（共 4 次 API 调用，远低于限流阈值）===
		// 1. 今日学习进度  2. 总单词数  3. 今日任务列表  4. 未来 7 天待复习记录
		const [progressData, countData, todayItemsData, future7Data] =
			await Promise.all([
				callMaimemoAPI("/api/v1/memo/study/get_study_progress", {}),
				callMaimemoAPI("/api/v1/memo/study/query_study_records", {
					as_count: true,
				}),
				callMaimemoAPI("/api/v1/memo/study/get_today_items", {
					limit: 1000,
				}),
				callMaimemoAPI("/api/v1/memo/study/query_study_records", {
					next_study_date: {
						start: dayStart(tomorrowStr),
						end: dayEnd(future7Str),
					},
					limit: 1000,
				}),
			]);

		const progress = progressData.data?.progress || {};
		const totalPlanned = countData.data?.count || 0;
		const todayItems = todayItemsData.data?.today_items || [];
		const future7Records = future7Data.data?.records || [];
		const todayNewCount = todayItems.filter(
			(item: { is_new?: boolean }) => item.is_new === true
		).length;

		// === 7 天复习计划（不含今天，从未来 7 天记录派生）===
		const upcomingReviews: { date: string; count: number }[] = [];
		for (let i = 1; i <= 7; i++) {
			const d = new Date(today);
			d.setDate(d.getDate() + i);
			const dateStr = getBeijingDateString(d);
			const count = future7Records.filter((r: any) => {
				if (!r.next_study_date) return false;
				return getBeijingDateString(new Date(r.next_study_date)) === dateStr;
			}).length;
			upcomingReviews.push({ date: dateStr, count });
		}

		// === 今日记忆单词（从 today_items 派生，不额外查 API）===
		// today_items 包含今日全部任务（新学 + 复习 + 逾期补复习），全天展示不区分完成状态
		const todayReviewWords = todayItems.map((item: any) => ({
			spelling: item.voc_spelling || "",
			last_response: item.last_response || "",
		}));

		// === 记忆风险单词（从未来 7 天记录中筛选 FORGET/VAGUE）===
		// 注意：仅覆盖未来 7 天内要复习的风险词，非全量。熟知单词无未来复习日期，天然被排除。
		const riskWords = future7Records
			.filter(
				(r: any) =>
					r.last_response === "FORGET" || r.last_response === "VAGUE"
			)
			.map((r: any) => ({
				spelling: r.voc_spelling || "",
				last_response: r.last_response || "",
				study_count: r.study_count || 0,
			}));

		// 组装结果
		const todayFinished = progress.finished || 0;
		const todayTotal = progress.total || 0;
		const todayReviewCount = Math.max(0, todayFinished - todayNewCount);
		const studyTimeMs = progress.study_time || 0;
		const studyTimeMinutes = Math.round(studyTimeMs / 60000);

		const data = {
			today_finished: todayFinished,
			today_total: todayTotal,
			today_new: todayNewCount,
			today_review: todayReviewCount,
			study_time_ms: studyTimeMs,
			study_time_minutes: studyTimeMinutes,
			total_planned: totalPlanned,
			upcoming_reviews: upcomingReviews,
			today_review_words: todayReviewWords,
			risk_words: riskWords,
		};

		// 2. 写入内存缓存
		setCached(data);

		return new Response(
			JSON.stringify({ success: true, data }),
			{
				status: 200,
				headers: { ...NO_STORE_HEADERS, "X-Cache": "MISS" },
			}
		);
	} catch (error) {
		// 3. 错误时若有未过期旧缓存，返回 stale 数据保证页面可用
		const stale = cachedEntry;
		if (stale) {
			return new Response(
				JSON.stringify({ success: true, data: stale.body }),
				{
					status: 200,
					headers: {
						...NO_STORE_HEADERS,
						"X-Cache": "STALE",
						"X-Error":
							error instanceof Error ? error.message : "unknown",
					},
				}
			);
		}
		return new Response(
			JSON.stringify({
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch study progress",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
};
