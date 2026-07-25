import { collection, config, fields, singleton } from "@keystatic/core";

const isDev = process.env.NODE_ENV === "development";

export default config({
	storage: isDev
		? { kind: "local" }
		: {
				kind: "github",
				repo: {
					owner: "NGU-Sino",
					name: "astrvow-blog",
				},
			},

	ui: {
		brand: { name: "Astrvow Blog" },
	},

	collections: {
		/** 博客文章 - 文件夹结构 src/content/posts/{slug}/index.md */
		posts: collection({
			label: "博客文章",
			path: "src/content/posts/*/",
			slugField: "title",
			format: { contentField: "content" },
			entryLayout: "content",
			schema: {
				title: fields.slug({
					name: {
						label: "标题",
						validation: { isRequired: true },
					},
				}),
				published: fields.date({
					label: "发布日期",
					defaultValue: { kind: "today" },
				}),
				updated: fields.date({ label: "更新日期" }),
				draft: fields.checkbox({
					label: "草稿",
					defaultValue: false,
					description: "草稿模式下不会发布",
				}),
				description: fields.text({
					label: "文章简介",
					multiline: true,
				}),
				image: fields.text({
					label: "封面图路径",
					description: "例如：cover.png 或 https://...",
				}),
				tags: fields.array(fields.text({ label: "标签" }), {
					label: "标签",
					itemLabel: (props) => props.value || "新标签",
				}),
				category: fields.text({
					label: "分类",
					description: "例如：技术、日常",
				}),
				pinned: fields.checkbox({
					label: "置顶",
					defaultValue: false,
				}),
				content: fields.markdoc({
					label: "正文",
					extension: "md",
				}),
			},
		}),

		/** 动态 - 文件结构 src/content/dynamic/{slug}.md */
		dynamic: collection({
			label: "动态",
			path: "src/content/dynamic/*",
			slugField: "title",
			format: { contentField: "content" },
			entryLayout: "content",
			schema: {
				title: fields.slug({
					name: { label: "标识" },
				}),
				published: fields.datetime({
					label: "发布时间",
					defaultValue: { kind: "now" },
				}),
				pinned: fields.checkbox({
					label: "置顶",
					defaultValue: false,
				}),
				description: fields.text({
					label: "页面描述",
					multiline: true,
				}),
				content: fields.markdoc({
					label: "内容",
					extension: "md",
				}),
			},
		}),

		/** 独立页面 - 文件结构 src/content/spec/{slug}.{md,mdx} */
		spec: collection({
			label: "独立页面",
			path: "src/content/spec/*",
			slugField: "title",
			format: { contentField: "content" },
			entryLayout: "content",
			schema: {
				title: fields.slug({
					name: {
						label: "页面名称",
						validation: { isRequired: true },
					},
				}),
				content: fields.markdoc({
					label: "内容",
					extension: "md",
				}),
			},
		}),
	},

	singletons: {
		/** 站点配置 */
		siteConfig: singleton({
			label: "站点配置",
			path: "src/config/siteConfigData",
			format: "json",
			schema: {
				title: fields.text({ label: "站点标题" }),
				subtitle: fields.text({ label: "站点副标题" }),
				description: fields.text({
					label: "站点描述",
					multiline: true,
				}),
				keywords: fields.array(fields.text({ label: "关键词" }), {
					label: "SEO 关键词",
					itemLabel: (props) => props.value || "关键词",
				}),
				themeColor: fields.object({
					hue: fields.number({
						label: "主题色相 (0-360)",
						validation: { min: 0, max: 360 },
					}),
					defaultMode: fields.select({
						label: "默认主题模式",
						options: [
							{ label: "跟随系统", value: "system" },
							{ label: "浅色", value: "light" },
							{ label: "深色", value: "dark" },
						],
						defaultValue: "system",
					}),
				}),
				pageWidth: fields.number({
					label: "页面宽度 (rem)",
					defaultValue: 100,
				}),
				card: fields.object({
					border: fields.checkbox({ label: "卡片边框" }),
					followTheme: fields.checkbox({ label: "卡片跟随主题色" }),
				}),
				navbar: fields.object({
					title: fields.text({ label: "导航栏标题" }),
					widthFull: fields.checkbox({ label: "全宽导航栏" }),
					menuAlign: fields.select({
						label: "菜单对齐",
						options: [
							{ label: "居中", value: "center" },
							{ label: "左对齐", value: "left" },
						],
						defaultValue: "center",
					}),
					followTheme: fields.checkbox({ label: "导航栏跟随主题色" }),
					stickyNavbar: fields.checkbox({ label: "固定导航栏" }),
				}),
				siteStartDate: fields.text({
					label: "站点开始日期",
					description: "格式：YYYY-MM-DD",
				}),
				pages: fields.object({
					friends: fields.checkbox({ label: "友链页面" }),
					sponsor: fields.checkbox({ label: "打赏页面" }),
					guestbook: fields.checkbox({ label: "留言板页面" }),
					bangumi: fields.checkbox({ label: "番组计划页面" }),
					gallery: fields.checkbox({ label: "相册页面" }),
					anime: fields.checkbox({ label: "追番页面" }),
					dynamic: fields.checkbox({ label: "动态页面" }),
				}),
				categoryBar: fields.checkbox({
					label: "分类导航栏",
					description: "首页和归档页顶部的分类快捷导航",
				}),
				foldArticle: fields.checkbox({
					label: "折叠旧文章",
					description: "归档页是否折叠非最新年份文章",
				}),
				postListLayout: fields.object({
					defaultMode: fields.select({
						label: "默认布局模式",
						options: [
							{ label: "列表", value: "list" },
							{ label: "网格", value: "grid" },
						],
						defaultValue: "list",
					}),
					mobileDefaultMode: fields.select({
						label: "移动端默认布局",
						options: [
							{ label: "列表", value: "list" },
							{ label: "网格", value: "grid" },
						],
						defaultValue: "grid",
					}),
					descriptionLines: fields.number({
						label: "简介显示行数",
						defaultValue: 2,
					}),
					showStatsIcons: fields.checkbox({ label: "统计信息图标" }),
					tagsPosition: fields.select({
						label: "标签位置",
						options: [
							{ label: "元数据区", value: "meta" },
							{ label: "底部", value: "bottom" },
						],
						defaultValue: "bottom",
					}),
					meta: fields.object({
						showPublished: fields.checkbox({ label: "显示发布日期" }),
						showCategory: fields.checkbox({ label: "显示分类" }),
						showTags: fields.checkbox({ label: "显示标签" }),
						tagCount: fields.number({ label: "标签数量上限" }),
						showWords: fields.checkbox({ label: "显示字数" }),
						showReadingTime: fields.checkbox({ label: "显示阅读时间" }),
					}),
					stats: fields.object({
						showPublished: fields.checkbox({ label: "显示发布日期" }),
						showWords: fields.checkbox({ label: "显示字数" }),
						showReadingTime: fields.checkbox({ label: "显示阅读时间" }),
					}),
					grid: fields.object({
						masonry: fields.checkbox({ label: "瀑布流布局" }),
						columnWidth: fields.number({ label: "卡片最小宽度(px)" }),
					}),
				}),
				post: fields.object({
					showLastModified: fields.checkbox({
						label: "显示上次编辑时间",
					}),
					outdatedThreshold: fields.number({
						label: "文章过期阈值(天)",
					}),
					rehypeCallouts: fields.object({
						theme: fields.text({
							label: "Callouts 主题",
							description: "例如: github",
						}),
						enablePythonMarkdownAdmonitions: fields.checkbox({
							label: "启用 Python Markdown Admonitions",
							defaultValue: false,
						}),
					}, {
						label: "Callouts 配置",
					}),
					sharePoster: fields.checkbox({ label: "分享海报" }),
					generateOgImages: fields.checkbox({
						label: "OpenGraph 图片",
						description: "开启后构建时间会显著增加",
					}),
				}),
				pagination: fields.object({
					postsPerPage: fields.number({
						label: "每页文章数",
						defaultValue: 10,
					}),
				}),
			},
		}),

		/** 个人资料 */
		profileConfig: singleton({
			label: "个人资料",
			path: "src/config/profileConfigData",
			format: "json",
			schema: {
				avatar: fields.text({
					label: "头像路径",
					description: "例如：assets/images/logo.png",
				}),
				name: fields.text({ label: "名字" }),
				bio: fields.text({ label: "个人签名", multiline: true }),
				links: fields.array(
					fields.object({
						name: fields.text({ label: "名称" }),
						icon: fields.text({
							label: "图标",
							description: "例如：fa7-brands:github",
						}),
						url: fields.text({ label: "链接" }),
						showName: fields.checkbox({ label: "显示名称" }),
					}),
					{
						label: "社交链接",
						itemLabel: (props) => props.fields.name.value || "新链接",
					},
				),
			},
		}),

		/** 公告 */
		announcementConfig: singleton({
			label: "公告",
			path: "src/config/announcementConfigData",
			format: "json",
			schema: {
				title: fields.text({ label: "公告标题" }),
				content: fields.text({
					label: "公告内容",
					multiline: true,
				}),
				closable: fields.checkbox({ label: "允许关闭" }),
				link: fields.object({
					enable: fields.checkbox({ label: "启用链接" }),
					text: fields.text({ label: "链接文本" }),
					url: fields.text({ label: "链接地址" }),
					external: fields.checkbox({ label: "外部链接" }),
				}),
			},
		}),

		/** 友链 */
		friendsConfig: singleton({
			label: "友链管理",
			path: "src/config/friendsConfigData",
			format: "json",
			schema: {
				friends: fields.array(
					fields.object({
						title: fields.text({ label: "站点名称" }),
						imgurl: fields.text({ label: "头像/图标 URL" }),
						desc: fields.text({ label: "描述", multiline: true }),
						siteurl: fields.text({ label: "站点链接" }),
						tags: fields.array(fields.text({ label: "标签" }), {
							label: "标签",
							itemLabel: (props) => props.value || "标签",
						}),
						weight: fields.number({
							label: "权重",
							description: "数字越大越靠前",
						}),
						enabled: fields.checkbox({
							label: "启用",
							defaultValue: true,
						}),
					}),
					{
						label: "友链列表",
						itemLabel: (props) => props.fields.title.value || "新友链",
					},
				),
			},
		}),
	},
});