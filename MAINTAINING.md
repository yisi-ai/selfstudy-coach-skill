# Maintenance and releases

The maintenance source lives in `yisi-ai-skills/apps/web/skills/selfstudy-coach/` in the main project. Commit documentation, browser scripts, and tools there. The standalone release repository is `~/project/skills/selfstudy-coach-skill/`, initialized as a separate Git repository. Its repository name is `selfstudy-coach-skill`; the installation directory and invocation name remain `selfstudy-coach`. Users do not need the main project or packaging tools. Direct page operations need no Node.js; the learning local connection requires a host capable of running Node.js 22+. The default release source is [yisi-ai/selfstudy-coach-skill](https://github.com/yisi-ai/selfstudy-coach-skill); verify another official source if the user selects one.

## Skill operation version

`SKILL.md`'s `metadata.version` is authoritative. `web:skill:sync` synchronizes Web's `platform/skill-operations.json`, Chrome's `src/platform/skill-operations.json`, and Weapp's `lib/study-operations.generated.json`. All declare the same `skillOperationVersion`, exposed through page `data-skill-operation-version` and the `version` and `help` commands. Legacy `data-gaga-version`, `data-gaga-release.version`, and `webVersion` are aliases for that same operation version. Web no longer reads a version from package.json or increments one independently.

Versions remain useful for release validation, artifact selection, and diagnosis. Agents do not compare Web and skill versions at startup or before normal operations. At runtime, discover capabilities and operate first; if blocked, diagnose the actual error. Recommend an update only for confirmed skill incompatibility with an applicable newer release. Version fields in `help`, `status`, and legacy snapshots do not trigger upgrade prompts. Honor explicit user requests to check or update. Development-time version consistency checks remain in place.

The skill maintains basic connections, operations, and learning boundaries. Web maintains current command names, parameters, result semantics, examples, and write flags in command definitions exposed by `help` and public `/agent/commands`. Agents compose actual capabilities rather than treating skill examples as an exhaustive catalog. Public documentation provides only capability metadata; actual libraries are read from the user's answering host.

Compatible new commands, optional filters, result fields, and UI changes do not require a skill update or operation-version increase. New commands need sufficient parameter and result documentation to be called independently and must be verified through the existing connection. Update the skill and adopt a new aligned version for incompatible connection protocols, basic entry points, required parameters, existing field meanings, or basic quiz formats, or changes to teaching principles and host support. Judge compatibility by whether the existing skill can operate correctly using dynamic descriptions, not by feature size. Pure visual changes, performance improvements, deployments, spelling corrections, and internal refactors retain the version.

For example, searching by cumulative wrong-answer count requires real cumulative data exposed through filters or readable statistics. Agents can compose filters but cannot derive counts from the latest result alone. If the addition preserves field semantics and the connection protocol and is discoverable through `help`, no skill change is needed. Editing this document or `help` alone does not create statistics.

Validation is no longer tied to all Web source files. `check` verifies declared versions, generated scripts, and the official skill's packaging record. It cannot determine whether operation documentation is semantically complete; developers must review affected behavior. Release-source hashes are for maintenance checks only and must never restrict user customizations or force runtime updates.

## Runtime reference boundaries

The skill targets Web only. Keep the route order in SKILL.md: local Node with the user's sidebar or system browser, browser tools controlling the actual answering page, then file/code handoff. Start the service on the first learning response, before an activity is needed, and reuse its record. Keep it on standby across replies and conversation completion until explicit shutdown. Each route has one reference; shared teaching, format, storage, and command documents must not expand manual delivery or reclassify hosts. Browser MCPs and other browser skills are allowed when they control the user's actual page. Product-level shared version declarations do not expand the skill into extension or native-app workflows.

Review the source and both generated editions for these cases: the first plan-only conversation starts Node without placeholder content; Node plus browser tools selects Node; a TUI with only a local terminal starts the service and opens the system browser; a missing browser opener leaves the service waiting with its preview link; local-listening permission failures use the host's approval flow and resume the same session; invisible browsers do not qualify; cloud-only code execution selects file delivery unless tools control the user's actual page; later activities reuse the recorded channel; a dropped connection is recovered before fallback; end-of-turn cleanup never stops the service. Check removed reference links and local-origin substitution when reorganizing files. Packaged user-customized installations still require the existing consent and merge procedure.

## Work in the main project

Use the main project's Node.js 24, pnpm, and dependencies. From the project root:

```bash
# When operation alignment is needed, update skill instructions and metadata.version,
# then synchronize platform declarations and browser scripts.
pnpm web:skill:sync
pnpm web:skill:check
pnpm web:skill:test
pnpm web:skill:pack
# Optional: generate the local-only test edition.
pnpm web:skill:local
```

Compatible extensions with an unchanged basic contract need no version change. Generated scripts need regeneration only when their source dependencies change; regeneration does not mean users must upgrade. `sync` does not update feature descriptions or decide compatibility. Web builds and CI check synchronization; CI also verifies release packaging.

Packaging produces an installable directory, not an archive or archive-checksum file. Output lives under the skill's Git-ignored `dist/`. Release content may be exported to the independent repository described below:

- Production installation directory: `dist/selfstudy-coach-skill/selfstudy-coach/`.
- Local installation directory: `dist/selfstudy-coach-local-skill/selfstudy-coach-local/`.

The local edition defaults to `http://localhost:3218`. Keep test directories local; do not commit or upload them.

## WorkBuddy package

For an explicitly requested WorkBuddy import package, run `pnpm web:skill:workbuddy` (Python 3 is needed only for packaging). It first validates and packs the formal edition, then generates `dist/selfstudy-coach-workbuddy-skill/selfstudy-coach/` and a ZIP named after the Chinese display name and operation version. The ZIP has `SKILL.md` at its root and includes the same references and runtime scripts.

The adapter adds the top-level display names, bilingual descriptions, version, and author documented by [WorkBuddy](https://open.workbuddy.cn/docs/skill), and recomputes the adapted content hash. The source's `metadata.version` remains authoritative; a display-name or packaging change does not increase it. This WorkBuddy ZIP is an explicit import deliverable; the standard pack/export workflow continues to produce an installation directory. Generated WorkBuddy content stays in ignored `dist/` and does not enter the formal Git repository. Updating an installed copy still preserves user customizations.

## Export to the independent release repository

Initialize `~/project/skills/selfstudy-coach-skill/` once with `git init -b main`. Then run from the main project root:

```bash
pnpm web:skill:sync
pnpm web:skill:check
pnpm web:skill:test
pnpm web:skill:pack --output ~/project/skills/selfstudy-coach-skill
```

`--output` must name the root of an independent Git repository called `selfstudy-coach-skill`. The command validates and builds the production installation directory, then synchronizes SKILL.md, the five README files (README.md, README.zh-CN.md, README.zh-TW.md, README.ja.md, README.ko.md), MAINTAINING.md, release.json, agents, references, and scripts into the repository root. All five READMEs participate in the release source hash. It creates no `packages/` directory or archives. These generated files and directories are replaced as a whole, removing obsolete scripts; make maintenance edits in the main source instead. `.git` and unrelated files are preserved. Local test output, tools, node_modules, backups, and main-project source are excluded.

Without `--output`, `pnpm web:skill:pack` only generates the production directory in `dist/` for CI validation and reuse by the local edition. It does not write to the developer's release repository. Export does not commit, configure remotes, or push automatically. Review the diff, then save release content with a Chinese commit message. Publish to [yisi-ai/selfstudy-coach-skill](https://github.com/yisi-ai/selfstudy-coach-skill) from the independent repository using explicit `git push skill-apps HEAD:refs/heads/main`. Verify remote main and the release-file scope first; do not force-overwrite the remote. The main project continues to use feature branches and pull requests.

Prepare a deliverable matching release directory before deploying a new skill operation version. Updates select content matching the webpage's declared operation version rather than blindly downloading latest. Install only with user consent, backing up and preserving customizations. Local editions always use locally generated test directories.
