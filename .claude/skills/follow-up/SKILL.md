---
name: follow-up
description: Compose the post-meeting follow-up that chases what a meeting left open — a message per community-of-practice × campus, built from the gap table PLUS the prose the table cannot see (notes, source text, the guide's bar elements). Saves it as a FollowUp node wired to the asks it carries. Triggered by "draft the follow-up", "follow up on that meeting", "what do we still need from X", "chase the gaps from the CSUEB interview".
---

# Follow-up — chase what the meeting left open

The third corner of the loop: a guide plans the questions, minutes record what was
said, and a follow-up carries the gaps back to the people who can close them. When
its asks come back settled, the next guide is prepared against a stronger graph.

**The app does not compose this.** It used to, and the failure is the reason this
skill exists — see *Why a template cannot do this* below. The app displays saved
follow-ups, timestamps them, and copies them into an email.

## Step 0 — Recon (read-only)

### 0.1 The gap table — necessary, not sufficient

```
meeting_followup_table(meeting_minutes_id)
```

One row per success indicator the meeting touched, with status, live evidence, and
every open ask (each with its `unique_id` — you need those to wire the message).
"Discussed" is derived: indicators sharing a Note with the minutes.

**An empty ask list does not mean an indicator is settled.** It usually means its
gaps were written as prose. That is the whole reason the next step is mandatory.

### 0.2 The prose the table cannot see — MANDATORY

Read, for every indicator in the table:

- **The notes on the YSE** (`notes_for_yse`) and on the minutes. Artifacts someone
  OFFERED live here, in sentences like *"Cheryl confirmed an attendee list and a
  slide deck exist and can be provided."* That is the highest-value ask in most
  meetings and it is invisible to the table.
- **The minutes body itself** — commitments, hesitations, who deferred to whom.
- **The interview guide** (`get_interview_guide`) — its bar-element tables say what
  each indicator still needs (Position / Budget / Procedures / Output). An element
  probed and found empty is a real gap even with no Query node behind it.
- **Source text** on the implementations' documentation, where a claim can be
  checked against what a page actually says before you ask about it.
- **Prior follow-ups** (`list_follow_ups`) — never re-ask what a previous message
  already asked and got answered. Check `includes_query` status on the old one.

### 0.3 Resolve the slice and the room

One follow-up per **community of practice × campus** — that is the audience sharing
the ground being chased. A meeting spanning two communities gets two messages.
Recipients default to the guide's `prepared_for`.

## Step 1 — Decide what to ask

Ask for the thing that would move the indicator, not for everything outstanding.

| Signal in the record | What to put in the message |
|---|---|
| Someone **offered** an artifact and it has not arrived | Ask for it by name — the strongest ask you have |
| A bar element is empty and one artifact would fill it | Ask for that artifact |
| An open **Query** with a named `answerable_by` | Put it to that person |
| An open **Recommendation** | State it and ask whether they agree it is the right change |
| An open **Concern** | Say the problem, ask who would own the fix |
| Evidence is rated but the rating looks wrong | Ask them to confirm what it covers |
| Nothing outstanding, honestly | Say the indicator looks settled and ask them to correct you |

**Never invent an ask to fill a section.** An indicator with nothing to chase gets a
sentence saying the record looks complete and inviting correction — which is itself
useful, because it is how a wrong Established gets caught.

**Never claim an indicator is fine because its ask list is empty.** Check the prose
first; that inference is exactly the bug this skill replaced.

## Step 2 — Write it

**All prose here follows `app/database/ontology/writing-style.md`** (the project writing style): no marketing vocabulary, no em dashes, one claim per sentence, name the relation instead of gesturing at it, no throat-clearing. Quoted material and success-indicator text are exempt and go in verbatim.


A real message to colleagues, not a report dump.

**Formatting carries the density — not brevity.** A three-column table states six
facts in the vertical space of one sentence, with the links inside it. Cutting
tables to shorten a message is backwards: it removes the compression and leaves
undifferentiated prose, which is what actually reads as a wall. Calibration
(2026-09-02): a draft was tightened from 8,456 to 5,492 characters by deleting
its evidence tables, and came back as *"much worse — there are NO tables,
everything is just separated by a br"*. Length was never the complaint.

**Lead with a summary table.** Indicator, what you need, who from — one row per
ask, names in bold. A reader who opens this on a phone should know within two
seconds whether anything is theirs.

**Then one section per indicator**, in this shape:
- an `##` heading naming the indicator and what it covers
- the current grade with a link to the public record
- an evidence table: what is on file, its strength, and links to the live
  documentation behind it
- the ask in bold, addressed to a named person
- two or three short paragraphs of context

**Prose earns its place by doing something the table cannot.** Say why the ask
changes the grade, what you could not settle from the record, or what you suspect
is wrong. Cut sentences that only prove you did the reading, or restate what the
recipient already knows about their own programme.

- **One ask per indicator.** Pick the thing that moves it furthest; the rest keep.
- **Every ask is an imperative or a direct question, with the person named.**
  "Cheryl, please send the attendee list" is an ask. "Cheryl, the attendee
  list you offered" is a topic heading, and it gets filed rather than
  answered. The summary table follows the same rule: each row is an action,
  not a noun phrase.
- **Name the person in bold at the ask.** With `answerable_by` set, every ask has
  an owner — address them so nobody has to work out which parts are theirs.
- **Link every claim.** The public record for each YSE, the public page for each
  implementation, and the live documentation URL for each claimed artifact. A
  reader who cannot check a claim cannot correct it.
- Quote the record where you want it challenged: *"my notes say the session has
  run for two years"* invites a correction a bare question does not.
- Ask for corrections once, at the end.
- Anything time-critical goes at the top, in one sentence, with the date.

Markdown, in the subset the renderer handles: headings, paragraphs, bullets, pipe
tables, horizontal rules, bold, italic, links. Escape a literal `|` inside a table
cell as `\|`.

**Not supported — do not reach for them:** blockquotes (`>`) and ordered lists
(`1.`) render as literal text in the email. Use a bold lead-in instead of a
blockquote, and bullets instead of numbers.

## Verify before writing — required gate

Present, and STOP:

```
## Slice            community × campus, recipients, and why them
## Asks             each ask, its source (table row / note prose / bar element /
                    guide), and the unique_id it will be wired to
## Not asking       what was outstanding and deliberately left out, one line each
## Corrections      what you are inviting them to correct, and why you suspect it
## The message      the full markdown, as it will be saved
```

The user is reviewing judgment and tone — this goes to real colleagues under their
name. Any change after approval → re-present the delta.

## Step 3 — Save

```
save_follow_up(
  subject, meeting_minutes_id, body_markdown,
  community_name, campus_abbreviation, interview_guide_id,
  recipient_employee_ids,
  covers_year_identifiers,
  query_unique_ids, recommendation_unique_ids, concern_unique_ids,
  created_by_employee_id,
)
```

**Wire every ask you actually made.** Skipping `query_unique_ids` leaves an inert
blob of text and makes "what came back" unanswerable. `generated_at` is stamped
automatically.

Saves as a **draft**. Call `mark_follow_up_sent(unique_id, date_sent)` only once it
has genuinely gone out — an ask still open under a SENT follow-up is a non-response
worth escalating, while the same ask on a draft is just an unfinished chase.

## Step 4 — Close the loop next cycle

When a reply lands: settle the Query (`settle_query`), attach any artifact received
(`/get-source-text` for a link, or the documentation tools for a file), and re-rate
evidence the reply changes. The next `meeting_followup_table` should be visibly
shorter — that shrinkage is the measure of whether this is working.

## Why a template cannot do this

Calibration, 2026-09-02. A generator in the app filled a fixed template from the
table. For `8.11-ins` at CSU East Bay it produced:

> *Nothing is recorded as outstanding against this indicator.*

The note on that same YSE read:

> *"Cheryl confirmed an attendee list and a slide deck exist and can be provided —
> both are still outstanding as artifacts."*

Someone had **offered the evidence in the room** and the message would have gone out
asking for nothing. The gap was in prose, and prose is exactly what a mail-merge
cannot read. That is why composition sits here and not in the application.
