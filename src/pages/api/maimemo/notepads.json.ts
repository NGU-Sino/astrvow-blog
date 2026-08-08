import type { APIRoute } from "astro";
import { maimemoConfig } from "@/config";

// 必须设为 SSR：否则会被 prerender 成静态 JSON 文件，数据永不更新
export const prerender = false;

// === 服务端内存缓存（5 分钟 TTL）===
// 原先每次请求都打 11 次 API（1 列表 + 10 详情），高频访问时易把服务器拖垮
const CACHE_TTL_MS = 5 * 60 * 1000;
type CachedEntry = { body: unknown; ts: number };
let cachedEntry: CachedEntry | null = null;
// 正在进行的请求去重：防止缓存过期时多个请求同时打 API（thundering herd）
let inflight: Promise<unknown> | null = null;

function getCached(): CachedEntry | null {
	if (!cachedEntry) return null;
	if (Date.now() - cachedEntry.ts > CACHE_TTL_MS) return null;
	return cachedEntry;
}

const NO_STORE_HEADERS = {
	"Content-Type": "application/json",
	// 禁止中间层缓存：缓存由本进程内存管理
	"Cache-Control": "no-store, max-age=0",
	"Surrogate-Control": "no-store",
	Pragma: "no-cache",
} as const;

// fetch 超时：墨墨 API 响应慢时防止请求堆积导致 OOM
const FETCH_TIMEOUT_MS = 8000;

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

	// 1. 命中内存缓存直接返回
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

	// 2. 请求去重：已有进行中的请求时复用其结果
	if (!inflight) {
		inflight = fetchNotepads().finally(() => {
			inflight = null;
		});
	}

	try {
		const notepadsWithDetails = await inflight;
		cachedEntry = { body: notepadsWithDetails, ts: Date.now() };

		return new Response(
			JSON.stringify({ success: true, data: notepadsWithDetails }),
			{
				status: 200,
				headers: { ...NO_STORE_HEADERS, "X-Cache": "MISS" },
			}
		);
	} catch (error) {
		// 错误时若有未过期旧缓存，返回 stale 数据
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
						: "Failed to fetch notepads",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
};

async function fetchNotepads() {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${maimemoConfig.apiToken}`,
		Accept: "application/json",
	};

	// 1. 获取云词本列表（带超时）
	const listRes = await fetch(
		`${maimemoConfig.apiBaseUrl}/api/v1/memo/notepads?limit=10`,
		{
			method: "GET",
			headers,
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		}
	);

	if (!listRes.ok) {
		const errText = await listRes.text();
		throw new Error(`Notepads API error ${listRes.status}: ${errText}`);
	}

	const listData = await listRes.json();
	const notepads = listData.data?.notepads || [];

	// 2. 获取每个云词本的详情（并发，每个都带超时）
	const notepadsWithDetails = await Promise.all(
		notepads.map(async (n: any) => {
			try {
				const detailRes = await fetch(
					`${maimemoConfig.apiBaseUrl}/api/v1/memo/notepads/${n.id}`,
					{
						method: "GET",
						headers,
						signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
					}
				);

				if (!detailRes.ok) {
					return {
						id: n.id,
						title: n.title,
						brief: n.brief,
						tags: n.tags || [],
						created_time: n.created_time,
						updated_time: n.updated_time,
						word_count: 0,
					};
				}

				const detailData = await detailRes.json();
				const notepad = detailData.data?.notepad || {};
				const wordCount = (notepad.list || []).filter(
					(item: any) => item.type === "WORD"
				).length;

				return {
					id: n.id,
					title: n.title,
					brief: n.brief,
					tags: n.tags || [],
					created_time: n.created_time,
					updated_time: n.updated_time,
					word_count: wordCount,
				};
			} catch (e) {
				console.error(`Failed to fetch notepad detail for ${n.id}:`, e);
				return {
					id: n.id,
					title: n.title,
					brief: n.brief,
					tags: n.tags || [],
					created_time: n.created_time,
					updated_time: n.updated_time,
					word_count: 0,
				};
			}
		})
	);

	return notepadsWithDetails;
}
