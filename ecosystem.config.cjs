// PM2 进程管理配置
// 在 /www/wwwroot/20.2.139.66 目录下执行 pm2 start dist/ecosystem.config.cjs
module.exports = {
	apps: [
		{
			name: "blog-astrvow",
			script: "./dist/server/entry.mjs",
			cwd: "/www/wwwroot/20.2.139.66",
			env: {
				HOST: "0.0.0.0",
				PORT: 4321,
				NODE_ENV: "production",
				KEYSTATIC_GITHUB_CLIENT_ID: process.env.KEYSTATIC_GITHUB_CLIENT_ID || "",
				KEYSTATIC_GITHUB_CLIENT_SECRET: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || "",
				KEYSTATIC_SECRET: process.env.KEYSTATIC_SECRET || "",
			},
		},
	],
};