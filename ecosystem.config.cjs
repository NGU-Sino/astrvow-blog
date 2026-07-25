// PM2 进程管理配置
// 使用方式：在 /www/wwwroot/20.2.139.66/dist/ 目录下执行 pm2 start ecosystem.config.cjs
module.exports = {
	apps: [
		{
			name: "blog-astrvow",
			script: "./server/entry.mjs",
			cwd: "/www/wwwroot/20.2.139.66/dist",
			node_args: "--experimental-specifier-resolution=node",
			env: {
				PORT: 4321,
				NODE_ENV: "production",
			},
		},
	],
};