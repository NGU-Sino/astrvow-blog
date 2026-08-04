import type { APIRoute } from "astro";
import { maimemoConfig } from "@/config";

// 内存缓存：5 分钟内复用已拉取的词库，避免每次随机都打墨墨 API
// 每次从缓存中随机选一个词返回，实现"高频随机"而不增加 API 调用
let cachedWords: any[] = [];
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

async function loadWordsIntoCache() {
	const now = Date.now();
	// 缓存未过期，直接复用
	if (cachedWords.length > 0 && now - cacheFetchedAt < CACHE_TTL_MS) {
		return;
	}

	const res = await fetch(
		`${maimemoConfig.apiBaseUrl}/api/v1/memo/study/query_study_records`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${maimemoConfig.apiToken}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ limit: 1000 }),
		}
	);

	if (!res.ok) {
		throw new Error(`API error ${res.status}`);
	}

	const data = await res.json();
	cachedWords = data.data?.records || [];
	cacheFetchedAt = now;
}

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
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// 从缓存中随机选一个词
		const randomIndex = Math.floor(Math.random() * cachedWords.length);
		const word = cachedWords[randomIndex];

		return new Response(
			JSON.stringify({
				success: true,
				data: {
					spelling: word.voc_spelling || "",
					last_response: word.last_response || "",
					study_count: word.study_count || 0,
					add_date: word.add_date || "",
					last_study_date: word.last_study_date || "",
					next_study_date: word.next_study_date || "",
					tags: word.tags || [],
				},
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					// 不缓存，每次请求都返回不同的随机单词（数据源由内存缓存控制）
					"Cache-Control": "no-cache, no-store, must-revalidate",
				},
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
