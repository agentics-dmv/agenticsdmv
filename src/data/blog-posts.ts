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

A note before you start: this is an engineering diary, not a tutorial. The mistakes are in here because the thought process is the thing. I did not start this knowing what I was doing. I was learning the paradigm while building it, improvising when things broke, and asking the AI for help at every step. Polishing that into a clean success story would miss the point entirely.

All of this — deployment through voice pipeline through research library — happened over three days.

---

## The Architecture of Before

Before OpenClaw made sense to me, I had to understand what came before it — and why it was genuinely different.

For a decade, automation meant Zapier. Or IFTTT. Or, more recently, n8n. These tools shared a common architecture: you defined a trigger, you defined a sequence of steps, data flowed through in one direction, and the workflow terminated. A new email arrives → parse it → create a Trello card. A form submits → validate → write to a database → notify Slack. Clean, predictable, auditable. If This, Then That — literally what the category was called.

These platforms eventually added LLMs. But *how* they added them is the key thing. The LLM was a node in a pipeline someone else defined. A smarter formatting step. "Take this customer complaint and classify it as billing, technical, or other." The model received a fixed input, produced a structured output, and the workflow moved on. It didn't plan. It didn't decide what tools to call next. It didn't remember yesterday. It was deterministic automation with a reasoning step inserted — the plumbing was still rigid, the logic was still explicit, the state still evaporated when the workflow terminated.

<figure style="float:right; width:280px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/llm-as-one-node.png" alt="The LLM as one node in a trigger-action pipeline" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">One box among equals. No memory, no planning, no initiative — just a smarter formatting step.</figcaption>
</figure>

The first attempts to break this model arrived in 2023: AutoGPT, BabyAGI, the early LangChain agent abstractions. These gave models the ability to call tools in a loop — the "ReAct" pattern: reason about what to do, take an action, observe the result, reason again. That was the right instinct. The implementation collapsed. Models with 4,000-token context windows couldn't hold a multi-step task's constraints from step one to step twenty. Agents hallucinated progress. They looped. They burned through API credits on the same failed call, retried until the credits ran out, and stopped without completing anything.

The problem wasn't that agents were a bad idea. The infrastructure wasn't ready.

![The Paradigm Shift: stateless trigger-action pipelines vs. stateful gateway daemon](/blog/paradigm-shift-stateless-vs-stateful.png)
*Top: the LLM as one node in a human-defined pipeline. Bottom: the LLM as the orchestrator of its own persistent loop.*

---

## What Changed, and Why Now

Three things converged between 2023 and 2026, and their combination is what made frameworks like OpenClaw viable rather than aspirational.

<figure style="float:left; width:260px; margin:0 1.5rem 1.5rem 0; clear:left;">
  <img src="/blog/three-enabling-conditions.png" alt="The three enabling conditions: context windows, instruction following, inference cost" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Three shifts that converged. Any one alone wouldn't have been enough.</figcaption>
</figure>

**Context windows grew by two orders of magnitude.** Claude Sonnet 4.6 has a 200,000-token context window. The workspace files that define my assistant's personality, knowledge, tools, and operating protocols are 6,650 tokens combined — 3% of that window. An early agent running on a 4k-token model couldn't hold its own operating instructions while also tracking a multi-step task. The ratio was wrong. Now it's not.

**Models crossed the instruction-following threshold.** There's a qualitative difference between a model that follows a 500-token system prompt and one that follows a 6,650-token prompt with fidelity across a long conversation. This post has an entire bug entry about this: the system ran Amazon Nova 2 Lite for days while I thought it was Sonnet, and the tell was that the workspace files were being progressively ignored as conversations grew longer. Both models are capable. Only one of them held the instructions at depth. That's not a marginal difference — it's the difference between a system that works and one that degrades.

**Inference costs dropped enough to make persistence economical.** Running an always-on agent means paying for inference on every message, indefinitely. At 2022 prices, that was a real commitment. At current prices — with prompt caching hitting at $0.30/M tokens instead of $3.00/M — persistence is just a feature, not a business decision. Gartner projects a 90% cost reduction in LLM inference by 2030. The economics are already most of the way there.

What these conditions enabled is a specific architectural shift: **the agent stopped being a step in someone else's pipeline and became the orchestrator of its own pipeline.** Instead of a human defining a directed graph and an LLM operating as one node in it, the LLM now manages a persistent process — assembling context, routing to tools, maintaining memory across sessions, acting between conversations without being asked. The human writes the operating instructions in English. The model figures out what to do with them.

The technical term for what OpenClaw is: a **stateful gateway daemon**. Not a chatbot wrapper. Not a workflow runner. A long-lived process that binds to a port, serializes incoming messages into a queue, and runs a multi-stage reasoning loop on each one. That loop — from message normalization through context assembly through tool execution through memory update — replaces what previously required a human to maintain as a hand-coded pipeline.

The old model: the task existed in the human's head, and the machine executed explicitly defined steps toward it. The new model: the task, its history, its dependencies, and its progress exist inside the machine's own persistent state. That shift is structural, not cosmetic.

<div style="clear:both;"></div>

---

## Three Conversations in Richmond That Couldn't Have Happened Before

I want to make this concrete. Not hypothetical AI futures — actual conversations that are possible now, and that weren't possible with the tools that came before.

**The first conversation** happens at the end of a run. I send a voice memo: *"I've been thinking about the Shockoe project more. Still think the thing that gets it funded is connecting it to the flooding infrastructure work the city's already committed to — same argument as last year's greenway pitch."* The bot transcribes it. Checks its memory. Responds: *"You made almost the same argument for the greenway funding in October. You won that one. Want me to pull the structure of that pitch and see how it maps to Shockoe?"* This is not a search result. It's a relationship. The bot remembered October because October is in MEMORY.md, and it recognized the structural similarity because it was listening for it. A Zapier workflow has no October. It has no pitch. It has no understanding of what "same argument" means across two different conversations.

**The second conversation** happens at 2pm on a Tuesday when I haven't sent a message. The bot's heartbeat fires — a proactive trigger that runs every 30 minutes and checks a HEARTBEAT.md checklist. It notices I asked two weeks ago to track coverage of a particular city council vote. It searches. The vote happened yesterday. I get a message: *"The vote passed 6-3. Three members voted against it. This connects to the rezoning concern you flagged in March."* I didn't ask. It went looking. That's not trigger-action logic. That's initiative. A Zapier workflow runs when something happens to it. This ran because the agent decided something was due.

<figure style="float:right; width:250px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/the-heartbeat.png" alt="The heartbeat: clock fires every 30 min, checks HEARTBEAT.md, acts if something is due" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">No message required. The agent checks, decides, acts.</figcaption>
</figure>

**The third conversation** happens over a week without any single explicit ask. I've been talking about a job transition — not as a formal "help me with my career" query, but the way people actually talk, tangentially, across fragmented messages. *"The meeting went weird today."* *"I'm not sure the role is what I thought it was."* *"I need to figure out my options."* By Friday, the bot has a picture I didn't explicitly draw for it. It says: *"Looking at this week, it sounds like the question isn't whether the fit is right — you seem clear on that. The question is timing and what you'd step into. Do you want to talk through what the landing zone looks like?"* That's synthesis across a week of signals. A chatbot with no memory resets on every message. This didn't.

None of these conversations required a feature request, a sprint, a developer, or a deployment. They required a system with persistent memory, initiative, and enough context about who I am to connect things I said this week to things I said last month. The paradigm shift isn't the AI getting smarter in isolation. It's the AI getting smarter *about you*, over time, without forgetting.

---

## What If OpenClaw Was Your 311 System

311 is the non-emergency city services line. You call to report a pothole. A broken streetlight. A noise complaint. The system takes your report, routes it to the right department, generates a ticket, and theoretically someone handles it.

The defining constraint of a 311 system is that it can only do what it's been programmed to do. Someone built the routing logic. Someone defined the ticket categories. Someone wired up the department queues. If your problem doesn't fit a category, the system doesn't know what to do with it. If two city systems need to talk to each other to handle your request and no one built that integration, the request dies at the handoff.

This is exactly the limit of every deterministic automation system. Its scope is hard-bounded by what has already been built. Anything outside that envelope requires a human to notice the gap, file a request, wait for an engineer to build a new feature, and wait for that feature to ship.

Now imagine that 311 system built on an agentic framework with API access to every city system that has an API: permitting, zoning, utilities, parks, public works, transit. Not a fixed feature set. A set of *capabilities* — the ability to read from and write to the systems that actually govern the city.

A resident calls in a pothole near the river. The agent doesn't look up "pothole" in a routing table. It reasons: this is a public works issue, but it's also adjacent to a stormwater infrastructure project that's budgeted and already in progress. It checks the project timeline, checks whether the pothole is in scope, and routes the ticket with a note: *"This location falls within the Phase 2 stormwater project scheduled for Q3. Recommend deferring repair until drainage work completes to avoid re-paving."* A human engineer would have figured that out if they happened to know about the project. The agent knows about every project, all the time.

The difference isn't intelligence — it's **state and scope**. The agent holds the full map of what's in motion, can reason across departments, and can generate responses that aren't limited to features that have been pre-built. The constraint shifts from "what did engineers build" to "what is actually possible given the available APIs and data."

This is the conversation Richmond could be having. Not replacing city workers — giving them a reasoning layer that can hold the full picture and connect things that currently only get connected by accident, by whoever happened to know about both things at once.

---

## How It Actually Works

The marketing pitch for agentic AI tends toward abstraction. "It reasons. It acts. It learns." None of that is specific enough to build on or trust. Here is what actually happens — the actual moving parts, named precisely.

### The Gateway Is Not a Web Server

OpenClaw runs as a long-lived daemon — a systemd service on Linux, a LaunchAgent on macOS. When the process starts, it binds to \`ws://127.0.0.1:18789\` and exposes a **typed WebSocket API** as its control plane. This single process owns everything: the channel adapters for Telegram/WhatsApp/Slack, the web control UI, CLI client connections, the cron scheduler, and all plugin lifecycle management.

This is a meaningful distinction. A web server terminates after each response. The gateway *persists* — it holds all session state in memory between messages and checkpoints state to disk for durability. It's closer to a message broker than an HTTP handler. It emits structured lifecycle events (message received, compaction triggered, cron fired, tool called) that hooks and plugins can intercept.

### Stage 1: Channel Normalization

When a message arrives, the channel adapter normalizes it before anything else. Telegram messages come in through grammY; WhatsApp through Baileys (a reverse-engineered WhatsApp Web client); web chat through the gateway's own WebSocket API. Voice memos, images, and text all become the same internal object: sender ID, channel, content type, content, timestamp.

This abstraction is why the same workspace files and the same model work across every channel. The normalization happens in the adapter layer before the model sees the input.

### Stage 2: Session Lock and Queue

The gateway resolves which session the message belongs to and acquires a **session lock** before proceeding. If the session is already processing a previous message, the new message waits in a queue. One session, one active task at a time.

This matters for correctness, not just performance. Concurrent messages triggering competing tool calls that both try to write to MEMORY.md produce corrupted state. The session lock makes that structurally impossible. The documented default timeout for a long-running agent task is **48 hours** — a single session can hold a complex, multi-step task across two full days before the system considers it stuck.

### Stage 3: Context Assembly

Before the model sees the message, the system assembles the full prompt from layered sources:

**Workspace files** — read from disk on every single turn. SOUL.md, USER.md, AGENTS.md, TOOLS.md. The persona, operating instructions, and tool descriptions are re-injected fresh at the start of every message, not held in a stateful conversation object that can drift or be overwritten. The programming surface is the filesystem: edit a file, restart nothing, next message follows the new instructions.

**MEMORY.md and daily notes** — MEMORY.md holds long-term facts extracted from past conversations. Daily notes live in \`memory/YYYY-MM-DD.md\`, an append-only log of each day's exchanges. Both are plain Markdown files in the workspace, indexed into a per-agent SQLite database that watches for changes and re-indexes automatically. When a file updates, the index updates. When you need to correct a bad memory, you edit the file and commit the change to Git.

**Session transcript** — loaded from a JSONL file on disk. Each turn is one JSON line appended to the file. The transcript grows until the **compaction subsystem** triggers: a background process that summarizes older turns into a compact representation and evicts raw history. The gateway maintains a *compaction reserve* — a token budget held back from the context window — to ensure compaction can run without the model running out of room mid-reasoning. Compaction is automatic, logged, and the pre-compaction snapshot is retained for audit.

**Skill manifests** — on every turn, only skill *names* are injected into the prompt. The full SKILL.md file (potentially 2,000 tokens of detailed workflow instructions) only loads when the model determines the skill is relevant to the current task. This lazy loading keeps baseline context lean: the model doesn't pay for expertise it won't use on this turn.

![Context Assembly: the four layers assembled into the model's context window on every message](/blog/context-assembly-layers.png)
*Four sources, rebuilt fresh on every turn. Workspace files re-read from disk. Session JSONL compacted as history grows. Skills loaded only when relevant.*

### Stage 4: Inference and Structured Tool Calling

The assembled context goes to the model — Claude Sonnet 4.6 via Amazon Bedrock, called using the instance IAM role, no credentials stored anywhere.

A critical enabling condition here: **structured function calling**, which OpenAI standardized in June 2023 and Anthropic followed. The model doesn't write "I need to run the research tool" somewhere in its response and hope a parser catches the intent. It emits a structured JSON tool call with schema-validated parameters. The gateway intercepts the structured call, routes it, and feeds back a structured result. Schema enforcement happens at the provider level.

OpenClaw also supports **MCP (Model Context Protocol)**, Anthropic's November 2024 standard for tool and data connections. MCP servers attach to the gateway through a bridge component called \`mcporter\` and can be added or swapped without restarting the gateway process. New tool surfaces — a calendar API, a code execution environment, a database — require no gateway changes, only a new MCP server configuration.

### Stage 5: The ReAct Loop

If inference produces a tool call, the gateway intercepts it before sending any response to the user. It executes the tool — a shell script, an MCP call, a built-in function — captures the output, and appends the result to the running context as a new observation. The model infers again on the updated context: it sees the tool result and decides whether to call another tool or produce a final answer.

This Reason-Act-Observe loop has no fixed depth bound beyond the session timeout. The loop includes retry logic: if a tool call fails, the gateway can invoke compaction and retry rather than aborting. Failed tool calls surface to the model as error output; the model reasons about the failure and either recovers or escalates. The model doesn't "know" how to transcribe audio or run a research query. It knows tool interfaces exist, and it calls them. The domain expertise lives in the tools; the routing judgment lives in the model.

<figure style="float:right; width:270px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/react-loop.png" alt="The ReAct loop: Reason, Act, Observe — cycling until done" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Each cycle: decide what to call, call it, read the result. Repeat until there's nothing left to do.</figcaption>
</figure>

### Stage 6: Memory Is a First-Class Runtime Component

Memory in OpenClaw is not an opaque vector store behind an API endpoint. It's a defined file layout in the workspace, indexed into SQLite:

- **MEMORY.md**: persistent facts the model has extracted and stored — preferences, ongoing projects, relationships, goals
- **Daily notes** (\`memory/YYYY-MM-DD.md\`): append-only record of each day's interactions
- **Optional long-form synthesis**: a "dreams" file for deeper cross-session reflection

The memory engine watches these files and re-indexes automatically on change. There is only one memory plugin slot in the gateway's plugin architecture — if you install a custom memory plugin, it replaces the builtin engine entirely, not supplements it. The design reason: two competing memory systems writing to the same agent state produce contradictions. The exclusive slot makes memory the system's concern, not yours.

The operational implication of file-based memory: it's **legible**. You can open MEMORY.md, read what the agent believes about you, edit an entry that's wrong, and commit the correction. Vector database embeddings cannot be read, corrected, or versioned by a human. File-based memory can. When the transcription bug produced a Lagos entry for a Richmond meeting, the correction path was straightforward: edit the wiki page, commit a provenance note, move on. The error chain was traceable because the memory was readable.

<figure style="float:right; width:280px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/memory-legibility.png" alt="Vector store vs MEMORY.md: one is a black box, one is a file you can read, edit, and git revert" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">If a bad memory gets committed, you fix it like any other file.</figcaption>
</figure>

### Stage 7: The Automation Substrate

Most people understand OpenClaw as a chat assistant. The fuller architectural picture is that it's an automation runtime — a system that can execute work without anyone sending a message.

**Hooks** are scripts that bind to gateway lifecycle events: a command invokes, a message phase completes, compaction runs, a session ends. They're how you extend the gateway's behavior without modifying core code. Both internal hooks and plugin-level hooks are integrated directly into the agent loop — they run at defined interception points, not as afterthoughts.

**Cron** is a built-in scheduler. Jobs persist across gateway restarts. When a job fires, it delivers output to a specified destination — a chat thread, a webhook endpoint. The heartbeat mechanism is a cron entry in HEARTBEAT.md that fires every 30 minutes: it wakes the agent, runs through a checklist, and acts if anything is due — without any human message.

**Task Flow** is the deeper primitive. It's an orchestration layer above individual tasks that manages durable, multi-step flows with **revisioned state**. A Task Flow persists across gateway restarts. Individual steps within a flow can run as direct agent turns, as sub-agents (background runs with independent session keys and independent context windows), or as ACP sessions (external coding harnesses — Cursor, Claude Code, similar — with spawn/steer/cancel controls). If a concurrent modification conflicts with in-progress flow state, the revision tracking detects it.

The **Webhooks plugin** is where this matters most for the comparison to legacy automation. The plugin binds external systems to Task Flows via authenticated HTTP routes. When Zapier fires a webhook at a traditional LLM API, it creates a stateless request-response cycle: trigger fires, model responds, state evaporates. When Zapier fires a webhook at OpenClaw's Webhooks plugin, it calls \`create_flow\` — which creates a **durable flow entity with revisioned state**, spawns managed tasks that can be inspected and cancelled, and persists independently of any single chat session or gateway restart. The trigger is identical. The downstream architecture is completely different: stateless invocation on one side, durable stateful orchestration on the other.

![The Automation Substrate: five execution tiers from direct response up through durable Task Flow, with Webhooks binding external systems to persistent state](/blog/automation-substrate-tiers.png)
*Same Zapier webhook. Different downstream: stateless request-response vs. durable flow with revisioned state that survives restarts.*

### What It Adds Up To

The architectural shape across these stages is: a **durable control plane** (gateway daemon), **inspectable state** (workspace files, JSONL session transcripts, MEMORY.md, Git), **structured tool interfaces** (function calling, MCP), and a **layered execution model** that scales from answering a question to running a multi-day, multi-agent workflow — direct response → tool loop → background task → sub-agent → Task Flow.

None of these components are new in isolation. Daemons, queues, state files, schedulers, and versioned databases all existed before 2023. The shift is in **integration and defaults**: these are the first-class primitives of the system, not infrastructure you wire together yourself. When you deploy OpenClaw, you get session serialization, context management, compaction, cron scheduling, sub-agent spawning, and durable flow state as runtime features, not as application code you're responsible for maintaining.

When something breaks, you \`ssh\` into the box, read the logs, check the JSONL session transcript, inspect MEMORY.md, and trace exactly what the model saw and what it decided. The system is made of things you can look at. That's not a design philosophy — it's what makes agentic systems operable in production rather than in demos.

---

## Where This Started

I had AWS credits left over from a hackathon. They were expiring.

That is the real beginning. Not a grand architectural vision, not a carefully planned AI infrastructure project. Credits running out, and a question: could I turn them into something tangible before they disappeared?

I had been circling OpenClaw for a while. It clearly had serious capability — a persistent agent, workspace-file-driven behavior, tool dispatch, multi-channel messaging — but I had kept putting off diving in. The paradigm was not obvious to me at first glance. How were the workspace files actually used? What did the model see? What constrained the agent's behavior and what didn't? I had enough of a sense of what it could do to know I wanted to try it, but not enough to feel ready to start without understanding it better. So I had been watching it from a distance.

The credits gave me a forcing function. The idea that crystallized was this: what if I deployed OpenClaw on AWS and used that as the basis for a local AWS meetup demo? Something concrete and running, not a slide deck. A working personal AI assistant on AWS infrastructure, explained by someone who had just built it. That framing kept the scope contained and the motivation honest. I was not trying to build the perfect production system. I was trying to build something real, understand it well enough to explain it, and show it to people.

That is where this started.

---

## What It Is

It's a personal AI assistant that lives on a server, talks to you over Telegram, and keeps running whether your laptop is open or not.

You send it a message. It responds. Within a conversation it tracks context, and across sessions it accumulates knowledge about you — your projects, goals, relationships, the things you talk about repeatedly. You can send a voice memo and it transcribes and files it. You can ask it to research something and it'll commission a deep research report, publish it to a versioned library, and notify you when it's done.

Four pieces make the stack:

**[OpenClaw](https://github.com/openclaw/openclaw)** — the open-source Node.js gateway. It connects messaging channels to AI models, handles session management and tool dispatch, and gets configured with JSON files and markdown documents called workspace files.

**AWS EC2** — a \`t4g.medium\` instance, ARM64/Graviton, no public ports. All access goes through AWS Systems Manager. The gateway runs as a systemd service.

**Amazon Bedrock** — the model API. The instance calls it directly via its IAM role using Claude Sonnet 4.6. The instance runs no inference — it assembles a prompt and sends it to Bedrock's endpoint.

**Telegram** — the interface. A bot created via [@BotFather](https://t.me/BotFather). Forum topics give you separate threads — research, voice notes, general chat — each with isolated history.

![The full stack: Telegram → EC2 → Bedrock, with S3, Transcribe, and GitHub in the loop](/blog/ai-stack-overview-dark-v2.png)
*t4g.medium on Graviton, no public ports, Claude Sonnet 4.6 via Bedrock.*

![OpenClaw System Architecture](/blog/openclaw-system-architecture.png)
*One EC2 instance. One gateway process. All access via SSM. Bedrock called on every message — no inference on the instance itself.*

The thing that makes this interesting isn't the stack — it's how you program it. Six markdown files on disk get injected into the prompt on every message. \`SOUL.md\` is the personality. \`USER.md\` is who you are. \`AGENTS.md\` is the operating manual. \`MEMORY.md\` is curated long-term facts. Together they're about 6,650 tokens — 3% of the model's context window. The bot always knows who it is, who it's talking to, and what its tools are, without you having to re-explain anything.

To change the personality: edit \`SOUL.md\`, run \`make ship\`, send a message. Next response follows the new instructions. No redeployment, no restart, no config change. The programming language is English. The runtime is a language model. The deploy target is a filesystem.

**Cost:** EC2 runs $26.93/month fixed. Everything else scales with use. At light use, total is ~$40–60/month. At moderate use, ~$125/month. The biggest lever is model choice — Nova 2 Lite costs 8.6× less than Sonnet 4.6, but Nova 2 Lite doesn't reliably follow a 6,650-token system prompt. That saving costs you the assistant.

---

## Three Days to Build It

### Learning the Paradigm First

Before touching any infrastructure, I needed to understand what OpenClaw actually was. Not the marketing pitch — the mechanics. What did the model see on each message? How were the workspace files assembled into the prompt? What happened when you edited them mid-session? What could the agent call and what could it not?

The workspace-file model makes intuitive sense in retrospect, but before it clicked it was opaque. I spent time on that education before doing anything concrete. That matters for understanding why the bugs we hit were the bugs we hit — a lot of them came from assumptions about what the system was doing that turned out to be wrong.

Once I felt like I had a rough working model of how OpenClaw operated, things moved quickly.

### Finding the Right Starting Point

I used to work on the team that maintained AWS samples for the SDK, so I already knew the ecosystem well. For any significant AWS use case, there are usually examples being actively maintained by the core team. My instinct when thinking about how to deploy OpenClaw on AWS was not to build from scratch — it was to find the sample.

I had also seen Brooke's blog post about OpenClaw on Bedrock. In the comments, someone referenced the example repository. That pointer, combined with prior familiarity with the samples pattern, became the path I followed. It was not random repo hunting. It was a specific move based on knowing where to look and trusting what I would find there.

The [official CloudFormation template](https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock) covered the hard parts: IAM role, security groups, a user-data script installing OpenClaw from npm, a systemd service, Bedrock connected. There is even a one-click launch path. I did not use it. I ran the CloudFormation commands myself, read what they were doing as they ran, and wrapped the steps in \`make\` targets so the deployment would be repeatable — not a sequence of commands I had to remember.

The actual first move: I opened Cursor, loaded twenty dollars in credits, cloned the repo, and asked the AI to help me deploy it. No architecture diagrams, no design doc. Clone, load credits, ask. The stack came up in 8 minutes.

### First Contact with the Running System

Once the AWS side was up, I created an SSM session and tunneled through it to reach the OpenClaw control UI in a browser. This was the first time the system felt real — not just infrastructure I had deployed, but something with an actual interface I could use. I clicked around, understood what it was offering, and generated a QR code through the UI.

I connected it to WhatsApp. It worked. I had a functioning bot, visible and interactive, running in AWS.

### WhatsApp: Connected, Then Gone

The WhatsApp path was not a deliberate platform choice. The reason I was on WhatsApp at all was situational: my Telegram number had been banned, apparently because of whatever the previous owner of that phone number had done before I ever had it. I had a help case open with Telegram trying to get it resolved. While I waited, WhatsApp was the workaround.

When the QR pairing worked, that was a real win. But what followed was not clean.

The SSM port forwarding kept dropping WebSocket connections. The health monitor kept triggering reconnects. Baileys, the library OpenClaw uses for WhatsApp's unofficial web protocol, retried on exponential backoff. After twenty-plus gateway restarts in one afternoon, I had a rate-limited phone number and a blocked account. [→ Bug 2](#bug-2-ssm-port-forwarding-and-websockets-dont-mix) [→ Bug 3](#bug-3-the-whatsapp-death-spiral)

![The WhatsApp Death Spiral](/blog/whatsapp-death-spiral.png)
*Twenty gateway restarts, hundreds of failed reconnect attempts, one rate-limited phone number.*

There was a genuine "now what?" moment. The path I had been on was closed. The fallback was Telegram, which was the platform I had been waiting to get unblocked on in the first place.

### Telegram: The Better Fit All Along

My Telegram account situation eventually resolved — help case moved, enough time passed, something. I created a bot through BotFather, got a token, dropped it into the config, and restarted the service.

Ten minutes. No QR codes, no pairing flows, no credential state to corrupt, no protocol that WhatsApp was actively trying to break.

BotFather was one of the genuinely pleasant surprises of the whole build. The developer experience was designed exactly for this kind of workflow. Token in hand, one config key, done. The bot responded to the first test message as if it had been running for years.

I was actually glad the WhatsApp path had closed. The process forced me toward the better platform for iterative development, even though I had not chosen it deliberately.

### The Big Refactor

Somewhere in the middle of all this — after Telegram was working, after the research system was roughed in — it became clear that the tool scripts needed more than cleanup. They needed to be rebuilt properly.

This was not about code style. The scripts had grown organically and were increasingly hard for the model to reason about without full context. Every change was expensive in tokens and fragile in practice. I was burning Opus credits on tasks that should have been within Sonnet 4.6's reach, but the architecture was not simple enough for Sonnet to hold without losing something. Too much implicit coupling, too little modularity, too many things that had to be understood together to change anything safely.

The fix was a real modularization effort. Not a cosmetic pass — a refactor with 196 Bats tests written alongside the changes. Something like thirty dollars in token spend across the refactor and all the bugs it surfaced. The commit history documents it.

The goal was model economics and practical reliability: if the system was simple enough for Sonnet 4.6 to handle, I could stop depending on Opus for every non-trivial task. Smaller scripts, cleaner interfaces between them, testable in isolation. Once the refactor landed, the model could extend the system without needing the full context of everything that came before.

### Skills as Operational Memory

One pattern repeated throughout the build: whenever I figured out how to do something — how to run a deployment step, how to debug a systemd issue, how to structure a Bats test, how to handle the SSM environment correctly — I would stop and ask the AI to turn that into a reusable skill.

Not documentation. Not comments. A structured, loadable instruction set that could be invoked in a future session without having to rediscover the same workflow from scratch.

![Without Skills vs. With Skills](/blog/with-skills.png)
*Same tokens, deeper thinking. Without skills, the AI explores broadly and fails often. With skills, the early branches are pre-solved.*

This became a major part of how I worked. Every solved problem was a candidate for capture. The goal was compounding rather than resetting: each session should start from a richer operational baseline than the one before. The graph of skill creation over the three days tracks closely with the rate of real progress. That was not a coincidence. Skills were load-bearing infrastructure for the way I was working, not an afterthought.

### The Bot's Character

Something I noticed early and kept noticing: the bot was unusually ready to fix itself.

I am not going to make claims about why at an architectural level — I cannot prove platform-specific things about why this system behaved differently from other AI interactions I have had. But behaviorally: it kept working a thread when something broke. It absorbed errors, attempted repairs, and kept going without stopping to ask permission. That changed the rhythm of working with it. It felt less like directing a tool and more like debugging alongside something that had its own momentum.

The persona layer mattered more than I expected. I told it to talk to me like a Gen Z teenager — direct, not verbose, a little rude, will still do what I say but clearly finds me slightly annoying. Something like: *be a teenager who helps me but doesn't pretend to be thrilled about it.* The tone that came out was lighter and faster than a formally polite assistant would have been. Less ceremony, more momentum. It turned out that interface tone affected the ergonomics of actually using the system. I was glad I set it.

What the bot was not: self-deploying. Even with good self-repair instincts and a GitHub token in hand, I still had to reinforce the behavior around pushing changes upstream. It would fix something, commit it, and stop there. The explicit protocol — push after every commit, pull before every read — had to be baked into the operational instructions before it held. [→ Bug 8](#bug-8-the-bot-committed-a-fix-and-didnt-push)

### The Working Loop

For most of the three days, my process was a simple feedback loop: something broke, I read the error, I fed it to the model in Cursor, the model produced a fix or a diagnostic step, I ran it, I fed the output back. Sometimes the error came from the AWS logs directly. Sometimes I copied Telegram output into Cursor. The channel did not matter — what mattered was that the loop was fast.

When the SSM session state got too noisy — terminal memory overloading Cursor's context, the session becoming less coherent — I would shift the model into advisory mode. Instead of letting it drive the shell, I asked for the exact commands to run in sequence. I ran them myself, collected the output, and pasted it back. Human driving, AI navigating. Less elegant but more reliable when the environment was fighting both of us.

![The Three-Day Feedback Loop](/blog/three-day-feedback-loop.png)
*Two variants of the same cycle. Bot-driven when it could fix things itself. Human-driven when the environment got too noisy.*

I used Sonnet 4.6 for most tasks. I escalated to Opus when Sonnet clearly could not break through — usually when the system state was complex and the task required holding a lot in context at once. Those escalations were conscious choices, not defaults.

---

<figure style="float:left; width:210px; margin:0 1.5rem 1.5rem 0; clear:left;">
  <img src="/blog/deep-research-telegram.png" alt="Deep research in Telegram" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Send a voice memo. The bot transcribes it, runs deep research, and publishes a report to GitHub — all in under two minutes.</figcaption>
</figure>

The research system came next. The design was done before any code: flat JSON index (not a vector database — at 500 files the index fits in ~15k tokens, well within Sonnet's 200k window), async callbacks so the gateway doesn't hold open a connection for 10 minutes, OIDC-authenticated GitHub Actions for the notification loop. A research file lands in the repo, Actions rebuilds the index, SSM notifies the running gateway. No static credentials, no open ports.

Then the voice pipeline — which revealed that every voice memo sent since Telegram was connected had been silently ignored.

OpenClaw, when it receives a voice message, downloads the file locally and appends a text annotation to the prompt: \`[media attached: voice_abc.oga]\`. Text. File path. No audio. No transcription. The agent saw a path to a file it couldn't read and said nothing.

![Voice → Wiki](/blog/voice-to-wiki-conceptual.png)
*The idea: voice memo becomes a wiki node. First we had to notice it wasn't happening. [→ Bug 6](#bug-6-voice-memos-were-silently-ignored)*

![Voice to Knowledge: How a Voice Memo Becomes a Wiki Page](/blog/voice-pipeline-horizontal-draft.png)
*Telegram → S3 → Transcribe → markdown → GitHub → knowledge base. $0.024/min. 60–120 seconds. Bot acknowledges in 2.*

Building the actual pipeline was straightforward. What wasn't: deploying it and finding the bot denied it could transcribe audio at all. Moved the capability description to the top of \`AGENTS.md\`. Denied again.

Checked the logs. The model wasn't Sonnet 4.6. It was Amazon Nova 2 Lite — a fast, cheap model optimized for speed, not instruction-following at long context. The model upgrade had been set in the config on the developer's machine, but the change had never been saved to the running config on EC2. Every response since deployment had come from Nova 2 Lite.

![The Model-Class Cliff](/blog/model-class-cliff.png)
*Same workspace files, same instructions. Nova 2 Lite ignored them. Sonnet 4.6 followed them. [→ Bug 7](#bug-7-the-wrong-model-was-running)*

One \`sed\` replacement to swap the model ID. The personality took hold. The protocols started working.

<div style="clear:both;"></div>

![Voice to Knowledge: The Full Pipeline](/blog/voice-to-knowledge-pipeline.png)
*Nine steps. The transcription error lived in step three and didn't surface until step six.*

![Knowledge Layers](/blog/knowledge-layers-conceptual.png)
*Raw sources stay locked. The wiki is the working layer. Agent Governance — the workspace files — runs on every turn.*

---

## How It Runs Now

The system runs on two rhythms.

**Phone loop (daily):** voice memos, questions, \`/research\` commands. The bot transcribes, publishes, replies. Each interaction adds entities, concepts, and relationships to the knowledge graph. The graph grows without anyone managing it.

**Laptop loop (weekly):** pull the latest from both repos — including patches the bot committed directly. Review what changed. Tune workspace files. Edit tool scripts. Run tests. Push.

![Two Loops: How OpenClaw Gets Smarter](/blog/two-loops-development-workflow.png)
*Both loops write to the same repos. The bot commits during the phone loop. The human reviews during the laptop loop.*

![The knowledge-base and deep-research threads in Telegram — the bot acknowledges jobs, fixes itself mid-task, and publishes research reports directly to GitHub](/blog/telegram-desktop.png)
*The two active threads: knowledge-base (left) and deep-research (right). The bot receives a voice memo, transcribes it, runs research, and returns a link to the published report — all without manual steps.*

The "bot committed directly" part required governance that didn't exist until the bot demonstrated it needed it. It diagnosed a bug in its own git retry logic, wrote the fix, committed it — and didn't push. The fix sat on the EC2 instance for days, invisible. The agent had write access to its own infrastructure but no deployment discipline. Two things came out of this: an explicit self-maintenance protocol requiring push after every commit, and a \`make ship\` Makefile target that pushes to GitHub and syncs to EC2 in one command, so there's no gap between "code is on GitHub" and "code is on EC2." [→ Bug 8](#bug-8-the-bot-committed-a-fix-and-didnt-push)

The pipeline has data quality challenges the governance layer is still absorbing. AWS Transcribe heard "Lagos" where "Richmond" was said. The integration pass placed a birthplace there. The response: raw transcripts stay immutable, correction notes sit beside them, derived pages evolve. Git history shows both. It's not a prompting problem — speech-to-text has error rates, and LLM passes amplify them. [→ Bug 13](#bug-13-speech-to-text-errors-propagating-through-the-pipeline)

On every message: six workspace files assembled into a prompt, session history appended from a JSONL file on EBS, Bedrock called via the instance IAM role, response returned. 4GB RAM. No inference on the instance. Prompt caching keeps the Bedrock cost lower than projected — the workspace files get cached after the first message, hitting at $0.30/M instead of $3.00/M.

One memo about kids. One about a housing search. One from a community meeting. The integration pass extracts entities, creates concept pages, infers relationships. Over weeks: "runs trails" becomes a tag, then a value. "Three kids by the river" becomes a relationship chain. Research reports connect to wiki entities. Goals connect back to values inferred from voice memos that weren't thought of as structured data.

The bot learns what you care about because you kept talking.

The system is being built to answer a question that requires knowing the person across all of it.

*What should I do today?*

That's version N. We're on version 1.

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

Every gateway restart — from a config change, a crash, or the systemd health monitor — triggered an automatic WhatsApp reconnect through Baileys, the library OpenClaw uses for WhatsApp's unofficial web protocol. WhatsApp's servers respond to repeated failed authentications with escalating rate limiting. Baileys retries on exponential backoff: 5s, 11s, 21s, 43s, 88s, 171s. Twenty-plus gateway restarts in one afternoon meant hundreds of failed reconnect attempts arriving in waves.

The phone showed: *Can't link new devices at this time.*

The fix was breaking the cycle entirely: stop the service, delete all credential files, wait, then run the pairing command directly on the server terminal — no browser, no SSM WebSocket layer, just a QR code rendered in the terminal. Scan it. Done.

**What this tells you:** A health monitor that restarts a service with aggressive reconnect behavior will eventually trigger rate limiting or bans. The restart loop is the bug, not the reconnect logic. WhatsApp's unofficial client support is inherently fragile — Baileys reverse-engineers a protocol WhatsApp actively discourages. Telegram has none of these problems.

---

### Bug 4: Wrong Config Key for Telegram

The Telegram plugin required a \`botToken\` field in \`openclaw.json\`. The first attempt used \`token\`. OpenClaw's schema validator rejected the config and the service refused to start, logging \`must NOT have additional properties\`. The message is accurate but points at the file level, not the specific field.

**What this tells you:** Check the plugin's documented schema before writing config by hand. The validator error tells you something is wrong; you have to read the actual plugin documentation to find out what.

---

### Bug 5: The API Key That Never Reached the Process

The research tool required a \`PARALLEL_API_KEY\` environment variable. The key had been stored in AWS SSM Parameter Store — but nothing had ever fetched it and written it into the instance's environment. The \`.env\` file on disk had \`PARALLEL_API_KEY=\` since day one.

Fixing the \`.env\` file revealed a second layer: even with the file written correctly and a \`.profile\` source line in place, the gateway service was started by systemd, and systemd user services don't source \`.profile\`. The service had been running with the key unset in its actual process environment the entire time. Interactive SSH sessions saw the key; the running gateway didn't.

The fix: an \`EnvironmentFile=\` directive in the systemd service unit pointing directly at the \`.env\` file. Verification via \`cat /proc/<pid>/environ\` confirmed all three keys were present in the live process after restart.

**What this tells you:** On a Linux server, there are at least three distinct paths for environment variables: SSM Parameter Store, user profile scripts, and systemd's own environment. They don't automatically connect. Systemd is authoritative for processes it manages. Put variables where systemd will actually see them, and verify with \`/proc/<pid>/environ\` rather than assuming.

![The Environment Variable Gap](/blog/env-variable-gap.png)
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

**What this tells you:** When an agent consistently ignores its workspace files, the first thing to check is which model is actually running — not how the instructions are written. Nova 2 Lite and Sonnet 4.6 aren't the same tier; they're different model classes. Nova 2 Lite is optimized for speed and degrades on instruction-following as context length increases. Making the instructions louder doesn't help if the model isn't reading them.

![The Model-Class Cliff](/blog/model-class-cliff.png)
*Same workspace files, same instructions. Nova 2 Lite ignored them. Sonnet 4.6 followed them.*

---

### Bug 8: The Bot Committed a Fix and Didn't Push

The bot diagnosed a real bug in its own infrastructure: \`lib/git.sh\` had no retry loop on push, causing \`status: partial\` failures when GitHub Actions happened to push a concurrent index rebuild at the same moment. It wrote a correct fix, committed it to the local git history on the EC2 instance, and stopped there. No push.

The commit sat on the instance for days — inaccessible from any other environment, not reviewed, not deployed — until a routine \`git pull\` on the development laptop surfaced it.

**What this tells you:** An agent with write access to its own codebase is genuinely useful. An agent with write access and no deployment discipline is a liability — it creates invisible state that only exists on one machine. Two governance artifacts came out of this: an explicit rule in \`CLAUDE.md\` requiring push after every commit (and pull before every read), and a \`make ship\` Makefile target that pushes to GitHub and syncs to EC2 in a single command, so there's no gap between "code is on GitHub" and "code is on EC2."

---

### Bug 9: IAM Permission Prefix Mismatch

\`ingest-voice.sh\` submitted AWS Transcribe jobs with the name prefix \`openclaw-wiki-*\`. The IAM policy attached to the instance role was scoped to allow Transcribe job actions only for resources matching \`openclaw-voice-*\`. These two strings had been written independently and never compared. The first end-to-end run produced an access denied error visible only by reading the Transcribe job status directly — the script logged \`status: failed\` with no explanation.

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

The first deep research reports published to the knowledge base repo rendered on GitHub as 250 lines of nested JSON objects — completely unreadable. \`research-and-publish.sh\` was calling Parallel AI's Task API with \`output_schema: { type: "auto" }\`, which returns structured data. The script had no step to turn that data into readable prose, so it committed the raw JSON directly.

The fix was changing the output mode to \`"text"\`, which returns a markdown narrative report with inline citations. No schema, no downstream formatting step. This also deleted a 36-line Bedrock reformatting stage that had been added to compensate for the raw JSON — a stage with its own silent failure mode that was no longer needed.

**What this tells you:** Pick the right output format at the API level rather than reformatting downstream. One parameter change deleted an entire pipeline stage and the bugs it contained.

---

### Bug 13: Speech-to-Text Errors Propagating Through the Pipeline

AWS Transcribe heard "Lagos" where "Richmond" was said. It misheard a name's spelling. It got an entirely different first name wrong. The voice-to-wiki integration pass — which takes the transcript and asks the model to produce a structured plan of wiki pages to create or update — treated the transcript as ground truth. A birthplace was filed in Lagos. A speculative note was added: *was Ford living in Nigeria at the time?* A profile page was created under the wrong name.

Seven files required manual correction. The raw transcripts stayed untouched — they're the immutable record of what Transcribe heard, not what was said. Correction notes were committed beside them. Derived pages were updated. Git history shows both the original error and the correction.

**What this tells you:** Speech-to-text has irreducible error rates, and LLM passes that treat transcripts as ground truth will amplify those errors into downstream records. The governance response: all transcribed content is a draft. Human review happens before anything is promoted to a canonical page. Corrections commit with provenance notes. The raw transcript stays immutable so the error chain is always traceable.`,
};

export const blogPosts: BlogPost[] = [main];
