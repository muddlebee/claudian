# Obsidian Chat

An Obsidian plugin that embeds AI coding assistants as a sidebar chat interface in your vault. Your vault becomes the AI's working directory, giving it full agentic capabilities: file read/write, search, bash commands, and multi-step workflows.

## Supported CLI Providers

- **[Codex CLI](https://github.com/openai/codex)** - OpenAI's agentic coding assistant
- **[Kilo Code CLI](https://kilo.ai/docs/code-with-ai/platforms/cli)** - Multi-model AI coding assistant with support for hundreds of LLMs

## Features

- **Full Agentic Capabilities**: Leverage CLI-based AI assistants to read, write, and edit files, search, and execute bash commands, all within your Obsidian vault.
- **Multi-CLI Support**: Choose between Codex CLI or Kilo Code CLI as your preferred provider.
- **Context-Aware**: Automatically attach the focused note, mention files with `@`, exclude notes by tag, include editor selection (Highlight), and access external directories for additional context.
- **Vision Support**: Analyze images by sending them via drag-and-drop, paste, or file path.
- **Inline Edit**: Edit selected text or insert content at cursor position directly in notes with word-level diff preview and read-only tool access for context.
- **Instruction Mode (`#`)**: Add refined custom instructions to your system prompt directly from the chat input, with review/edit in a modal.
- **Slash Commands**: Create reusable prompt templates triggered by `/command`, with argument placeholders, `@file` references, and optional inline bash substitutions.
- **Skills**: Extend the plugin with reusable capability modules that are automatically invoked based on context.
- **Custom Agents**: Define custom subagents that the AI can invoke, with support for tool restrictions and model overrides.
- **MCP Support**: Connect external tools and data sources via Model Context Protocol servers (stdio, SSE, HTTP) with context-saving mode and `@`-mention activation.

## Requirements

- One of the supported CLI tools installed:
  - [Codex CLI](https://github.com/openai/codex): `npm install -g @openai/codex`
  - [Kilo Code CLI](https://kilo.ai/docs/code-with-ai/platforms/cli): `npm install -g @kilocode/cli`
- Obsidian v1.8.9+
- Desktop only (macOS, Linux, Windows)

## Installation

### From GitHub Release (recommended)

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder called `obsidian-chat` in your vault's plugins folder:
   ```
   /path/to/vault/.obsidian/plugins/obsidian-chat/
   ```
3. Copy the downloaded files into the folder
4. Enable the plugin in Obsidian:
   - Settings → Community plugins → Enable "Obsidian Chat"

### From source (development)

1. Clone this repository into your vault's plugins folder:
   ```bash
   cd /path/to/vault/.obsidian/plugins
   git clone <repo-url> obsidian-chat
   cd obsidian-chat
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Enable the plugin in Obsidian:
   - Settings → Community plugins → Enable "Obsidian Chat"

### Development

```bash
# Watch mode
npm run dev

# Production build
npm run build
```

## Usage

**Two modes:**
1. Click the bot icon in ribbon or use command palette to open chat
2. Select text + hotkey for inline edit

Use it like any agentic coding assistant—read, write, edit, search files in your vault.

### Context

- **File**: Auto-attaches focused note; type `@` to attach other files
- **@-mention dropdown**: Type `@` to see MCP servers, agents, external contexts, and vault files
  - `@Agents/` shows custom agents for selection
  - `@mcp-server` enables context-saving MCP servers
  - `@folder/` filters to files from that external context (e.g., `@workspace/`)
  - Vault files shown by default
- **Selection**: Select text in editor, then chat—selection included automatically
- **Images**: Drag-drop, paste, or type path; configure media folder for `![[image]]` embeds
- **External contexts**: Click folder icon in toolbar for access to directories outside vault

### Features

- **Inline Edit**: Select text + hotkey to edit directly in notes with word-level diff preview
- **Instruction Mode**: Type `#` to add refined instructions to system prompt
- **Slash Commands**: Type `/` for custom prompt templates or skills
- **Skills**: Add `skill/SKILL.md` files to the skills directory
- **Custom Agents**: Add agent files to the agents directory; select via `@Agents/` in chat
- **MCP**: Add external tools via Settings → MCP Servers; use `@mcp-server` in chat to activate

## Configuration

### Settings

**CLI Provider**
- **Provider**: Choose between Codex CLI or Kilo Code CLI
- **CLI path**: Custom path to the CLI executable (leave empty for auto-detection via PATH)

**Customization**
- **User name**: Your name for personalized greetings
- **Excluded tags**: Tags that prevent notes from auto-loading (e.g., `sensitive`, `private`)
- **Media folder**: Configure where vault stores attachments for embedded image support (e.g., `attachments`)
- **Custom system prompt**: Additional instructions appended to the default system prompt (Instruction Mode `#` saves here)
- **Enable auto-scroll**: Toggle automatic scrolling to bottom during streaming (default: on)

**Hotkeys**
- **Inline edit hotkey**: Hotkey to trigger inline edit on selected text
- **Open chat hotkey**: Hotkey to open the chat sidebar

**Slash Commands**
- Create/edit/import/export custom `/commands`

**MCP Servers**
- Add/edit/verify/delete MCP server configurations with context-saving mode

**Environment**
- **Custom variables**: Environment variables for the CLI (KEY=VALUE format, supports `export ` prefix)
- **Environment snippets**: Save and restore environment variable configurations

**Advanced**
- **CLI path**: Custom path to CLI executable (leave empty for auto-detection)

## Safety and Permissions

| Scope | Access |
|-------|--------|
| **Vault** | Full read/write (symlink-safe via `realpath`) |
| **Export paths** | Write-only (e.g., `~/Desktop`, `~/Downloads`) |
| **External contexts** | Full read/write (session-only, added via folder icon) |

## Privacy & Data Use

- **Sent to API**: Your input, attached files, images, and tool call outputs sent to your configured CLI provider's API.
- **Local storage**: Settings, session metadata, and commands stored locally in your vault.
- **No telemetry**: No tracking beyond your configured API provider.

## Troubleshooting

### CLI not found

If you encounter `spawn codex ENOENT` or `CLI not found`, the plugin can't auto-detect your CLI installation. Common with Node version managers (nvm, fnm, volta).

**Solution**: Find your CLI path and set it in Settings → Advanced → CLI path.

| Platform | Command | Example Path |
|----------|---------|--------------|
| macOS/Linux | `which codex` or `which kilocode` | `/usr/local/bin/codex` |
| Windows | `where.exe codex` | `C:\Users\you\AppData\Roaming\npm\codex` |

**Alternative**: Add your Node.js bin directory to PATH in Settings → Environment → Custom variables.

### npm CLI and Node.js not in same directory

If using npm-installed CLI, check if the CLI and `node` are in the same directory:
```bash
dirname $(which codex)
dirname $(which node)
```

If different, GUI apps like Obsidian may not find Node.js.

**Solutions**:
1. Add Node.js path to Settings → Environment: `PATH=/path/to/node/bin`

## Architecture

```
src/
├── main.ts                      # Plugin entry point
├── core/                        # Core infrastructure
│   ├── cli/                     # CLI services (Codex, Kilo Code)
│   ├── agents/                  # Custom agent management
│   ├── commands/                # Slash command management
│   ├── hooks/                   # PreToolUse/PostToolUse hooks
│   ├── images/                  # Image caching and loading
│   ├── mcp/                     # MCP server config, service, and testing
│   ├── prompts/                 # System prompts for agents
│   ├── security/                # Approval, blocklist, path validation
│   ├── storage/                 # Distributed storage system
│   ├── tools/                   # Tool constants and utilities
│   └── types/                   # Type definitions
├── features/                    # Feature modules
│   ├── chat/                    # Main chat view + UI, rendering, controllers, tabs
│   ├── inline-edit/             # Inline edit service + UI
│   └── settings/                # Settings tab UI
├── shared/                      # Shared UI components and modals
├── i18n/                        # Internationalization
├── utils/                       # Modular utility functions
└── style/                       # Modular CSS (→ styles.css)
```

## License

Licensed under the [MIT License](LICENSE).

## Acknowledgments

- [Obsidian](https://obsidian.md) for the plugin API
- [OpenAI](https://openai.com) for Codex CLI
- [Kilo Code](https://kilo.ai) for Kilo Code CLI
