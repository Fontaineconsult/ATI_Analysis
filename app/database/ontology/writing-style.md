# Writing style

The prose counterpart to `claude_files/design-sense.md`. That file governs how the
app looks. This one governs how it reads.

## Scope

Applies to every piece of prose produced for this project: node text
(Recommendation detail, Concern detail, Plan description, Note content),
follow-up emails, interview guides, reports, commit messages, code comments, and
anything pasted in for editing.

Write like a specific person who knows the subject. Not like a consultant deck.

## What this is not

It is not a ban on ordinary English. Several rules below are about how a word is
used, not whether it appears. A rule that makes a true sentence impossible to
write is a bad rule, and the exceptions section overrides everything else.

## Editing text that was pasted in

Preserve the content, claims, point of view, tense, and person (I / you / we).
Keep roughly the same length and structure unless the structure is a banned
pattern. Do not invent stories, numbers, or promises. Output only the edited
text, with no commentary around it.

## Words that are never right here

These carry no literal meaning in this domain. They are decoration.

delve, realm, harness, tapestry, paradigm, paradigm-shifting, cutting-edge,
revolutionize, unlock, showcase, showcasing, meticulous, meticulously,
unparalleled, synergy, synergize, game-changer, testament, commendable,
groundbreaking, pioneering, trailblazing, unleash, transformative, redefine,
breakthrough, empower, next-gen, next-generation, frictionless, elevate,
effortless, visionary, disruptive, reimagine, state-of-the-art, immersive,
plug-and-play, turnkey, future-proof, always-on, hyper-personalized,
results-driven, machine-first, leading-edge, democratize, AI-powered,
cloud-native, mission-critical, vibrant, intricate, pivotal, crucial, surpass,
boast, accentuate, garner, holistic

## Words that are fine as facts and wrong as praise

These have real technical meanings. Use them when they state what something is.
Do not use them to say something is good.

robust, findings, integrated, align, alignment, potential, automate, automation,
scalable, scale, transparent, reliable, efficient, dynamic, predictive,
proprietary, personalized, adaptive, versatile, intuitive, seamless, optimize,
streamline, smart, intelligent, insightful, proactive, customizable,
data-driven, agile, enhance, highlight, emphasize, underscore, foster, leverage

**The test:** replace the word with a measurement or a mechanism. If the sentence
still says the same thing, the word was doing real work. If the sentence gets
weaker but more honest, the word was praise.

Working: "WCAG 2.1 requires content to be robust." Robust is one of the four
principles. There is no other word for it.

Praise: "a robust remediation pipeline." Say what it does. It processes 400 PDFs
a term, or it has run without manual intervention since March.

## Exceptions that override everything above

**Quoted material is never edited.** A transcript, a policy, a web page, or a
person's own sentence keeps its words. If Cheryl said the process is seamless,
that is what she said.

**Success indicator text is quoted, not paraphrased.** The Chancellor's Office
wrote it. Indicator 8.11-ins reads "Campus has integrated accessibility into
faculty orientations" and 1.21-web says "in alignment with CSU policy." Those
words go in as written.

**Existing node titles and identifiers stay as they are.** "Alt Media Request &
Fulfillment Automation" is the name of a thing. Renaming it to satisfy a style
rule breaks the reference.

**Standards vocabulary is not negotiable.** Perceivable, Operable,
Understandable, Robust. Conformance, alignment, findings, remediation.

## Sentence patterns to avoid

A: "In a world where [change], [virtue] becomes [advantage]."
Instead: "Today, [specific change]. So [practical implication]."

B: "Most people [lazy thing]. The few who [disciplined thing]."
Instead: "Among [group], [specific observation]. What works: [tactic]."

C: "Stop [X]. Start [Y]."
Instead: "If you are doing [X], switch to [Y] when [condition], because [reason]."

Also avoid uplift endings and parallelism used for rhythm.

## Sentence construction

**One claim per sentence, where the claims are independent.** A qualification can
ride along with the thing it qualifies. Splitting "the page returns 404, which is
link rot rather than an outage" into two sentences makes it worse, because the
second half is not a separate claim.

**Contrast belongs in one sentence.** When the second clause cuts against the
first, join it with "but" or "though". Splitting the pair into two sentences
deletes the relationship between them and leaves the reader to reconstruct it.

Wrong: "The content is good. It only reaches people who turn up."
Right: "The content is good, but it only reaches people who turn up."

The same applies to cause. "It is graded Defined because the attendance list is
missing" beats two sentences that leave the reader to infer the link.

**State a request as a request.** Anything you want someone to do is an
imperative or a direct question, with the actor named. A noun phrase is not an
ask, and the reader has to guess what to do with it.

Wrong: "Cheryl, the attendee list and the slide deck you offered."
Right: "Cheryl, please send the attendee list and the slide deck you offered."

Wrong: "A correction I have already made, which you may want to argue with."
Right: "Tell me if I have this wrong, and I will change it back."

This is the most common failure in a message someone is supposed to act on. A
noun phrase reads as a topic heading, so it gets filed rather than answered.

**Each sentence should license the next.** If sentence three would still make
sense with sentence two deleted, sentence two was decoration.

**Name the relation instead of gesturing at it.** Weak: "the note sits under the
YSE." Specific: "the note is attached to the YSE by has_note." Gesture verbs
(stands as, sits under, informs, reflects, represents, carries) are fine when the
relation genuinely is conveyance or containment. "The edge carries a strength
rating" is literally true. "This carries our commitment to access" is not.

**Definitions before uses.** Do not use a term in paragraph one and define it in
paragraph three.

**State facts, not framings.** "Attendance is not tracked per individual" beats
"there is an opportunity to improve attendance tracking."

**Hold terms steady.** One word per thing, for the length of the document. If it
is a Query, it is a Query throughout, not a question, an item, or an open point.

**No metaphor unless the metaphor is the argument.** "The holding pen between a
problem being raised and anyone deciding what would close it" earns its place,
because that is what a Concern is.

**No throat-clearing.** Cut sentences that announce what the writing is about to
do. "It is worth noting that" and "this section covers" advance nothing.

## Em dashes

Do not use them. Use a colon when the second half explains the first, a full stop
when it is a separate thought, and parentheses for an aside.

This is a deliberate anti-tell: heavy em dash use is one of the clearest markers
of machine prose. Applies to everything written from now on. Files written before
this rule are not retrofitted unless a rewrite is asked for.

## Where this is enforced

Skills that write prose reference this file rather than restating it:
`/ontology-ingest` (Recommendation, Concern, and Plan text), `/follow-up`
(message body), `/stakeholder-interview` (guide body),
`/maturity-status-reviewer` (rationale). Rules specific to one artifact stay in
that skill. Rules that apply to all prose live here.
