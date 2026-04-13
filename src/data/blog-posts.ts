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

---

## What Changed, and Why Now

Three things converged between 2023 and 2026, and their combination is what made frameworks like OpenClaw viable rather than aspirational.

<figure style="float:left; width:260px; margin:0 1.5rem 1.5rem 0; clear:left;">
  <img src="/blog/three-enabling-conditions.png" alt="The three enabling conditions: context windows, instruction following, inference cost" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Three shifts that converged. Any one alone wouldn't have been enough.</figcaption>
</figure>

**Context windows grew by two orders of magnitude.** [Claude Sonnet 4.6](https://www.anthropic.com/claude) has a 200,000-token context window. The workspace files that define my assistant's personality, knowledge, tools, and operating protocols are 6,650 tokens combined — 3% of that window. An early agent running on a 4k-token model couldn't hold its own operating instructions while also tracking a multi-step task. The ratio was wrong. Now it's not.

**Models crossed the instruction-following threshold.** There's a qualitative difference between a model that follows a 500-token system prompt and one that follows a 6,650-token prompt with fidelity across a long conversation. This post has an entire bug entry about this: the system ran [Amazon Nova 2 Lite](https://aws.amazon.com/bedrock/nova/) for days while I thought it was Sonnet, and the tell was that the workspace files were being progressively ignored as conversations grew longer. Both models are capable. Only one of them held the instructions at depth. That's not a marginal difference — it's the difference between a system that works and one that degrades.

**Inference costs dropped enough to make persistence economical.** Running an always-on agent means paying for inference on every message, indefinitely. At 2022 prices, that was a real commitment. At current prices — with prompt caching hitting at $0.30/M tokens instead of $3.00/M — persistence is just a feature, not a business decision. Gartner projects a 90% cost reduction in LLM inference by 2030. The economics are already most of the way there.

Those three things converging meant the agent could stop being a step in someone else's pipeline and start running its own. Instead of a human maintaining the graph and an LLM operating as one node in it, the model now manages a persistent process — assembling context, routing to tools, maintaining memory across sessions, acting between conversations without being asked. The human writes the operating instructions in English. The model figures out what to do with them.

The technical term for what OpenClaw is: a **stateful gateway daemon**. Not a chatbot wrapper. Not a workflow runner. A long-lived process that binds to a port, serializes incoming messages into a queue, and runs a multi-stage reasoning loop on each one.

The old model: the task existed in the human's head. The machine executed steps someone else defined. The new model: the task, its history, and its progress live inside the machine's own persistent state. That shift is structural, not cosmetic.

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

OpenClaw runs as a long-lived daemon — a [systemd](https://www.freedesktop.org/software/systemd/man/systemd.html) service on Linux, a LaunchAgent on macOS. It binds to \`ws://127.0.0.1:18789\` and holds that port for the lifetime of the process. One process owns everything: channel adapters for Telegram/WhatsApp/Slack, the web control UI, the CLI, the cron scheduler, all plugin lifecycle management.

A web server terminates after each response. The gateway doesn't. It's already running when your message arrives. It knows the context from every prior message this session. The right mental model is a message broker, not an HTTP handler — it holds state, it queues work, it emits lifecycle events that everything else hooks into.

### Stage 1: Channel Normalization

When a message arrives, the channel adapter normalizes it before anything else. Telegram comes in through [grammY](https://grammy.dev). WhatsApp through [Baileys](https://github.com/WhiskeySockets/Baileys) — a reverse-engineered client that speaks WhatsApp's unofficial web protocol. Voice memos, images, and text all become the same internal object: sender ID, channel, content type, content, timestamp.

That's why the same workspace files and the same model work across every channel. By the time the message reaches the model, it has no idea which surface it came from.

### Stage 2: Session Lock and Queue

The gateway resolves which session the message belongs to and acquires a session lock before doing anything else. If the session is already processing something, the new message waits. One session, one active task at a time.

This isn't a performance optimization — it's a correctness guarantee. Two concurrent messages triggering competing tool calls that both try to write to MEMORY.md produce corrupted state. The lock makes that structurally impossible. The default timeout for a long-running task is 48 hours. A session can hold a complex, multi-step job across two full days before the system considers it stuck.

### Stage 3: Context Assembly

Before the model sees the message, the gateway assembles the full prompt from four sources.

**Workspace files** — read from disk on every single turn. SOUL.md, USER.md, AGENTS.md, TOOLS.md. Re-injected fresh every message, not held in a conversation object that drifts. The programming surface is the filesystem: edit a file, restart nothing, next message follows the new instructions.

**MEMORY.md and daily notes** — long-term facts extracted from past conversations, plus an append-only daily log in \`memory/YYYY-MM-DD.md\`. Plain Markdown files, indexed into a per-agent [SQLite](https://www.sqlite.org/index.html) database that re-indexes automatically when files change. When a memory is wrong, you edit the file and commit it.

**Session transcript** — a [JSONL](https://jsonlines.org) file on disk. Each turn is one appended line. When the transcript grows large enough, a compaction process summarizes older turns and evicts the raw history — but holds a token reserve back from the context window so compaction can always run without the model running out of room mid-task. The pre-compaction snapshot stays on disk for audit.

**Skill manifests** — only skill *names* go into every prompt. The full SKILL.md file loads only when the model decides it's relevant. The model doesn't pay for expertise it won't use on this turn.

![Context Assembly: the four layers assembled into the model's context window on every message](/blog/context-assembly-layers.png)
*Four sources, rebuilt fresh on every turn. Workspace files re-read from disk. Session JSONL compacted as history grows. Skills loaded only when relevant.*

### Stage 4: Inference and Structured Tool Calling

The assembled context goes to the model — [Claude Sonnet 4.6](https://www.anthropic.com/claude) via [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/), called using the instance [IAM role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html), no credentials stored anywhere.

One thing that matters a lot here: [structured function calling](https://platform.openai.com/docs/guides/function-calling), which OpenAI standardized in June 2023 and [Anthropic followed](https://docs.anthropic.com/en/docs/build-with-claude/tool-use). Before this, agents had to write something like "I need to run the research tool" in free-form text and hope a parser caught it. Now the model emits a structured JSON tool call with schema-validated parameters. The gateway intercepts it, routes it, feeds back a structured result. The schema is enforced at the provider level, not in your code.

OpenClaw also supports [MCP](https://github.com/anthropics/mcp) — Anthropic's November 2024 standard for tool and data connections. MCP servers attach via a bridge called \`mcporter\` and can be added or swapped without restarting the gateway. New tool surfaces don't require gateway changes. Just a new MCP server config.

### Stage 5: The ReAct Loop

If the model requests a tool, the gateway intercepts it before sending any response. It runs the tool — a shell script, an MCP call, a built-in function — captures the output, and feeds it back as a new observation. The model sees the result and decides what to do next: another tool call, or a final answer.

No fixed depth limit on this loop, just the session timeout. If a tool fails, the model sees the error and reasons about it — tries a different approach, or surfaces the failure. It doesn't know how to transcribe audio. It knows a tool exists that does, and it calls the tool. The expertise lives in the tools. The routing judgment lives in the model.

<figure style="float:right; width:270px; margin:0 0 1.5rem 1.5rem; clear:right;">
  <img src="/blog/react-loop.png" alt="The ReAct loop: Reason, Act, Observe — cycling until done" style="width:100%; border-radius:8px;" />
  <figcaption style="font-size:0.75rem; text-align:center; margin-top:0.5rem; color:#888;">Each cycle: decide what to call, call it, read the result. Repeat until there's nothing left to do.</figcaption>
</figure>

### Stage 6: Memory Is a First-Class Runtime Component

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

### Stage 7: The Automation Substrate

Most people think of OpenClaw as a chat assistant. The more complete picture is that it's an automation runtime — a system that can do work without anyone sending a message.

**Hooks** are scripts that bind to gateway lifecycle events. A command invokes, a message phase completes, compaction runs. They're how you extend the gateway's behavior without touching its core code.

**Cron** is a built-in scheduler that persists across restarts. When a job fires, output goes somewhere — a chat thread, a webhook. The heartbeat is a cron entry in HEARTBEAT.md: fires every 30 minutes, wakes the agent, runs through a checklist, acts if anything is due. No human message required.

**Task Flow** is the deeper primitive. Durable, multi-step flows with revisioned state. Task Flows persist across gateway restarts. Steps within a flow can run as direct agent turns, as sub-agents with independent session keys and their own context windows, or as ACP sessions — external coding harnesses with spawn/steer/cancel controls. If a concurrent write conflicts with in-progress state, revision tracking catches it.

The **Webhooks plugin** is where this matters most for the comparison to legacy automation. The plugin binds external systems to Task Flows via authenticated HTTP routes. When Zapier fires a webhook at a traditional LLM API, it creates a stateless request-response cycle: trigger fires, model responds, state evaporates. When Zapier fires a webhook at OpenClaw's Webhooks plugin, it calls \`create_flow\` — which creates a **durable flow entity with revisioned state**, spawns managed tasks that can be inspected and cancelled, and persists independently of any single chat session or gateway restart. The trigger is identical. The downstream architecture is completely different: stateless invocation on one side, durable stateful orchestration on the other.

![The Automation Substrate: five execution tiers from direct response up through durable Task Flow, with Webhooks binding external systems to persistent state](/blog/automation-substrate-tiers.png)
*Same Zapier webhook. Different downstream: stateless request-response vs. durable flow with revisioned state that survives restarts.*

### What It Adds Up To

None of these components are new in isolation. Daemons, queues, state files, schedulers — all existed before 2023. What changed is that they're the defaults now, not infrastructure you assemble yourself. Deploy OpenClaw and you get session serialization, compaction, cron scheduling, sub-agent spawning, and durable flow state out of the box. In the runtime, not in your application code.

When something breaks, you \`ssh\` into the box and read the logs. Open the JSONL session transcript and see exactly what the model was given. Check MEMORY.md and see what it believed. Everything that touched the decision is a file you can read.

That's not a design philosophy. That's what separates something you can operate from something you can only demo.

---

## Where This Started

I had AWS credits left over from a hackathon. They were expiring.

That is the real beginning. Not a grand architectural vision, not a carefully planned AI infrastructure project. Credits running out, and a question: could I turn them into something tangible before they disappeared?

I had been circling OpenClaw for a while. It clearly had serious capability — a persistent agent, workspace-file-driven behavior, tool dispatch, multi-channel messaging — but I had kept putting off diving in. The paradigm was not obvious to me at first glance. How were the workspace files actually used? What did the model see? What constrained the agent's behavior and what didn't? I had enough of a sense of what it could do to know I wanted to try it, but not enough to feel ready to start without understanding it better. So I had been watching it from a distance.

The credits gave me a forcing function. The idea that crystallized was this: what if I deployed OpenClaw on AWS and used that as the basis for a local AWS meetup demo? Something concrete and running, not a slide deck. A working personal AI assistant on AWS infrastructure, explained by someone who had just built it. That framing kept the scope contained and the motivation honest. I was not trying to build the perfect production system. I was trying to build something real, understand it well enough to explain it, and show it to people.

That is where this started.

---

## What It Is

It's a personal AI assistant that lives on a server, talks to you over Telegram, and keeps running whether your laptop is open or not. Within Telegram, you set up a group and topics in these groups. Within each topic, you send a message, it responds, and within each topic, it tracks context. Across all sessions, it accumulates knowledge about you — your projects, goals, relationships, the things you talk about repeatedly. You can send a voice memo and it transcribes and files it. You can ask it to research something and it'll commission a deep research report, publish it to a versioned library, and notify you when it's done.

Four pieces make the stack:

**[OpenClaw](https://github.com/openclaw/openclaw)** — the open-source Node.js gateway. It connects messaging channels to AI models, handles session management and tool dispatch, and gets configured with JSON files and markdown documents called "workspace files."

**AWS EC2** — a [\`t4g.medium\`](https://aws.amazon.com/ec2/instance-types/t4g/) instance, ARM64/Graviton, no public ports. All access goes through [AWS Systems Manager](https://docs.aws.amazon.com/systems-manager/). (The gateway runs as a [systemd](https://www.freedesktop.org/software/systemd/man/systemd.html) service.)

**[Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)** — the model API. The instance calls it directly via its IAM role using Claude Sonnet 4.6. The instance runs no inference — it assembles a prompt and sends it to Bedrock's endpoint.

**Telegram** — the bot automation-friendly interface. A bot created via [@BotFather](https://t.me/BotFather). Forum topics give you separate threads — research, voice notes, general chat — each with isolated history.

![The full stack: Telegram → EC2 → Bedrock, with S3, Transcribe, and GitHub in the loop](/blog/ai-stack-overview-dark-v2.png)
*t4g.medium on Graviton, no public ports, Claude Sonnet 4.6 via Bedrock.*

![OpenClaw System Architecture](/blog/openclaw-system-architecture.png)
*One EC2 instance. One gateway process. All access via SSM. Bedrock called on every message — no inference on the instance itself.*

The thing that makes this interesting isn't the stack — it's how you program it. Six markdown files on disk get injected into the prompt on every message. \`SOUL.md\` is the personality. \`USER.md\` is who you are. \`AGENTS.md\` is the operating manual. \`MEMORY.md\` is curated long-term facts. Together they're about 6,650 tokens — 3% of the model's context window. The bot always knows who it is, who it's talking to, and what its tools are, without you having to re-explain anything.

To change the personality: edit \`SOUL.md\`, run \`make ship\`, send a message. Next response follows the new instructions. No redeployment, no restart, no config change; you write instructions in English & the model follows them.

**Cost:** EC2 runs $26.93/month fixed, with everything else scaling with use (light: ~$40–60/month, moderate: ~$125/month). Unfortunately, the biggest lever is model selection; despite costing 9x more than Nove 2 Lite, Sonnet 4.6 was the cheapest model that could reliably follow a 6,650-token system prompt. So $40 is about as cheap as I could go.

---

## Three Days to Build It

### Learning the Paradigm First

Before I could get my hands dirty, I needed to understand OpenClaw beyond the marketing pitch, e.g. system prompting, workspace file management, tool calling rules, etc.

In short, on every message the gateway assembles a prompt from a handful of markdown files on disk, sends it to the model, and routes any tool calls the model makes back to shell scripts running on the server. That's the loop. Everything else is configuration on top of it.

Anyways, once I felt like I had a rough working model of how OpenClaw operated, things moved quickly.

### Finding the Right Starting Point

I used to work on the AWS SDK Code Examples team, so I knew to go straight to the aws-samples repo and found [this CloudFormation template](https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock). I cloned it, loaded up some leftover free credits I had from a previous event, loaded up $20 in Cursor tokens, and started vibing. Overall, the plan was to deploy first and understand later.

The official [CloudFormation](https://docs.aws.amazon.com/cloudformation/) template handled everything: IAM role, security groups, user-data script installing OpenClaw from npm, systemd service. Stack came up in 8 minutes.

To interact with the deployment on EC2, you had to create a connection via SSM Session Manager, naviate to a URL, and click buttons on a poorly-vibed UI.

For example: My Telegram account was banned thanks to the sins of whoever owned my phone number before, so I submitted a help case and connected it to my WhatsApp by generating a QR code on said Admin UI. In 30 minutes or so, I was chatting with FordClaw; however, the SSM port forwarding kept dropping WebSocket connections and triggering reconnects, and some combination of a glitchy QR generator buton and the way Baileys (the library OpenClaw uses for WhatsApp's unofficial web protocol) did auth retries resulted in my WhatsApp account being temporarily banned. I rage quiet, went to sleep, and awoke to find my Telegram account liberated.

### Telegram: The Better Fit All Along

On Telegram, I created a bot through @BotFather, got a token, dropped it into the config, and restarted the service (no QR codes, no weird pairing flows, no credential state to corrupt, no protocol that WhatsApp was actively trying to hack).

### Voice Memo Ingestion

With Telegram working, the first real feature was voice memo ingestion. The idea: send a voice memo, the bot transcribes it, and passes it to OpenClaw for action (in this case ingesting it into the LLM Wiki knowledge base).

Diving deep for a minute: the pipeline is 4 steps. Telegram delivers the voice message as a [\`.oga\`](https://en.wikipedia.org/wiki/Ogg) file. A shell script stages it to [S3](https://docs.aws.amazon.com/s3/) and submits a job to [AWS Transcribe](https://docs.aws.amazon.com/transcribe/). Transcribe returns a JSON transcript. A second model pass extracts entities and creates or updates wiki pages in the knowledge base repo — people, places, projects, anything worth remembering. The whole thing runs in the background and the bot acknowledges when it's done.

There were a few bugs. The most interesting one: [Amazon Nova 2 Lite](https://aws.amazon.com/bedrock/nova/) — the model that ships with the official CloudFormation template, which is what I had been running the whole time — turned out to be incapable of following OpenClaw's workspace file instructions at any useful depth. The personality didn't hold. Tool protocols were bypassed. When I added transcription capability to \`AGENTS.md\` and the bot denied it could transcribe audio at all, I assumed it was a prompting problem. It wasn't. Nova 2 Lite degrades on instruction-following as context grows. It's optimized for speed, not for holding a 6,650-token system prompt across a real conversation.

One \`sed\` command to swap the model ID. Restarted the service. The personality took hold on the next message. [→ Bug 7](#bug-7-the-wrong-model-was-running)

### The Refactor

With Sonnet 4.6 running, it became obvious the tool scripts were rough. Even after escalating to Opus within [Cursor](https://cursor.com) IDE, I found my context windows for updates were struggling with high-confidence updates and testing. So I halted dev and spent 4 hours and roughly $45 in Opus 4.6 Thinking tokens refactoring the whole thing to add 200+ integration and unit tests.

This helped me tightened the tool layer, made execution more deterministic, and gave me way more confidence in making updates. Side benefit: it also significantly cleaned up how state and filesystem interactions were handled.

From there, the system really started to open up around two core intake flows.

**Research** is designed for depth. It takes a prompt or topic, expands it outward using external sources, and synthesizes results into a structured markdown report that lands in a versioned library. The index is a flat JSON file — not a vector database — which at 500 entries fits in ~15k tokens and stays well within Sonnet's context window. Reports are published via async callbacks so the gateway never holds a connection open for 10 minutes waiting; a [GitHub Actions](https://docs.github.com/en/actions) workflow rebuilds the index and SSM-notifies the running gateway when it's done. No static credentials, no open ports. Over time this becomes a compounding asset — not just a chat history you forget exists.

**Knowledge base ingestion** is more personal and continuous. Voice memos, notes, day-to-day inputs — they get transformed into structured knowledge. Heavily inspired by LLM Wiki: raw inputs compiled into organized, navigable documents that evolve over time. Instead of dumping text into a folder, the system incrementally builds something closer to a living, queryable map of your own thinking.

Both flows feed the same underlying knowledge base, but from opposite directions. One pulls in external intelligence and distills it. The other captures internal context and refines it. Together, they start to form something that actually feels like memory instead of just storage.

### Emergent Pattern #1: Skills as Operational Memory

One pattern repeated throughout the build: whenever I figured out how to do something — how to run a deployment step, how to debug a [systemd](https://www.freedesktop.org/software/systemd/man/systemd.html) issue, how to structure a [Bats](https://github.com/bats-core/bats-core) test, how to handle the SSM environment correctly — I would stop and ask the AI to turn that into a reusable skill.

TLDR; forget a doc or code comment! In 2026 I put everything in structured, loadable instruction sets that can be invoked in future session without having to rediscover the same workflow from scratch. This saves on tokens and reduces inference entropy.

![Without Skills vs. With Skills](/blog/with-skills.png)
*Same tokens, deeper thinking. Without skills, the AI explores broadly and fails often. With skills, the early branches are pre-solved.*

I'm not kidding that this skills-first strategy has became a major part of how I work. Every solved problem has a post-hook of "what skill would you update based on what you learned in this session?". This creates a flywheel where each session starts from a richer operational baseline than the one before.

### Emergent Pattern #2:The Bot's Self-Healing Instinct

Something I noticed early and kept noticing: the bot was unusually ready to fix itself.

Behaviorally: it kept working a thread when something broke. It absorbed errors, attempted repairs, and kept going without stopping to ask permission. It felt less like directing a tool and more like debugging alongside something with its own momentum.

The persona layer mattered more than I expected. I set it to talk like a Gen Z teenager — direct, not verbose, a little rude. Less ceremony, more momentum. Interface tone turned out to affect the ergonomics of actually using the system.

What the bot was not: self-deploying. It would fix something, commit it, and stop there. The push-after-every-commit protocol had to be baked into the operational instructions before it held. [→ Bug 8](#bug-8-the-bot-committed-a-fix-and-didnt-push)

### Emergent Pattern #3: The Working Loop

For most of the three days, my process was a simple feedback loop: something broke, I read the error, I fed it to the model in [Cursor](https://cursor.com), the model produced a fix or a diagnostic step, I ran it, I fed the output back. Sometimes the error came from the AWS logs directly. Sometimes I copied Telegram output into Cursor. The channel did not matter — what mattered was that the loop was fast.

When the SSM session state got too noisy — terminal memory overloading Cursor's context, the session becoming less coherent — I would shift the model into advisory mode. Instead of letting it drive the shell, I asked for the exact commands to run in sequence. I ran them myself, collected the output, and pasted it back. Human driving, AI navigating. Less elegant but more reliable when the environment was fighting both of us.

![The Three-Day Feedback Loop](/blog/three-day-feedback-loop.png)
*Two variants of the same cycle. Bot-driven when it could fix things itself. Human-driven when the environment got too noisy.*

I used Sonnet 4.6 for most tasks. I escalated to Opus when Sonnet clearly could not break through — usually when the system state was complex and the task required holding a lot in context at once. Those escalations were conscious choices, not defaults.

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

Every gateway restart — from a config change, a crash, or the systemd health monitor — triggered an automatic WhatsApp reconnect through [Baileys](https://github.com/WhiskeySockets/Baileys), the library OpenClaw uses for WhatsApp's unofficial web protocol. WhatsApp's servers respond to repeated failed authentications with escalating rate limiting. Baileys retries on exponential backoff: 5s, 11s, 21s, 43s, 88s, 171s. Twenty-plus gateway restarts in one afternoon meant hundreds of failed reconnect attempts arriving in waves.

The phone showed: *Can't link new devices at this time.*

The fix was breaking the cycle entirely: stop the service, delete all credential files, wait, then run the pairing command directly on the server terminal — no browser, no SSM WebSocket layer, just a QR code rendered in the terminal. Scan it. Done.

**What this tells you:** A health monitor that restarts a service with aggressive reconnect behavior will eventually trigger rate limiting or bans. The restart loop is the bug, not the reconnect logic. WhatsApp's unofficial client support is inherently fragile — [Baileys](https://github.com/WhiskeySockets/Baileys) reverse-engineers a protocol WhatsApp actively discourages. Telegram has none of these problems.

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
