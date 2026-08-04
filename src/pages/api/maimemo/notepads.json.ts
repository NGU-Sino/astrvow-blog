import type { APIRoute } from "astro";
import { maimemoConfig } from "@/config";

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
		// 1. 获取云词本列表
		const listRes = await fetch(
			`${maimemoConfig.apiBaseUrl}/api/v1/memo/notepads?limit=10`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${maimemoConfig.apiToken}`,
					Accept: "application/json",
				},
			}
		);

		if (!listRes.ok) {
			const errText = await listRes.text();
			throw new Error(`Notepads API error ${listRes.status}: ${errText}`);
		}

		const listData = await listRes.json();
		const notepads = listData.data?.notepads || [];

		// 2. 获取每个云词本的详情（包含单词列表）
		const notepadsWithDetails = await Promise.all(
			notepads.map(async (n: any) => {
				try {
					const detailRes = await fetch(
						`${maimemoConfig.apiBaseUrl}/api/v1/memo/notepads/${n.id}`,
						{
							method: "GET",
							headers: {
								Authorization: `Bearer ${maimemoConfig.apiToken}`,
								Accept: "application/json",
							},
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
					// list 字段中 type 为 WORD 的条目即为单词
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

		return new Response(
			JSON.stringify({
				success: true,
				data: notepadsWithDetails,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=300",
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
						: "Failed to fetch notepads",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
};
