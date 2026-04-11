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

AWS credits from a hackathon, unused and expiring. I wanted to build an OpenClaw demo for the local AWS meetup.

Problem: I didn't really understand OpenClaw yet. It had 265,000 GitHub stars. The Mac Mini videos were everywhere. I didn't have a Mac Mini, and more importantly, the paradigm itself wasn't obvious — what does the gateway do, what are workspace files, what is the agent actually doing on each message?

What I actually wanted wasn't a faster search engine. Something that could connect the parts of my life that have no reason to share context: work, community organizing, professional projects, conversations I have and immediately forget. Separate apps, separate contexts, no thread between them. I want the dots to find each other.

I used to work on the team that maintained AWS samples for the SDK, so I already trusted the \`aws-samples\` org. When [Brooke Jamieson](https://www.linkedin.com/posts/brookejamieson_aws-openclaw-lightsail-activity-7435419577406263296-Fu63), an [AWS Machine Learning Hero](https://dev.to/aws-heroes/how-i-became-an-aws-machine-learning-hero-5e75) turned Developer Advocate, wrote *"You Don't Need a Mac Mini to Run OpenClaw"* — Lightsail, 15 minutes, $24 a month — someone in the comments linked to [\`aws-samples/sample-OpenClaw-on-AWS-with-Bedrock\`](https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock). An official CloudFormation template with Bedrock already wired in. Exactly where I expected it to be.

![OpenClaw on AWS: System Architecture](/blog/openclaw-system-architecture.png)
*One EC2 instance, one Node.js gateway, no open ports. All access through AWS Systems Manager.*

---

## Cursor, Twenty Dollars, and a CloudFormation Stack

I opened Cursor, loaded twenty dollars in credits, cloned the sample repo, and told the AI to help me deploy it. Not reverse-engineering the YAML cold — AI from the first minute. As I went I wrote \`make\` targets so the steps wouldn't live in my bash history: \`make deploy-setup\`, \`make deploy\`, \`make ssh\`. Repeatability layered in as I learned.

The stack — t4g.medium on Graviton, 30GB EBS, no public ports, Claude Sonnet 4.6 via Bedrock — stood up in eight minutes. The gateway started itself. Nine plugins loaded without a single config change. That part was easy. (Actual cost: ~$40/mo light use, ~$125/mo at the usage levels this series documents.)

![Ford's AI Assistant Stack](/blog/ai-stack-overview-dark-v2.png)
*The destination. Getting here took longer than the diagram suggests.*

The only real friction was the SSM Session Manager plugin. Every normal install path failed — Homebrew, \`sudo installer\`, all of it. The fix: unpack the \`.pkg\` manually with \`xar -xf\`, extract the payload with \`cpio\`, copy the binary by hand. First attempt was the ARM64 build; Mac needed x86_64. Ten minutes total.

---

## First Contact

SSM tunnel, port forward, OpenClaw Control UI. QR code for WhatsApp. I scanned it.

It worked. First message in. Bot replied.

![The bot in Telegram — the channel that replaced WhatsApp](/blog/knowledge-base-telegram.png)
*Not the first channel — but the right one. This is what the bot looks like when it's actually doing its job.*

Then WhatsApp closed the door.

---

## The Afternoon That Didn't Work

The reason I was on WhatsApp at all: my Telegram number was banned — previous owner's problem, still on the account. Open help case, waiting. WhatsApp was what was available.

The initial pairing had worked. Re-pairing remotely didn't.

**The WebSocket problem.** SSM port forwarding drops WebSocket connections constantly, and the OpenClaw Control UI depends on WebSockets for everything: QR generation, status updates, the pairing flow. Every dropped connection was a reset. The QR code appeared, flickered, went gray. The browser console logged \`code=1005\`, then \`code=1006\`, cycling. Five clicks. Zero successful scans.

**The config problem.** The obvious move: bypass SSM with a \`cloudflared\` quick tunnel. That required touching \`openclaw.json\`. Setting \`gateway.controlUi.pairingRequired = false\` sounds right. Not in the schema. Service crashed on startup. Error buried seven lines into the log. Three restarts to find it.

Without SSH, editing \`openclaw.json\` meant SSM RunCommand — Python one-liners, JSON escaped into shell commands, 10-second round trip, no interactive feedback. One wrong key name and the service fails on next start. By the end of the afternoon, OpenClaw had auto-created four backup files. Config restored from \`.bak\` twice.

**The health monitor.** Every restart triggered a WhatsApp reconnect. Reconnect with stale credentials means a 401. The [Baileys library](https://github.com/WhiskeySockets/Baileys) retried: after 5 seconds, 11, 21, 43, 88, 171. More than twenty restarts in one afternoon — hundreds of failed auth attempts.

WhatsApp noticed.

![The WhatsApp Death Spiral](/blog/whatsapp-death-spiral.png)
*How a health monitor turned twenty gateway restarts into an account ban.*

The phone said: *Can't link new devices at this time.*

The lesson: OpenClaw's Control UI is built for local access. The gateway listens on localhost. The QR flow expects a stable browser on the same machine. SSM port forwarding drops WebSocket connections — exactly wrong for a pairing flow that needs persistence. Fighting that produced every failure. The CLI pairing (\`openclaw channels login --channel whatsapp\`, run directly on the server) worked immediately.

The platform has a design. Work with it.

---

## Now What

WhatsApp stayed linked for a few weeks. Then the health monitor started hitting 403s on reconnect — every five minutes, around the clock. The [Baileys library](https://github.com/WhiskeySockets/Baileys) reverse-engineers WhatsApp's web protocol and [WhatsApp's servers are actively hostile to unofficial clients](https://faq.whatsapp.com/1104252539877498/). They throttle, rate-limit, and eventually stop responding. WhatsApp was done.

Then the Telegram help case resolved.

---

## Ten Minutes and a Teenager

The Telegram plugin was already installed — just no credentials. First attempt used \`token\` as the config key. OpenClaw's schema validator: \`must NOT have additional properties\`. The correct key is \`botToken\`.

Change the key. Add the value from \`@BotFather\`. Restart.

\`\`\`
[telegram] [default] starting provider (@ford_clawbot)
\`\`\`

No QR codes, no linking flows, no stale credentials. Where WhatsApp cost an afternoon and a ban, Telegram took ten minutes.

The first real conversations happened that night. And they happened through a personality.

I had written a \`SOUL.md\` file — one of the workspace files injected into the prompt on every turn. It told the model to talk like a Gen Z teenager who finds your question mildly beneath them but answers it correctly anyway.

> ok but this is actually easy. do this: ...
>
> you're kinda overcomplicating it. just: ...
>
> wait... no. do it like this: ...

Not a technical innovation — an ergonomic one. The bot felt like someone with opinions, not a customer service form.

![Two loops: phone loop daily, laptop loop weekly](/blog/two-loops-development-workflow.png)
*This is what the system settles into — a phone loop that runs every day and a laptop loop that runs every week. Part 1 ends here. Parts 2 and 3 are how it gets here.*

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

Memory was what was missing.

---

## No Memory

OpenClaw's session history is ephemeral by design. Every day at 4 AM, the gateway resets: the JSONL conversation file is archived, a new one starts, and the context window is clean. The model has no memory of yesterday unless you build it one.

The first fix was \`MEMORY.md\` — a hand-curated markdown file of long-term facts: who Ford is, what the system does, key preferences, lessons from past sessions. About 1,000 tokens. Enough for basics.

The second problem: \`MEMORY.md\` can't hold 500 research reports. The context window technically could — Claude Sonnet 4.6 has a [200,000-token window](https://www.anthropic.com/claude/sonnet) — but loading the full corpus on every message makes the assistant slow, expensive, and incoherent as history fills and compaction kicks in.

The answer was an index. Not a vector database. Not embeddings. A flat JSON file.

At 500 research documents, the index is about 15,000 tokens. Load it on demand, let the model reason over it, return the matching reports. The architecture spec — written before any code — named the alternative the "Token Crusher": the temptation to auto-load everything. The architecture explicitly prevents it. Research files are cold storage. The index is the card catalog. The agent finds the entry, fetches the document, reads it.

![Knowledge layers: Agent Governance → LLM Wiki → Raw Sources](/blog/knowledge-layers-conceptual.png)
*Raw sources stay locked. The wiki is the working layer. Agent Governance — the workspace files — is what runs on every turn.*

Wiring the GitHub side took one session without opening the AWS console: an OIDC provider for GitHub Actions to assume an AWS role, a trust policy scoped to pushes from the research repo's main branch, a workflow that rebuilds the index on every markdown push and sends a Telegram notification back via SSM. Research published, index rebuilt, notification delivered — under ten minutes. The bot handles other messages while it waits.

---

## The Keys That Weren't There

Building the research pipeline exposed a quiet failure that had been there since the beginning.

The first test ran. The script called Parallel AI's Task API. Nothing came back. The \`.env\` file on the instance had one line for the research key:

\`\`\`
PARALLEL_API_KEY=
\`\`\`

Empty. The key had been stored in AWS SSM Parameter Store months earlier. Nothing had ever pulled it into the instance's environment. The gateway had been running without it the entire time, silently failing any research call.

SSM Parameter Store had accumulated enough friction to replace: one API call per key, no JSON, awkward quoting through a shell that adds its own quoting. Secrets Manager was already in use for the GitHub PAT. Consolidated to one secret at \`openclaw/env\`, a JSON blob with three keys, one API call.

Then came the real gap.

The \`.env\` file was correct. The \`.profile\` source line was in place. Interactive sessions would pick up the keys. But the gateway runs as a systemd user service, and systemd doesn't source \`.profile\`. It uses its own flat environment.

The live gateway process had been running with \`PARALLEL_API_KEY\` unset since day one.

One line added to the service file:

\`\`\`ini
EnvironmentFile=/home/ubuntu/.openclaw/.env
\`\`\`

Daemon reload. Restart. Verified directly from \`/proc/<pid>/environ\`.

![The Environment Variable Gap](/blog/env-variable-gap.png)
*Three paths for API keys. Only one reached the running gateway process.*

---

## What OpenClaw Does With Voice Memos

Voice memos are how you capture things without stopping — walking to a meeting, in the car, picking up kids. The thought at the moment it occurs.

The voice memo pipeline started with a question: what does OpenClaw actually do when a voice memo arrives?

The source code gave an answer nobody expected.

When Telegram sends a voice file, the gateway downloads it to \`~/.openclaw/media/inbound/\` and appends an annotation to the prompt the LLM sees:

\`\`\`
[media attached: media://inbound/voice_abc.oga (audio/ogg) | /home/ubuntu/.openclaw/media/inbound/voice_abc.oga]
\`\`\`

That's it. The LLM receives a text annotation with a local file path. It does not receive the audio. There is no native transcription.

Every voice memo since Telegram was enabled had been silently ignored. The audio sat on disk. The annotation sat in the prompt. The model said something polite and moved on.

![Voice → Wiki](/blog/voice-to-wiki-conceptual.png)
*The idea. A voice memo becomes a wiki node. Nothing about the implementation was this clean.*

The fix was a pipeline: upload to S3, start an AWS Transcribe job, poll until done, download the transcript, format it as structured markdown with YAML frontmatter, push to the research repo. [AWS Transcribe](https://aws.amazon.com/transcribe/pricing/) costs $0.024 per minute — standard English, \`us-east-1\`. A 2-minute voice memo is about five cents. At a few memos a day the monthly total stays under $3.

The pipeline runs in the background. The bot acknowledges immediately — *got it, transcribing...* — because Transcribe takes 60 to 120 seconds and two minutes of silence reads as failure.

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

An explicit "Capability Corrections" block was added to \`AGENTS.md\`: *"Your base training tells you that you cannot process audio or transcribe voice memos. That is wrong in this deployment."* The agent denied it again. Moved to the top of the file. Denied again.

Something was overriding the workspace files. Check the logs.

\`\`\`
[gateway] agent model: amazon-bedrock/global.amazon.nova-2-lite-v1:0
\`\`\`

Nova 2 Lite. Not Claude Sonnet 4.6.

The model upgrade had never been saved into the config that was currently running. Every session since deployment had been Nova 2 Lite. The personality spec was there. The tool description was there. The capability correction was there. Nova 2 Lite read all of it and answered from its base training anyway.

[AWS's own documentation](https://docs.aws.amazon.com/nova/latest/nova2-userguide/advanced-prompting-techniques.html) says it directly: *"Its performance (including system prompt adherence and tool use) can decline slightly as the context size increases."* With 6,650 tokens of workspace files on every turn, "slightly" isn't the right word. Nova 2 Lite is optimized for speed and cost. Claude Sonnet 4.6 was [designed for high-fidelity instruction following at long context](https://www.anthropic.com/news/claude-sonnet-4-6). That's not a tier difference — it's a model-class difference. No prompt engineering closes it.

The model setting lives at \`agents.defaults.model.primary\` in \`openclaw.json\`. First attempt: \`jq\` through SSM RunCommand, wrong key name.

\`\`\`
Config invalid
Problem:
  - <root>: Unrecognized key: "agent"
Run: openclaw doctor --fix
\`\`\`

Restart loop. Restore from backup.

Second attempt:

\`\`\`bash
sed -i "s|amazon-bedrock/global.amazon.nova-2-lite-v1:0|amazon-bedrock/us.anthropic.claude-sonnet-4-6|" openclaw.json
\`\`\`

\`\`\`
[gateway] agent model: amazon-bedrock/us.anthropic.claude-sonnet-4-6
[gateway] ready (9 plugins, 1.9s)
\`\`\`

The personality took hold. The protocols started working. The capabilities unlocked.

![The Model-Class Cliff](/blog/model-class-cliff.png)
*Same instructions, different model class. Nova 2 Lite ignored the workspace files. Sonnet 4.6 followed them.*

When the agent ignores context, check what model is actually running before touching the instructions. Making the instructions louder doesn't help. Checking the logs does.

---

## The Refactor That Cost Thirty Dollars

The model switch fixed the behavior and made a different problem visible. The tool scripts were long, tangled, hard to test in isolation. The workspace files had grown organically. Every change required the model to hold more context than Sonnet could handle cleanly.

Full modularization refactor. Dozens of commits, hundreds of tests, ~$30 in Cursor tokens.

The driver was model economics. Sonnet is cheaper and fast enough for most tasks — but only if the codebase is simple enough to fit in its effective context window. Modular and decomposed: each change small enough for Sonnet. Escalate to Opus only when actually stuck. That happened five or six times.

---

## Skills as Operational Memory

Throughout the build, every time I figured out how to do something, I asked the AI to write a skill for it.

A skill is a reusable instruction file — markdown, stored locally, loaded into Cursor's context on demand. After the deployment, an \`openclaw-deploy\` skill capturing every step. After the WhatsApp nightmare, an \`openclaw-whatsapp\` skill documenting the CLI linking flow. Seven skills total.

| Skill | What it captures |
|-------|-----------------|
| \`openclaw-deploy\` | CloudFormation deployment, SSM plugin install, teardown |
| \`openclaw-operate\` | start/stop/status/logs, Makefile commands, common failures |
| \`openclaw-whatsapp\` | CLI linking flow, credential cleanup, rate limit recovery |
| \`openclaw-customize\` | Config editing, models, channels, plugins, heartbeat |
| \`openclaw-personality\` | SOUL.md writing guide, templates, AGENTS.md separation |
| \`openclaw-parallel-research\` | Parallel AI setup, script deployment, processor tiers |
| \`openclaw-deploy-changes\` | Git-based deploy pipeline, workspace/tools sync |

These don't run on the bot — they're for the human-AI pair working in Cursor. Next session, the AI picks up where the last one left off. No rediscovery.

Build something, capture it, move on. The system compounds instead of resetting.

![Without skills vs. with skills](/blog/with-skills.png)
*Same tokens, deeper thinking. Without skills, the AI explores broadly and fails often. With skills, the early branches are pre-solved and the reasoning goes further on the same budget.*

---

## What the Bot Was Willing to Do

When something broke, the bot didn't just report the error and wait. It reasoned through the failure, proposed a fix, and often applied it — patching a script, adjusting a config value, retrying from a different angle.

But it couldn't be fully trusted. I gave it a GitHub token so it could push changes. It would fix something, commit locally, and not push. I had to write explicit rules into \`CLAUDE.md\` — always push, always pull the KB before reading it, never leave uncommitted changes silently — to reinforce the discipline.

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

\`research-and-publish.sh\` was submitting tasks to Parallel AI with \`output_schema: { type: "auto" }\`. \`auto\` mode returns structured JSON — right for batch enrichment pipelines. The script had a second stage that called Bedrock to reformat the JSON into markdown. When that Bedrock call failed silently, the fallback wrote the raw JSON directly to the file. No error surfaced.

[Parallel's Task API](https://docs.parallel.ai/) has a \`text\` mode. One line in the docs:

> *Specifying text schema mode triggers Deep Research with a markdown report output format.*

The change: \`"auto"\` to \`"text"\`. One word. The Bedrock formatting step — 36 lines of bash, temp files, \`jq\` templates, an \`aws bedrock-runtime invoke-model\` invocation, fallback logic, cleanup — was deleted.

Fewer parts. One fewer API call per research run. No silent fallback.

![The Pipeline Simplification](/blog/pipeline-simplification.png)
*One parameter change deleted an entire pipeline stage and its silent failure mode.*

---

## Three Bugs

With \`ingest-voice.sh\` deployed and \`AGENTS.md\` routing voice memos through the full pipeline, a test memo went in. It failed immediately.

**Bug 1: IAM policy mismatch.** \`ingest-voice.sh\` was using \`openclaw-wiki-*\` job names for AWS Transcribe. The IAM policy on the instance role allowed \`openclaw-voice-*\`. These two had never been tested together. Fix: align the script to the working job prefix.

**Bug 2: Non-ASCII in Bedrock request.** \`wiki-integrate.sh\` built a JSON request body that contained em-dashes from the prompt template and whatever Unicode showed up in the transcript. The AWS CLI's \`--body file://\` flag treats the file as text and rejects non-ASCII characters. Fix: \`fileb://\` instead of \`file://\`. One character.

**Bug 3: GitHub Actions metadata extraction.** The workflow used \`grep -m1 '^(title|query):'\` to extract frontmatter fields. The pattern matched \`- Age: 37\` in \`personal/ford-prior.md\` body content — not frontmatter. And the summary extraction piped multi-line JSON into \`echo "summary=\${SUMMARY}" >> \$GITHUB_OUTPUT\`, which GitHub Actions can't parse. Fix: a Python-based frontmatter parser scoped to the YAML block, and heredoc delimiters for all \`\$GITHUB_OUTPUT\` writes.

After those three fixes, the pipeline ran end to end. A voice memo about OpenClaw workshops and Mac Minis produced a source page, \`wiki/concept/workshop-hosting.md\`, \`wiki/entity/hardware/mac-mini.md\`, \`wiki/entity/tool/openclaw.md\`, and an updated wiki index. Subsequent memos built out social circles, home-buying goals, friend entities. The graph was growing from casual conversation.

![The bot in the knowledge-base Telegram thread](/blog/knowledge-base-telegram.png)
*Debugging its own git rebase logic, then immediately ingesting a voice memo about Ford's movie preferences. "doesn't really love movies but favorites: Dune, The Matrix, Interstellar."*

---

## The Bot That Fixed Its Own Code

\`lib/git.sh\` didn't have a retry loop — if a push was rejected because GitHub Actions had concurrently pushed an index rebuild, the script would fail and report \`status: partial\`. The bot diagnosed the issue, wrote a retry-with-rebase loop, and committed it.

On EC2. It did not push.

The fix sat on the instance until a \`git pull\` surfaced commit \`fdcef68\`. The bot had done real developer work — correct diagnosis, clean fix — and then ignored every convention that makes developer work usable. The commit existed. Nobody knew about it. The laptop was deploying old code.

This led to two things.

The **Agent Self-Maintenance Protocol** in \`CLAUDE.md\`: the bot must always push code changes, always pull the KB before reading it, and never leave uncommitted changes silently. \`CLAUDE.md\` is the bot's onboarding document. It cannot be trusted to follow deployment discipline without explicit rules.

And \`make ship\` — a new Makefile target: \`git push origin main && make deploy\`. One command. The gap between "code is on GitHub" and "code is on EC2" had been bridged by human memory. \`make ship\` closes it.

---

## Three Days

All of this took roughly three days.

It was a loop: catch an error, feed it back, watch the fix attempt, verify or redirect. Sometimes the bot fixed the issue itself and I'd tell it to push upstream. Other times I'd copy Telegram outputs — error messages, stack traces, the bot's own confused responses — back into Cursor and apply the fix from there.

Sonnet 4.6 handled most of it. I escalated to Opus maybe five or six times — when the problem required holding too many moving parts at once. Start cheap, go bigger when stuck.

When the SSM session got noisy enough to overwhelm Cursor's context, I adapted: stop executing, give me the commands in sequence, I'll run them and feed the output back.

The bot guided. I typed. The errors came back. The bot guided again.

![The Three-Day Feedback Loop](/blog/three-day-feedback-loop.png)
*Two variants of the same cycle. Bot-driven when it could fix things itself. Human-driven when the environment got too noisy.*

---

## Two Loops

The system now runs on two rhythms.

The phone loop runs daily. Ford sends voice memos, questions, \`/research\` commands. The bot transcribes, publishes, replies. Every interaction adds to the knowledge graph — new entities, updated concepts, accumulated evidence for what Ford cares about. The graph grows without anyone managing it.

The laptop loop runs weekly. Pull the latest from both repos — including any patches the bot committed directly. Review what changed. Tune the workspace files. Edit the tool scripts. Run the 196 Bats tests. Ship.

![Two Loops: How OpenClaw Gets Smarter](/blog/two-loops-development-workflow.png)
*The phone loop runs daily. The laptop loop runs weekly. Both write to the same repos.*

Both loops write to \`rvaopenclaw\` and \`openclaw-research\`. The bot commits fixes, pushes patches, keeps the KB current. The human reviews. Corrections go back through git. The loop closes.

---

## What It Is Now

![OpenClaw: Personal AI Assistant on AWS](/blog/openclaw-system-architecture.png)

One EC2 instance. One Node.js gateway. Port 18789, localhost only. All external access through AWS Systems Manager. On every message: six markdown files assembled into a prompt, session history appended from a JSONL file on local EBS, Bedrock called via the instance's IAM role, response returned. The model is not on the instance — the instance has 4GB of RAM and runs no inference at all. It's a prompt assembler and a caller.

The workspace files together are about 6,650 tokens. [Sonnet 4.6 has a 200,000-token window](https://www.anthropic.com/claude/sonnet). The baseline takes 3.3% of it. \`SOUL.md\` is 38 lines. \`USER.md\` is 17. They say what they need to say and stop.

To change the personality: edit \`SOUL.md\`, run \`make ship\`, send a message. The very next response applies the new instructions. To teach the bot a new tool: add a section to \`TOOLS.md\`. To give it a protocol for a new task type: write it in \`AGENTS.md\`. No redeployment. No restart. No config change. The programming language is English. The runtime is a language model. The deploy target is a filesystem.

Actual cost: ~$125/mo at the usage levels in this series (391 Bedrock invocations in seven days, 1–3 research tasks a day). Lower than estimated because [prompt caching](https://aws.amazon.com/bedrock/pricing/) works: Bedrock caches the 6,650-token workspace files, so most input hits at $0.30/M instead of $3.00/M. Observed Bedrock cost: $28 for the week, not the $44 the raw-input estimate would predict.

At light use: ~$40/mo. EC2 and EBS fixed at $27; Bedrock variable around $9 for ten turns a day.

The largest lever is still model choice. Nova 2 Lite would cut the Bedrock line by 8.6×. But Nova 2 Lite can't follow the workspace instructions. That saving would cost you the assistant.

---

## The Thing It's Building Toward

One memo about kids. One memo about a housing search. One memo from a community meeting. One from a work conversation. One about what Ford doesn't actually like but keeps mentioning anyway. The integration pass extracts entities, creates concept pages, infers relationships. Over weeks, patterns emerge. "Runs trails" becomes a tag on an entity, then a value. "Three kids by the river" becomes a relationship chain. The research reports connect to wiki entities. The wiki entities connect to goals. The goals connect back to values inferred from dozens of voice memos Ford didn't think of as structured data.

The bot learns what you care about not because you entered it in a form, but because you kept talking.

Work life. Community organizing. Professional projects. The versions of you that have never been in the same room, no thread between them.

*What should I do today?*

---

*[← Part 1: You Wanted a 24/7 AI Assistant. Here's What Broke First.](/blog/you-wanted-a-24-7-ai-assistant)*
*[← Part 2: It Was Online. It Was Useless.](/blog/it-was-online-it-was-useless)*`,
};

export const blogPosts: BlogPost[] = [part1, part2, part3];
