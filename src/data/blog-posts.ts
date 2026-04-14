export interface BlogPost {
  slug: string;
  part: number;
  title: string;
  subtitle: string;
  date: string;
  content: string;
}

const main: BlogPost = {
  slug: "building-a-personal-ai-assistant-on-aws",
  part: 1,
  title: "Building a Personal AI Assistant on AWS",
  subtitle: "What it is, how we built it, and what broke.",
  date: "2026-04-11",
  content: `# Building a Personal AI Assistant on AWS

*What it is, how we built it, and what broke.*

---

This is an engineering diary, not a tutorial. The mistakes stay because the thinking matters. I started without knowing the paradigm, learning it in real time—improvising when things broke and leaning on AI at every step. Turning this into a polished success story would miss the point.

Deployment, voice pipeline, and research library—all built in three days.

---

## Questions We Can Ask Now

I like to introduce new tech by talking about what questions it makes possible. OpenClaw is a persistent AI agent running on your own infrastructure — memory, tools, and the ability to act between conversations. Here's what that unlocks.

**"Given everything you know about me over time, what should I actually be doing?"** It knows your projects, your habits, and the gap between what you said you'd focus on and what you actually did. What should you stop working on? Where are you wasting time? What have you been ignoring? Before this, every tool treated you like a goldfish with a keyboard — no history, no context, no receipts.

**"Take this vague goal and figure out how to execute it end-to-end."** Say "turn my voice notes into a structured knowledge base and keep it updated." You're not defining how. You're defining intent. Older tools made you spell out every step — trigger, condition, action — like programming a very literal intern. The system figures out the steps. That's not an upgrade. That's a category break.

**"Continuously do this for me and tell me when it matters."** You're no longer asking questions. You're assigning jobs. Old model: ask → get answer → repeat forever. New model: define objective → system runs → interrupts you when needed. You've moved from querying software to delegating work.

## Where It Came From & How It Works

### Before OpenClaw

For a decade, automation meant [Zapier](https://zapier.com). Or [IFTTT](https://ifttt.com). Or, more recently, [n8n](https://n8n.io). These tools shared a common architecture: you defined a trigger, you defined a sequence of steps, data flowed through in one direction, and the workflow terminated. A new email arrives → parse it → create a Trello card. A form submits → validate → write to a database → notify Slack. Clean, predictable, auditable. If This, Then That — literally what the category was called.

These platforms eventually added LLMs. But *how* they added them is the key thing. The LLM was a node in a pipeline someone else defined. A smarter formatting step. "Take this customer complaint and classify it as billing, technical, or other." The model received a fixed input, produced a structured output, and the workflow moved on. It didn't plan. It didn't decide what tools to call next. It didn't remember yesterday. It was deterministic automation with a reasoning step inserted — the plumbing was still rigid, the logic was still explicit, the state still evaporated when the workflow terminated.

<figure style="float:right; width:280px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/llm-as-one-node.png" alt="The LLM as one node in a trigger-action pipeline" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">One box among equals. No memory, no planning, no initiative — just a smarter formatting step.</figcaption>
</figure>

The first attempts to break this model arrived in 2023: [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT), [BabyAGI](https://github.com/yoheinakajima/babyagi), the early [LangChain](https://docs.langchain.com/docs/components/agents/) agent abstractions. These gave models the ability to call tools in a loop — the "[ReAct](https://arxiv.org/abs/2210.03629)" pattern: reason about what to do, take an action, observe the result, reason again. That was the right instinct. The implementation collapsed. Models with 4,000-token context windows couldn't hold a multi-step task's constraints from step one to step twenty. Agents hallucinated progress. They looped. They burned through API credits on the same failed call, retried until the credits ran out, and stopped without completing anything.

The problem wasn't that agents were a bad idea. The infrastructure wasn't ready.

![The Paradigm Shift: stateless trigger-action pipelines vs. stateful gateway daemon](/blog/paradigm-shift-stateless-vs-stateful.png)
*Top: the LLM as one node in a human-defined pipeline. Bottom: the LLM as the orchestrator of its own persistent loop.*

### What Changed

Three things converged between 2023 and 2026, and their combination is what made frameworks like OpenClaw viable rather than aspirational.

<figure style="float:left; width:260px; margin:0 1.5rem 1.5rem 0; clear:left;">
  <img src="/blog/three-enabling-conditions.png" alt="The three enabling conditions: context windows, instruction following, inference cost" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Three shifts that converged. Any one alone wouldn't have been enough.</figcaption>
</figure>

**Context windows grew by two orders of magnitude.** [Claude Sonnet 4.6](https://www.anthropic.com/claude) has a 200,000-token context window. The workspace files that define my assistant's personality, knowledge, tools, and operating protocols are 6,650 tokens combined — 3% of that window. An early agent running on a 4k-token model couldn't hold its own operating instructions while also tracking a multi-step task. The ratio was wrong. Now it's not.

**Models crossed the instruction-following threshold.** There's a qualitative difference between a model that follows a 500-token system prompt and one that follows a 6,650-token prompt with fidelity across a long conversation. This post has an entire bug entry about this: the system ran [Amazon Nova 2 Lite](https://aws.amazon.com/bedrock/nova/) for days while I thought it was Sonnet, and the tell was that the workspace files were being progressively ignored as conversations grew longer. Both models are capable. Only one of them held the instructions at depth. That's not a marginal difference — it's the difference between a system that works and one that degrades.

**Inference costs dropped to where persistence is a feature, not a budget decision.** Prompt caching brings input tokens to $0.30/M instead of $3.00/M. Running an always-on agent is now a line item.

Those three things let the agent stop being a step in someone else's pipeline and start running its own — a **stateful gateway daemon**: a long-lived process that holds state, queues work, and runs a reasoning loop on every message. The human writes operating instructions in English. The model figures out what to do with them.

<div style="clear:both;"></div>

### What It Is

It's a personal AI assistant that lives on a server, talks to you over Telegram, and keeps running whether your laptop is open or not. Within Telegram, you set up a group and topics in these groups. Within each topic, you send a message, it responds, and within each topic, it tracks context. Across all sessions, it accumulates knowledge about you — your projects, goals, relationships, the things you talk about repeatedly. You can send a voice memo and it transcribes and files it. You can ask it to research something and it'll commission a deep research report, publish it to a versioned library, and notify you when it's done.

<figure style="float:right; width:260px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/voice-to-wiki-conceptual.png" alt="Voice → Wiki: voice memo becomes a structured markdown note" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Voice memo in, structured wiki page out.</figcaption>
</figure>

Four pieces make the stack:

**[OpenClaw](https://github.com/openclaw/openclaw)** — the open-source Node.js gateway. It connects messaging channels to AI models, handles session management and tool dispatch, and gets configured with JSON files and markdown documents called "workspace files."

**AWS EC2** — a [\`t4g.medium\`](https://aws.amazon.com/ec2/instance-types/t4g/) instance, ARM64/Graviton, no public ports. All access goes through [AWS Systems Manager](https://docs.aws.amazon.com/systems-manager/). (The gateway runs as a [systemd](https://www.freedesktop.org/software/systemd/man/systemd.html) service.)

**[Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)** — the model API. The instance calls it directly via its IAM role using Claude Sonnet 4.6. The instance runs no inference — it assembles a prompt and sends it to Bedrock's endpoint.

**Telegram** — the bot automation-friendly interface. A bot created via [@BotFather](https://t.me/BotFather). Forum topics give you separate threads — research, voice notes, general chat — each with isolated history.

![Ford's AI Assistant Stack: Telegram → EC2 (workspace files + Claude Sonnet 4.6) → GitHub repos + S3](/blog/03-ai-assistant-stack.png)
*t4g.medium on Graviton, no public ports, Claude Sonnet 4.6 via Bedrock.*

![OpenClaw: Personal AI Assistant on AWS — gateway, workspace files, shell tools, memory tiers, external services](/blog/01-openclaw-system-architecture.png)
*One EC2 instance. One gateway process. All access via SSM. Bedrock called on every message — no inference on the instance itself.*

![Telegram desktop — topics, threads, voice notes, research](/blog/telegram-desktop.png)
*What it actually looks like to use: forum topics as separate threads, each with isolated history.*

The thing that makes this interesting isn't the stack — it's how you program it. Six markdown files on disk get injected into the prompt on every message. \`SOUL.md\` is the personality. \`USER.md\` is who you are. \`AGENTS.md\` is the operating manual. \`MEMORY.md\` is curated long-term facts. Together they're about 6,650 tokens — 3% of the model's context window. The bot always knows who it is, who it's talking to, and what its tools are, without you having to re-explain anything.

To change the personality: edit \`SOUL.md\`, run \`make ship\`, send a message. Next response follows the new instructions. No redeployment, no restart, no config change; you write instructions in English & the model follows them.

**Cost:** EC2 runs $26.93/month fixed. Everything else scales with use. The critical constraint is model selection: Claude Sonnet 4.6 costs 9× more than Nova 2 Lite — but Nova 2 Lite can't hold the 6,650-token system prompt at depth. That makes ~$40/month the realistic floor, not a choice.

| Service | Light (~10 turns/day) | Moderate (~50/day) | Heavy (~200/day) |
|---|---|---|---|
| EC2 t4g.medium | $26.93 | $26.93 | $26.93 |
| Claude Sonnet 4.6 | $9.45 | $47.25 | $189.00 |
| *(Nova 2 Lite alt)* | *($1.10)* | *($5.48)* | *($21.90)* |
| AWS Transcribe | $2.40 | $2.40 | $12.00 |
| Parallel AI (core, 1 research/day) | $0.75 | $2.25 | $7.50 |
| **Claude stack total** | **~$39.53** | **~$78.83** | **~$235.43** |

Observed reality: heavy usage with aggressive prompt caching ran ~$125/month instead of the $189 projection — because most input tokens arrive as cache reads at $0.30/1M rather than raw input at $3.00/1M. Over 7 days, the actual breakdown was $24.04 in cache writes, $3.94 in cache reads, $0.34 in Nova 2 Lite (for lighter single-turn tasks), and $0.035 in Transcribe. The optimization target isn't token volume — it's cache write frequency.

### How It Actually Works

The marketing pitch for agentic AI tends toward abstraction. "It reasons. It acts. It learns." None of that is specific enough to build on or trust. Here is what actually happens — the actual moving parts, named precisely.

#### The Gateway Is Not a Web Server

OpenClaw runs as a long-lived daemon — a [systemd](https://www.freedesktop.org/software/systemd/man/systemd.html) service on Linux, a LaunchAgent on macOS. It binds to \`ws://127.0.0.1:18789\` and holds that port for the lifetime of the process. One process owns everything: channel adapters for Telegram/WhatsApp/Slack, the web control UI, the CLI, the cron scheduler, all plugin lifecycle management.

A web server terminates after each response. The gateway doesn't. It's already running when your message arrives. It knows the context from every prior message this session. The right mental model is a message broker, not an HTTP handler — it holds state, it queues work, it emits lifecycle events that everything else hooks into.

#### Stage 1: Channel Normalization

When a message arrives, the channel adapter normalizes it before anything else. Telegram comes in through [grammY](https://grammy.dev). WhatsApp through [Baileys](https://github.com/WhiskeySockets/Baileys) — a reverse-engineered client that speaks WhatsApp's unofficial web protocol. Voice memos, images, and text all become the same internal object: sender ID, channel, content type, content, timestamp.

That's why the same workspace files and the same model work across every channel. By the time the message reaches the model, it has no idea which surface it came from.

#### Stage 2: Session Lock and Queue

The gateway resolves which session the message belongs to and acquires a session lock before doing anything else. If the session is already processing something, the new message waits. One session, one active task at a time.

This isn't a performance optimization — it's a correctness guarantee. Two concurrent messages triggering competing tool calls that both try to write to MEMORY.md produce corrupted state. The lock makes that structurally impossible. The default timeout for a long-running task is 48 hours. A session can hold a complex, multi-step job across two full days before the system considers it stuck.

#### Stage 3: Context Assembly

Before the model sees the message, the gateway assembles the full prompt from four sources.

**Workspace files** — read from disk on every single turn. SOUL.md, USER.md, AGENTS.md, TOOLS.md. Re-injected fresh every message, not held in a conversation object that drifts. The programming surface is the filesystem: edit a file, restart nothing, next message follows the new instructions.

**MEMORY.md and daily notes** — long-term facts extracted from past conversations, plus an append-only daily log in \`memory/YYYY-MM-DD.md\`. Plain Markdown files, indexed into a per-agent [SQLite](https://www.sqlite.org/index.html) database that re-indexes automatically when files change. When a memory is wrong, you edit the file and commit it.

**Session transcript** — a [JSONL](https://jsonlines.org) file on disk. Each turn is one appended line. When the transcript grows large enough, a compaction process summarizes older turns and evicts the raw history — but holds a token reserve back from the context window so compaction can always run without the model running out of room mid-task. The pre-compaction snapshot stays on disk for audit.

**Skill manifests** — only skill *names* go into every prompt. The full SKILL.md file loads only when the model decides it's relevant. The model doesn't pay for expertise it won't use on this turn.

![Context Assembly: the four layers assembled into the model's context window on every message](/blog/context-assembly-layers.png)
*Four sources, rebuilt fresh on every turn. Workspace files re-read from disk. Session JSONL compacted as history grows. Skills loaded only when relevant.*

#### Stage 4: Inference and Structured Tool Calling

The assembled context goes to the model — [Claude Sonnet 4.6](https://www.anthropic.com/claude) via [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/), called using the instance [IAM role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html), no credentials stored anywhere.

One thing that matters a lot here: [structured function calling](https://platform.openai.com/docs/guides/function-calling), which OpenAI standardized in June 2023 and [Anthropic followed](https://docs.anthropic.com/en/docs/build-with-claude/tool-use). Before this, agents had to write something like "I need to run the research tool" in free-form text and hope a parser caught it. Now the model emits a structured JSON tool call with schema-validated parameters. The gateway intercepts it, routes it, feeds back a structured result. The schema is enforced at the provider level, not in your code.

OpenClaw also supports [MCP](https://github.com/anthropics/mcp) — Anthropic's November 2024 standard for tool and data connections. MCP servers attach via a bridge called \`mcporter\` and can be added or swapped without restarting the gateway. New tool surfaces don't require gateway changes. Just a new MCP server config.

#### Stage 5: The ReAct Loop

If the model requests a tool, the gateway intercepts it before sending any response. It runs the tool — a shell script, an MCP call, a built-in function — captures the output, and feeds it back as a new observation. The model sees the result and decides what to do next: another tool call, or a final answer.

No fixed depth limit on this loop, just the session timeout. If a tool fails, the model sees the error and reasons about it — tries a different approach, or surfaces the failure. It doesn't know how to transcribe audio. It knows a tool exists that does, and it calls the tool. The expertise lives in the tools. The routing judgment lives in the model.

<figure style="float:right; width:270px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/react-loop.png" alt="The ReAct loop: Reason, Act, Observe — cycling until done" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Each cycle: decide what to call, call it, read the result. Repeat until there's nothing left to do.</figcaption>
</figure>

#### Stage 6: Memory Is a First-Class Runtime Component

Memory in OpenClaw is not a vector store behind an API. It's a file layout in the workspace:

- **MEMORY.md** — persistent facts extracted from conversations: preferences, ongoing projects, relationships, goals
- **Daily notes** (\`memory/YYYY-MM-DD.md\`) — append-only log of each day's exchanges
- An optional long-form synthesis file for deeper cross-session reflection

The memory engine watches these files and re-indexes into SQLite automatically. There's only one memory plugin slot — installing a custom one replaces the builtin entirely, doesn't supplement it. Two competing memory systems writing to the same agent state produce contradictions. One slot, one owner.

What this means practically: memory is readable. You can open MEMORY.md, see what the agent believes about you, edit an entry that's wrong, and commit the correction. Vector embeddings can't be read, corrected, or diffed by a human. A Markdown file can. When the transcription bug produced a Lagos entry for a Richmond meeting, the fix was three commands — edit, commit, move on. The error chain was traceable because the memory was a file.

<figure style="float:right; width:280px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/memory-legibility.png" alt="Vector store vs MEMORY.md: one is a black box, one is a file you can read, edit, and git revert" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">If a bad memory gets committed, you fix it like any other file.</figcaption>
</figure>

#### Stage 7: The Automation Substrate

Most people think of OpenClaw as a chat assistant. The more complete picture is that it's an automation runtime — a system that can do work without anyone sending a message.

**Hooks** are scripts that bind to gateway lifecycle events. A command invokes, a message phase completes, compaction runs. They're how you extend the gateway's behavior without touching its core code.

**Cron** is a built-in scheduler that persists across restarts. When a job fires, output goes somewhere — a chat thread, a webhook. The heartbeat is a cron entry in HEARTBEAT.md: fires every 30 minutes, wakes the agent, runs through a checklist, acts if anything is due. No human message required.

**Task Flow** is the deeper primitive. Durable, multi-step flows with revisioned state. Task Flows persist across gateway restarts. Steps within a flow can run as direct agent turns, as sub-agents with independent session keys and their own context windows, or as ACP sessions — external coding harnesses with spawn/steer/cancel controls. If a concurrent write conflicts with in-progress state, revision tracking catches it.

The **Webhooks plugin** is where this matters most for the comparison to legacy automation. The plugin binds external systems to Task Flows via authenticated HTTP routes. When Zapier fires a webhook at a traditional LLM API, it creates a stateless request-response cycle: trigger fires, model responds, state evaporates. When Zapier fires a webhook at OpenClaw's Webhooks plugin, it calls \`create_flow\` — which creates a **durable flow entity with revisioned state**, spawns managed tasks that can be inspected and cancelled, and persists independently of any single chat session or gateway restart. The trigger is identical. The downstream architecture is completely different: stateless invocation on one side, durable stateful orchestration on the other.

![The Automation Substrate: five execution tiers from direct response up through durable Task Flow, with Webhooks binding external systems to persistent state](/blog/automation-substrate-tiers.png)
*Same Zapier webhook. Different downstream: stateless request-response vs. durable flow with revisioned state that survives restarts.*

#### What It Adds Up To

None of these components are new in isolation. Daemons, queues, state files, schedulers — all existed before 2023. What changed is that they're the defaults now, not infrastructure you assemble yourself. Deploy OpenClaw and you get session serialization, compaction, cron scheduling, sub-agent spawning, and durable flow state out of the box. In the runtime, not in your application code.

When something breaks, you \`ssh\` into the box and read the logs. Open the JSONL session transcript and see exactly what the model was given. Check MEMORY.md and see what it believed. Everything that touched the decision is a file you can read.

That's not a design philosophy. That's what separates something you can operate from something you can only demo.

---

## Building It

### Getting Started

I had AWS credits left over from a hackathon. They were expiring.

That is the real beginning. Not a grand architectural vision, not a carefully planned AI infrastructure project. Credits running out, and a question: could I turn them into something tangible before they disappeared?

I had been circling OpenClaw for a while. It clearly had serious capability — a persistent agent, workspace-file-driven behavior, tool dispatch, multi-channel messaging — but I had kept putting off diving in. The paradigm was not obvious to me at first glance. How were the workspace files actually used? What did the model see? What constrained the agent's behavior and what didn't? The idea that crystallized was this: deploy OpenClaw on AWS and use that as the basis for a local AWS meetup demo. Something concrete and running, not a slide deck. That framing kept the scope contained and the motivation honest. I was not trying to build the perfect production system. I was trying to build something real, understand it well enough to explain it, and show it to people.

Before getting hands-on, I needed to understand OpenClaw beyond the marketing pitch — system prompting, workspace file management, tool calling rules. On every message, the gateway assembles a prompt from a handful of markdown files on disk, sends it to the model, and routes any tool calls the model makes back to shell scripts running on the server. That's the loop. Everything else is configuration on top of it.

I used to work on the AWS SDK Code Examples team, so I knew to go straight to the aws-samples repo and found [this CloudFormation template](https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock). I cloned it, loaded up some leftover free credits, loaded up $20 in Cursor tokens, and started. The plan was to deploy first and understand later.

The official [CloudFormation](https://docs.aws.amazon.com/cloudformation/) template handled everything: IAM role, security groups, user-data script installing OpenClaw from npm, systemd service. Stack came up in 8 minutes.

My Telegram account was banned thanks to whoever owned the number before me, so I submitted a help case and in the meantime connected to WhatsApp by generating a QR code on the Admin UI. In 30 minutes I was chatting with FordClaw — but the SSM port forwarding kept dropping WebSocket connections and triggering reconnects. [Baileys](https://github.com/WhiskeySockets/Baileys) responds to repeated failed authentications with exponential backoff retries. Twenty-plus gateway restarts in one afternoon sent hundreds of failed reconnect attempts to WhatsApp's servers. My account got temporarily banned. [→ Bug 3](#bug-3-the-whatsapp-death-spiral)

WhatsApp is not bot-native. It actively discourages automated clients. The health monitor that restarts a crashed service — correct behavior for every other piece of software on the machine — is exactly wrong for a client fighting rate-limit escalation from a platform trying to block it. I rage-quit, went to sleep, and awoke to find my Telegram account liberated.

On Telegram, I created a bot through @BotFather, got a token, dropped it into the config, and restarted the service. No QR codes, no weird pairing flows, no credential state to corrupt, no protocol Telegram was trying to hack.

#### Emergent Pattern #1: Skills as Operational Memory

One pattern repeated throughout the build: whenever I figured out how to do something — how to run a deployment step, how to debug a [systemd](https://www.freedesktop.org/software/systemd/man/systemd.html) issue, how to structure a [Bats](https://github.com/bats-core/bats-core) test, how to handle the SSM environment correctly — I would stop and ask the AI to turn that into a reusable skill.

In 2026 I put everything in structured, loadable instruction sets that can be invoked in future sessions without having to rediscover the same workflow from scratch. This saves on tokens and reduces inference entropy.

![Without Skills vs. With Skills](/blog/07-with-skills.png)
*Same tokens, deeper thinking. Without skills, the AI explores broadly and fails often. With skills, the early branches are pre-solved.*

This skills-first strategy became a major part of how I work. Every solved problem has a post-hook of "what skill would you update based on what you learned in this session?" This creates a flywheel where each session starts from a richer operational baseline than the one before.

#### Emergent Pattern #2: The Bot's Self-Healing Instinct

Something I noticed early and kept noticing: the bot was unusually ready to fix itself.

Behaviorally: it kept working a thread when something broke. It absorbed errors, attempted repairs, and kept going without stopping to ask permission. It felt less like directing a tool and more like debugging alongside something with its own momentum.

The persona layer mattered more than I expected. I set it to talk like a Gen Z teenager — direct, not verbose, a little rude. Less ceremony, more momentum. Interface tone turned out to affect the ergonomics of actually using the system.

What the bot was not: self-deploying. It would fix something, commit it, and stop there. The push-after-every-commit protocol had to be baked into the operational instructions before it held. This failure mode surfaced repeatedly and in a more complex form later. [→ Bug 8](#bug-8-the-bot-diagnosed-the-wrong-code-path)

#### Emergent Pattern #3: The Working Loop

For most of the three days, my process was a simple feedback loop: something broke, I read the error, I fed it to the model in [Cursor](https://cursor.com), the model produced a fix or a diagnostic step, I ran it, I fed the output back. Sometimes the error came from the AWS logs directly. Sometimes I copied Telegram output into Cursor. The channel did not matter — what mattered was that the loop was fast.

When the SSM session state got too noisy — terminal memory overloading Cursor's context, the session becoming less coherent — I would shift the model into advisory mode. Instead of letting it drive the shell, I asked for the exact commands to run in sequence. I ran them myself, collected the output, and pasted it back. Human driving, AI navigating. Less elegant but more reliable when the environment was fighting both of us.

![The Three-Day Feedback Loop](/blog/12-three-day-feedback-loop.png)
*Two variants of the same cycle. Bot-driven when it could fix things itself. Human-driven when the environment got too noisy.*

![Two Loops: How OpenClaw Gets Smarter — phone loop daily, laptop loop weekly, both writing to the same repos](/blog/04-two-loops-workflow.png)
*The steady-state operational pattern after the build: phone loop for daily use, laptop loop for weekly development.*

I used Sonnet 4.6 for most tasks. I escalated to Opus when Sonnet clearly could not break through — usually when the system state was complex and the task required holding a lot in context at once. Those escalations were conscious choices, not defaults.

---

### The Knowledge Base

With Telegram working, the first real feature was voice memo ingestion. The idea: send a voice memo, the bot transcribes it, and ingests it into the knowledge base.

![Voice → Wiki: Telegram voice memo becomes a structured markdown note via AWS](/blog/05-voice-to-wiki-conceptual.png)
*The concept: voice memo in, structured wiki page out.*

The pipeline is four steps. Telegram delivers the voice message as a [\`.oga\`](https://en.wikipedia.org/wiki/Ogg) file. A shell script stages it to [S3](https://docs.aws.amazon.com/s3/) and submits a job to [AWS Transcribe](https://docs.aws.amazon.com/transcribe/). Transcribe returns a JSON transcript. A second model pass extracts entities and creates or updates wiki pages in the knowledge base repo — people, places, projects, anything worth remembering. The whole thing runs in the background and the bot acknowledges when it's done.

![Voice to Knowledge: How a Voice Memo Becomes a Wiki Page — all 7 stages from input to GitHub Markdown](/blog/10-voice-pipeline-horizontal.png)
*Voice Input → Telegram → OpenClaw EC2 → AWS Transcribe → S3 (1-day lifecycle) → GitHub Markdown → Confirmation.*

The knowledge base is a flat file library: markdown files in a GitHub repo, organized by category. No vector database. The index is a JSON file rebuilt by a GitHub Actions workflow on every push. At the current scale of roughly 500 entries, the index is around 15,000 tokens — well within a single Sonnet context window. Retrieval works by loading the full index, scanning it, and fetching the relevant file directly. No embedding lookup, no similarity search — the model reads the index and finds what it's looking for.

When a wiki page needs to be created or updated, the model gets the transcript, reasons about what to extract, and writes structured markdown. The result is committed to the repo. GitHub Actions rebuilds the index and SSM-notifies the gateway when it's done.

This approach has a clear tradeoff. A vector database would scale to tens of thousands of entries and retrieve more precisely. It would also be opaque — you can't read what it knows, diff what changed, or correct a wrong entry by editing a file. The flat file approach trades retrieval sophistication for operational legibility: every entry is a file you can open, edit, and git-revert. When the transcription bug produced a Lagos entry for a Richmond meeting [→ Bug 13](#bug-13-speech-to-text-errors-propagating-through-the-pipeline), the fix was three commands — edit, commit, move on. The error chain was traceable because the memory was a file.

The discovery that Nova 2 Lite couldn't follow the workspace files at any useful depth came through this feature. When I added transcription capability to \`AGENTS.md\` and the bot denied it could transcribe audio at all, I assumed it was a prompting problem. It wasn't. Nova 2 Lite degrades on instruction-following as context grows. It's optimized for speed, not for holding a 6,650-token system prompt across a real conversation. One \`sed\` command swapped the model ID. The personality took hold on the next message. [→ Bug 7](#bug-7-the-wrong-model-was-running)

After that swap, it became obvious the tool scripts were rough. Even after escalating to Opus within [Cursor](https://cursor.com), I found context windows for updates were struggling with high-confidence changes. So I halted dev and spent four hours — roughly $45 in Opus 4.6 Thinking tokens — refactoring the whole tool layer to add 200+ integration and unit tests. This tightened execution, made tool calls more deterministic, and gave me far more confidence in making changes without things silently breaking downstream.

![Voice to Knowledge: The Full Pipeline — 9 stages from capture to retrieval](/blog/02-voice-to-knowledge-pipeline.png)
*From speaking into a phone to a retrievable wiki page: git push, GitHub Actions index rebuild, and SSM notify included.*

![Knowledge Layers: Agent Governance → LLM Wiki → Raw Sources](/blog/11-knowledge-layers.png)
*Three tiers. Config and prompt files feed governance. Governance writes to the wiki. The wiki draws from raw sources.*

---

### The Research Agent

Research is designed for depth. It takes a prompt or topic, expands it outward using external sources, and synthesizes results into a structured markdown report that lands in a versioned library.

The pipeline runs through [Parallel AI](https://parallel.ai)'s Task API. Before submitting anything, the agent constructs a structured query — not the raw user prompt, but an expanded specification: what to find, what sources to prioritize, how to structure the output, what format to return. That specification goes to Parallel AI as a single async task submission.

Parallel AI fans the query out internally: crawling multiple web sources, cross-referencing claims, synthesizing a narrative. The caller doesn't manage any of this fan-out — it submits one task and gets back a task ID. The script then polls on a backoff interval. The gateway never holds a connection open for the full research duration (2-25 minutes depending on tier); the task runs independently and the gateway moves on to other work. When Parallel AI finishes, the result arrives on the next poll.

Once the report is received, it gets committed to the research library repo. GitHub Actions picks up the push, rebuilds the index JSON, and SSM-notifies the running gateway. The bot sends a Telegram message when it receives the notification. The full chain: construct query → submit → poll → receive → commit → index rebuild → SSM notify → Telegram confirmation. Each step is independent and auditable, and none of it requires a human to monitor or stitch it together.

The pricing model is genuinely different from the rest of the stack: fixed per-task, not per-token. You pick a processor tier, submit, and pay a flat rate regardless of how many sources the underlying agent crawls or how many tokens it consumes internally.

| Processor | Cost/task | Latency | Best for |
|---|---|---|---|
| \`lite\` | $0.005 | 10–60s | Single-field lookups |
| \`base\` | $0.010 | 15–100s | ~5 fields, standard enrichment |
| \`core\` | $0.025 | 1–5min | ~10 fields, cross-referenced |
| \`pro\` | $0.100 | 2–10min | ~20 fields, exploratory research |
| \`ultra\` | $0.250 | 5–25min | Multi-source deep research |

Each processor also has a \`-fast\` variant (e.g. \`core-fast\`) that trades some data freshness for 2–5× lower latency — useful for interactive agent workflows where a user is waiting on a response.

The other key choice is **output mode**. Parallel AI supports two: \`output_schema: { type: "text" }\` returns a markdown narrative with inline citations — exactly what you want for a readable research report. \`output_schema: { type: "auto" }\` returns structured JSON matching whatever schema you define — useful for batch enrichment workflows that need machine-readable output. Getting this wrong cost me a week of reports rendering as 250-line JSON blobs before I found the one-parameter fix. ([→ Bug 12](#bug-12-research-output-rendering-as-raw-json))

The index is a flat JSON file — not a vector database — which at 500 entries fits in ~15k tokens and stays well within Sonnet's context window. Reports are published via async callbacks so the gateway never holds a connection open waiting; a [GitHub Actions](https://docs.github.com/en/actions) workflow rebuilds the index and SSM-notifies the running gateway when it's done. No static credentials, no open ports. Over time this becomes a compounding asset — not just a chat history you forget exists.

The most significant failure from this phase wasn't an API configuration problem. It was a race condition in how the bot committed its own code — one that repeated across multiple sessions because the bot kept fixing the wrong thing. [→ Bug 8](#bug-8-the-bot-diagnosed-the-wrong-code-path)

---

## What's Next

At this point there's not much more to explain about the core system. What emerged was a clean feedback loop where the bot can partially fix itself. I built out a set of skills that made it easy to pass commands back and forth — instead of constantly intervening, I could guide it at a higher level. The development and debugging flow ended up being surprisingly fluid, especially once the system had enough context to reason about its own state.

The interesting part now isn't what it does today. It's what comes next.

**Knowledge base enrichment and propagation.** Ingestion works, but it's still too literal. I want to introduce a cloud agent that runs whenever a new entry is added. Its job: normalize, enrich, and distribute that information across the system. So instead of just storing "I'm going to the beach this summer," it adds it to events and places, links it to relationships, maps it to goals. Turning isolated facts into connected knowledge. This is partially working today but not yet consistent enough. The target is something closer to semantic propagation across the knowledge graph, even if I'm not calling it that out loud.

**Transcription upgrade to [Whisper](https://github.com/openai/whisper).** Amazon Transcribe works fine. Fine isn't a compelling long-term strategy. Whisper is more accurate, more resilient to real-world audio, and still affordable enough to justify the switch. This doesn't change the architecture — just the quality of everything downstream.

**Structured self-improvement via GitHub issues.** Right now improvements are still ad hoc. I want to formalize the loop: describe a feature or bug in a Telegram topic, that automatically creates a GitHub issue, the issue triggers a cloud agent workflow, the agent implements the change, pushes the code, handles redeployment. Intent directly into shipped changes. Less "open a ticket and come back later," more "state the problem and let the system close the loop."

**Dedicated Q&A interface.** A clean way to actually use all of this — not another bot, just a dedicated Telegram topic. A place to ask questions and get answers grounded in everything the system has ingested. The ingestion pipeline is already doing the hard work of building context. This is just the surface layer where that context becomes useful.

Side note: prompt caching on EC2 means session context gets reused across messages, so the model doesn't rebuild it from scratch every time — keeps latency low and costs from drifting up quietly.

---

## Bug Appendix

*Every failure from the build, explained in full. Bugs with images appear briefly in the main text above; full details are here.*

---

### Bug 1: Getting the SSM Plugin to Install

The AWS Systems Manager Session Manager plugin is required to tunnel into the instance from a Mac — without it, none of the \`make ssh\` or \`make logs\` commands work. The standard install methods (Homebrew, \`sudo installer\`) both failed without an interactive GUI session.

The fix was unpacking the \`.pkg\` file manually: \`xar -xf\` to extract the archive, \`cpio\` to pull out the binary, copy it to \`/usr/local/bin\`. First attempt used the ARM64 build. The Mac needed x86_64. Second attempt worked.

**What this tells you:** AWS's documentation for this plugin assumes a normal install environment. If the normal path fails, the binary is just a binary — find it inside the package and move it yourself. The ARM64 vs x86_64 issue is easy to miss because both exist inside the same download.

---

### Bug 2: SSM Port Forwarding and WebSockets Don't Mix

The OpenClaw Control UI uses WebSockets for its QR pairing flow — QR generation, status updates, and pairing confirmation all depend on a persistent WebSocket connection to the gateway. SSM port forwarding is asynchronous and drops idle or loaded connections. Every drop reset the pairing flow from the beginning. Five attempts at the QR generator. Zero successful scans.

**What this tells you:** SSM port forwarding is fine for short-lived HTTP requests and terminal sessions. It is exactly wrong for anything requiring a persistent WebSocket. The Control UI is designed for a browser running on the same physical machine as the gateway — not for remote access through a tunnel. Fighting this architecture cost three hours.

---

### Bug 3: The WhatsApp Death Spiral

Every gateway restart — from a config change, a crash, or the systemd health monitor — triggered an automatic WhatsApp reconnect through [Baileys](https://github.com/WhiskeySockets/Baileys). WhatsApp's servers respond to repeated failed authentications with escalating rate limiting. Twenty-plus gateway restarts in one afternoon sent hundreds of failed reconnect attempts in waves. The phone showed: *Can't link new devices at this time.*

![The WhatsApp Death Spiral: health monitor restarts → stale credentials → Baileys retries → rate limit → repeat](/blog/09-whatsapp-death-spiral.png)
*20+ restarts × exponential backoff = hundreds of failed auth attempts in one afternoon.*

The fix was breaking the cycle entirely: stop the service, delete all credential files, wait, then run the pairing command directly on the server terminal — no browser, no SSM WebSocket layer, just a QR code rendered in the terminal.

**What this tells you:** The failure here is platform mismatch, not retry configuration. WhatsApp actively discourages automated clients. Baileys reverse-engineers an unofficial protocol that WhatsApp is actively trying to block. The systemd health monitor's restart behavior — correct for every other service — is exactly wrong for a client fighting rate-limit escalation from a platform that doesn't want it there. Telegram has a published bot API, official token-based authentication, and no protocol to reverse-engineer. The operational difference is night and day.

---

### Bug 4: Wrong Config Key for Telegram

The Telegram plugin required a \`botToken\` field in \`openclaw.json\`. The first attempt used \`token\`. OpenClaw's schema validator rejected the config and the service refused to start, logging \`must NOT have additional properties\`. The message is accurate but points at the file level, not the specific field.

**What this tells you:** Check the plugin's documented schema before writing config by hand. The validator error tells you something is wrong; you have to read the actual plugin documentation to find out what.

---

### Bug 5: The API Key That Never Reached the Process

The research tool required a \`PARALLEL_API_KEY\` environment variable. The key had been stored in [AWS SSM Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) — but nothing had ever fetched it and written it into the instance's environment. The \`.env\` file on disk had \`PARALLEL_API_KEY=\` since day one.

Fixing the \`.env\` file revealed a second layer: even with the file written correctly and a \`.profile\` source line in place, the gateway service was started by systemd, and systemd user services don't source \`.profile\`. The service had been running with the key unset in its actual process environment the entire time. Interactive SSH sessions saw the key; the running gateway didn't.

The fix: an \`EnvironmentFile=\` directive in the systemd service unit pointing directly at the \`.env\` file. Verification via \`cat /proc/<pid>/environ\` ([proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html)) confirmed all three keys were present in the live process after restart.

**What this tells you:** On a Linux server, there are at least three distinct paths for environment variables: SSM Parameter Store, user profile scripts, and systemd's own environment. They don't automatically connect. Systemd is authoritative for processes it manages. Put variables where [systemd](https://www.freedesktop.org/software/systemd/man/systemd.html) will actually see them, and verify with \`/proc/<pid>/environ\` rather than assuming.

![The Environment Variable Gap](/blog/08-env-variable-gap.png)
*Three paths for API keys. Only one reached the running gateway process.*

---

### Bug 6: Voice Memos Were Silently Ignored

When Telegram delivers a voice message, OpenClaw's gateway downloads the audio file locally and appends a text annotation to the model prompt: \`[media attached: voice_abc.oga (audio/ogg) | /path/to/file]\`. That's it. The model receives a file path to a file it cannot read. No audio data is passed. No transcription occurs.

Every voice memo sent since Telegram was connected had been silently discarded. The bot received the annotation, had no way to act on it, and said nothing to indicate anything was wrong.

**What this tells you:** "Voice message support" in a gateway means the gateway acknowledged receipt of the file. It doesn't imply the content was processed or understood. The gap between "the file arrived" and "the content was understood" is exactly where the actual work lives. Read the source code before assuming a feature works end-to-end.

---

### Bug 7: The Wrong Model Was Running

The config change switching from Amazon Nova 2 Lite to Claude Sonnet 4.6 had been made on the development machine — but the updated config file was never deployed to EC2. The running gateway was using Nova 2 Lite for every message during the entire initial deployment.

This wasn't immediately obvious. Nova 2 Lite is capable enough that responses seemed plausible. The tell was the workspace files being ignored: the personality instructions worked loosely, the tool protocols were mostly bypassed, and when the voice transcription capability was added to \`AGENTS.md\`, the bot denied it could do it even after the description was moved to the very top of the file.

Checking the gateway logs revealed: \`agent model: amazon-bedrock/global.amazon.nova-2-lite-v1:0\`. One \`sed\` replacement to swap the model ID. Restart. The personality took hold immediately.

**What this tells you:** Nova 2 Lite and Sonnet 4.6 aren't the same tier — they're different model classes, and the difference isn't marginal at 6,650 tokens of system prompt. Nova 2 Lite is optimized for speed and degrades on instruction-following as context length increases; it's past its reliable operating range before the system prompt is even finished. Making the instructions louder doesn't help if the model isn't reading them. When an agent consistently ignores its workspace files, check which model is actually running before touching the instructions.

![The Model-Class Cliff](/blog/06-model-class-cliff.png)
*Same workspace files, same instructions. Nova 2 Lite ignored them. Sonnet 4.6 followed them.*

---

### Bug 8: The Bot Diagnosed the Wrong Code Path

This one ran for multiple sessions before it was understood, because the bot kept fixing a real problem — just not the one that was actually failing.

**The symptom**: every Telegram voice memo triggered the ingestion pipeline: transcribe, extract entities, write wiki pages, commit to the repo, push. Commit succeeded. Push failed. The bot reported partial success or logged a warning, and on the next voice memo the same push failure came back. It wasn't intermittent — it was every time.

**The diagnosis**: the bot identified that \`lib/git.sh\` lacked retry logic on push. When GitHub Actions happened to push a concurrent index rebuild commit between the bot's \`git commit\` and \`git push\`, the push was rejected with a non-fast-forward error. The fix was real: add a retry loop with \`git pull --rebase origin main\` before the next push attempt. The bot wrote the fix, committed it, reported done.

**The next voice memo**: same push failure.

The bot checked \`lib/git.sh\` again. The retry logic was there — it had just written it. It re-examined the logic, decided something was subtly wrong, rewrote it, committed the fix again, reported done. Next voice memo: same failure. This repeated across multiple sessions. Each time, the bot correctly diagnosed the symptom, correctly targeted \`lib/git.sh\`, and correctly wrote the fix. Each time the fix was irrelevant.

**The architectural lie**: \`ingest-voice.sh\` sources \`lib/git.sh\` on line 23. The functions were always available. But \`ingest-voice.sh\` never calls any of them. It owns its entire git workflow inline — commit, push, done — across roughly 40 lines of script. There was a bare \`git push\` with no retry, no rebase, no awareness of remote state. When GitHub Actions pushed a competing commit before the bot's push landed, the rejection was guaranteed.

The codebase looked like it had a single centralized git push pattern. In practice it had two: the hardened path in \`lib/git.sh\`, and the inline path in the most frequently called script in the system. The bot had read access to all of it, but its diagnostic instinct was to look at the library — the intended code path — and reason about correctness there. \`ingest-voice.sh\`'s inline git block was structurally invisible to that diagnostic pattern.

**What "out of sync" meant mechanically**: EC2's local branch was 1 commit ahead of remote at commit time. GitHub Actions then made remote 1 commit ahead before the push landed. Non-fast-forward rejection. The branch diverged on every single voice memo invocation — predictably, not occasionally.

**Why tests missed it**: the integration test for push failure used \`chmod 000\` on the remote to simulate unavailability. That test passed regardless of whether retry logic was present — it tested the failure case, not recovery. A test asserting "push succeeds when the remote is already 1 commit ahead" would have caught this immediately: it would pass for \`transcribe-voice.sh\` (which routes through the lib) and fail for \`ingest-voice.sh\` (which doesn't). That race condition test was the one added in the fix.

**The actual fix**: refactor all four shell scripts to route their git operations through \`git_add_commit_push()\` in the lib. Remove the inline git blocks. Add eight unit tests for \`lib/git.sh\` directly. Add an integration test using a second local clone positioned 1 commit ahead of the script's local clone, simulating the GitHub Actions race. Fix the test helper to use \`main\` instead of \`master\` — the retry path (\`git pull --rebase origin main\`) had never actually been exercised in tests because the local test repos were initialized with \`master\`.

**What this tells you**: the bot was a reliable diagnoser of symptoms and a reliable fixer of its diagnosed target. It had no visibility into whether the diagnosed target was the actual code path in use. The Sisyphus quality of the failure — fix deployed, same failure next run, fix deployed again — was a signal that the bot was operating on a model of the system that didn't match the system. Identifying that gap required a human to read the scripts structurally, not just examine the library. The follow-on governance: an explicit rule requiring all scripts to route through lib functions, and a dedicated integration test class that exercises the race condition rather than just the clean-path and unavailability cases.

---

### Bug 9: IAM Permission Prefix Mismatch

\`ingest-voice.sh\` submitted [AWS Transcribe](https://docs.aws.amazon.com/transcribe/) jobs with the name prefix \`openclaw-wiki-*\`. The IAM policy attached to the instance role was scoped to allow Transcribe job actions only for resources matching \`openclaw-voice-*\`. These two strings had been written independently and never compared. The first end-to-end run produced an access denied error visible only by reading the Transcribe job status directly — the script logged \`status: failed\` with no explanation.

**What this tells you:** IAM resource patterns must be aligned with what the code actually generates. A mismatch doesn't fail at deploy time — it silently fails at the first real invocation. The fix is simple (align the prefix in the script to match the policy), but finding it requires knowing to look at the IAM policy at all.

---

### Bug 10: Non-ASCII Characters in an AWS CLI Request

\`wiki-integrate.sh\` constructed a JSON request body that included em-dashes copied directly from the prompt template — the kind of punctuation that looks like a hyphen but isn't. When passed to the AWS CLI via \`--body file://\`, the request was rejected. The \`file://\` file-reading mode expects ASCII. The content wasn't ASCII.

The fix is one character: \`fileb://\` instead of \`file://\`. The \`fileb://\` variant reads the file as raw bytes and passes it as binary, handling any character encoding without complaint.

**What this tells you:** Any time a request body is assembled from templates that might include curly quotes, em-dashes, ellipses, or any other typographic punctuation, use \`fileb://\`. The error from \`file://\` is cryptic and doesn't point directly at the character encoding issue.

---

### Bug 11: GitHub Actions Multi-Line Output Parsing

The GitHub Actions workflow extracted frontmatter fields from research files using a \`grep -m1\` pattern looking for lines starting with \`title:\` or \`query:\`. The pattern worked on clean files — and silently matched body content that happened to start with those words in other files. Summary extraction piped a multi-line JSON value into \`echo "summary=..." >> $GITHUB_OUTPUT\`, which Actions' output parser cannot handle. Multi-line values written this way are truncated or cause the step to fail with a confusing error.

The fix: a short Python frontmatter parser instead of grep, and heredoc delimiter syntax for multi-line values in \`$GITHUB_OUTPUT\` (write \`key<<DELIMITER\`, then the value on subsequent lines, then \`DELIMITER\` on its own line).

**What this tells you:** Grep is the wrong tool for structured data extraction from frontmatter. It works until a body line matches the pattern, and it fails silently rather than noisily. For \`$GITHUB_OUTPUT\`, multi-line values require the heredoc format — the simple \`echo\` syntax only works for single-line values.

---

### Bug 12: Research Output Rendering as Raw JSON

The first deep research reports published to the knowledge base repo rendered on GitHub as 250 lines of nested JSON objects — completely unreadable. \`research-and-publish.sh\` was calling [Parallel AI](https://parallel.ai)'s Task API with \`output_schema: { type: "auto" }\`, which returns structured data. The script had no step to turn that data into readable prose, so it committed the raw JSON directly.

The fix was changing the output mode to \`"text"\`, which returns a markdown narrative report with inline citations. No schema, no downstream formatting step. This also deleted a 36-line Bedrock reformatting stage that had been added to compensate for the raw JSON — a stage with its own silent failure mode that was no longer needed.

**What this tells you:** Pick the right output format at the API level rather than reformatting downstream. One parameter change deleted an entire pipeline stage and the bugs it contained.

---

### Bug 13: Speech-to-Text Errors Propagating Through the Pipeline

AWS Transcribe heard "Lagos" where "Richmond" was said. It misheard a name's spelling. It got an entirely different first name wrong. The voice-to-wiki integration pass — which takes the transcript and asks the model to produce a structured plan of wiki pages to create or update — treated the transcript as ground truth. A birthplace was filed in Lagos. A speculative note was added: *was Ford living in Nigeria at the time?* A profile page was created under the wrong name.

Seven files required manual correction. The raw transcripts stayed untouched — they're the immutable record of what Transcribe heard, not what was said. Correction notes were committed beside them. Derived pages were updated. Git history shows both the original error and the correction.

**What this tells you:** Speech-to-text has irreducible error rates, and LLM passes that treat transcripts as ground truth will amplify those errors into downstream records. The governance response: all transcribed content is a draft. Human review happens before anything is promoted to a canonical page. Corrections commit with provenance notes. The raw transcript stays immutable so the error chain is always traceable.`,
};

export const blogPosts: BlogPost[] = [main];
