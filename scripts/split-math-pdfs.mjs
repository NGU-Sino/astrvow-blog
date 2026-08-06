// 按章节拆分高数笔记和错题 PDF
// 基于书签的顶层 outline（章节级）拆分，每章一个 PDF 文件
// 输出目录：public/review-assets/math/gaoshu/{notes,errors}/
import { PDFDocument, PDFName, PDFArray, PDFDict } from "pdf-lib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const NOTES_SRC = "高等数学.pdf";
const ERRORS_SRC = "高数错题本.pdf";
const NOTES_DIR = join("public", "review-assets", "math", "gaoshu", "notes");
const ERRORS_DIR = join("public", "review-assets", "math", "gaoshu", "errors");

// 解码 PDF 书签标题
function decodeTitle(titleObj) {
  if (!titleObj) return "";
  try {
    if (typeof titleObj.asBytes === "function") {
      const bytes = titleObj.asBytes();
      if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        return new TextDecoder("utf-16be").decode(bytes.subarray(2));
      }
      return new TextDecoder("latin1").decode(bytes);
    }
    if (titleObj.value !== undefined) return String(titleObj.value);
    return String(titleObj);
  } catch (err) {
    return `[decode_error: ${err.message}]`;
  }
}

// 解析 dest 返回页码（0-based）
function resolveDest(dest) {
  if (!dest) return -1;
  try {
    if (dest instanceof PDFArray && dest.size() > 0) {
      const firstEl = dest.lookup(0);
      if (firstEl && typeof firstEl.asNumber === "function") {
        return firstEl.asNumber();
      }
    }
  } catch {
    // ignore
  }
  return -1;
}

// 提取顶层 outline（章节级），返回 [{title, pageIndex}, ...]
function extractTopLevelOutline(pdf) {
  const outlineRoot = pdf.catalog.lookup(PDFName.of("Outlines"));
  const result = [];
  if (!outlineRoot) return result;
  const first = outlineRoot.lookup(PDFName.of("First"));
  let cur = first;
  const seen = new Set();
  while (cur) {
    const refKey = cur.objectNumber
      ? `${cur.objectNumber}:${cur.generationNumber}`
      : null;
    if (refKey && seen.has(refKey)) break;
    if (refKey) seen.add(refKey);

    const title = decodeTitle(cur.lookup(PDFName.of("Title")));
    let dest = null;
    try {
      dest = cur.lookup(PDFName.of("Dest"));
    } catch {
      // ignore
    }
    if (!dest) {
      try {
        const a = cur.lookup(PDFName.of("A"));
        if (a instanceof PDFDict) dest = a.lookup(PDFName.of("D"));
      } catch {
        // ignore
      }
    }
    const pageIndex = resolveDest(dest);
    result.push({ title, pageIndex });

    try {
      cur = cur.lookup(PDFName.of("Next"));
    } catch {
      cur = null;
    }
  }
  return result;
}

// 中文数字转阿拉伯数字（支持 1-99）
function chineseToNumber(str) {
  const digits = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (str === "十") return 10;
  if (str.startsWith("十")) return 10 + (digits[str[1]] ?? 0);
  if (str.endsWith("十")) return (digits[str[0]] ?? 0) * 10;
  if (str.includes("十")) {
    const parts = str.split("十");
    return (digits[parts[0]] ?? 0) * 10 + (digits[parts[1]] ?? 0);
  }
  return digits[str] ?? 0;
}

// 从章节标题中提取章号和纯标题
// 例如 "第一章 函数极限与连续" -> { num: 1, title: "函数极限与连续" }
// 例如 "第1章 函数极限与连续" -> { num: 1, title: "函数极限与连续" }
// 例如 "第十一章 ..." -> { num: 11, ... }
function parseChapterTitle(title) {
  const m = title.match(/^第([0-9一二三四五六七八九十]+)章\s*(.+)$/);
  if (!m) return { num: 0, title };
  const numStr = m[1];
  let num;
  if (/^[0-9]+$/.test(numStr)) {
    num = parseInt(numStr, 10);
  } else {
    num = chineseToNumber(numStr);
  }
  return { num, title: m[2].trim() };
}

// 将章节标题转换为安全的文件名（去掉 Windows 非法字符）
function sanitizeFilename(title) {
  return title.replace(/[\\/:*?"<>|]/g, "_").trim();
}

// 拆分 PDF：根据顶层 outline 的页码，按章拆分
async function splitPdf(srcPath, outDir, label) {
  const bytes = readFileSync(srcPath);
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();
  const outline = extractTopLevelOutline(pdf);

  console.log(`\n========== ${label} ==========`);
  console.log(`总页数: ${pageCount}, 顶层书签数: ${outline.length}`);

  mkdirSync(outDir, { recursive: true });

  const results = [];
  for (let i = 0; i < outline.length; i++) {
    const { title, pageIndex } = outline[i];
    const { num, title: pureTitle } = parseChapterTitle(title);
    const startPage = pageIndex;
    // 结束页 = 下一章起始页 - 1，或最后一页
    const endPage =
      i + 1 < outline.length ? outline[i + 1].pageIndex - 1 : pageCount - 1;

    if (startPage < 0 || endPage < startPage) {
      console.warn(`  [跳过] 第${num}章 "${title}" 页码无效: ${startPage}-${endPage}`);
      results.push({ num, title: pureTitle, fileName: null, startPage, endPage });
      continue;
    }

    // 创建新 PDF，复制对应页面
    const newPdf = await PDFDocument.create();
    const pageIndices = [];
    for (let p = startPage; p <= endPage; p++) pageIndices.push(p);
    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    for (const page of copiedPages) newPdf.addPage(page);

    const fileName = `${String(num).padStart(2, "0")}-${sanitizeFilename(pureTitle)}.pdf`;
    const outPath = join(outDir, fileName);
    const pdfBytes = await newPdf.save();
    writeFileSync(outPath, pdfBytes);

    console.log(`  第${num}章 "${pureTitle}": 页 ${startPage}-${endPage} (${pageIndices.length}页) -> ${fileName}`);
    results.push({
      num,
      title: pureTitle,
      fileName,
      startPage,
      endPage,
      pageIndices,
    });
  }

  return results;
}

// 主流程
const notesResults = await splitPdf(NOTES_SRC, NOTES_DIR, "高等数学笔记");
const errorsResults = await splitPdf(ERRORS_SRC, ERRORS_DIR, "高数错题本");

// 输出汇总 JSON，供后续更新 mathChaptersData.json 使用
const summary = {
  notes: notesResults.map((r) => ({
    chapter: r.num,
    title: r.title,
    url: r.fileName ? `/review-assets/math/gaoshu/notes/${r.fileName}` : null,
  })),
  errors: errorsResults.map((r) => ({
    chapter: r.num,
    title: r.title,
    url: r.fileName ? `/review-assets/math/gaoshu/errors/${r.fileName}` : null,
  })),
};
writeFileSync("scripts/split-math-summary.json", JSON.stringify(summary, null, 2));
console.log("\n已写入 scripts/split-math-summary.json");
console.log("\n拆分完成！");
