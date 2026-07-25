// PM2 进程管理配置
// 使用方式：pm2 start ecosystem.config.cjs
module.exports = {
	apps: [
		{
			name: "blog-astrvow",
			script: "./dist/server/entry.mjs",
			node_args: "--experimental-specifier-resolution=node",
			env: {
				PORT: 4321,
				NODE_ENV: "production",
				// 以下变量由 GitHub Actions 部署时写入，此处无需填写
				KEYSTATIC_GITHUB_CLIENT_ID: process.env.KEYSTATIC_GITHUB_CLIENT_ID || "",
				KEYSTATIC_GITHUB_CLIENT_SECRET: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || "",
				KEYSTATIC_SECRET: process.env.KEYSTATIC_SECRET || "",
			},
		},
	],
};