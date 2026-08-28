# OBIE — Ontology-Based Information Extraction
## Design brief for a LinkedIn article graphic + workflow diagram

**Audience:** LinkedIn professional readership — higher-ed IT, accessibility, knowledge-management,
and applied-AI people. The graphic must be legible to someone who has never seen a knowledge
graph. One hero graphic (the cycle) plus optionally 2–3 small supporting panels.

**The one-sentence pitch:** Instead of asking an LLM to summarize documents, we give it an
*ontology* — a formal model of what counts as evidence and what "good" means — and every
interview, web page, and document is extracted INTO that model, then graded AGAINST it.
The knowledge graph gets sharper every cycle; the AI never free-associates.

---

## The core idea to illustrate

**The ontology sits in the center. Everything orbits it.**

The ontology is a knowledge graph that defines, in advance:

- **What exists** — programs, processes, services, policies, people, tools, documents
- **What counts as evidence** — an explicit "companion bar" per success indicator:
  named requirements (Position, Budget, Procedures, Output) a campus must meet
- **What "good" means** — a six-level maturity rubric (Not Started → Initiated → Defined →
  Established → Managed → Optimizing)
- **How strongly things connect** — every evidence link carries qualifiers:
  *strength* (0–3), *control* (who runs the practice), *satisfies* (which specific
  requirements it answers), and *rationale* (the written argument for the link)

Information doesn't get "summarized into" this graph. It gets **extracted against it** —
routed to a specific node type, graded for signal strength, and wired with explicit,
reviewable claims.

---

## The workflow — four stations around the graph (the hero diagram)

A **cycle** around a central knowledge-graph icon, four stations. **Every label on the
diagram must be in the worker's voice** — a thing a person would actually say or do,
never a compressed abstraction. "One page, built from gaps" means nothing on a slide;
"I walk in knowing why every question exists" is a person you can draw. Each station
below gives you the scene, the single moment to draw, and labels ready to place.

### Station 1 — PREPARE
**The scene:** Before I talk to anyone, I ask the graph what it already knows about
this person's corner of the campus — and, more importantly, what it doesn't. Which
requirements of the maturity bar have nothing behind them? Which questions did the
last meeting leave open? The guide that comes out fits on one page, and every question
on it exists because a specific piece of evidence is missing. I walk into the room
knowing exactly why I'm asking each thing.

**Draw this moment:** a person holding a one-page checklist; behind them, the graph
with a few nodes lit and several conspicuously dark — the dark ones have dotted lines
running to the questions on the page.

**Labels that work:**
- "The graph writes my interview guide"
- "Every question traces to a missing piece of evidence"
- "Open items from last time come with me"

### Station 2 — INTERVIEW
**The scene:** I start by having everyone say and spell their full name — because a
transcript once turned "Zach Oshri" into "Zach Autry" and it cost a day to untangle.
Then the heart of it: "Walk me through last term, step by step. The last course you
remediated — what actually happened?" Past-tense, concrete questions get me facts;
"tell me about your process" gets me brochure copy. When someone describes a plan, I
ask one follow-up that sorts everything: "Is that funded, or is it something you want?"
At the end I read the action items back out loud, into the recording — the recap is
the most extraction-ready minute of the whole hour.

**Draw this moment:** two people at a table, a recorder between them; the
interviewer's speech bubble says "Walk me through last term" — and the answer is
visibly separating into three labeled streams: WHAT HAPPENS (solid), WHAT'S PLANNED
(dashed), WHAT'S HEARSAY (faint).

**Labels that work:**
- "Say and spell your full name"
- "Walk me through last term, step by step"
- "Is that funded, or just wanted?"
- "Read the action items back, out loud"

### Station 3 — EXTRACT
**The scene:** Before anything is written to the graph, every page and document the
conversation mentioned gets opened and its actual text copied in next to the link —
so the extraction reads what the page says, not what its title implies. One page
404s; that's not a failure, that's a finding: the link is rot and now the graph knows.
Then, statement by statement, the transcript gets routed: "we do all the PDFs" is an
operating process; "we're setting up the contract" is a plan, never a process; "should
we buy the site license?" is an open question with a named decider. When I'm not sure,
I file it as a note — a note is recoverable; a fabricated process poisons the well.
And before one write happens, everything lands on my screen as a list of judgments —
this became a Process because she runs it; this stayed a Note because it's secondhand —
and I approve the judgments, not the syntax.

**Draw this moment:** a person at a screen reviewing a checklist of decisions, finger
on an APPROVE button; to one side, pages being pulled into the graph (one stamped
404 — LINK ROT); below, transcript lines sorting down a ladder into
Process / Plan / Question / Note, with one line dropping all the way to the bottom.

**Labels that work:**
- "Read the page, not the title"
- "A dead link is a finding, not a failure"
- "'We do it' becomes a Process. 'We will' only ever becomes a Plan"
- "When unsure, file it as a note — notes are recoverable"
- "I approve judgments, not syntax"

### Station 4 — REVIEW
**The scene:** I load the standard before I look at a single piece of evidence — read
the bar first, or I'll anchor on what exists and talk myself into a grade around it.
Then I walk the requirements one by one. Where something claims to satisfy a
requirement, I read the written reason on that link and test it: does the work
actually deliver what the sentence asks? Sometimes a claim doesn't hold — and a wrong
claim is worse than none, because the dashboard shows that gap as closed. Sometimes
work delivers a requirement nobody claimed — that's missing wiring, not missing
practice, and I say which. Plans never raise a grade. When I'm torn between two
levels, I pick the lower one and write down exactly what would earn the higher. My
review gets filed on the record — the next review starts by reading mine.

**Draw this moment:** a reviewer holding evidence cards up against a wall-mounted
bar chart of requirements; one card fits its slot (MET), one is taped over a slot it
doesn't fill (OVERCLAIMED), one slot has work piled under it unconnected
(UNCLAIMED BUT MET), one slot is empty (BARE).

**Labels that work:**
- "Read the standard before the evidence"
- "A claim is an assertion, not proof"
- "A wrong claim is worse than no claim"
- "Torn between two grades? Take the lower — and write down what earns the higher"
- "The next review starts by reading mine"

### …and the loop closes
**The scene:** my review's open gaps are next cycle's interview questions. The person
at Station 1 is me, three months from now, holding a guide the graph wrote from what
I just filed.

**Label:** "What I couldn't prove today is what I'll ask about next time."

---

## Supporting panels (optional smaller graphics)

**Panel A — The signal-strength ladder.** Five rungs, S1 at top. Show one quote per
rung and where it lands in the graph (Process / Plan / Query / Note / omitted).
This is the most shareable single visual: it shows the discipline.

**Panel B — The four verdicts.** A 2×2-feel table: claimed vs. delivered.
Met (✓✓) / Overclaimed (✓✗ — *"worse than no claim: it reports a gap as closed"*) /
Unclaimed-but-met (✗✓ — *"missing wiring, not missing practice"*) / Bare (✗✗).

**Panel C — One evidence link, annotated.** A single edge between "Canvas Remediation
Process" and "Indicator 7.5" with its four qualifiers labeled: strength=2,
control=internal, satisfies=[Procedures, Output], rationale="…". Shows that in OBIE,
*the relationship itself carries the argument.*

---

## Visual language suggestions

- Center: a graph/constellation motif (nodes + edges), clearly the anchor of the cycle.
- The four stations as a ring; **artifacts** (guide, transcript, manifest, review
  note) drawn as small documents traveling along the arrows — the artifacts make
  the flow tangible. Mirrored source pages appear as small page-icons feeding the
  graph at the Extract station, not as a stop on the ring.
- The human-approval gate at Station 3 should be visually explicit — a checkpoint,
  not decoration. This is a human-in-the-loop story; that gate is the credibility.
- One accent color for "the standard" (rubric/bar), one for "the evidence" —
  Station 4 (Review) is where the two meet.
- Tone: engineering-diagram clarity over infographic gloss. This audience trusts
  boxes and arrows more than illustrations.

## Phrases available as pull-quotes (worker's voice)

- "The graph writes my interview guide — every question traces to a missing piece
  of evidence."
- "Is that funded, or just wanted?"
- "'We do it' becomes a Process. 'We will' only ever becomes a Plan."
- "When unsure, file it as a note — a note is recoverable; a fabricated process
  poisons the well."
- "I approve judgments, not syntax."
- "Read the standard before the evidence, or you'll talk yourself into a grade."
- "A wrong claim is worse than no claim — the dashboard shows that gap as closed."
- "What I couldn't prove today is what I'll ask about next time."
