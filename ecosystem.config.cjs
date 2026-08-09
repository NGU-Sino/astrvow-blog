// PM2 进程管理配置
// 此文件位于项目根目录（非 dist/），需上传到 /www/wwwroot/20.2.139.66/ecosystem.config.cjs
// 在该目录下执行: pm2 start ecosystem.config.cjs
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
			// 内存超过 512MB 自动重启，防止内存泄漏导致 OOM 拖垮整台服务器
			// Astro SSR + pdfjs-dist 等依赖常规占用约 150-250MB，512MB 留足余量
			max_memory_restart: "512M",
			// 重启退避策略：连续崩溃时拉长重启间隔，避免雪崩
			// 默认 100ms 间隔在崩溃循环时会加剧服务器负载
			exp_backoff_restart_delay: 1000,
			// 最大重启次数（窗口内），超过后停止避免无限循环
			max_restarts: 10,
			// 重启次数计算的时间窗口（秒）
			restart_time_window: 300,
			// 崩溃退出码白名单：仅这些退出码触发自动重启
			// 0 = 正常退出（不重启），1 = 未捕获异常，其他 = 手动/信号
			min_uptime: "10s",
		},
	],
};