/**
 * 阶段标签切换（基础/强化/冲刺）
 *
 * 适用于 cs408-progress 与 math-progress 两个页面。
 *
 * 背景：项目使用 @swup/astro 客户端路由，Swup 切换页面时不会重新执行
 * 新页面中的 <script is:inline>，导致从主页导航进入的页面里 .stage-tab
 * 按钮没有绑定 click 事件，点击"强化"等标签无反应。
 *
 * 方案：把绑定逻辑提取为共享模块，监听 astro:page-load（Swup 完成页面
 * 替换后会触发该事件），每次页面加载完都重新扫描并绑定 .stage-tab。
 * 直接刷新页面时首次调用负责初始绑定。
 */

function initStageTabs(): void {
	const tabs = document.querySelectorAll<HTMLElement>(".stage-tab");
	if (tabs.length === 0) return;

	tabs.forEach((tab) => {
		// Swup 切换页面后 DOM 是全新节点，不会残留标记；同页二次触发时避免重复绑定
		if (tab.dataset.stageBound === "true") return;
		tab.dataset.stageBound = "true";

		tab.addEventListener("click", () => {
			const stageId = tab.getAttribute("data-stage");
			if (!stageId) return;

			document.querySelectorAll(".stage-tab").forEach((t) => {
				t.classList.remove("bg-(--primary)", "text-white");
				t.classList.add(
					"bg-neutral-100",
					"dark:bg-neutral-800",
					"text-neutral-500",
					"dark:text-neutral-400",
				);
			});
			tab.classList.remove(
				"bg-neutral-100",
				"dark:bg-neutral-800",
				"text-neutral-500",
				"dark:text-neutral-400",
			);
			tab.classList.add("bg-(--primary)", "text-white");

			document
				.querySelectorAll(".stage-content")
				.forEach((c) => c.classList.add("hidden"));
			const target = document.getElementById(`stage-${stageId}`);
			if (target) target.classList.remove("hidden");
		});
	});
}

// 直接刷新页面时的初始绑定
initStageTabs();

// Swup 客户端路由切换页面后重新绑定
document.addEventListener("astro:page-load", initStageTabs);
