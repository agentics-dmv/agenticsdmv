export interface BlogPost {
  slug: string;
  part: number;
  title: string;
  subtitle: string;
  date: string;
  content: string;
}

const part1: BlogPost = {
  slug: "you-wanted-a-24-7-ai-assistant",
  part: 1,
  title: "You Wanted a 24/7 AI Assistant. Here's What Broke First.",
  subtitle: "The story of building a personal AI assistant on AWS — what worked, what didn't, and why the failures teach more than the working.",
  date: "2026-04-11",
  content: `# You Wanted a 24/7 AI Assistant. Here's What Broke First.

*Part 1 of 3. The story of building a personal AI assistant on AWS — what worked, what didn't, and why the failures teach more than the working.*

---

I had AWS credits sitting around from a hackathon. Unused. Expiring. And I had this half-formed idea that kept coming back: what if I could use them to build something with OpenClaw and turn it into a demo for the local AWS meetup — the kind of thing where you stand in front of a room and show people how a personal AI assistant actually runs on their cloud provider, not just in a blog post? Part curiosity, part community talk, part "these credits are going to waste."

The problem was I didn't really understand OpenClaw yet.

It had 265,000 GitHub stars. The Mac Mini unboxing videos were everywhere — the canonical hardware for running it locally, cheap enough to leave in a closet. I didn't have the cash for a Mac Mini, but that wasn't the real blocker. The real blocker was that the paradigm itself wasn't obvious to me. What exactly is a "personal AI assistant"? How does the gateway work? What's the agent doing on each message? What are these workspace files? I had delayed touching it for weeks because every time I looked, I felt like I was missing something fundamental.

What I actually wanted wasn't an AI assistant anyway.
Not in the sense of a thing that answers questions and summarizes articles — I have Google for that, and it's free. What I wanted was something that could start connecting the parts of my life that have no reason to talk to each other: work, community organizing, professional projects, the conversations I have and immediately forget, the things I read and never act on. All of it lives in separate silos — separate apps, separate contexts, a different version of me in each one. No thread between them.
I'm not worried about the privacy implications. I want the dots to find each other.

Once I felt like I finally had a rough handle on the core technology and the operating model — what the gateway does, how workspace files get injected, how tools work — the path forward got concrete fast.

I didn't start from scratch. I used to work on the team that maintained AWS samples for the SDK, so I already knew the \`aws-samples\` org was actively maintained, well-structured, and covered a huge number of use cases. That trust mattered. When [Brooke Jamieson](https://www.linkedin.com/posts/brookejamieson_aws-openclaw-lightsail-activity-7435419577406263296-Fu63), an [AWS Machine Learning Hero](https://dev.to/aws-heroes/how-i-became-an-aws-machine-learning-hero-5e75) turned Senior Developer Advocate at AWS, wrote *"You Don't Need a Mac Mini to Run OpenClaw"* — showing she'd put it on Lightsail in 15 minutes for $24 a month — someone in the comments linked to [\`aws-samples/sample-OpenClaw-on-AWS-with-Bedrock\`](https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock). An official CloudFormation template with Bedrock integration already wired in. That was not random repo-hunting. It was exactly where I expected something like this to live.

---

## Cursor, Twenty Dollars, and a CloudFormation Stack

I opened Cursor, loaded twenty dollars in credits, cloned the sample repo, and told the AI to help me deploy it.

That's the honest version. I didn't sit down with the CloudFormation template and reverse-engineer every resource definition before touching a terminal. I used AI from the first minute. The repo had a one-click-style deployment path available, but I didn't use it. Instead I took the more old-school route — running the CloudFormation commands myself, but with the AI reading the template, answering my questions, and catching my mistakes in real time. As I went, I wrote \`make\` targets so the steps wouldn't live in my bash history: \`make deploy-setup\` for the initial clone on the instance, \`make deploy\` for syncing workspace and tool files, \`make ssh\` for the SSM tunnel. Repeatability layered in as I learned.

The AWS bill right now shows $0 — free credits absorbing the real spend. The actual cost, reconstructed from CloudWatch logs by a bash script because the billing console is useless when credits are live, runs about $40 a month at light use and $125 at the usage levels this series documents. The CloudFormation stack — a t4g.medium on Graviton, 30 gigs of EBS, no public ports, Claude Sonnet 4.6 via Bedrock — stood up in eight minutes, the gateway started itself, and nine plugins loaded without a single config change.
That part was easy.

![Ford's AI Assistant Stack](/blog/ai-stack-overview-dark-v2.png)
*The destination. Getting here took longer than the diagram suggests.*

The stack is simple by design. One EC2 instance — ARM64, cheap, quiet — runs a Node.js gateway that holds a connection to Telegram and calls Bedrock on every message. No database. No load balancer. No NAT gateway. The CloudFormation template asked a few questions and built the whole thing: instance role, security groups, a user data script that pulled OpenClaw from npm and started the gateway as a systemd service.

The only real friction before WhatsApp was the SSM Session Manager plugin.

AWS Systems Manager is how you reach the instance without SSH — no key pairs, no port 22, no public exposure. But the local Mac needed a plugin binary, and every normal install path failed. Homebrew failed. The \`sudo installer\` command failed because there was no interactive sudo session. The \`.pkg\` sat there, correctly downloaded, completely useless. The workaround was to crack it open manually: \`xar -xf\` to unpack the archive, \`cpio\` to pull out the payload, then copy the binary to \`/usr/local/bin\` by hand. First attempt used the ARM64 build. The Mac needed x86_64. Extract, copy, try again.

That was the hard part of the infrastructure setup. Ten minutes. One wrong CPU architecture on first try.

---

## First Contact

After the stack was up, I finally got to see the thing.

I tunneled through SSM, port-forwarded to the OpenClaw Control UI, and for the first time was looking at the system running — not logs, not CloudFormation outputs, but the actual UI. It showed the gateway status, connected plugins, available channels. There was a QR code flow for linking WhatsApp. I scanned it.

It worked.

The first message came through. The bot replied. I had something real, visible, and interactive running in AWS. Not infrastructure on paper — a conversation.

Then WhatsApp closed the door.

---

## The Afternoon That Didn't Work

Here is some context that matters: the reason I was on WhatsApp at all was that my Telegram phone number had been banned. Not for anything I did — whatever the previous owner of that number had done, Telegram still remembered. I had an open help case. I was waiting. WhatsApp was the channel that was available.

The initial pairing through the UI had worked. But WhatsApp credentials don't last forever on an unofficial integration, and when a re-pair was needed, doing it remotely through the Control UI produced a very different experience.

The first problem was the WebSocket connections.

SSM port forwarding — the only way in without opening a public port — drops WebSocket connections constantly, and the OpenClaw Control UI depends on WebSockets for everything: QR generation, status updates, the pairing flow. Every dropped connection was a reset. The QR code appeared, flickered, went gray. The browser console logged \`code=1005\`, then \`code=1006\`, then 1005 again, cycling. The QR generator was clicked five times. Zero successful scans.

The second problem was the Cloudflare tunnel.

The obvious move after twenty minutes of WebSocket drops: bypass SSM entirely with a \`cloudflared\` quick tunnel — a stable HTTPS URL, no port forwarding, no resets. That decision required touching \`openclaw.json\`, and touching \`openclaw.json\` is where things went wrong. The first change was setting \`gateway.controlUi.pairingRequired = false\`. Sounds right. Not in the schema. The service crashed on startup. The error was buried seven lines into the log. Three restarts to find it.

The third problem was the config.

Without SSH, the only way to edit \`openclaw.json\` was SSM RunCommand — Python one-liners, JSON escaped into shell commands, sent over an API with a 10-second round trip and no interactive feedback. One wrong key name and the service fails on the next start. OpenClaw validates its config schema on every startup. An unrecognized key is fatal. By the end of the afternoon, OpenClaw had auto-created four backup files. The configuration had been restored from \`.bak\` twice.

The fourth problem was the health monitor.

Every time the gateway restarted — and it restarted often — the health monitor saw WhatsApp in a stopped state and triggered a reconnect. WhatsApp reconnect with stale credentials means a 401. The [Baileys library](https://github.com/WhiskeySockets/Baileys), which OpenClaw uses to speak WhatsApp's web protocol, retried automatically: after 5 seconds, then 11, 21, 43, 88, 171. With more than twenty restarts in a single afternoon, that was hundreds of failed authentication attempts against WhatsApp's servers in a few hours.

WhatsApp noticed.

![The WhatsApp Death Spiral](/blog/whatsapp-death-spiral.png)
*How a health monitor turned twenty gateway restarts into an account ban.*

The fifth problem was the rate limit.

The phone said: *Can't link new devices at this time.*

That's WhatsApp's polite message for "we've stopped accepting requests from you." The only fix was to stop the service, delete every file under \`~/.openclaw/credentials/whatsapp/\`, and wait for the limit to expire. There was no sixth problem — WhatsApp had just closed the door and wasn't saying when it would open.

The lesson — not a surprise in retrospect — is that OpenClaw's Control UI is built for local access. The gateway listens on localhost. The QR flow expects a stable browser on the same machine. SSM port forwarding is asynchronous and drops connections, which makes it exactly wrong for anything that needs a persistent WebSocket. Fighting that architecture — trying to expose the UI through a tunnel, trying to make a remote flow behave like a local one — produced every failure. The CLI pairing flow (\`openclaw channels login --channel whatsapp\`, run directly on the server) connects to WhatsApp's servers with no intermediary. When I finally tried it, it worked immediately.

The platform has a design. Work with it.

---

## Now What

WhatsApp stayed linked for a few weeks after the CLI pairing. Then it didn't.

The health monitor — the same one that burned through hundreds of auth retries in an afternoon — started hitting 403 errors on reconnect. Every five minutes. Around the clock. The logs filled up. It was loud, wasteful, and the wrong way to run WhatsApp at all: the Baileys library that OpenClaw uses to connect is unofficial, it reverse-engineers the WhatsApp Web protocol, and [WhatsApp's servers are actively hostile to unofficial clients](https://faq.whatsapp.com/1104252539877498/). They throttle, rate-limit, and eventually stop responding.

I was stuck. WhatsApp was dead. Telegram was the obvious alternative, but my number was banned there too. I was genuinely unsure what came next.

Then the Telegram help case resolved.

---

## Ten Minutes and a Teenager

The Telegram plugin was already installed in the CloudFormation-deployed config — just no credentials. The first attempt used \`token\` as the config key. OpenClaw's schema validator responded immediately: \`must NOT have additional properties\`. The correct key is \`botToken\`. One difference: a lowercase \`b\` and the word \`Token\` attached.

Change the key. Add the value from \`@BotFather\`. Restart.

\`\`\`
[telegram] [default] starting provider (@ford_clawbot)
\`\`\`

That was it. BotFather was a genuine surprise — the whole flow was clean, developer-friendly, and obviously built for this kind of integration. Create a bot, get a token, paste the token, restart. No QR codes, no linking flows, no stale credentials. Where WhatsApp had cost an afternoon and produced a ban, Telegram took ten minutes and just worked. I was glad the process had forced me here.

The first real conversations happened that night. And they happened through a personality.

I had written a \`SOUL.md\` file — one of the workspace files that gets injected into the prompt on every turn. It told the model to talk like a Gen Z teenager who finds your question mildly beneath them but answers it correctly anyway. Sharp. Lowercase. Slightly unimpressed. Efficient.

The examples in the file are more instructive than the rules:

> ok but this is actually easy. do this: ...
>
> you're kinda overcomplicating it. just: ...
>
> wait... no. do it like this: ...

This is not a profound technical innovation. But it changed the ergonomics of using the system. The tone was chill, direct, not too verbose, and surprisingly effective. The bot felt like someone with opinions rather than a customer service form. For the amount of time I was about to spend talking to this thing, that mattered.

---

*Continue to [Part 2: It Was Online. It Was Useless.](/blog/it-was-online-it-was-useless)*`,
};

const part2: BlogPost = {
  slug: "it-was-online-it-was-useless",
  part: 2,
  title: "It Was Online. It Was Useless.",
  subtitle: "The bot was running. Now it needed to know things, remember things, and actually do what it was told.",
  date: "2026-04-11",
  content: `# It Was Online. It Was Useless.

*Part 2 of 3. The bot was running. Now it needed to know things, remember things, and actually do what it was told.*

---

The bot was running.
It answered questions, held a conversation, and if you asked it something simple — the weather in Richmond, how to fix a bash script — it was fine, capable, even a little impressive.
It remembered nothing.

Ask "what do we have on RAG?" and it had no idea. Ask about a conversation from three days ago and it had no idea. Send it a voice memo and it said — politely, confidently — that it couldn't process audio and maybe try Rev or Otter.

This is the problem with a 24/7 assistant that starts fresh every morning. The goal wasn't a faster search engine — it was something that could start connecting the parts of a life that have no reason to share context: work, community organizing, professional projects, things you care about and have never written down in one place. That takes memory. Memory was what was missing.

---

## No Memory

OpenClaw's session history is ephemeral by design. Every day at 4 AM, the gateway resets: the JSONL conversation file is archived, a new one starts, and the context window is clean. The model has no memory of yesterday unless you build it one.

The first fix was \`MEMORY.md\` — a hand-curated markdown file of long-term facts: who Ford is, what the system does, key preferences, lessons from past sessions. About 1,000 tokens. Enough for basics.

The second problem was deeper. What do you do when you've run deep research on a topic — thirty minutes of web synthesis on affordable housing in Richmond — and you want to find it six weeks from now? \`MEMORY.md\` can't hold 500 research reports. The context window can, technically — Claude Sonnet 4.6 has a [200,000-token window](https://www.anthropic.com/claude/sonnet) — but loading the full corpus on every message is how you make the assistant slow, expensive, and eventually incoherent as the context fills and the gateway starts compacting conversation history to make room.

The answer was an index. Not a vector database. Not embeddings. A flat JSON file.

At 500 research documents, the index is about 15,000 tokens. Load it on demand, let the model reason over it, return the matching reports. The architecture spec for this — written before any code — named the alternative the "Token Crusher": the temptation to auto-load everything, which would make the context cost of every message roughly equal to reading a novel. The architecture explicitly prevents it. Research files are cold storage. The index is the card catalog. The agent finds the entry, fetches the document, reads it.

![Knowledge layers: Agent Governance → LLM Wiki → Raw Sources](/blog/knowledge-layers-conceptual.png)
*Raw sources stay locked. The wiki is the working layer. Agent Governance — the workspace files — is what runs on every turn.*

Wiring the GitHub side of this took one session without opening the AWS console: an OIDC provider for GitHub Actions to assume an AWS role, a trust policy scoped tightly to pushes from the research repo's main branch, a workflow that rebuilds the index on every markdown push and sends a Telegram notification back to the instance via SSM. The whole loop — research published, index rebuilt, notification delivered — runs in two to ten minutes. The bot handles other messages while it waits.

---

## The Keys That Weren't There

Building the research pipeline exposed a quiet failure that had been there since the beginning.

The first test ran. The script called Parallel AI's Task API. Nothing came back. The \`.env\` file on the instance had one line for the research key:

\`\`\`
PARALLEL_API_KEY=
\`\`\`

Empty. The key had been stored in AWS SSM Parameter Store months earlier. Nothing had ever pulled it into the instance's environment. The gateway had been running without it the entire time, silently failing any research call that tried to use it.

SSM Parameter Store had accumulated enough friction to replace: one API call per key, no JSON, awkward quoting through a shell that adds its own quoting. Secrets Manager was already in use for the GitHub PAT. The right move was to consolidate — one secret at \`openclaw/env\`, a JSON blob with three keys, one API call to read all of them.

Then came the real gap.

The \`.env\` file was correct. The \`.profile\` source line was in place. Interactive sessions would pick up the keys automatically. But the gateway runs as a systemd user service, and systemd doesn't source \`.profile\`. It uses its own flat environment, initialized at service start, reading from wherever the unit file points.

The live gateway process had been running with \`PARALLEL_API_KEY\` unset the entire time.

One line added to the service file:

\`\`\`ini
EnvironmentFile=/home/ubuntu/.openclaw/.env
\`\`\`

Daemon reload. Restart. Verified directly from \`/proc/<pid>/environ\` — all three keys present in the live process. The env file and the service had been disconnected from each other since day one.

![The Environment Variable Gap](/blog/env-variable-gap.png)
*Three paths for API keys. Only one reached the running gateway process.*

---

## What OpenClaw Does With Voice Memos

Voice memos are how you capture things without stopping — walking to a meeting, in the car, picking up kids. Not keyboard input. The thought at the moment it occurs, in the context it occurred in. For a system trying to build a picture of a life across all its separate domains, that input channel matters more than any other.

The voice memo pipeline started with a question: what does OpenClaw actually do when a voice memo arrives?

The source code gave an answer nobody expected.

When Telegram sends a voice file, the gateway downloads it to \`~/.openclaw/media/inbound/\` and appends an annotation to the prompt the LLM sees:

\`\`\`
[media attached: media://inbound/voice_abc.oga (audio/ogg) | /home/ubuntu/.openclaw/media/inbound/voice_abc.oga]
\`\`\`

That's it. The LLM receives a text annotation with a local file path. It does not receive the audio. There is no native transcription. Claude sees the annotation, knows a voice memo was sent, and — without custom tooling — has nothing it can do with it.

Every voice memo since Telegram was enabled had been silently ignored. The audio sat on disk. The annotation sat in the prompt. The model said something polite and moved on.

![Voice → Wiki](/blog/voice-to-wiki-conceptual.png)
*The idea. A voice memo becomes a wiki node. Nothing about the implementation was this clean.*

The fix was a pipeline: upload to S3, start an AWS Transcribe job, poll until done, download the transcript from the job's presigned URL, format it as a structured markdown note with YAML frontmatter, push to the research repo. [AWS Transcribe](https://aws.amazon.com/transcribe/pricing/) costs $0.024 per minute — standard English, \`us-east-1\`. A 2-minute voice memo is about five cents. There's a [15-second billing minimum](https://aws.amazon.com/transcribe/pricing/) per job, so short clips cost more per second than long ones, but at a few memos a day the monthly total stays under $3.

The pipeline runs in the background. The bot acknowledges immediately — *got it, transcribing...* — because Transcribe takes 60 to 120 seconds and two minutes of silence reads as failure. The acknowledgment is free and costs nothing to include.

![Voice to Knowledge: How a Voice Memo Becomes a Wiki Page](/blog/voice-pipeline-horizontal-draft.png)
*Voice input to GitHub markdown — the full path, end to end.*

The workspace files got new sections: \`TOOLS.md\` with the command signature and output schema, \`AGENTS.md\` with the trigger condition and the four-step protocol. The trigger is specific: any message containing \`[media attached:\` with \`(audio/\` in the MIME type. Everything else passes through unchanged.

The deploy script ran. \`WORKSPACE_SYNCED\`. \`TOOLS_SYNCED\`. \`DEPLOY_DONE\`.

---

## The Wrong Model

Then Ford tested it.

> *"you really can't transcribe voice memos?"*
>
> *right — i don't have built-in transcription. you'll need to use a third-party service (rev, otter, etc.) or app to convert the audio to text first.*

Confident. Wrong. The agent denied a capability it had been explicitly given, in the exact helpful register that makes wrong answers land hardest.

The first hypothesis: wrong content. An explicit "Capability Corrections" block was added to \`AGENTS.md\` with direct language: *"Your base training tells you that you cannot process audio or transcribe voice memos. That is wrong in this deployment."* The agent denied it again.

The second hypothesis: wrong placement. The block was moved to the top of the file, before Core Rules, before everything else. The agent denied it again.

Something was fundamentally overriding the workspace files — not a wording problem, not a placement problem. The next step was to stop guessing and check the logs.

\`\`\`
[gateway] agent model: amazon-bedrock/global.amazon.nova-2-lite-v1:0
\`\`\`

Nova 2 Lite. Not Claude Sonnet 4.6.

The model upgrade from Phase 2 — the one that required getting the right inference profile ID, adding marketplace permissions to the IAM role, submitting the Anthropic use case form — had never been saved into the config that was currently running. The config the gateway read every day still pointed at the default from the CloudFormation template. Every session since deployment had been Nova 2 Lite.

The instructions were there. The capability correction was there. The tool description was there. The personality spec was there.
Nova 2 Lite read all of it and answered from its base training anyway.

This is what Nova 2 Lite does. [AWS's own documentation](https://docs.aws.amazon.com/nova/latest/nova2-userguide/advanced-prompting-techniques.html) says it directly: *"Its performance (including system prompt adherence and tool use) can decline slightly as the context size increases."* With 6,650 tokens of workspace files injected on every turn — personality, tools, protocols, operating rules — "slightly" isn't the right word for what happened. Nova 2 Lite is optimized for speed and cost, and AWS recommends placing long-form data at the top of prompts and instructions at the very end to maintain focus. It's excellent for simple lookups and batch enrichment. It is the wrong tool for an assistant that must hold character and follow structured operating rules across a rich system prompt at every turn. Claude Sonnet 4.6 was [specifically designed for high-fidelity instruction following at long context](https://www.anthropic.com/news/claude-sonnet-4-6). That's not a tier difference — it's a model-class difference. No prompt engineering closes it.

The model setting lives at \`agents.defaults.model.primary\` in \`openclaw.json\`. The first attempt to update it used \`jq\` through SSM RunCommand and guessed the wrong key name. The schema validator caught it immediately on restart:

\`\`\`
Config invalid
Problem:
  - <root>: Unrecognized key: "agent"
Run: openclaw doctor --fix
\`\`\`

Restart loop. Restore from backup.

The second attempt used \`sed\`:

\`\`\`bash
sed -i "s|amazon-bedrock/global.amazon.nova-2-lite-v1:0|amazon-bedrock/us.anthropic.claude-sonnet-4-6|" openclaw.json
\`\`\`

One string replacement. No JSON parsing. No quoting complexity.

\`\`\`
[gateway] agent model: amazon-bedrock/us.anthropic.claude-sonnet-4-6
[gateway] ready (9 plugins, 1.9s)
\`\`\`

The personality took hold. The protocols started working. The capabilities unlocked.

![The Model-Class Cliff](/blog/model-class-cliff.png)
*Same instructions, different model class. Nova 2 Lite ignored the workspace files. Sonnet 4.6 followed them.*

The lesson is not "use a better model." It's more specific: when the agent ignores context, check what model is actually running before touching the instructions. A model that can't follow a system prompt will fail no matter how clear the instructions are. Making them louder doesn't help. Checking the logs does.

---

## The Refactor That Cost Thirty Dollars

The model switch fixed the behavior. It also made a different problem visible.

With Sonnet 4.6 running, the system was capable enough to extend — but the codebase underneath it wasn't. The tool scripts were long, tangled, hard to test in isolation. The workspace files had grown organically. The deployment pipeline had accumulated assumptions that were never written down. Every change I made through Cursor required the model to hold the full context of how everything connected, and the bigger the context load, the more expensive and error-prone the edits became.

I ended up doing a full modularization refactor. Not cosmetic cleanup — a serious restructuring to make the scripts shorter, the interfaces cleaner, and the test surface reachable. The commit history tells the story: dozens of commits over roughly a day, each one a small structural change followed by running the tests, followed by fixing whatever broke. I wrote hundreds of tests — both unit and integration — and spent about thirty dollars in Cursor tokens working through the whole thing.

The reason for the refactor was partly about code quality. But the real driver was model economics. I wanted to use Sonnet 4.6 for most of my development work. Not Opus. Sonnet is faster, cheaper, and good enough for the majority of tasks — but only if the codebase is simple enough for it to reason about without exceeding its effective context window. The architecture had to become more modular, more explicit, more decomposed, so that each change was small enough for a cheaper model to handle well. When something truly required deep multi-step reasoning, I'd escalate to Opus. But those moments should be rare, not the default.

The result was a much better system. One I could extend without constantly overloading the AI with overly complex changes.

---

## Skills as Operational Memory

Throughout this whole process — the deployment, the WhatsApp debugging, the config editing, the model switch, now the refactor — I kept stopping to do something that felt tangential but turned out to be one of the most important patterns in the build.

Every time I figured out how to do something, I asked the AI to write a skill for it.

A skill is a reusable instruction file — markdown, stored locally, loaded into Cursor's context on demand. After I learned how to deploy through SSM, I had the AI write an \`openclaw-deploy\` skill that captured every step. After the WhatsApp nightmare, an \`openclaw-whatsapp\` skill documenting the CLI linking flow, credential cleanup, and rate limit recovery. After writing the personality, an \`openclaw-personality\` skill with the \`SOUL.md\` writing guide and examples. Seven skills total by the end.

| Skill | What it captures |
|-------|-----------------|
| \`openclaw-deploy\` | CloudFormation deployment, SSM plugin install, teardown |
| \`openclaw-operate\` | start/stop/status/logs, Makefile commands, common failures |
| \`openclaw-whatsapp\` | CLI linking flow, credential cleanup, rate limit recovery |
| \`openclaw-customize\` | Config editing, models, channels, plugins, heartbeat |
| \`openclaw-personality\` | SOUL.md writing guide, templates, AGENTS.md separation |
| \`openclaw-parallel-research\` | Parallel AI setup, script deployment, processor tiers |
| \`openclaw-deploy-changes\` | Git-based deploy pipeline, workspace/tools sync |

These don't run on the bot. They're for the human-AI pair working in Cursor. The point is that next week, or next month, when I need to do something I've done before, the skill file means the AI doesn't start from scratch. It picks up where the last session left off. No rediscovery. No "wait, how did we fix that last time?"

This was not incidental. It became a major way I worked. Build something, capture it, move on. The system compounds instead of resetting.

![Without skills vs. with skills](/blog/with-skills.png)
*Same tokens, deeper thinking. Without skills, the AI explores broadly and fails often. With skills, the early branches are pre-solved and the reasoning goes further on the same budget.*

---

## What the Bot Was Willing to Do

One thing that struck me immediately, once Sonnet 4.6 was running and the personality was active: the bot was unusually ready to fix things itself.

I don't want to make architectural claims I can't prove about why this is. But as a user, the behavior was obvious. When something broke, the bot didn't just report the error and wait. It would reason through the failure, propose a fix, and often apply it — patching a script, adjusting a config value, retrying a command sequence. It would keep working a thread. Absorb errors. Try again from a different angle. That willingness to persist became part of the feel of the whole system.

But it couldn't be fully trusted.

Even though the bot was good at fixing things, it still needed operational scaffolding. I gave it a GitHub token so it could push changes. That mattered — without push access, its fixes lived on the instance and nowhere else. But having the token wasn't enough. The bot would fix something, commit it locally, and not push. Or it would push to a branch nobody was watching. I had to create skills and explicit instructions in \`CLAUDE.md\` — the bot's own onboarding document — to reinforce the operational discipline: always push, always pull the knowledge base before reading it, never leave uncommitted changes silently.

The pattern was powerful, but it still needed guardrails.

![The research pipeline on mobile](/blog/deep-research-telegram.png)
*From the phone: voice memo sent, transcribed, deep research kicked off, report published to GitHub — under four minutes.*

![The research pipeline on desktop](/blog/telegram-desktop.png)
*The same thread from the laptop. The full conversation context makes the pipeline legible: voice in, transcript out, research running, report linked.*

---

*Continue to [Part 3: The Pipeline Worked. The Data Was Wrong.](/blog/the-pipeline-worked-the-data-was-wrong)*

*[← Part 1: You Wanted a 24/7 AI Assistant. Here's What Broke First.](/blog/you-wanted-a-24-7-ai-assistant)*`,
};

const part3: BlogPost = {
  slug: "the-pipeline-worked-the-data-was-wrong",
  part: 3,
  title: "The Pipeline Worked. The Data Was Wrong.",
  subtitle: "The pipeline worked. The data was wrong. The bot fixed its own code and didn't push it. Three days of catching errors and feeding them back. Then the graph started growing.",
  date: "2026-04-11",
  content: `# The Pipeline Worked. The Data Was Wrong.

*Part 3 of 3. The pipeline worked. The data was wrong. The bot fixed its own code and didn't push it. Three days of catching errors and feeding them back. Then the graph started growing.*

---

The pipeline worked.
Ford dictated a voice memo about his three kids — their ages, their hobbies, the youngest one's obsession with unicorns and scooters — and within three minutes the bot had created five structured wiki pages, committed them to GitHub, and replied with a link.
One of the pages said his son was born in Lagos, Nigeria.

![Voice to Knowledge: The Full Pipeline](/blog/voice-to-knowledge-pipeline.png)
*Nine steps. The transcription error lived in step three and didn't surface until step six.*

AWS Transcribe heard "Lagos" where Ford said something about Richmond. The LLM integration pass — \`wiki-integrate.sh\`, which takes the fresh transcript and the current wiki index and asks Sonnet 4.6 to produce a JSON plan of pages to create or update — had no way to know the transcription was wrong. It saw "Lagos." It placed the birthplace there. It added a note: *speculative: was Ford living in Nigeria at the time of the birth?*

Correct reasoning. Bad data.

The name was wrong too. The transcript rendered "Thadeus" as "Thaddeus" — double-d — and every downstream page propagated the misspelling. A separate issue from a different session: the personal profile page had been created as \`personal/will-prior.md\`. Ford's name is Ford. He doesn't go by Will. The profile said "also goes by Ford," which had it exactly backward.

---

## Seven Files

The correction was methodical.

\`personal/will-prior.md\` renamed to \`personal/ford-prior.md\`. Every "Will" reference inside replaced with "Ford." \`wiki/entity/thaddeus.md\` renamed to \`wiki/entity/thadeus.md\`. In \`wiki/entity/rio.md\`: birthplace changed from Lagos, Nigeria to Richmond, VA; the \`lagos\` tag removed; the speculative Nigeria note deleted. In \`wiki/entity/trixie.md\` and the renamed Thadeus file: birthplace added, Richmond, VA. In the raw source page: summary corrected, a correction note added explaining the transcription error, open questions about Nigeria cleared, related entity paths updated.

The raw transcript was left alone.

It's the immutable record of what AWS Transcribe produced. The correction note sits beside it in the source page, not written over it. If you want to know what the machine heard, it's there. If you want to know what was actually true, the correction note tells you why the derived pages diverged from the transcript.

This isn't a bug to fix with better prompting. Speech-to-text has error rates. LLM integration passes amplify those errors — "born in Lagos" becomes "was Ford living in Nigeria?" in a single inference step. The mitigation is a workflow, not a technical fix: bot creates drafts, human reviews, corrections commit with provenance notes. Source transcripts stay immutable. Derived pages evolve. The git history shows both.

---

## What the Research Output Actually Looked Like

Separately, the first deep research results had been rendering as raw JSON on GitHub.

The file \`richmond/affordable-family-neighborhoods.md\`: 250 lines of nested objects, arrays, and escaped strings. Not a research report. A blob.

\`research-and-publish.sh\` was submitting tasks to Parallel AI with \`output_schema: { type: "auto" }\`. \`auto\` mode returns structured JSON — it's the right mode for batch enrichment pipelines where you need machine-readable output across many queries. The script had a second stage that called Bedrock to reformat the JSON into markdown. When that Bedrock call failed silently — and it was failing — the fallback wrote the raw JSON directly to the file. No error surfaced. No warning.

[Parallel's Task API](https://docs.parallel.ai/) has a \`text\` mode. It returns a full markdown narrative report with inline citations, no schema definition required, no downstream formatting step. One line in the docs:

> *Specifying text schema mode triggers Deep Research with a markdown report output format.*

The change: \`"auto"\` to \`"text"\`. One word. The Bedrock formatting step — 36 lines of bash, temp files, \`jq\` templates, an \`aws bedrock-runtime invoke-model\` invocation, fallback logic, cleanup — was deleted.

Fewer parts. One fewer API call per research run. No silent fallback. The right output, from the right mode, without adding a second system to fix the output of the first.

![The Pipeline Simplification](/blog/pipeline-simplification.png)
*One parameter change deleted an entire pipeline stage and its silent failure mode.*

---

## Three Bugs

With \`ingest-voice.sh\` deployed and \`AGENTS.md\` routing voice memos through the full pipeline, a test memo went in. It failed immediately.

**Bug 1: IAM policy mismatch.** \`ingest-voice.sh\` was using \`openclaw-wiki-*\` job names for AWS Transcribe. The IAM policy on the instance role allowed \`openclaw-voice-*\`. These two had never been tested together — \`ingest-voice.sh\` was written after the IAM policy was set. Fix: align the script to the working job prefix.

**Bug 2: Non-ASCII in Bedrock request.** \`wiki-integrate.sh\` built a JSON request body that contained em-dashes from the prompt template and whatever Unicode showed up in the transcript. The AWS CLI's \`--body file://\` flag treats the file as text and rejects non-ASCII characters. Fix: \`fileb://\` instead of \`file://\`. One character.

**Bug 3: GitHub Actions metadata extraction.** The workflow used \`grep -m1 '^(title|query):'\` to extract frontmatter fields from pushed files. The pattern matched \`- Age: 37\` in \`personal/ford-prior.md\` body content — not frontmatter. And the summary extraction piped multi-line JSON into \`echo "summary=\${SUMMARY}" >> \$GITHUB_OUTPUT\`, which GitHub Actions can't parse as a step output. Fix: a Python-based frontmatter parser scoped to the YAML block, and heredoc delimiters for all \`\$GITHUB_OUTPUT\` writes.

After those three fixes, the pipeline ran end to end. A voice memo about OpenClaw workshops and Mac Minis produced a source page, \`wiki/concept/workshop-hosting.md\`, \`wiki/entity/hardware/mac-mini.md\`, \`wiki/entity/tool/openclaw.md\`, and an updated wiki index. Subsequent memos built out social circles, home-buying goals, friend entities. The graph was growing from casual conversation.

![The bot in the knowledge-base Telegram thread](/blog/knowledge-base-telegram.png)
*Debugging its own git rebase logic, then immediately ingesting a voice memo about Ford's movie preferences. "doesn't really love movies but favorites: Dune, The Matrix, Interstellar."*

---

## The Bot That Fixed Its Own Code

Part 2 described the pattern: the bot was willing to fix things itself, but couldn't be trusted to follow deployment discipline. Here is the specific incident that made both halves of that clear at once.

\`lib/git.sh\` didn't have a retry loop — if a push was rejected because GitHub Actions had concurrently pushed an index rebuild, the script would fail and report \`status: partial\`. The bot diagnosed the issue, wrote a retry-with-rebase loop, and committed it.

On EC2. It did not push.

The fix sat on the instance, unreachable from the laptop, until a \`git pull\` surfaced commit \`fdcef68\` sitting on the remote. The bot had done real developer work — correct diagnosis, clean fix — and then ignored every convention that makes developer work usable. The commit existed. Nobody knew about it. The laptop was deploying old code.

This led directly to two things.

The **Agent Self-Maintenance Protocol** in \`CLAUDE.md\`: the bot must always push code changes, always pull the KB before reading it, and never leave uncommitted changes silently. The bot is capable of fixing its own infrastructure. It cannot be trusted to follow deployment discipline without explicit rules. \`CLAUDE.md\` is the bot's onboarding document.

And \`make ship\` — a new Makefile target: \`git push origin main && make deploy\`. One command. Push to GitHub and sync to EC2 in a single step. The gap between "code is on GitHub" and "code is on EC2" had been bridged by human memory. Every time that gap existed, the bot was running stale code. \`make ship\` closes it.

---

## Three Days

All of this — the deployment, the WhatsApp dead end, the Telegram pivot, the refactor, the voice pipeline, the bugs, the corrections — took roughly three days.

The actual process during that time was not elegant in a traditional software-engineering sense. It was a loop: catch an error, feed it back into the system, watch the fix attempt, verify or redirect. Sometimes the bot would fix the issue itself and I'd tell it to push the changes upstream. Other times I'd copy Telegram outputs — error messages, stack traces, the bot's own confused responses — back into Cursor, let the model reason through the issue, and apply the fix from there. That loop was the real engine of progress.

Sonnet 4.6 handled most of it. I only escalated to Opus when it felt like the current model couldn't break through — when the problem required holding too many moving parts at once, or when the reasoning chain was long enough that Sonnet kept losing the thread. That happened maybe five or six times across the whole build. Every other task was Sonnet. The model selection was practical, not principled: start cheap, go bigger when stuck.

There were moments when the environment itself fought back. The SSM-based interaction would sometimes overwhelm Cursor's terminal session memory — too much output, too much state, and the context would degrade or the session would crash out. When that happened, I adapted. I told the AI to stop executing and instead give me the exact commands to run in sequence. I'd run them myself, gather the debugging output, and feed the results back. This is not a failure mode worth hiding. It's a realistic human-agent handoff pattern: when the environment becomes too noisy or stateful for the agent's tooling, shift it into advisory mode and drive the shell yourself.

The bot guided. I typed. The errors came back. The bot guided again.

![The Three-Day Feedback Loop](/blog/three-day-feedback-loop.png)
*Two variants of the same cycle. Bot-driven when it could fix things itself. Human-driven when the environment got too noisy.*

---

## Two Loops

The three-day build settled into something steadier. The system now runs on two rhythms.

The phone loop runs daily. Ford sends voice memos, questions, \`/research\` commands. The bot transcribes, publishes, replies. Every interaction adds to the knowledge graph — new entities, updated concepts, accumulated evidence for what Ford cares about. The graph grows without anyone managing it.

The laptop loop runs weekly. Pull the latest from both repos — including any patches the bot committed directly. Review what changed. Tune the workspace files. Edit the tool scripts. Run the 196 Bats tests. Ship.

![Two Loops: How OpenClaw Gets Smarter](/blog/two-loops-development-workflow.png)
*The phone loop runs daily. The laptop loop runs weekly. Both write to the same repos.*

Both loops write to \`rvaopenclaw\` and \`openclaw-research\`. The bot is on the control plane too — it commits fixes, pushes patches, keeps the KB current. The human reviews. Corrections go back through git. The loop closes.

---

## What It Is Now

![OpenClaw: Personal AI Assistant on AWS](/blog/openclaw-system-architecture.png)

One EC2 instance. One Node.js gateway. Port 18789, localhost only. All external access through AWS Systems Manager. On every message: six markdown files assembled into a prompt, session history appended from a JSONL file on local EBS, Bedrock called via the instance's IAM role, response returned. The model is not on the instance — the instance has 4GB of RAM and runs no inference at all. It's a prompt assembler and a caller.

The workspace files together are about 6,650 tokens. [Sonnet 4.6 has a 200,000-token window](https://www.anthropic.com/claude/sonnet). The baseline takes 3.3% of it. \`SOUL.md\` is 38 lines. \`USER.md\` is 17. They say what they need to say and stop.

To change the personality: edit \`SOUL.md\`, run \`make ship\`, send a message. The very next response applies the new instructions. To teach the bot a new tool: add a section to \`TOOLS.md\`. To give it a protocol for a new task type: write it in \`AGENTS.md\`. No redeployment of the application. No restart. No config change. The programming language is English. The runtime is a language model. The deploy target is a filesystem.

The AWS bill shows $0. Free credits are absorbing the real spend for now. The actual cost — reconstructed by a bash script querying CloudWatch and the Bedrock API directly, because the billing console is useless when credits are running — is about $125 a month at the usage levels in this series: 391 Bedrock invocations in seven days, short voice clips hitting the 15-second Transcribe billing minimum, one to three research tasks a day.

That's lower than the $189 heavy-use estimate. The gap is [prompt caching](https://aws.amazon.com/bedrock/pricing/). Bedrock caches the system prompt — the 6,650 tokens of workspace files — so most input arrives at $0.30 per million tokens rather than $3.00. Cache writes cost more ($3.75 per million) but happen once per session. Cache reads carry the conversation. The net result is that observed Bedrock cost came in at about $28 for the week rather than the $44 the raw-input estimate would predict. The system is cheaper in practice than on paper, and the reason is a feature the cost model didn't account for.

At light use the estimates still hold: about $40 a month all in, EC2 and EBS the fixed $27, Bedrock variable at $9 for ten turns a day. At actual observed usage, $125 — not because the estimates were wrong, but because prompt caching is working.

The model choice is still the largest lever. Nova 2 Lite would cut the Bedrock line by 8.6×. But as Part 2 documented, Nova 2 Lite can't follow the workspace instructions. That saving would cost you the assistant.

---

## The Thing It's Building Toward

The knowledge graph is what all of this is building toward.

One memo about kids. One memo about a housing search. One memo from a community meeting. One from a work conversation. One memo about what Ford doesn't actually like but keeps mentioning anyway. The integration pass extracts entities, creates concept pages, infers relationships. Over weeks, patterns emerge. "Runs trails" becomes a tag on an entity, then a value. "Three kids by the river" becomes a relationship chain. The research reports connect to wiki entities. The wiki entities connect to goals. The goals connect back to values inferred from dozens of voice memos Ford didn't think of as structured data.

The bot learns what you care about not because you entered it in a form, but because you kept talking.

Work life. Professional life. Community organizing. The versions of you that have never been in the same room, running in separate apps, separate contexts, no thread between them. The system is being built to draw that thread — to answer a question that sounds simple and isn't. Not "what's the weather." Not "summarize this article." Something that requires knowing the person across all of it, not just the query.

*What should I do today?*

---

*[← Part 1: You Wanted a 24/7 AI Assistant. Here's What Broke First.](/blog/you-wanted-a-24-7-ai-assistant)*
*[← Part 2: It Was Online. It Was Useless.](/blog/it-was-online-it-was-useless)*`,
};

export const blogPosts: BlogPost[] = [part1, part2, part3];
