# Obsidian × Kilo: AI-Powered Writing


**Obsidian Chat** is an Obsidian plugin that embeds AI assistants directly into the note-taking workflow. We've integrated **Kilo CLI**, bringing Kilo's multi-model capabilities to 1M+ Obsidian users.

**Demo** 👇

![obs-chat](https://github.com/user-attachments/assets/d9cc2a70-5223-48b4-ab8b-21d850f38214)


## The Opportunity

### Obsidian's Scale
- **1M+ active users** (knowledge workers, writers, researchers, developers)
- **10K+ GitHub stars** on popular plugins
- Users spend **hours daily** in the app writing, researching, and organizing knowledge
- Strong community that values privacy, local-first tools, and extensibility

### The Gap
Writers and knowledge workers want AI assistance **without leaving their flow**. Current solutions require:
- Switching to browser tabs (ChatGPT, Claude.ai)
- Copy-pasting context manually
- Losing the connection between AI output and their notes

## Solution: Kilo in the Obsidian Sidebar

Obsidian Chat embeds Kilo CLI as a sidebar chat interface:

```
┌─────────────────────────────────────────────────────┐
│  Obsidian                                           │
│  ┌──────────────────────┬────────────────────────┐  │
│  │                      │  💬 Kilo Chat          │  │
│  │   Your Notes         │  ───────────────────── │  │
│  │                      │  [Trinity Large ▾]     │  │
│  │   # Research Paper   │                        │  │
│  │   Lorem ipsum...     │  User: Help me expand  │  │
│  │                      │  this paragraph...     │  │
│  │                      │                        │  │
│  │                      │  Kilo: Here's an       │  │
│  │                      │  expanded version...   │  │
│  │                      │                        │  │
│  └──────────────────────┴────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Sidebar Integration** | Chat without leaving your notes |
| **Model Selection** | Switch between Kilo models (Trinity, GLM, MiniMax, etc.) |
| **Context Awareness** | Reference files with `@filename` mentions |
| **Multi-Tab Chats** | Run parallel conversations |
| **Conversation History** | Persist and resume sessions |
| **Streaming Responses** | Real-time output as Kilo generates |


## Technical Architecture

### How It Works

```
User Input → Obsidian Chat Plugin → kilo run "prompt" --model "model"
                                        ↓
                               Kilo CLI (local)
                                        ↓
                               Kilo Provider/OpenRouter API
                                        ↓
                               Streaming Response → UI
```

### Integration Points

```typescript
// Spawns Kilo CLI with user's prompt
const args = ['run', prompt, '--model', 'kilo/arcee-ai/trinity-large-preview:free'];
const child = spawn('kilo', args, { cwd: vaultPath });

// Streams output to chat UI
for await (const chunk of child.stdout) {
  yield { type: 'text', content: chunk.toString() };
}
```

### Auto-Detection
- Automatically finds `kilo` in PATH (including nvm, volta, fnm installations)
- Falls back to manual path configuration in settings
- Clear error messages with install instructions

---

## User Experience

### Onboarding Flow
1. Install Obsidian Chat from Obsidian Community Plugins
2. Plugin detects Kilo CLI (or prompts install: `npm install -g kilo-code`)
3. Select "Kilo" from provider dropdown
4. Start chatting

### Daily Workflow
1. **Writing**: "Help me expand this section on quantum computing"
2. **Research**: "Summarize the key points from @research-notes.md"
3. **Editing**: "Make this paragraph more concise"
4. **Brainstorming**: "Give me 5 angles for this blog post"

---

## Why Kilo?

### For Obsidian Chat Users
- **Model Choice**: Access to 100+ models through single interface
- **Free Tier**: Trinity Large Preview, GLM-4.7, and others at no cost
- **Quality**: State-of-the-art models for writing tasks
- **Privacy**: Local CLI execution, no browser required

### For Kilo
- **Distribution**: Reach 1M+ Obsidian users
- **Use Case**: Showcase Kilo for creative writing/knowledge work
- **Stickiness**: Daily active usage in users' primary workspace
- **Community**: Tap into passionate Obsidian community

