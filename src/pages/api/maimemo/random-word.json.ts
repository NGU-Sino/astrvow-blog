import type { APIRoute } from "astro";
import { maimemoConfig } from "@/config";

// 必须设为 SSR：否则在默认 static 模式下会被 prerender 成静态 JSON 文件，
// 构建时调用一次墨墨 API 后写死，部署后单词永不更新
export const prerender = false;

// === 服务端内存缓存（5 分钟 TTL）===
// 目的：控制对墨墨 API 的调用频率，避免触发限流
// 注意：仅当前 Node 进程有效，PM2 重启或多实例时缓存独立
let cachedWords: any[] = [];
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟
// 正在进行的请求去重：防止缓存过期时多个请求同时打 API（thundering herd）
let inflight: Promise<void> | null = null;

// fetch 超时：墨墨 API 响应慢时防止请求堆积导致 OOM
const FETCH_TIMEOUT_MS = 8000;

// 获取北京时间（+08:00）的 YYYY-MM-DD 日期字符串
function getBeijingDateString(date: Date) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

async function loadWordsIntoCache() {
	const now = Date.now();
	// 缓存未过期，直接复用
	if (cachedWords.length > 0 && now - cacheFetchedAt < CACHE_TTL_MS) {
		return;
	}

	// 请求去重：已有进行中的请求时等待其完成
	if (inflight) {
		await inflight;
		return;
	}

	inflight = (async () => {
		// 筛选条件：未来（不含今天）即将学习的词
		// start = 明天 00:00:00 +08:00，不设 end（覆盖所有未来日期）
		// 这样拉到的是"接下来要复习的全部词"中按 next_study_date 升序的前 1000 个
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = getBeijingDateString(tomorrow);
		const startStr = `${tomorrowStr}T00:00:00+08:00`;

		const res = await fetch(
			`${maimemoConfig.apiBaseUrl}/api/v1/memo/study/query_study_records`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${maimemoConfig.apiToken}`,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					limit: 1000,
					next_study_date: {
						start: startStr,
					},
				}),
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			}
		);

		if (!res.ok) {
			throw new Error(`API error ${res.status}`);
		}

		const data = await res.json();
		cachedWords = data.data?.records || [];
		cacheFetchedAt = Date.now();
	})();

	try {
		await inflight;
	} finally {
		inflight = null;
	}
}

const NO_STORE_HEADERS = {
	"Content-Type": "application/json",
	// 禁止中间层缓存：缓存由本进程内存管理（5 分钟 TTL）
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

	try {
		await loadWordsIntoCache();

		if (cachedWords.length === 0) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "No words found",
				}),
				{
					status: 404,
					headers: NO_STORE_HEADERS,
				}
			);
		}

		// 将服务端缓存的全量词库（最多 1000 个）返回给客户端
		// 客户端本地随机选词，5 分钟内可切换全部 1000 个词
		// 这样设计的原因：宝塔 Nginx proxy_cache 会锁死 API 响应，
		// 改为返回全量词库后，即使整个响应被缓存 5 分钟，客户端仍能本地随机切换
		// 响应体约 200KB（gzip 后约 50KB），一次性下载可接受
		const wordsData = cachedWords.map((word) => ({
			spelling: word.voc_spelling || "",
			last_response: word.last_response || "",
			study_count: word.study_count || 0,
			add_date: word.add_date || "",
			last_study_date: word.last_study_date || "",
			next_study_date: word.next_study_date || "",
			tags: word.tags || [],
		}));

		return new Response(
			JSON.stringify({
				success: true,
				data: wordsData,
			}),
			{
				status: 200,
				headers: { ...NO_STORE_HEADERS, "X-Cache": "HIT" },
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch random word",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
};
