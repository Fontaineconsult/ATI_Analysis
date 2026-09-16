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

**Active voice. Name who acts.** Passive hides the actor, and in this project the
actor is usually the finding. "The course is remediated" leaves out that a
student assistant does it. "Responsibility has been assigned" leaves out whether
anyone signed anything. Put the actor in the subject and let them act. Passive is
right only when nobody knows who acted, or when the thing acted on is the subject
of the paragraph and the actor genuinely does not matter.

**Do not stack nouns.** Three or more abstractions in a row stop being a phrase
and become a label the reader has to unpack.

Wrong: "Accessibility Services publishes the term calendar and faculty
obligations."
Right: "Accessibility Services sets the deadlines faculty work to."

The same fault wears a verb when a document is the one acting. A page that
"states the obligation", "sets out the framework", "carries the program" or
"holds the guidance" is a noun stack with a verb dropped in the middle. Say what
it tells a person to do.

Wrong: "CIC 47 states the faculty obligation for LMS course accessibility."
Right: "CIC 47 tells faculty to build Canvas courses that meet WCAG."

The tell is repetition of shape. If every sentence in a paragraph runs [document]
[verb] [abstract noun phrase], the paragraph is a list of labels and no one in it
is doing anything. Fix it by finding the people: who writes it, who runs it, who
reads it, who is left out.

**Stop compounding.** Two clauses joined by "and" is a sentence. Four is a list
someone forgot to punctuate. When every sentence in a paragraph runs "X, and Y",
the reader loses which pairs matter, because everything is joined at the same
strength. Join with "and" only when the second clause depends on the first.
Otherwise use a full stop.

**Keep list items the same shape.** A list only reads as a list if its items are
parallel. "Dated waves, a one-page checklist for this year, and workshops through
the term" runs bare-plural, then singular-with-qualifier, then plural-with-
qualifier, so the reader restarts three times. Either make them match or stop
writing it as a list and say the thing in a sentence.

**Vary the length.** A paragraph of medium sentences reads as one flat tone, and
the reader has nowhere to rest. Put a short sentence where the point lands. This
matters most in dense passages: a paragraph carrying WCAG, UDOIT and three
product names needs a four-word sentence in it more than a plain one does.

**Do not jump subjects.** Consecutive sentences that each open on a different
actor make the reader rebuild the connection every time. Follow one person or one
thing through the passage and let the others enter as they act on it. Where the
subject has to change, name the relation in the sentence that changes it.

**State a request as a request.** Anything you want someone to do is an
imperative or a direct question, with the actor named. A noun phrase is not an
ask, and the reader has to guess what to do with it.

Wrong: "Cheryl, the attendee list and the slide deck you offered."
Right: "Cheryl, please send the attendee list and the slide deck you offered."

Wrong: "A correction I have already made, which you may want to argue with."
Right: "Tell me if I have this wrong, and I will change it back."

This is the most common failure in a message someone is supposed to act on. A
noun phrase reads as a topic heading, so it gets filed rather than answered.

**An inference from the record is a question, not a statement.** When you worked
something out by reading their pages rather than hearing it from them, write it
as a question. Stating it announces that you have already decided, and the
correction you were hoping for becomes an argument the reader has to start.

Wrong: "The Learning Circles already solve that."
Right: "Do the Learning Circles already solve that?"

Wrong: "Nobody mentioned it on the call, and it is the strongest thing on that page."
Right: "Is there a reason nobody mentioned it on the call?"

The checkable facts around the inference stay as statements. "They pay 800
dollars a semester to a lead facilitator" is printed on the page, so it is a
fact. Whether that mechanism solves the problem is a reading of the page, so it
is a question.

**Do not pre-empt the answer.** Stating your verdict before asking closes the
question you just opened, and invites a defence instead of a correction.

Wrong: "Graded Defined, and I think that is now wrong."
Right: "Graded Defined."

**Each sentence should license the next.** If sentence three would still make
sense with sentence two deleted, sentence two was decoration.

**One claim per sentence is not one sentence per paragraph.** Sentences that
build a single argument belong in one paragraph. Breaking each onto its own line
puts white space where the reasoning should be, and the reader has to rebuild
the thread that joined them. Start a new paragraph when the subject changes, not
when the sentence ends.

**Name the relation instead of gesturing at it.** Weak: "the note sits under the
YSE." Specific: "the note is attached to the YSE by has_note." Gesture verbs
(stands as, sits under, informs, reflects, represents, carries) are fine when the
relation genuinely is conveyance or containment. "The edge carries a strength
rating" is literally true. "This carries our commitment to access" is not.

**Definitions before uses.** Do not use a term in paragraph one and define it in
paragraph three.

**Keep internal vocabulary out of anything a stakeholder reads.** Evidence
strength ratings, signal tiers, node labels, and edge names are how the system
thinks. A recipient has no way to interpret them, and explaining them costs more
than they are worth. Use them to decide what to say, then say it in the reader's
terms.

Wrong: "ScreenSteps was carrying this indicator at full strength."
Right: "I took ScreenSteps off this indicator."

**Prefer the present tense.** Past-perfect constructions about the state of a
record read as bureaucracy. "The record says no formal process exists" beats "it
had been recorded as having no formal process".

**State facts, not framings.** "Attendance is not tracked per individual" beats
"there is an opportunity to improve attendance tracking."

**Hold terms steady.** One word per thing, for the length of the document. If it
is a Query, it is a Query throughout, not a question, an item, or an open point.

**No metaphor unless the metaphor is the argument.** "The holding pen between a
problem being raised and anyone deciding what would close it" earns its place,
because that is what a Concern is.

**No throat-clearing.** Cut sentences that announce what the writing is about to
do. "It is worth noting that" and "this section covers" advance nothing.

## Register: write for the reader you have

The rules above govern sentences. This one governs the shape of the whole piece,
and getting it wrong wastes prose that passes every other test. Three readers
recur in this project.

**An executive** reads one thing and has to describe it afterwards, in a meeting,
without opening what sits underneath. A provost, a vice president, a Chancellor's
Office reviewer. Open with the assessment in one sentence they can repeat. Spend
the middle earning it with named specifics, enough that a claim like
"interconnected" is visible rather than asserted. Close by answering the question
that follows any stated position: what is missing.

Do not open on a scene. "There is one way to do this at East Bay, and faculty can
look it up" is clean prose and tells a provost nothing in the second they spend
on the first line. Narrative voice is a choice for a piece someone reads for
pleasure or persuasion, and it is the wrong one for a piece someone reads to make
a decision.

**A practitioner** runs the work and already knows its shape. Lead with the
change or the ask. Context they supplied is not worth their time.

**Someone you are asking something of** gets the ask as an imperative with an
actor named, and gets your inferences as questions, per the two rules above.

**Gloss a proper name on first use when the reader is outside the work.** UDOIT,
Verbit, Grackle, PopeTech, Ally, ScreenSteps: these are real product names, not
internal vocabulary, so they stay as written. One clause makes them legible.
"Running the UDOIT accessibility checker" costs three words and keeps the reader
in the sentence, where a bare "running UDOIT" sends them out of it.

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
`/maturity-status-reviewer` (rationale, and the Evidence Summary the public
report publishes). Rules specific to one artifact stay in that skill. Rules that apply to all prose live here.
