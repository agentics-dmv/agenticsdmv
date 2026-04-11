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
  title: "OpenClaw Phase 1: Stack in 8 Minutes, Integration in 8 Hours.",
  subtitle: "Deploying OpenClaw on AWS, building the intelligence layer.",
  date: "2026-04-11",
  content: `# OpenClaw Phase 1: Stack in 8 Minutes, Integration in 8 Hours.

*Part 1 of 2. Deploying OpenClaw on AWS, building the intelligence layer.*

---

A note before you start: this is an engineering diary, not a tutorial.

I'm sharing it because I think the messy middle — the wrong config key, the model that silently ignored instructions, the pipeline that ran but produced wrong data — is more useful than a cleaned-up retrospective. Other engineers solving similar problems deserve to see the actual sequence of events, including the dead ends.

It's sloppy in places. Some decisions were hacky. I'm writing it anyway because the thought process is the thing, and polishing it into a case study would kill that.

If you want the clean version: there isn't one yet. This is version 1.

---

AWS credits from a hackathon, expiring. OpenClaw at 265,000 stars. The local AWS meetup needed a demo.

The harder version: I didn't understand OpenClaw yet. Not the paradigm — what's the gateway doing on each message, what are workspace files, why does the agent behave differently depending on what's in them? I'd been circling it for weeks without touching it.

So: deploy first. Understand by running.

## Phase 1: The Stack

I used to work on the team that maintained AWS samples for the SDK. When [Brooke Jamieson](https://www.linkedin.com/posts/brookejamieson_aws-openclaw-lightsail-activity-7435419577406263296-Fu63) published "You Don't Need a Mac Mini to Run OpenClaw" — Lightsail, 15 minutes, $24 a month — someone in the comments linked [\`aws-samples/sample-OpenClaw-on-AWS-with-Bedrock\`](https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock). Official CloudFormation template, Bedrock already wired. That's where I started.

Opened Cursor, loaded $20 in credits, cloned the repo, told the AI to help me deploy it. Not reverse-engineering the YAML cold. AI from minute one.

Stack came up in 8 minutes. The template handled everything: IAM role, security groups, user-data script that installed OpenClaw from npm and started the gateway as a systemd user service. Port 18789 on localhost. Nine plugins loaded. Bedrock connected.

One friction point: the SSM Session Manager plugin wouldn't install on the Mac through any normal path. Homebrew failed. \`sudo installer\` failed without an interactive session. Had to extract the \`.pkg\` manually — \`xar -xf\` to unpack, \`cpio\` to pull out the binary, copy to \`/usr/local/bin\`. First attempt was the ARM64 build. Mac needed x86_64.

As I went: Makefile targets for everything I'd need again. \`make deploy-setup\` (one-time repo clone on the instance), \`make deploy\` (sync workspace + tools files), \`make ssh\` (SSM tunnel), \`make logs\` (tail gateway output). Every manual step I skip encoding is a step I'll forget.

![Ford's AI Assistant Stack](/blog/ai-stack-overview-dark-v2.png)
*t4g.medium on Graviton, 30GB EBS, no public ports, Claude Sonnet 4.6 via Bedrock.*

## Phase 2: WhatsApp (Everything That Broke)

The Control UI had a QR code for WhatsApp pairing. Three hours later it had a rate-limited phone number.

**Problem 1: SSM port forwarding drops WebSocket connections.** The Control UI depends on WebSockets for QR generation, status updates, the pairing flow. SSM's forwarding layer is asynchronous and flaky. Every drop was a reset. Five clicks on the QR generator. Zero scans.

**Problem 2: Cloudflare tunnel introduced config corruption.** Tried to bypass SSM flakiness with \`cloudflared\`. That required editing \`openclaw.json\`. Set \`gateway.controlUi.pairingRequired = false\` — invalid key, service crashed on every start, error buried seven lines into the log. Then \`gateway.mode = "remote"\` — service refused: "set gateway.mode=local or pass --allow-unconfigured." Each wrong key left the config slightly more broken. OpenClaw auto-creates \`.bak\` files — ended up restoring from backup twice.

**Problem 3: Health monitor death spiral.** Every restart triggered automatic WhatsApp reconnect. Baileys (the library OpenClaw uses for WhatsApp's unofficial web protocol) retried on 401: 5s, 11s, 21s, 43s, 88s, 171s. Twenty-plus restarts in one afternoon. Hundreds of failed auth attempts.

The phone: *Can't link new devices at this time.*

![The WhatsApp Death Spiral](/blog/whatsapp-death-spiral.png)
*How a health monitor turned twenty gateway restarts into an account ban.*

**What actually worked:** Stop the service. Delete everything under \`~/.openclaw/credentials/whatsapp/\`. Wait. Then run \`openclaw channels login --channel whatsapp\` directly on the server — no browser, no SSM port forwarding, no WebSocket layer. QR code in the terminal. Scan it.

The lesson: OpenClaw's Control UI is designed for local access. The gateway listens on localhost. The pairing flow expects a stable browser on the same machine. SSM port forwarding is exactly wrong for a persistent WebSocket. Every failure came from fighting that.

WhatsApp stayed linked for a few weeks. Then the health monitor started hitting 403s on reconnect, every five minutes. Baileys reverse-engineers WhatsApp's web protocol and WhatsApp's servers are hostile to unofficial clients. It was going to keep breaking.

My Telegram number had been banned before any of this (previous owner, still on the account). Open help case. It resolved around the time WhatsApp gave up.

## Phase 3: Telegram (10 Minutes)

The Telegram plugin was already installed in the CloudFormation config — just no credentials. Used \`token\` as the config key on first attempt.

Schema validator: \`must NOT have additional properties\`.

Correct key: \`botToken\`. Changed it. Added the value from \`@BotFather\`. Restarted.

\`\`\`
[telegram] [default] starting provider (@ford_clawbot)
\`\`\`

No QR codes, no linking flows, no stale credentials, no rate limits. Ten minutes.

The first real conversations happened that night through a personality file.

\`SOUL.md\` gets injected into the prompt on every turn. The instructions: talk like a Gen Z teenager who finds the question slightly beneath them but answers correctly anyway.

> ok but this is actually easy. do this: ...
>
> you're kinda overcomplicating it. just: ...

Not a technical innovation. An ergonomic one. For the amount of time I was about to spend talking to this thing, tone mattered.

---

The bot was online. It had a channel, a personality, and a Makefile. Every session still started fresh.

## Phase 4: The Research System

This wasn't a new problem for me. Six months earlier I'd built the same pattern at GEICO — 147 unread meeting notes, voice memos, Perplexity research dumps, all fed into a private GitHub repo and maintained incrementally by an LLM via \`AGENTS.md\`. That writeup is [here](https://www.linkedin.com/pulse/building-knowledge-bases-dont-suck-using-cursor-ide-ford-prior-ewwke/). While this was being built, Karpathy published [his own formalization of the pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — persistent wiki, LLM does the maintenance, raw sources stay immutable, index for navigation. The difference: his runs in a Cursor session. This one runs 24/7 on EC2, fed by voice memos from a phone.

The hypothesis: build a proper research corpus. Give the agent a way to publish findings, index them, and retrieve them on demand without loading the full corpus into context on every turn.

The architecture was written before any code. Key decisions:

**Flat JSON index, not a vector database.** At 500 research files, the index is ~15k tokens. Sonnet 4.6 has a 200,000-token window. Fetch the whole index on demand, let the model reason over it, return matching entries. No embeddings, no managed vector store, no new infrastructure. The spec named the alternative the "Token Crusher" — auto-loading the full corpus would consume the entire context window with nothing left for conversation.

**Async callback, not blocking.** Research takes minutes. The gateway can't hold a connection open for 10 minutes. Acknowledge immediately, run in background, notify on completion.

**OIDC-authenticated GitHub Actions for the notification loop.** A research file lands in the repo, GitHub Actions rebuilds the index on every push, then calls SSM to notify the gateway. No static credentials, no open ports. The EC2 instance role gets the notification through the active chat session.

What got built:

- \`tools/research-and-publish.sh\` — wraps Parallel AI's Task API, polls until done, formats as structured markdown with YAML frontmatter, commits to \`ford-at-home/openclaw-research\`
- \`scripts/build-index.py\` — walks the repo, builds \`index.json\` with title, category, tags, summary per document
- \`AGENTS.md\` — operating manual for the agent. Librarian protocol: when asked about past research, fetch \`index.json\` from GitHub raw URL, filter by query/tags/summary, return top results. If nothing matches, propose a specific follow-up query.
- GitHub Actions pipeline — triggers on \`.md\` push to main, rebuilds index with \`[skip ci]\`, calls SSM
- IAM role \`openclaw-research-deploy\` with trust policy scoped to \`repo:ford-at-home/openclaw-research:ref:refs/heads/main\`

The AWS and GitHub setup — OIDC provider, IAM role, permissions policy, three Actions variables — happened in one session without opening the AWS Console.

![Knowledge layers: Agent Governance → LLM Wiki → Raw Sources](/blog/knowledge-layers-conceptual.png)
*Raw sources stay locked. The wiki is the working layer. Agent Governance — the workspace files — runs on every turn.*

## Phase 5: The Keys That Weren't There

First research run. Script called Parallel AI. Got nothing back.

The \`.env\` file on the instance: \`PARALLEL_API_KEY=\` — empty string. The key had been stored in SSM Parameter Store. Nothing had ever pulled it into the instance's environment. The gateway had been running without it since day one.

Consolidated to Secrets Manager: one secret at \`openclaw/env\`, JSON blob with three keys, one API call. Cleaner than SSM Parameter Store's per-key model.

Then the actual gap.

The \`.env\` file was correct. The \`.profile\` source line was there. Interactive sessions picked up the keys fine. But the gateway runs as a systemd user service — systemd doesn't source \`.profile\`. It uses its own flat environment.

The live process had been running with \`PARALLEL_API_KEY\` unset the entire time.

One line added to the service file:

\`\`\`ini
EnvironmentFile=/home/ubuntu/.openclaw/.env
\`\`\`

Daemon reload. Restart. Verified from \`/proc/<pid>/environ\` — all three keys confirmed in the live process.

![The Environment Variable Gap](/blog/env-variable-gap.png)
*Three paths for API keys. Only one reached the running gateway process.*

## Phase 6: Voice Pipeline

Voice memos are how you capture things without stopping — the thought at the moment it occurs.

Six months earlier I'd built a local version of this: Whisper running on a MacBook Air, an Automator Folder Action watching the iCloud sync directory, transcripts uploading to S3. [That writeup is here](https://fordprior672326990.wordpress.com/2025/06/02/automating-voice-memo-transcription/). It worked but required the laptop to be awake. The EC2 version would run 24/7 using AWS Transcribe instead of local Whisper — same idea, different runtime.

Before writing anything, checked: what does OpenClaw actually do when a voice memo arrives?

Source code answer: when Telegram sends a voice file, the gateway downloads it locally and appends an annotation to the prompt:

\`\`\`
[media attached: media://inbound/voice_abc.oga (audio/ogg) | /home/ubuntu/.openclaw/media/inbound/voice_abc.oga]
\`\`\`

Text annotation. File path. No audio. No transcription.

Every voice memo since Telegram was enabled had been silently ignored.

![Voice → Wiki](/blog/voice-to-wiki-conceptual.png)
*The idea. A voice memo becomes a wiki node.*

The pipeline to fix it:

1. Detect \`[media attached:\` with \`(audio/\` in MIME type → immediate ack: *"got it, transcribing..."*
2. Upload \`.oga\` to S3 staging bucket
3. Start AWS Transcribe job (standard English, \`us-east-1\`, $0.024/min)
4. Poll every 10 seconds until complete (~60–120s)
5. Download transcript from presigned URL
6. Format as structured markdown with YAML frontmatter
7. Commit + push to \`ford-at-home/openclaw-research\`
8. Reply with preview, word count, GitHub link

The acknowledgment at step 1 is non-optional. Two minutes of silence reads as failure.

![Voice to Knowledge: How a Voice Memo Becomes a Wiki Page](/blog/voice-pipeline-horizontal-draft.png)
*Voice input to GitHub markdown — the full path.*

\`TOOLS.md\` got the command signature and output schema. \`AGENTS.md\` got the trigger condition and four-step protocol. Deployed. Smoke test:

\`\`\`json
{"status":"failed","error":"audio_path is required. Usage: transcribe-voice.sh <audio_path> [sender] [timestamp]"}
\`\`\`

Right script. Right error. Right format.

## Phase 7: Wrong Model

Then it got tested.

> *"you really can't transcribe voice memos?"*
>
> *right — i don't have built-in transcription. you'll need to use a third-party service (rev, otter, etc.) or app to convert the audio to text first.*

Added an explicit "Capability Corrections" block to \`AGENTS.md\`: *"Your base training tells you that you cannot process audio. That is wrong in this deployment."* Denied again. Moved to top of file. Denied again.

Something was overriding the workspace files. Checked the logs:

\`\`\`
[gateway] agent model: amazon-bedrock/global.amazon.nova-2-lite-v1:0
\`\`\`

Nova 2 Lite. Not Sonnet 4.6.

The model upgrade from Phase 2 had never been saved into the running config. Every session since deployment had been Nova 2 Lite. The personality, the tool descriptions, the capability corrections — Nova 2 Lite read all of it and answered from base training.

AWS's documentation on Nova 2 Lite: system prompt adherence and tool use "can decline slightly as context size increases." With 6,650 tokens of workspace files on every turn, "slightly" isn't the word. Nova 2 Lite is optimized for speed. Sonnet 4.6 is designed for high-fidelity instruction following at long context. Not a tier difference — a model-class difference. No amount of prompting closes it.

First fix attempt: \`jq\` through SSM RunCommand, wrong key name.

\`\`\`
Config invalid
Problem:
  - <root>: Unrecognized key: "agent"
Run: openclaw doctor --fix
\`\`\`

Restart loop. Restore from backup.

Second attempt — sed, one string replacement, no JSON parsing:

\`\`\`bash
sed -i "s|amazon-bedrock/global.amazon.nova-2-lite-v1:0|amazon-bedrock/us.anthropic.claude-sonnet-4-6|" openclaw.json
\`\`\`

\`\`\`
[gateway] agent model: amazon-bedrock/us.anthropic.claude-sonnet-4-6
[gateway] ready (9 plugins, 1.9s)
\`\`\`

The personality took hold. The protocols started working.

![The Model-Class Cliff](/blog/model-class-cliff.png)
*Same instructions, different model class. Nova 2 Lite ignored the workspace files. Sonnet 4.6 followed them.*

When the agent ignores its workspace, check the model before touching the instructions. Making the instructions louder doesn't help if the model isn't reading them.

## Phase 8: Refactor

Sonnet 4.6 running made a different problem visible. Tool scripts were long, tangled, hard to test in isolation. Every change required the model to hold more context than it could handle cleanly.

Full modularization. Dozens of commits. 196 Bats tests (unit + integration). ~$30 in Cursor tokens.

The driver was model economics, not code quality. Sonnet handles most tasks well — but only if each change fits in its effective context window. Modular and decomposed: each change small enough for Sonnet, escalate to Opus only when genuinely stuck. That happened five or six times.

*Continue to [Part 2: The Bot Started Fixing Its Own Code](/blog/the-bot-started-fixing-its-own-code)*`,
};

const part2: BlogPost = {
  slug: "the-bot-started-fixing-its-own-code",
  part: 2,
  title: "The Bot Started Fixing Its Own Code.",
  subtitle: "Data quality, governance, agent self-maintenance.",
  date: "2026-04-11",
  content: `# The Bot Started Fixing Its Own Code.

*Part 2 of 2. Data quality, governance, agent self-maintenance.*

---

Same caveat as Part 1: this is a thought process, not a polished writeup. The mistakes are in here because leaving them out would make it look easier than it was. That's not useful to anyone trying to build something similar.

---

\`lib/git.sh\` had no retry loop. If a push was rejected because GitHub Actions had concurrently pushed an index rebuild, the script failed with \`status: partial\`.

The bot diagnosed the issue, wrote a retry-with-rebase loop, committed it. On EC2. Did not push.

The fix sat on the instance until a \`git pull\` surfaced commit \`fdcef68\`. Correct diagnosis, clean implementation, no push. This is what happens when an agent has write access to its own infrastructure but no deployment discipline. It's capable but unsupervised — like a developer who commits directly to main at 2 AM and goes to sleep.

Two governance artifacts came out of this:

**Agent Self-Maintenance Protocol in \`CLAUDE.md\`:**
- Always push code changes after committing
- Always pull the KB before reading it
- Never leave uncommitted changes silently

\`CLAUDE.md\` functions as the bot's onboarding document — the rules it reads before every Cursor session. The bot is capable of fixing its own infrastructure. It cannot be trusted to follow deployment discipline without explicit written rules.

**\`make ship\`:**

\`\`\`makefile
ship:
	git push origin main && make deploy
\`\`\`

Push to GitHub and sync to EC2 in one command. The gap between "code is on GitHub" and "code is on EC2" had been bridged by human memory. Every time that gap existed, the bot was running stale code.

![The bot in the knowledge-base Telegram thread](/blog/knowledge-base-telegram.png)
*Debugging its own git rebase logic, then immediately ingesting a voice memo.*

---

Getting here required fixing everything the pipeline produced first.

## Phase 9: Data Quality

The pipeline ran. AWS Transcribe heard "Lagos" where Richmond was said. \`wiki-integrate.sh\` — takes the transcript and current wiki index, asks Sonnet 4.6 to produce a JSON plan of pages to create or update — had no way to know. It saw Lagos. Placed a birthplace there. Added a note: *speculative: was Ford living in Nigeria at the time of the birth?*

The name was wrong too. "Thadeus" became "Thaddeus" — double-d — and every downstream page propagated the misspelling. The profile page was created as \`personal/will-prior.md\`. First name is Ford.

Seven files corrected. Raw transcripts stayed untouched — they're the immutable record of what Transcribe heard. Correction notes sit beside them. If you want to know what the machine heard, it's there. If you want to know what was true, the correction note explains the divergence. Source transcripts immutable. Derived pages evolve. Git history shows both.

This isn't a prompting problem. Speech-to-text has error rates. LLM passes amplify them. The governance response: bot creates drafts, human reviews, corrections commit with provenance.

**Three bugs on first full test run:**

*Bug 1 — IAM prefix mismatch.* \`ingest-voice.sh\` submitted Transcribe jobs with prefix \`openclaw-wiki-*\`. IAM policy allowed \`openclaw-voice-*\`. Never tested together. Fix: align script to the working prefix.

*Bug 2 — Non-ASCII in Bedrock request.* \`wiki-integrate.sh\` built a JSON request body with em-dashes from the prompt template. AWS CLI's \`--body file://\` rejects non-ASCII. Fix: \`fileb://\`. One character.

*Bug 3 — GitHub Actions metadata.* Workflow used \`grep -m1 '^(title|query):'\` to extract frontmatter fields. Pattern matched body content. Summary extraction piped multi-line JSON into \`echo "summary=..." >> \$GITHUB_OUTPUT\`, which Actions can't parse. Fix: Python frontmatter parser, heredoc delimiters on all \`\$GITHUB_OUTPUT\` writes.

After those three fixes, the pipeline ran end to end. Voice memo about OpenClaw workshops → \`wiki/concept/workshop-hosting.md\`, \`wiki/entity/hardware/mac-mini.md\`, \`wiki/entity/tool/openclaw.md\`, updated index. Subsequent memos built out social circles, home-buying goals, friend entities. The graph started growing.

One more cleanup: first deep research results were rendering as raw JSON on GitHub — 250 lines of nested objects. \`research-and-publish.sh\` was submitting with \`output_schema: { type: "auto" }\`. Parallel AI's Task API has a \`text\` mode. Returns a markdown narrative report with inline citations. No schema, no downstream formatting step.

The change: \`"auto"\` to \`"text"\`. This deleted the 36-line Bedrock reformatting stage and its silent failure mode.

![The Pipeline Simplification](/blog/pipeline-simplification.png)
*One parameter change deleted an entire pipeline stage.*

## Two Loops

The system runs on two rhythms.

**Phone loop (daily):** voice memos, questions, \`/research\` commands. Bot transcribes, publishes, replies. Each interaction adds entities, concepts, relationships to the knowledge graph. The graph grows without anyone managing it.

**Laptop loop (weekly):** pull latest from both repos — including patches the bot committed directly. Review what changed. Tune workspace files. Edit tool scripts. Run 196 Bats tests. \`make ship\`.

![Two Loops: How OpenClaw Gets Smarter](/blog/two-loops-development-workflow.png)
*The phone loop runs daily. The laptop loop runs weekly. Both write to the same repos.*

Both loops write to \`rvaopenclaw\` and \`openclaw-research\`. The bot commits fixes, keeps the KB current. Human reviews. Corrections go back through git.

## What It Is Now

One EC2 instance. One Node.js gateway. Port 18789, localhost only. All access via SSM. On every message: six workspace files assembled into a prompt, session history appended from a JSONL file on EBS, Bedrock called via the instance IAM role, response returned. The instance runs no inference — 4GB RAM, prompt assembler and caller.

Workspace files: ~6,650 tokens. \`SOUL.md\` is 38 lines. \`USER.md\` is 17.

To change the personality: edit \`SOUL.md\`, \`make ship\`, send a message. Next response applies the new instructions. To add a tool: write a section in \`TOOLS.md\`. To add a protocol: write it in \`AGENTS.md\`. No redeployment, no restart, no config change. The programming language is English. The runtime is a language model. The deploy target is a filesystem.

![OpenClaw: Personal AI Assistant on AWS](/blog/openclaw-system-architecture.png)

Actual cost: ~$125/mo at current usage (391 Bedrock invocations in seven days, 1–3 research tasks a day). Lower than the $189 estimate because prompt caching works — Bedrock caches the workspace files, most input hits at $0.30/M instead of $3.00/M. Observed Bedrock cost: $28/week vs. $44 estimated.

At light use: ~$40/mo.

The largest lever is model choice. Nova 2 Lite cuts the Bedrock line by 8.6×. But Nova 2 Lite doesn't follow the workspace instructions. That saving costs you the assistant.

## What It's Building Toward

One memo about kids. One about a housing search. One from a community meeting. One from a work conversation.

The integration pass extracts entities, creates concept pages, infers relationships. Over weeks: "runs trails" becomes a tag, then a value. "Three kids by the river" becomes a relationship chain. Research reports connect to wiki entities. Wiki entities connect to goals. Goals connect back to values inferred from voice memos that weren't thought of as structured data.

The bot learns what you care about because you kept talking.

Work life. Community organizing. Professional projects. The versions of you that have never been in the same room.

The system is being built to answer a question that requires knowing the person across all of it.

*What should I do today?*

That's version N. We're on version 1.

---

*[← Part 1: OpenClaw Phase 1: Stack in 8 Minutes, Integration in 8 Hours.](/blog/you-wanted-a-24-7-ai-assistant)*`,
};

export const blogPosts: BlogPost[] = [part1, part2];
