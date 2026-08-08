import { getCollection } from "astro:content";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import {
	dynamicSearchText,
	dynamicSlug,
	sortDynamics,
} from "@/utils/dynamic-utils";

const markdownImagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g;

// === 服务端内存缓存（10 分钟 TTL）===
// dynamic.json 每次请求都渲染所有动态的 markdown，CPU 密集
// 缓存渲染结果避免高频访问时 CPU 飙升
const CACHE_TTL_MS = 10 * 60 * 1000;
type CachedEntry = { body: unknown; ts: number };
let cachedEntry: CachedEntry | null = null;
// 正在进行的请求去重
let inflight: Promise<unknown> | null = null;

function getCached(): CachedEntry | null {
	if (!cachedEntry) return null;
	if (Date.now() - cachedEntry.ts > CACHE_TTL_MS) return null;
	return cachedEntry;
}

const NO_STORE_HEADERS = {
	"Content-Type": "application/json; charset=utf-8",
	"Cache-Control": "no-store, max-age=0",
	"Surrogate-Control": "no-store",
	Pragma: "no-cache",
} as const;

export async function GET() {
	// 1. 命中内存缓存直接返回
	const cached = getCached();
	if (cached) {
		return new Response(JSON.stringify(cached.body), {
			headers: { ...NO_STORE_HEADERS, "X-Cache": "HIT" },
		});
	}

	// 2. 请求去重
	if (!inflight) {
		inflight = fetchDynamicData().finally(() => {
			inflight = null;
		});
	}

	try {
		const data = await inflight;
		cachedEntry = { body: data, ts: Date.now() };

		return new Response(JSON.stringify(data), {
			headers: { ...NO_STORE_HEADERS, "X-Cache": "MISS" },
		});
	} catch (error) {
		// 错误时若有旧缓存，返回 stale 数据
		const stale = cachedEntry;
		if (stale) {
			return new Response(JSON.stringify(stale.body), {
				headers: {
					...NO_STORE_HEADERS,
					"X-Cache": "STALE",
					"X-Error":
						error instanceof Error ? error.message : "unknown",
				},
			});
		}
		return new Response(
			JSON.stringify({
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch dynamics",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}

async function fetchDynamicData() {
	const processor = await createMarkdownProcessor();
	const dynamics = sortDynamics(await getCollection("dynamic"));
	const data = await Promise.all(
		dynamics.map(async (entry) => {
			const images: Array<{ alt: string; src: string; title?: string }> = [];
			const markdown = (entry.body || "").replace(
				markdownImagePattern,
				(_match, alt: string, src: string, title?: string) => {
					images.push({ alt, src, ...(title ? { title } : {}) });
					return "";
				},
			);
			const rendered = await processor.render(markdown);

			return {
				id: dynamicSlug(entry.id),
				published: entry.data.published.getTime(),
				html: rendered.code,
				images,
				searchText: dynamicSearchText(entry),
				pinned: entry.data.pinned || false,
			};
		}),
	);

	return data;
}
