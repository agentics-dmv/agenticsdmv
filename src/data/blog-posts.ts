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

A note before you start: this is an engineering diary, not a tutorial. The mistakes are in here because the thought process is the thing. Polishing it into a case study would kill that.

All of this — deployment through voice pipeline through research library — happened over three days.

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

The thing that makes this interesting isn't the stack — it's how you program it. Six markdown files on disk get injected into the prompt on every message. \`SOUL.md\` is the personality. \`USER.md\` is who you are. \`AGENTS.md\` is the operating manual. \`MEMORY.md\` is curated long-term facts. Together they're about 6,650 tokens — 3% of the model's context window. The bot always knows who it is, who it's talking to, and what its tools are, without you having to re-explain anything.

To change the personality: edit \`SOUL.md\`, run \`make ship\`, send a message. Next response follows the new instructions. No redeployment, no restart, no config change. The programming language is English. The runtime is a language model. The deploy target is a filesystem.

**Cost:** EC2 runs $26.93/month fixed. Everything else scales with use. At light use, total is ~$40–60/month. At moderate use, ~$125/month. The biggest lever is model choice — Nova 2 Lite costs 8.6× less than Sonnet 4.6, but Nova 2 Lite doesn't reliably follow a 6,650-token system prompt. That saving costs you the assistant.

---

## Three Days to Build It

AWS credits from a hackathon, expiring. The local AWS meetup needed a demo. The harder constraint: I didn't understand OpenClaw yet — not the paradigm, not what the workspace files were doing, not why the agent behaved differently depending on their contents. The plan was to deploy first and understand by running.

The [official CloudFormation template](https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock) handled everything: IAM role, security groups, user-data script installing OpenClaw from npm, systemd service, Bedrock connected. Stack came up in 8 minutes.

Then WhatsApp — and three hours of fighting a platform that wasn't designed for this use case. SSM port forwarding drops WebSocket connections; WhatsApp's pairing flow depends on them. Trying to work around it corrupted the config file twice. Then the health monitor started triggering automatic reconnects, which the underlying library retried on exponential backoff until the phone account got rate limited.

![The WhatsApp Death Spiral](/blog/whatsapp-death-spiral.png)
*Twenty gateway restarts, hundreds of failed reconnect attempts, one rate-limited phone number. [→ Bugs 2 & 3](#bug-2-ssm-port-forwarding-and-websockets-dont-mix)*

Telegram: ten minutes. Bot token from @BotFather, one config key change, one restart. No QR codes, no pairing flows, no credential state to corrupt.

The research system came next. The design was done before any code: flat JSON index (not a vector database — at 500 files the index fits in ~15k tokens, well within Sonnet's 200k window), async callbacks so the gateway doesn't hold open a connection for 10 minutes, OIDC-authenticated GitHub Actions for the notification loop. A research file lands in the repo, Actions rebuilds the index, SSM notifies the running gateway. No static credentials, no open ports.

Then the voice pipeline — which revealed that every voice memo sent since Telegram was connected had been silently ignored.

OpenClaw, when it receives a voice message, downloads the file locally and appends a text annotation to the prompt: \`[media attached: voice_abc.oga]\`. Text. File path. No audio. No transcription. The agent saw a path to a file it couldn't read and said nothing.

![Voice → Wiki](/blog/voice-to-wiki-conceptual.png)
*The idea: voice memo becomes a wiki node. First we had to notice it wasn't happening. [→ Bug 6](#bug-6-voice-memos-were-silently-ignored)*

Building the actual pipeline was straightforward. What wasn't: deploying it and finding the bot denied it could transcribe audio at all. Moved the capability description to the top of \`AGENTS.md\`. Denied again.

Checked the logs. The model wasn't Sonnet 4.6. It was Amazon Nova 2 Lite — a fast, cheap model optimized for speed, not instruction-following at long context. The model upgrade had been set in the config on the developer's machine, but the change had never been saved to the running config on EC2. Every response since deployment had come from Nova 2 Lite.

![The Model-Class Cliff](/blog/model-class-cliff.png)
*Same workspace files, same instructions. Nova 2 Lite ignored them. Sonnet 4.6 followed them. [→ Bug 7](#bug-7-the-wrong-model-was-running)*

One \`sed\` replacement to swap the model ID. The personality took hold. The protocols started working.

With Sonnet 4.6 actually running, the tool scripts looked obviously rough. A half-day refactor, 196 Bats tests, and it felt stable enough to hand off to the model for maintenance.

---

## How It Runs Now

The system runs on two rhythms.

**Phone loop (daily):** voice memos, questions, \`/research\` commands. The bot transcribes, publishes, replies. Each interaction adds entities, concepts, and relationships to the knowledge graph. The graph grows without anyone managing it.

**Laptop loop (weekly):** pull the latest from both repos — including patches the bot committed directly. Review what changed. Tune workspace files. Edit tool scripts. Run tests. Push.

![Two Loops: How OpenClaw Gets Smarter](/blog/two-loops-development-workflow.png)
*Both loops write to the same repos. The bot commits during the phone loop. The human reviews during the laptop loop.*

The "bot committed directly" part required governance that didn't exist until the bot demonstrated it needed it. It diagnosed a bug in its own git retry logic, wrote the fix, committed it — and didn't push. The fix sat on the EC2 instance for days, invisible. The agent had write access to its own infrastructure but no deployment discipline. Two things came out of this: an explicit self-maintenance protocol requiring push after every commit, and a \`make ship\` target that pushes to GitHub and syncs to EC2 in one command. [→ Bug 8](#bug-8-the-bot-committed-a-fix-and-didnt-push)

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
