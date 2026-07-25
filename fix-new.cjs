const fs = require("fs");
let c = fs.readFileSync("keystatic.config.ts", "utf-8");

// Fix 1: rehypeCallouts field name - must match JSON (lowercase c)
c = c.replace(/rehypeCallouts:/g, "rehypeCallouts:");
c = c.replace(/enablePythonMarkdownAdmonitions/g, "enablePythonMarkdownAdmonitions");

// Fix 2: sharePoster indentation (one too many tabs)
c = c.replace(/\t{6}sharePoster:/g, "\t\t\t\t\tsharePoster:");

// Fix 3: Add description to spec schema
const specContent = `\t\t\t\tcontent: fields.markdoc({
\t\t\t\t\tlabel: "内容",
\t\t\t\textension: "md",
\t\t\t\t}),
\t\t\t},
\t\t}),`;

const specWithDesc = `\t\t\t\tdescription: fields.text({
\t\t\t\t\tlabel: "页面描述",
\t\t\t\t\tmultiline: true,
\t\t\t\t}),
\t\t\t\tcontent: fields.markdoc({
\t\t\t\t\tlabel: "内容",
\t\t\t\textension: "md",
\t\t\t\t}),
\t\t\t},
\t\t}),`;

if (c.includes(specContent)) {
	c = c.replace(specContent, specWithDesc);
	console.log("✅ Added description to spec");
} else {
	console.log("❌ Could not find spec content block");
}

fs.writeFileSync("keystatic.config.ts", c, "utf-8");
console.log("Done");