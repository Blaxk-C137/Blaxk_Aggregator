# Responsiveness and import rules

## Changes
- Imports, document extraction, combined-output generation, and all export formats execute in disposable module Web Workers. Cancel terminates the active import/export worker; cancelled imports commit no partial files.
- Combined previews are generated only when their tab is open; stale preview jobs are terminated when input changes or the tab closes.
- Previews display at most 500 rows, 120,000 characters, and 1,000 characters per row. This is a preview-only limit; exports use full file contents.
- File explorer displays at most 500 matching files; search locates the rest. Selection/export still covers the full imported collection.
- Ignore rules and metadata filters run before content extraction. Null-containing binary samples and common binary file extensions are skipped.
- Source file size limit remains configurable. Imports have a 200 MiB source-byte budget. These are safety limits, not guarantees against memory exhaustion: extracted documents can be larger than their source files.
- Duplicate paths are not appended to existing imports. Clear the project before re-importing changed files.
- Progress messages are throttled; stats, file grouping and preview rows are memoized. Search updates use deferred rendering.
- PDF export wraps rather than silently truncates long lines.
- Document libraries and the single ThreeUI renderer are loaded separately from the main application. PDF.js uses a bundled local worker instead of a CDN URL.

## Gitignore behavior
Select the **project root folder**, including its `.gitignore` files. Root and nested `.gitignore` files are automatically read. Matching uses the `ignore` package, supporting comments, globs, negation, anchored rules and ignored-directory semantics. Nested rules can override file exclusions, but cannot reopen an ignored ancestor directory.

The browser grants access only to selected files. Rules outside the selection, global Git excludes and `.git/info/exclude` are not automatically available. Individually added files without relative paths cannot be matched to nested directory rules. Git tracked/untracked state is not inspected. Ignored files are filtered even if tracked in a repository.

Manual exclusions are applied separately and cannot be overridden by `.gitignore` negations. Filters apply on import; change settings and re-import to apply new rules. Root/nested `.gitignore` files up to 1 MiB each are read. Larger rule files are not parsed.

## Run and deploy
```
npm ci
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
npm test
npm run typecheck
npm run build
```
Deploy the **entire `dist/` directory** on an HTTP(S) server, not just index.html. The previous single-file build was replaced with an asset-split build to support workers and avoid eagerly downloading heavy libraries. If a Content Security Policy is configured, it must allow same-origin workers and blob download URLs as appropriate.

## Validation
- Seven automated tests: root/nested rules, negation, directory pruning, manual exclusions, size/type/depth filtering, large-file preservation, binary detection, and worker-safe HTML escaping.
- Browser smoke check: 140,000-line source import; preview capped at 500 rows; combined preview; full text download; PDF download; gitignore filtering; no page errors in that run.
- Cancellation verified with delayed worker startup: no imported files committed.
- TypeScript check and production build pass.

The application still holds imported text in memory. It is not intended for arbitrarily large repositories or multi-gigabyte files; larger-scale storage/streaming would require a separate IndexedDB/OPFS design. Clipboard permissions and very large clipboard writes remain subject to browser limits.
