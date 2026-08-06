// 把两个 PDF 的书签目录结构 dump 到 JSON 文件，便于分析章节划分
// 使用 pdf-lib 的低级 API 解析 Outlines 字典
// 注意：该 PDF 的 dest 数组第一个元素是页码（PDFNumber，0-based），而非标准的 pageRef
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFRef } from "pdf-lib";
import { readFileSync, writeFileSync } from "node:fs";

const files = [
  { name: "高等数学", path: "高等数学.pdf" },
  { name: "高数错题本", path: "高数错题本.pdf" },
];

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

// 解析 dest，返回页码（0-based）
// 该 PDF 的 dest 是 [PDFNumber(pageIndex), /XYZ|/Fit|..., ...] 非标准格式
function resolveDest(dest) {
  if (!dest) return -1;
  try {
    if (dest instanceof PDFArray && dest.size() > 0) {
      const firstEl = dest.lookup(0);
      // 优先尝试 asNumber()
      if (firstEl && typeof firstEl.asNumber === "function") {
        return firstEl.asNumber();
      }
      // 兼容标准格式 [pageRef, ...]
      if (firstEl instanceof PDFRef) {
        // 此处无 pageRefIndexMap，返回 -1（该 PDF 不走此分支）
      }
    }
  } catch {
    // ignore
  }
  return -1;
}

// 递归解析 outline
function parseOutline(item) {
  const node = { title: "", pageIndex: -1, children: [] };
  try {
    node.title = decodeTitle(item.lookup(PDFName.of("Title")));
  } catch {
    node.title = "";
  }

  // Dest 可能是数组或字符串
  let dest = null;
  try {
    dest = item.lookup(PDFName.of("Dest"));
  } catch {
    // ignore
  }
  // 也可能通过 A -> D 指定
  if (!dest) {
    try {
      const a = item.lookup(PDFName.of("A"));
      if (a instanceof PDFDict) dest = a.lookup(PDFName.of("D"));
    } catch {
      // ignore
    }
  }
  node.pageIndex = resolveDest(dest);

  // 递归子节点
  try {
    const first = item.lookup(PDFName.of("First"));
    if (first) {
      let cur = first;
      const seen = new Set();
      while (cur) {
        const refKey = cur.objectNumber
          ? `${cur.objectNumber}:${cur.generationNumber}`
          : null;
        if (refKey && seen.has(refKey)) break;
        if (refKey) seen.add(refKey);
        node.children.push(parseOutline(cur));
        try {
          cur = cur.lookup(PDFName.of("Next"));
        } catch {
          cur = null;
        }
      }
    }
  } catch {
    // ignore
  }
  return node;
}

const result = {};

for (const f of files) {
  try {
    const bytes = readFileSync(f.path);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = pdf.getPageCount();

    const outlineRoot = pdf.catalog.lookup(PDFName.of("Outlines"));
    const outline = [];
    if (outlineRoot) {
      const first = outlineRoot.lookup(PDFName.of("First"));
      let cur = first;
      const seen = new Set();
      while (cur) {
        const refKey = cur.objectNumber
          ? `${cur.objectNumber}:${cur.generationNumber}`
          : null;
        if (refKey && seen.has(refKey)) break;
        if (refKey) seen.add(refKey);
        outline.push(parseOutline(cur));
        try {
          cur = cur.lookup(PDFName.of("Next"));
        } catch {
          cur = null;
        }
      }
    }

    result[f.name] = { pageCount, outline };
  } catch (err) {
    result[f.name] = { error: err.message };
  }
}

writeFileSync("scripts/pdf-outline-dump.json", JSON.stringify(result, null, 2));
console.log("已写入 scripts/pdf-outline-dump.json");
