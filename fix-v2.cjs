const fs = require("fs");
let c = fs.readFileSync("keystatic.config.ts", "utf-8");

// Step 1: Fix rehypeCallouts field name
c = c.replace(/rehypeCallouts:/g, "rehypeCallouts:");
c = c.replace(/"Callouts 主题"/g, "\"Callouts 主题\"");
c = c.replace(/"例如: github"/g, "\"例如: github\"");
c = c.replace(/enablePythonMarkdownAdmonitions/g, "enablePythonMarkdownAdmonitions");

// Step 2: Fix sharePoster indentation
c = c.replace(/\t{6}sharePoster:/g, "\t\t\t\t\tsharePoster:");

// Step 3: Add description to spec schema
// Replace the closing of spec
const oldSpec = `\t\t\t\tcontent: fields.markdoc({
\t\t\t\t\tlabel: \"内容\",
\t\t\t\t\textension: \"md\",
\t\t\t\t}),
\t\t\t},
\t\t}),`;

const newSpec = `\t\t\t\tdescription: fields.text({
\t\t\t\t\tlabel: \"页面描述\",
\t\t\t\t\tmultiline: true,
\t\t\t\t}),
\t\t\t\tcontent: fields.markdoc({
\t\t\t\t\tlabel: \"内容\",
\t\t\t\t\textension: \"md\",
\t\t\t\t}),
\t\t\t},
\t\t}),`;

if (c.includes(oldSpec)) {
	c = c.replace(oldSpec, newSpec);
	console.log("✅ Added description to spec schema");
} else {
	console.log("❌ spec old text not found - checking...");
	// Debug
	const idx = c.indexOf("content: fields.markdoc");
	console.log(c.substring(idx, idx + 200));
}

fs.writeFileSync("keystatic.config.ts", c, "utf-8");
console.log("Done");