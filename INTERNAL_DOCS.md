# Bunch Internal Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Backend (Rust)](#backend-rust)
  - [Models](#models)
  - [Scanner Module](#scanner-module)
  - [Commands](#commands)
- [Frontend (TypeScript/React)](#frontend-typescriptreact)
  - [Types](#types)
  - [Tauri Command Wrappers](#tauri-command-wrappers)
  - [Context Providers](#context-providers)
  - [Components](#components)
- [Key Features](#key-features)
  - [Lazy Loading](#lazy-loading)
  - [Agent Owner Inference](#agent-owner-inference)
  - [File Watcher](#file-watcher)
  - [Right-Click Context Menu](#right-click-context-menu)
  - [Status Bar File Stats](#status-bar-file-stats)
  - [Expanded State Preservation](#expanded-state-preservation)
  - [Inheritance Chain Viewer](#inheritance-chain-viewer)
  - [Content Search](#content-search)
  - [Tree Filtering](#tree-filtering)
  - [Theme and Zoom](#theme-and-zoom)
- [Key Patterns and Decisions](#key-patterns-and-decisions)
  - [treeRef Pattern](#treeref-pattern)
  - [scannedPathsRef for Stable Watcher Callback](#scannedpathsref-for-stable-watcher-callback)
  - [rebuildTreeNodes Preserves Expanded IDs](#rebuildtreenodes-preserves-expanded-ids)
  - [useEffect Runs Once on Mount](#useeffect-runs-once-on-mount)
  - [applyTree as Single Update Point](#applytree-as-single-update-point)
- [Tauri Plugins and Dependencies](#tauri-plugins-and-dependencies)
- [Styling](#styling)


---


## Overview

Bunch is a Tauri v2 desktop application for managing Claude Code configuration files. It provides a graphical interface for browsing, editing, and organizing the config files that live under `~/.claude/`, including global settings, project-specific configurations, agent definitions, and slash commands.

The app discovers config files at the global level (`~/.claude/CLAUDE.md`, `~/.claude/settings.json`, `~/.claude/agents/*.md`, `~/.claude/commands/*.md`) and at the project level (project CLAUDE.md files, `.claude/settings.local.json`, project agents, project commands). It presents these in a tree view grouped by parent directory, and opens them in a tabbed Monaco Editor with live markdown preview.


## Architecture

Bunch follows the standard Tauri v2 architecture:

- **Backend**: Rust (via `tauri` 2.x), handles filesystem scanning, file reading/writing, file watching, and platform-specific operations (open in Finder/Explorer).
- **Frontend**: React 18 with TypeScript, TailwindCSS for styling, Monaco Editor for code editing, and `react-markdown` with `remark-gfm` for rendered markdown preview.
- **IPC**: The frontend calls Rust functions through Tauri's `invoke` system. The backend emits events to the frontend through Tauri's event system (`app.emit`).

The Rust backend exposes a set of commands registered via `tauri::generate_handler![]` in `lib.rs`. The frontend wraps each command in a typed async function in `tauri-commands.ts`, and all state management flows through `ConfigTreeContext`.


## Project Structure

```
bunch/
  package.json              # Frontend dependencies and scripts
  vite.config.ts            # Vite build config
  tailwind.config.ts        # TailwindCSS config
  tsconfig.json             # TypeScript config
  index.html                # HTML entry point
  src/
    main.tsx                # React entry point, renders <App />
    App.tsx                 # Root component: ThemeProvider > ZoomProvider > ConfigTreeProvider > AppLayout
    types/
      config-tree.ts        # TypeScript mirrors of Rust data types
      settings.ts           # AppSettings interface
    lib/
      tauri-commands.ts     # Typed wrappers around Tauri invoke calls
      config-parser.ts      # buildTreeData(), filterTreeByType(), groupProjectsByParent()
      path-utils.ts         # shortenPath(), getFileExtension(), getLanguageFromPath()
    context/
      ConfigTreeContext.tsx  # Core state management: tree, tabs, filters, search, file watcher
      ThemeContext.tsx       # Light/dark theme with localStorage persistence
      ZoomContext.tsx        # Zoom level (0.6x to 1.6x) with keyboard shortcuts
    components/
      layout/
        AppLayout.tsx       # Top-level layout: resizable sidebar + main panel + status bar
        Sidebar.tsx         # Header with action buttons, search, filter, tree view
        MainPanel.tsx       # Tab bar + editor panel, or inheritance chain viewer
        StatusBar.tsx       # Bottom bar: project count, scan time, file stats, zoom, theme
      tree/
        TreeView.tsx        # Renders TreeNode list or search results
        TreeNode.tsx        # Recursive tree node: folders, projects, files
        TreeFilter.tsx      # Filter pills: All, CLAUDE.md, Settings, Agents, Commands
        TreeSearch.tsx      # Search input with debounced content search
        ContextMenu.tsx     # Right-click menu: Show in Enclosing Folder, Delete
      editor/
        EditorPanel.tsx     # Chooses view mode: raw, split, or preview
        EditorTabs.tsx      # Horizontal tab bar with dirty indicators
        EditorToolbar.tsx   # File path, view mode toggles, save button
        MonacoEditor.tsx    # Monaco Editor wrapper with Cmd+S save
        MarkdownPreview.tsx # react-markdown with GFM support
      inheritance/
        InheritanceChain.tsx # Shows global-to-project config inheritance
        InheritanceNode.tsx  # Single level in the chain (global or project)
      settings/
        SettingsPanel.tsx   # Theme and zoom controls
        ThemeToggle.tsx     # Compact theme toggle button for status bar
        ZoomControl.tsx     # Compact zoom buttons for status bar
    styles/
      globals.css           # Tailwind directives, base styles, component classes
  src-tauri/
    Cargo.toml              # Rust dependencies
    src/
      main.rs               # Binary entry point, calls bunch_lib::run()
      lib.rs                 # Tauri builder: registers plugins and command handlers
      models/
        mod.rs               # Re-exports config_node module
        config_node.rs       # Core data types: ConfigTree, ProjectNode, ConfigFile, etc.
        settings.rs          # ClaudeSettings struct
      scanner/
        mod.rs               # Re-exports discovery, tree_builder, owner_inference
        discovery.rs         # Filesystem scanning: scan_global_files, scan_projects, scan_single_project, decode_project_path
        tree_builder.rs      # build_config_tree, build_global_tree, build_inheritance_chain, search_content
        owner_inference.rs   # infer_agent_owner: filename, frontmatter, keyword scoring
      commands/
        mod.rs               # Re-exports scan, files, watch
        scan.rs              # Tauri commands: scan_config_tree, scan_global_only, scan_project_folder, get_inheritance_chain, search_config_content
        files.rs             # Tauri commands: read_config_file, write_config_file, delete_config_file, show_in_folder
        watch.rs             # Tauri commands: start_watching, stop_watching (notify crate)
```


## Backend (Rust)


### Models

Defined in `src-tauri/src/models/config_node.rs`. All types derive `Serialize` and `Deserialize` with `#[serde(rename_all = "camelCase")]` so they serialize directly to camelCase JSON for the frontend.

**ConfigFileType** (enum): Identifies the kind of config file.
- `ClaudeMd` - A CLAUDE.md file
- `SettingsJson` - A settings.json file
- `SettingsLocalJson` - A settings.local.json file
- `AgentMd` - An agent definition (.md in agents/ directory)
- `CommandMd` - A slash command definition (.md in commands/ directory)

**ConfigLevel** (enum): Whether a file belongs to the global scope or a specific project.
- `Global`
- `Project`

**AgentOwner** (enum): Which AI tool or user likely owns an agent file.
- `Claude`, `Codex`, `Cursor`, `Windsurf`, `Antigravity`, `User`

**ConfigFile** (struct): Represents a single config file on disk.
- `path: String` - Absolute filesystem path
- `file_type: ConfigFileType`
- `level: ConfigLevel`
- `name: String` - Filename (e.g. "CLAUDE.md")
- `size: u64` - File size in bytes
- `modified: Option<String>` - Last modified timestamp formatted as "YYYY-MM-DD HH:MM:SS"
- `project_path: Option<String>` - For project-level files, the decoded project path
- `owner: Option<AgentOwner>` - Inferred owner, only set for AgentMd files

**ProjectNode** (struct): A project with its associated config files.
- `name: String` - Short project name (last path segment)
- `path: String` - Encoded directory name under `~/.claude/projects/` (dash-separated)
- `decoded_path: String` - Actual filesystem path (e.g. `/Users/name/projects/myapp`)
- `files: Vec<ConfigFile>`

**GlobalNode** (struct): Container for global-level config files.
- `files: Vec<ConfigFile>`

**ConfigTree** (struct): The top-level data structure returned by scans.
- `global: GlobalNode`
- `projects: Vec<ProjectNode>`
- `scan_time_ms: u64` - How long the scan took in milliseconds

**InheritanceChainLevel** (struct): One level in the config inheritance chain.
- `level: ConfigLevel`
- `label: String` - Display label, e.g. "Global (~/.claude/)"
- `files: Vec<ConfigFile>`

**InheritanceChain** (struct): Shows how config files inherit from global to project.
- `project_name: String`
- `project_path: String`
- `levels: Vec<InheritanceChainLevel>` - Always two levels: global, then project

**SearchResult** and **SearchMatch** (structs): Content search results.
- `SearchResult` has a `file: ConfigFile` and `matches: Vec<SearchMatch>`
- `SearchMatch` has `line_number: usize` and `line_content: String`

**ClaudeSettings** (struct, in `settings.rs`): Represents parsed settings.json content.
- `permissions: HashMap<String, Value>`
- `env: HashMap<String, String>`
- `other: HashMap<String, Value>` (flattened catch-all)


### Scanner Module

Located in `src-tauri/src/scanner/`. Three files handle discovery, tree building, and owner inference.

#### discovery.rs

**`get_claude_home() -> PathBuf`**: Returns `~/.claude/` using the `dirs` crate.

**`scan_global_files(claude_home: &Path) -> GlobalNode`**: Scans for global config files:
1. `~/.claude/CLAUDE.md` (ClaudeMd)
2. `~/.claude/settings.json` (SettingsJson)
3. `~/.claude/agents/*.md` (AgentMd, with owner inference)
4. `~/.claude/commands/*.md` (CommandMd)

**`scan_projects(claude_home: &Path) -> Vec<ProjectNode>`**: Iterates directories under `~/.claude/projects/`. For each directory:
1. Decodes the dash-encoded directory name to a real filesystem path using `decode_project_path`
2. Looks for `CLAUDE.md` at the decoded project root
3. Looks for `.claude/settings.local.json`, `.claude/agents/*.md`, `.claude/commands/*.md`
4. Falls back to a stored `CLAUDE.md` inside the `~/.claude/projects/<encoded>/` directory itself if the project-root one is absent
5. Extracts a short display name from the last path segment
6. Sorts projects alphabetically (case-insensitive)

**`scan_single_project(folder_path: &str) -> Option<ProjectNode>`**: Scans a single project folder by its real filesystem path. Used when the user adds a project via the folder picker. Encodes the path (strips leading `/`, replaces `/` with `-`) to match the `~/.claude/projects/` convention.

**`decode_project_path(encoded: &str) -> String`**: Decodes a dash-separated directory name back to a real path. Uses a greedy filesystem resolution algorithm: splits by `-`, then tries the longest possible segments first, checking if each candidate path exists on disk. Falls back to single segments if no longer match resolves.

**`scan_md_dir(...)`**: Internal helper that scans a directory for `.md` files, creates `ConfigFile` entries, and runs owner inference for `AgentMd` files.

**`make_config_file(...) -> Option<ConfigFile>`**: Internal helper that reads file metadata (size, modified time) and constructs a `ConfigFile` struct.


#### tree_builder.rs

**`build_config_tree() -> ConfigTree`**: Full scan. Calls `scan_global_files` + `scan_projects`, measures elapsed time.

**`build_global_tree() -> ConfigTree`**: Global-only scan. Returns a `ConfigTree` with an empty projects array. This is what runs on startup for lazy loading.

**`build_inheritance_chain(project_encoded_name: &str) -> Option<InheritanceChain>`**: Builds a two-level chain showing global files and project files side by side.

**`search_content(query: &str, tree: &ConfigTree) -> Vec<SearchResult>`**: Case-insensitive content search across all files in the tree. Reads each file, checks each line against the query, returns matching lines with line numbers. Caps display at 3 matches per file on the frontend.


#### owner_inference.rs

**`infer_agent_owner(file_path: &Path, content: &str) -> AgentOwner`**: Three-stage inference for agent files:

1. **Filename check**: If the file stem (name without extension) contains "claude", "codex", "cursor", "windsurf", or "antigravity" (case-insensitive), returns the matching owner immediately.

2. **Frontmatter model field**: If the content starts with `---` (YAML frontmatter), extracts the `model:` field. Maps `claude-*`/`claude-opus*`/`claude-sonnet*`/`claude-haiku*` to Claude. Maps `gpt-*`/`o1-*`/`o3-*` to Codex.

3. **Keyword scoring**: Counts keyword occurrences in the content, each weighted:
   - Claude keywords: "anthropic" (weight 2), "claude code" (weight 3), "claude" (weight 1)
   - Codex keywords: "openai" (weight 2), "chatgpt" (weight 2), "codex" (weight 3)
   - Cursor keywords: "cursor" (weight 3)
   - Windsurf keywords: "codeium" (weight 3), "windsurf" (weight 3)
   - Antigravity keywords: "antigravity" (weight 3)
   - Count per keyword is capped at 5 occurrences to prevent outlier bias
   - Returns the owner with the highest score, or `User` if all scores are zero


### Commands

Located in `src-tauri/src/commands/`. These are the Tauri IPC endpoints.

#### scan.rs

- **`scan_config_tree() -> ConfigTree`**: Full scan of global + all discovered projects
- **`scan_global_only() -> ConfigTree`**: Global-only scan, returns empty projects array
- **`scan_project_folder(path: String) -> Option<ProjectNode>`**: Scan a single project by its real path
- **`get_inheritance_chain(project_path: String) -> Option<InheritanceChain>`**: Build inheritance chain for a project (by encoded path)
- **`search_config_content(query: String) -> Vec<SearchResult>`**: Content search across all files

#### files.rs

- **`read_config_file(path: String) -> Result<String, String>`**: Read file contents as UTF-8 string
- **`write_config_file(path: String, content: String) -> Result<(), String>`**: Write string content to file
- **`delete_config_file(path: String) -> Result<(), String>`**: Delete a file, errors if it does not exist
- **`show_in_folder(path: String) -> Result<(), String>`**: Opens the containing folder in the OS file manager. On macOS, uses `open -R` to reveal the file. On Linux, uses `xdg-open`. On Windows, uses `explorer`.

#### watch.rs

- **`start_watching(app: AppHandle) -> Result<(), String>`**: Creates a `notify::RecommendedWatcher` that watches `~/.claude/` recursively. Filters events for relevant file extensions (`.md`, `.json`) or paths containing `agents` or `commands`. On relevant changes, emits a `config-file-changed` event to the frontend. The watcher is stored in a `Mutex<Option<RecommendedWatcher>>` static.
- **`stop_watching() -> Result<(), String>`**: Drops the watcher by setting the static to `None`.


## Frontend (TypeScript/React)


### Types

Defined in `src/types/config-tree.ts`. These are TypeScript mirrors of the Rust types with camelCase field names.

**Data types** (matching Rust):
- `ConfigFileType`: `"ClaudeMd" | "SettingsJson" | "SettingsLocalJson" | "AgentMd" | "CommandMd"`
- `ConfigLevel`: `"Global" | "Project"`
- `AgentOwner`: `"Claude" | "Codex" | "Cursor" | "Windsurf" | "Antigravity" | "User"`
- `ConfigFile`, `ProjectNode`, `GlobalNode`, `ConfigTree`
- `InheritanceChainLevel`, `InheritanceChain`
- `SearchMatch`, `SearchResult`

**Frontend-only types**:
- `TreeNodeData`: UI tree representation with `id`, `label`, `type` (`"root" | "group" | "project" | "file"`), optional `configFile`/`project` references, `children` array, and `expanded` boolean
- `EditorTab`: Represents an open editor tab with `id` (same as file path), `path`, `name`, `content`, `originalContent`, `isDirty`, `fileType`, and `viewMode` (`"raw" | "split" | "preview"`)

Defined in `src/types/settings.ts`:
- `AppSettings`: `theme`, `zoom`, `sidebarWidth`


### Tauri Command Wrappers

Defined in `src/lib/tauri-commands.ts`. Each function calls `invoke<T>(command_name, { args })` and returns a typed Promise.

| Function | Rust Command | Return Type |
|---|---|---|
| `scanConfigTree()` | `scan_config_tree` | `ConfigTree` |
| `scanGlobalOnly()` | `scan_global_only` | `ConfigTree` |
| `scanProjectFolder(path)` | `scan_project_folder` | `ProjectNode \| null` |
| `getInheritanceChain(projectPath)` | `get_inheritance_chain` | `InheritanceChain \| null` |
| `readConfigFile(path)` | `read_config_file` | `string` |
| `writeConfigFile(path, content)` | `write_config_file` | `void` |
| `deleteConfigFile(path)` | `delete_config_file` | `void` |
| `searchConfigContent(query)` | `search_config_content` | `SearchResult[]` |
| `showInFolder(path)` | `show_in_folder` | `void` |
| `startWatching()` | `start_watching` | `void` |
| `stopWatching()` | `stop_watching` | `void` |


### Context Providers

#### ConfigTreeContext (`src/context/ConfigTreeContext.tsx`)

The core state provider. Manages:

- **tree** (`ConfigTree | null`): The raw scan data from Rust
- **rawTreeNodes** (`TreeNodeData[]`): Tree nodes built from `tree`, with expanded state
- **treeNodes** (`TreeNodeData[]`): Filtered version of `rawTreeNodes` based on active filter
- **loading** / **error**: Loading and error state
- **tabs** (`EditorTab[]`): Open editor tabs
- **activeTabId** (`string | null`): Currently selected tab
- **filter** (`FilterType`): Active filter (`"claudemd" | "settings" | "agents" | "commands" | null`)
- **searchQuery** / **searchResults**: Content search state with 300ms debounce
- **inheritanceChain** (`InheritanceChain | null`): When set, MainPanel shows the chain viewer instead of the editor
- **scannedProjectPaths** (`string[]`): Paths of projects loaded so far (state)
- **treeRef** (`useRef<ConfigTree | null>`): Ref mirror of `tree` for stable closures
- **scannedPathsRef** (`useRef<string[]>`): Ref mirror of `scannedProjectPaths` for watcher callback

Exposed actions:
- `rescan()`: Full scan of global + all projects
- `scanProject()`: Opens native folder picker, scans selected folder, merges into tree
- `deleteFile(path)`: Deletes file on disk, removes from tabs and tree
- `openFile(file)`: Opens a file in a new tab (or focuses existing tab)
- `closeTab(tabId)`: Closes tab, adjusts active tab selection
- `updateTabContent(tabId, content)`: Updates tab content, computes dirty state
- `saveTab(tabId)`: Writes tab content to disk via Rust
- `setFilter(filter)`: Sets tree filter type
- `setSearchQuery(query)`: Sets search query (debounced 300ms)
- `showInheritance(projectPath)`: Fetches and displays inheritance chain
- `clearInheritance()`: Returns to editor view
- `setViewMode(tabId, mode)`: Sets tab view mode (raw/split/preview)
- `toggleNodeExpanded(nodeId)`: Toggles tree node expanded/collapsed state

#### ThemeContext (`src/context/ThemeContext.tsx`)

Manages light/dark theme. Persists to `localStorage` under key `bunch-theme`. Toggles the `dark` class on `document.documentElement` for Tailwind dark mode.

#### ZoomContext (`src/context/ZoomContext.tsx`)

Manages UI zoom level (0.6x to 1.6x in 0.1 steps). Persists to `localStorage` under key `bunch-zoom`. Applies zoom by setting `document.documentElement.style.fontSize` to `zoom * 16px`. Registers global keyboard shortcuts: `Cmd+=` (zoom in), `Cmd+-` (zoom out), `Cmd+0` (reset).


### Components

#### Layout

**AppLayout** (`src/components/layout/AppLayout.tsx`): Top-level flex layout. Contains a resizable sidebar (200px to 600px, default 300px, persisted to `localStorage` under `bunch-sidebar-width`), a 4px drag handle, the main panel, and a status bar. Drag resizing is handled via document-level mousemove/mouseup listeners.

**Sidebar** (`src/components/layout/Sidebar.tsx`): Contains:
- Header with "BUNCH" title
- "+ Project" button (calls `scanProject`)
- "Scan All" button (calls `rescan`)
- `TreeSearch` component
- `TreeFilter` component
- `TreeView` component (scrollable)
- Loading/error states

**MainPanel** (`src/components/layout/MainPanel.tsx`): Conditionally renders:
1. `InheritanceChain` component if `inheritanceChain` is set
2. Empty state message if no tabs are open
3. `EditorTabs` + `EditorPanel` for the active tab

**StatusBar** (`src/components/layout/StatusBar.tsx`): Fixed 28px bottom bar showing:
- "Rescan" button
- Project count
- Scan time in milliseconds
- Active file path (shortened, with dirty indicator)
- File stats for active tab: size (B/KB), line count, paragraph count, estimated token count (~4 chars/token)
- Zoom controls and percentage
- Theme toggle and label

#### Tree

**TreeView** (`src/components/tree/TreeView.tsx`): Renders the tree or search results.
- If there is an active search query with results, shows `SearchResultNode` items (file name, path, up to 3 matching lines with line numbers)
- If search is active but no results, shows "No results found"
- Otherwise, renders `TreeNode` recursively

**TreeNode** (`src/components/tree/TreeNode.tsx`): Recursive component for tree nodes.
- **File nodes**: Shows a type indicator badge (M for ClaudeMd, S for Settings, A for Agent, C for Command) color-coded by type. Shows the filename. Displays an owner badge for agent files (unless owner is "User"). Right-click opens context menu. Click opens the file.
- **Folder/project/group nodes**: Shows a chevron for expand/collapse. Click toggles expanded state. Project nodes show file count. Double-click on project nodes opens the inheritance chain viewer.

Owner badge colors:
- Claude: orange
- Codex: emerald
- Cursor: cyan
- Windsurf: teal
- Antigravity: pink
- User: gray (hidden, not displayed)

**TreeFilter** (`src/components/tree/TreeFilter.tsx`): Row of pill buttons for filtering the tree. Options: All, CLAUDE.md, Settings, Agents, Commands. Active pill is highlighted blue.

**TreeSearch** (`src/components/tree/TreeSearch.tsx`): Simple text input. Value bound to `searchQuery` in context. The debounce logic (300ms) lives in `ConfigTreeContext`.

**ContextMenu** (`src/components/tree/ContextMenu.tsx`): Positioned absolutely at click coordinates. Dismisses on outside click or Escape. Takes an `items` array of `{ label, onClick, danger? }`. Used with two items: "Show in Enclosing Folder" and "Delete" (styled red).

#### Editor

**EditorPanel** (`src/components/editor/EditorPanel.tsx`): Given an `EditorTab`, renders the toolbar and the appropriate view:
- `"raw"`: Monaco editor only
- `"split"`: Monaco on left half, markdown preview on right half
- `"preview"`: Markdown preview only
- JSON files always show "raw" regardless of viewMode setting

**EditorTabs** (`src/components/editor/EditorTabs.tsx`): Horizontal tab bar. Each tab shows the filename with a dirty indicator (`*` in amber). Close button appears on hover. Active tab has a blue bottom border.

**EditorToolbar** (`src/components/editor/EditorToolbar.tsx`): Shows the shortened file path (monospace), view mode toggle buttons (Raw/Split/Preview, only for markdown files), and a Save button (enabled only when dirty).

**MonacoEditor** (`src/components/editor/MonacoEditor.tsx`): Wrapper around `@monaco-editor/react`. Configuration:
- Language detection from file extension (markdown or json)
- Font: JetBrains Mono, fallback to system monospace
- Font size: `14 * zoom` (rounded)
- Theme: `vs-dark` in dark mode, `light` in light mode
- Minimap disabled, word wrap on, line numbers on
- Registers global `Cmd+S` handler for saving

**MarkdownPreview** (`src/components/editor/MarkdownPreview.tsx`): Uses `react-markdown` with `remark-gfm` plugin. Applies Tailwind typography (`prose prose-sm`) with `prose-invert` for dark mode.

#### Inheritance

**InheritanceChain** (`src/components/inheritance/InheritanceChain.tsx`): Shows the project name and path, a "Close" button, and a vertical chain of `InheritanceNode` components connected by arrow indicators with "inherits into" labels.

**InheritanceNode** (`src/components/inheritance/InheritanceNode.tsx`): Renders one level (global or project) as a bordered card. Global levels use blue styling, project levels use green. Lists each file with a type badge (MD/AGT/CMD/SET), filename, and size. Files are clickable to open in the editor.

#### Settings

**SettingsPanel** (`src/components/settings/SettingsPanel.tsx`): Full settings page with theme toggle button and zoom controls.

**ThemeToggle** (`src/components/settings/ThemeToggle.tsx`): Compact button for the status bar. Shows "D" to switch to dark, "L" to switch to light.

**ZoomControl** (`src/components/settings/ZoomControl.tsx`): Compact button group for the status bar with -, 0 (reset), and + buttons. Tooltips show keyboard shortcuts.


## Key Features


### Lazy Loading

On startup, Bunch only scans global files via `scanGlobalOnly()`. No projects are loaded until the user explicitly adds one. This keeps startup fast, since scanning all `~/.claude/projects/` directories can be slow on machines with many projects.

The user loads projects in two ways:
1. **"+ Project" button**: Opens a native folder picker (via `@tauri-apps/plugin-dialog`). The selected path is scanned via `scanProjectFolder()` and merged into the existing tree.
2. **"Scan All" button**: Calls `scanConfigTree()` which scans global files and all projects under `~/.claude/projects/`. Updates `scannedProjectPaths` to include all discovered project paths.

The `scannedProjectPaths` state tracks which projects have been loaded. This list is used by the file watcher's rescan logic to only re-scan loaded projects, not the full set.


### Agent Owner Inference

Agent files (`.md` files in `agents/` directories) are analyzed to determine which AI tool they belong to. The inference runs in Rust during scanning (`scan_md_dir` calls `infer_agent_owner`).

The three-stage process (filename, frontmatter model, keyword scoring) is described in the [owner_inference.rs section](#owner_inferencers). The result is stored as the `owner` field on `ConfigFile` and displayed as a colored badge in the tree next to agent file names. The "User" owner is intentionally hidden in the UI since it is the default fallback.


### File Watcher

The Rust backend uses the `notify` crate (v6) to watch `~/.claude/` recursively. When a relevant file change is detected (files ending in `.md` or `.json`, or paths containing `agents` or `commands`), it emits a `config-file-changed` event.

The frontend listens for this event in the `ConfigTreeContext` mount effect. On change, it calls `rescanLoaded()`, which:
1. Runs `scanGlobalOnly()` to refresh global files
2. Runs `scanProjectFolder()` for each path in `scannedPathsRef.current`
3. Merges the results into a new `ConfigTree` and applies it

This design means the watcher only triggers rescans for projects the user has already loaded, keeping the response fast. The `scannedPathsRef` (a ref, not state) is used to ensure the watcher callback always sees the latest list without needing to re-register the listener.


### Right-Click Context Menu

Right-clicking on a file node in the tree opens a context menu with two options:
1. **Show in Enclosing Folder**: Calls `showInFolder()` which invokes the Rust command. On macOS, this runs `open -R <path>` to reveal the file in Finder.
2. **Delete**: Calls `deleteFile()` which deletes the file on disk, removes it from any open tabs, and updates the tree.

The context menu is positioned at the cursor coordinates and dismisses on outside click or Escape keypress.


### Status Bar File Stats

When a file is open, the status bar shows live statistics computed from the editor content:
- **Size**: Byte count of the UTF-8 encoded content, displayed as B or KB
- **Lines**: Number of lines (split by newline)
- **Paragraphs**: Count of non-empty blocks separated by blank lines
- **Estimated tokens**: Content length divided by 4 (rough approximation of ~4 characters per token)

These update in real time as the user edits.


### Expanded State Preservation

When the tree is rebuilt (after rescans, adding projects, or deleting files), the expanded/collapsed state of tree nodes is preserved. Two helper functions handle this:

1. `collectExpandedIds(nodes)`: Recursively collects all node IDs where `expanded === true` into a Set
2. `applyExpandedIds(nodes, expandedIds)`: Maps over new tree nodes, setting `expanded: true` for any node whose ID is in the set (or was already expanded by default)

This runs inside `rebuildTreeNodes()`, which is called every time the tree data changes. The node IDs are deterministic (e.g. `"global"`, `"group-PERSONAL"`, `"project-Users-name-projects-myapp"`, `"project-<path>-<filePath>"`), so they remain stable across rebuilds as long as the underlying data has not changed.


### Inheritance Chain Viewer

Double-clicking a project node in the tree triggers `showInheritance()`, which fetches the inheritance chain from Rust. The chain shows two levels:

1. **Global (~/.claude/)**: All global config files
2. **Project (<decoded path>)**: All project-specific config files

Each level is rendered as a colored card (blue for global, green for project), connected by vertical arrows with "inherits into" labels. Files within each level are clickable to open in the editor. The viewer replaces the editor panel and has a "Close" button to return.


### Content Search

Typing in the search box triggers a debounced (300ms) call to `searchConfigContent()`, which invokes the Rust `search_config_content` command. The backend reads all files in the current tree, performs case-insensitive line matching, and returns results with line numbers.

The frontend displays results in the tree area, replacing the normal tree view. Each result shows the file name, full path, and up to 3 matching lines with line numbers in monospace font. Clicking a result opens the file in the editor.


### Tree Filtering

The filter pills (All, CLAUDE.md, Settings, Agents, Commands) filter the tree by `ConfigFileType`. The filtering happens on the frontend in `filterTreeByType()`:

- `"claudemd"` shows only `ClaudeMd` files
- `"settings"` shows `SettingsJson` and `SettingsLocalJson` files
- `"agents"` shows only `AgentMd` files
- `"commands"` shows only `CommandMd` files

Parent nodes (root, group, project) are preserved only if they have matching children. Filtered nodes are shown with `expanded: true` so results are immediately visible.


### Theme and Zoom

**Theme**: Light and dark modes via Tailwind's `dark:` variant. The `dark` class is toggled on `<html>`. Persisted to `localStorage`. Monaco editor switches between `vs-dark` and `light` themes.

**Zoom**: Scales the entire UI by adjusting the root font size. Range is 60% to 160% in 10% steps. Monaco font size is computed as `14 * zoom`. Keyboard shortcuts: `Cmd+=` (in), `Cmd+-` (out), `Cmd+0` (reset). Persisted to `localStorage`.


## Key Patterns and Decisions


### treeRef Pattern

The `ConfigTreeContext` maintains both `tree` (state) and `treeRef` (ref) pointing to the same `ConfigTree`. The ref is updated synchronously in `applyTree()` alongside `setTree()`.

This solves the stale closure problem: `useCallback` functions like `scanProject()` and `deleteFile()` need to read the current tree to compute updates. If they captured `tree` from state, they would see stale values because React state updates are asynchronous and `useCallback` with `[]` deps freezes over the initial value. By reading `treeRef.current`, these callbacks always access the latest tree without needing `tree` in their dependency arrays, which would cause them to be recreated on every scan.


### scannedPathsRef for Stable Watcher Callback

Similar to `treeRef`, `scannedPathsRef` keeps a ref that mirrors `scannedProjectPaths` state. The line `scannedPathsRef.current = scannedProjectPaths` runs on every render, keeping the ref in sync.

The `rescanLoaded` callback reads `scannedPathsRef.current` instead of closing over `scannedProjectPaths`. This means `rescanLoaded` has a stable identity (empty deps in `useCallback`), which is important because it is passed to the Tauri event listener in the mount effect. If `rescanLoaded` changed identity, the event listener would need to be re-registered, creating complexity around cleanup timing.


### rebuildTreeNodes Preserves Expanded IDs

Every time tree data changes (scan, add project, delete file), `rebuildTreeNodes` is called. It uses `setRawTreeNodes(prev => ...)` to access the previous nodes, collects their expanded IDs, builds fresh nodes from the new `ConfigTree`, then re-applies the expanded state.

This functional updater pattern (`prev => ...`) avoids needing `rawTreeNodes` as a dependency, which would create update loops.


### useEffect Runs Once on Mount

The main `useEffect` in `ConfigTreeContext` runs once (empty dependency array). It:
1. Calls `scanGlobalOnly()` to load initial data
2. Calls `startWatching()` to begin file system monitoring
3. Registers a Tauri event listener for `config-file-changed` that calls `rescanLoaded()`
4. Returns a cleanup function that unregisters the listener

The ESLint exhaustive-deps warning is intentionally suppressed (`// eslint-disable-line react-hooks/exhaustive-deps`) because the callbacks used (`rescanLoaded`) are stable refs that do not need to be in the dependency array.


### applyTree as Single Update Point

The `applyTree(result)` function is the single point where tree data is applied:
1. Sets `tree` state
2. Updates `treeRef.current`
3. Calls `rebuildTreeNodes(result)` to rebuild UI nodes with expanded state preservation

Every operation that modifies tree data (initial scan, rescan, add project, delete file, watcher rescan) goes through `applyTree`, ensuring consistent state across all three representations (state, ref, UI nodes).


## Tauri Plugins and Dependencies

**Rust dependencies** (from `Cargo.toml`):
- `tauri` 2.x - Core framework
- `tauri-plugin-fs` 2.x - Filesystem access plugin
- `tauri-plugin-dialog` 2.x - Native dialog plugin (folder picker)
- `serde` / `serde_json` - Serialization
- `dirs` 5.x - Home directory resolution
- `notify` 6.x - Filesystem watching
- `chrono` 0.4 - Date/time formatting
- `sha2` 0.10 - SHA-256 hashing (available but not actively used in current code)

**Frontend dependencies** (from `package.json`):
- `react` / `react-dom` 18.3 - UI framework
- `@tauri-apps/api` 2.x - Tauri IPC
- `@tauri-apps/plugin-dialog` 2.x - Folder picker dialog
- `@tauri-apps/plugin-fs` 2.x - Filesystem plugin (frontend bindings)
- `@monaco-editor/react` 4.6 - Monaco Editor React wrapper
- `react-markdown` 9.x - Markdown rendering
- `remark-gfm` 4.x - GitHub Flavored Markdown support

**Dev dependencies**:
- `vite` 6.x - Build tool
- `typescript` 5.6 - Type checking
- `tailwindcss` 3.4 - CSS framework
- `@tailwindcss/typography` 0.5 - Prose styling for markdown preview
- `autoprefixer` / `postcss` - CSS processing


## Styling

Global styles are in `src/styles/globals.css`. The app uses Tailwind with three layers:

**Base layer**:
- Font family: Inter, with system sans-serif fallbacks
- Body: hidden overflow, full viewport height, dark mode support
- Custom thin scrollbar styling (6px width, gray colors)

**Component layer** (custom utility classes):
- `.tree-node-hover`: Hover background transition for tree nodes (75ms)
- `.tab-active`: Blue bottom border for active editor tabs
- `.inheritance-arrow`: Vertical line connector for inheritance chain
- `.filter-pill`: Rounded pill button with border
- `.filter-pill-active`: Blue filled pill for active filter

All component styling uses Tailwind utility classes directly in JSX. Dark mode is implemented via the `dark:` variant with class-based toggling on the root element.
