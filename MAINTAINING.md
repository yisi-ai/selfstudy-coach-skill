# 维护与正式发布

维护源位于主项目 `yisi-ai-skills/apps/web/skills/selfstudy-coach/`，说明、浏览器脚本及 tools 随主项目提交。正式产物仓库位于 `~/project/skills/selfstudy-coach-skill/`，在该目录单独初始化 Git。仓库名为 `selfstudy-coach-skill`，Skill 的安装目录与调用名仍为 `selfstudy-coach`。安装用户不需要主项目或打包工具；直接操作网页不需要 Node.js，学习本机连接需要宿主可运行 Node.js 22+。Skill 当前未配置远程更新源。

## Skill 操作版本

Skill 的 `SKILL.md metadata.version` 是版本来源。Web 的 `platform/skill-operations.json` 声明支持的 `skillOperationVersion`，页面通过 `data-skill-operation-version` 暴露，前端 `version` 和 `help` 命令也返回它。旧 `data-gaga-version`、`data-gaga-release.version` 和 `webVersion` 仅为兼容别名，均表示同一个 Skill 操作版本。Web 不再从 package.json 读取或独立递增版本。

只有变更影响 Skill 指导或执行的用户操作时，才同步更新功能说明、命令、入口、数据格式和脚本；两边对齐后使用新的 Skill 操作版本。新增学习功能、修改导入流程或存档协议属于此范围。纯视觉、性能优化、部署和不改变操作的内部重构保持版本不变。拼写修正和维护工具调整也不表示操作能力变化。

校验不再绑定整个 Web 源码。`check` 核对声明版本和生成脚本，并检查官方 Skill 的打包记录；它不能判断操作说明的语义是否完整，开发者仍须审查受影响功能。正式内容的源码摘要只用于维护检查，运行时绝不据此限制用户定制或强制升级。

## 主项目内维护

使用主项目的 Node.js 24、pnpm 和依赖。在主项目根目录执行：

```bash
# 需要操作同步时，先更新 Skill 说明和 metadata.version，再同步 Web 声明与浏览器脚本。
pnpm web:skill:sync
pnpm web:skill:check
pnpm web:skill:test
pnpm web:skill:pack
# 可选：生成仅本机使用的测试版。
pnpm web:skill:local
```

操作不变时不用更改版本。如果只是脚本实现重构，重新生成脚本并校验即可。`sync` 不会自动修改功能说明或替开发者决定是否需要新版本。Web 构建及 CI 均执行同步校验；CI 同时验证正式打包。

Skill 打包只生成可直接安装的目录，不生成压缩包或压缩包校验文件。产物位于本 Skill 的 `dist/`，整个目录忽略 Git；正式内容可导出到下述独立仓库：

- 正式安装目录：`dist/selfstudy-coach-skill/selfstudy-coach/`。
- 本地安装目录：`dist/selfstudy-coach-local-skill/selfstudy-coach-local/`。

本地测试版默认连接 `http://localhost:3218`；测试目录只保留在本机，不提交、不上传。

## 导出到独立产物仓库

首次在 `~/project/skills/selfstudy-coach-skill/` 执行 `git init -b main`。之后在主项目根目录运行：

```bash
pnpm web:skill:sync
pnpm web:skill:check
pnpm web:skill:test
pnpm web:skill:pack --output ~/project/skills/selfstudy-coach-skill
```

`--output` 必须指向名为 `selfstudy-coach-skill` 的独立 Git 仓库根目录。命令先校验并生成正式安装目录，再将 SKILL.md、README.md、MAINTAINING.md、release.json、agents、references 和 scripts 同步到产物仓库根目录，不创建 `packages/` 或压缩包。这些生成文件和目录会整体替换，旧脚本会移除；维护修改应在主项目源码中进行。仓库的 `.git` 和其他文件保留。本地测试产物、tools、node_modules、备份和主项目源码不导出。

不带 `--output` 的 `pnpm web:skill:pack` 仅生成 dist 中的正式目录，供 CI 校验和本地测试版复用，不写入开发者的产物仓库。导出不自动提交、配置远程或推送；检查差异后使用中文提交信息保存产物。远程发布地址由维护者另行指定，不能沿用已移除的旧仓库地址或把本地产物声称为公开下载。主项目仍按功能分支与 PR 规则提交。

上线新的 Skill 操作版本之前，先准备可交付的对应正式目录。更新时选择与网页 Skill 操作版本相同的正式内容，不盲目下载 latest；用户同意后才安装，先备份并保留定制。本地测试版始终使用本机生成的测试目录。
