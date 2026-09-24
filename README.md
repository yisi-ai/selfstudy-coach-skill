# 自学辅导 Skill

让 AI 根据你的目标和基础辅导自学，提供知识讲解、答疑，以及网页问卷、测验和错题复盘。

## 一句话让 Agent 安装

把下面这句话发给支持 Skill、能够联网并写入本机文件的 Agent：

> 请从 https://github.com/yisi-ai/selfstudy-coach-skill 安装自学辅导 Skill 到你当前宿主的 Skill 目录，安装目录名为 selfstudy-coach，并验证安装成功；如果已经安装，请先备份并保留我的自定义内容。

Agent 根据当前宿主识别实际安装位置，获取本仓库的完整 Skill 文件，放入 `selfstudy-coach/` 目录。仓库名是 `selfstudy-coach-skill`，Skill 的安装目录与调用名是 `selfstudy-coach`；仓库根目录就是正式内容，包含 `SKILL.md`、`release.json`、说明文档以及 `agents/`、`references/`、`scripts/`，安装时排除 `.git/`。脚本已编译，可直接使用。

安装后，Agent 应核对实际目录中的入口、版本和引用文件，并按宿主要求重新加载 Skill；需要开启新会话时告知用户。已有安装按 [更新流程](references/version-update.md) 备份并保留定制。无法写入本机文件的网页版 AI 不适用这种自动安装方式。

安装完成后，可以说：

> 使用 $selfstudy-coach 帮我学习一个主题，先了解我的目标和基础，再从适合我的内容开始。

## 使用说明

供网页版 AI 和桌面 Agent 使用：根据当前目标和已有理解提供知识入门、分步讲解、会话总结、答疑和复盘。首次学习某个主题时，可以先邀请用户做一份简短的网页选择题问卷，同意后再出题，根据实际回答确定学习起点；用户可以跳过。需要网页验证时，网页版 AI 提供完整导入内容和带操作提醒的网址，桌面 Agent 在用户电脑上自动连接并导入。问卷确认导入后直接进入第一题；知识测验自动导入默认中等难度，手动导入由用户选择难度并开始。闪卡、简答题的 Web 功能尚未实现。

将正式发布目录或独立仓库中的 Skill 内容放入 Agent 的 `selfstudy-coach` Skill 目录，入口为 [SKILL.md](SKILL.md)，调用 `$selfstudy-coach`。英文 name 与目录保持固定；显示名独立配置在 SKILL.md 的 metadata.display_name（自学辅导）和 metadata.display_name_en（Self-Study Tutor）。agents/openai.yaml 同步中文界面名；实际呈现取决于宿主支持的显示字段。

例如：“使用 $selfstudy-coach 帮我入门一个主题”“总结当前会话的知识与疑点”“我卡在这个概念上”“把刚才学的内容出成测验让我做”。学习阶段从当前情况判断，不要求从课程第一步开始，也不强制每次都出题。

准备使用 Web 且具备页面读取能力时，Agent 静默读取网页的 Skill 操作版本 data-skill-operation-version（旧页面兼容 data-gaga-version 和 data-gaga-release.version），与 Skill 的 metadata.version 比较；网页版无法读取时直接提供指导，不要求用户额外检查。版本相同直接继续，不向用户汇报“版本一致”或“无需更新”。只有网页对应的 Skill 版本更新时，才显示双方版本并询问用户是否更新；同意后由 Agent 使用用户提供的正式目录或明确指定的发布来源更新并保留定制。当前未配置远程更新地址，缺少可用版本时保留当前安装，不声称更新完成。版本差异不阻止继续使用，不依据内容哈希限制用户修改。具体见 [更新流程](references/version-update.md)。

只讲解或总结无需浏览器。使用网页功能前先分流：网页版 AI 和只有云端工具的宿主直接使用 [指导与提醒链接](references/browser-handoff.md#网页版指导与提醒链接)，不运行 Node，也不要求用户安装它。电脑上安装且能调用用户本机工具的 Agent 优先使用 [本机连接](references/local-connection.md)，知识测验、问卷和题库检索共用连接；已有可靠页面操作工具时可使用前端命令。桌面应用优先使用自己的侧栏，WorkBuddy 必须使用右栏预览面板；导入和读取都须核验实际可见的答题页，不把另一浏览器的成功操作当作侧栏成功。

题目及成绩由浏览器本地保存；问卷只缓存当前一份及其回答，不进入题集库、备份或历史。桌面自动连接在用户告知完成后读取回答；网页版 AI 需要用户贴回展开后的问卷回答，或复制题库备份用于测验复盘。读取脚本不会向网站服务器上传数据；交给 AI 分析的数据由用户选择的 Agent 处理。用户可以修改自己的 Skill；更新时先备份并合并修改，不强制覆盖。

Skill 的维护源位于主项目 `apps/web/skills/selfstudy-coach/`，正式产物导出到 `~/project/skills/selfstudy-coach-skill/` 独立 Git 仓库。Web 声明支持的「Skill 操作版本」，仅在影响 Skill 操作的功能变化、两边完成同步时更新；普通网站部署或非操作改动不改变它。主仓库忽略本 Skill 的整个 dist；本地测试版只留在本机，不进入任一仓库。发布记录见 [release.json](release.json)，维护方法见 [MAINTAINING.md](MAINTAINING.md)。

桌面自动连接需要用户电脑上的 Node.js 22+ 与交互网页展示能力，不能使用云端终端的 localhost；具体命令见 [连接说明](references/local-connection.md)。网页版的完整导入、备份提醒网址和交接步骤见 [网页版指引](references/browser-handoff.md#网页版指导与提醒链接)，链接不代表已自动导入或已在 AI 侧栏打开。
