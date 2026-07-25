// PM2 进程管理配置
// 在 /www/wwwroot/20.2.139.66 目录下执行 pm2 start dist/ecosystem.config.cjs
// 敏感信息（KEYSTATIC_*）请放在同目录的 .env 文件中，不会随部署覆盖
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
			},
			env_file: ".env",
		},
	],
};