# Writing style

The prose counterpart to `claude_files/design-sense.md`. That file governs how the
app looks. This one governs how it reads.

## The principle

Every word carries content the reader needs, and the reader never rebuilds what the
writer left out.

Prose fails this in two ways. **Decoration** puts form where content should be:
praise words, stock frames, and rhythm chosen for its sound. **Withholding** leaves
a gap the reader has to fill: a hidden actor, a placeholder, an undefined term, a
link between two sentences that nobody stated. Each rule below closes one of those
failures. When a case comes up that no rule covers, ask which failure it is.

The result should read like a specific person who knows the subject. Not a
consultant deck.

## Scope

The guide covers every piece of prose written for this project. That includes node
text (Recommendation detail, Concern detail, Plan description, Note content),
follow-up emails, interview guides, reports, commit messages and code comments.

**Text pasted in for editing** keeps its content, claims, point of view, tense and
person (I, you, we). Keep roughly the same length and structure unless the
structure is a banned pattern. Invent no stories, numbers or promises. Return only
the edited text.

## When the rules give way

The guide does not ban ordinary English. Most rules govern how a word is used, not
whether it appears. A rule that makes a true sentence impossible to write is a bad
rule, and these exceptions override everything below.

**Quoted material is never edited.** A transcript, a policy, a web page or a
person's own sentence keeps its words. If Cheryl said the process is seamless,
that is what she said.

**Success indicator text is quoted, not paraphrased.** The Chancellor's Office
wrote the text. Indicator 8.11-ins reads "Campus has integrated accessibility into
faculty orientations" and 1.21-web says "in alignment with CSU policy." Those
words go in as written.

**Existing node titles and identifiers stay as they are.** "Alt Media Request &
Fulfillment Automation" is the name of a node. Renaming it to satisfy a style rule
breaks every reference to the node.

**Standards vocabulary is not negotiable.** Perceivable, Operable,
Understandable, Robust. Conformance, alignment, findings, remediation.

## Words

**Words that are never right here.** These carry no literal meaning in this
domain. They are decoration.

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

**Words that are fine as facts and wrong as praise.** These have real meanings. Use one
when it tells the reader what a thing is, how it is built or how far it reaches. "Structural" fits a property of how the model is built, "systemic" a barrier
that recurs across a product, and "explicit" a value the requester states rather than one
the review infers. The same word is wrong when all it says is that something is good.

robust, findings, integrated, align, alignment, potential, automate, automation,
scalable, scale, transparent, reliable, efficient, dynamic, predictive,
proprietary, personalized, adaptive, versatile, intuitive, seamless, optimize,
streamline, smart, intelligent, insightful, proactive, customizable,
data-driven, agile, enhance, highlight, emphasize, underscore, foster, leverage

The test is to replace the word with a measurement or a mechanism. Keep the word if the
sentence still says the same thing, or if the word is the shortest accurate name for the
mechanism and the reader understands faster with it. If the sentence gets weaker but more
honest, the word was praise.

Working: "WCAG 2.1 requires content to be robust." Robust is one of the four
principles, and no other word names that principle.

Praise: "a robust remediation pipeline." Say what the pipeline does. It processes
400 PDFs a term, or it has run without manual intervention since March.

**Name the thing, not a placeholder.** A sentence that leans on "do it", "this",
"the work" or "a way to do it" has postponed its content. The reader holds an empty
slot and fills it from earlier in the passage.

Wrong: "We need a systematic way to do it."
Right: "We need to grade evidence systematically."

The fault is the empty word, not its position. Ending on a preposition is fine.
"The platform we moved to" beats "the platform to which we moved".

**Do not end on a tracking pronoun.** A clause that closes on "it", "them" or
"this" ends on its weakest word and sends the reader back for the referent. End on
the noun, an active verb or a concrete object.

Wrong: "Faculty upload the files, and students depend on them."
Right: "Students depend on the files faculty upload."

The same holds mid-sentence when "it" could point at two nouns. In "a finding records
a barrier and names the users it affects", "it" could be the finding or the barrier.
Repeat the noun.

Wrong: "A finding records one barrier. It names the users it affects and the task it
gets in the way of."
Right: "A finding records one barrier. It names the users the barrier affects and the
core task the barrier blocks."

**Define a term before using it.** Define each term the first time it appears,
using plain language or terms defined earlier on the page. A definition that leans
on a later section, or on another undefined term, defines nothing. A reader
starting at the top must understand each sentence from what came before. Pronouns
and "that X" follow the same rule, so "how far the reviewer can trust that
description" fails when no description was named.

Wrong: "The outcome in the cell is the grade," before the reader has seen a grid.
Right: "Each pairing of an Exposure level with a Severity level has a fixed risk
grade."

**Define a secondary term inside its first mention.** A secondary term serves a primary one.
Examples are a holding state, a threshold, a component of a score or a value set. A sentence of
its own gives the secondary term the weight of a primary object, and the reader has to link the
sentence back. Embed the definition at the first mention, as a modifier or a short appositive.
Primary terms, the objects the document is about, keep their own definition sentence.

Wrong: "A review ends in a final decision or holds in a route. A route is a hold state with no
final decision, pending submission of the documentation the route names. The final decision
takes one of four values."
Right: "Reviews either conclude with one of four final decisions or remain paused in a named
routing state pending documentation submission."

An embedded definition still has to come before any later use of the term, so the rule above
still holds. Stop embedding once the modifier is longer than the clause that carries it. At that
point the term is primary in this passage and has earned a sentence.

**Qualify generic nouns.** A key concept named with a generic word (grade, result,
score, process, status) leaves the reader guessing which of several is meant. Add
the qualifier that says what produces the concept or what it measures. "Risk grade"
separates the result of the risk factors from the final decision. "Grade" alone
does not.

**Hold terms steady.** One word per thing, for the length of the document. A Query
stays a Query throughout, never a question, an item or an open point.

**Describe states with domain terms, not action sequences.** A conversational verb
or an explanatory clause spells out how a person does something, step by step.
Compress that loop into the domain-specific noun phrase that names the step. The
sentence then states the technical condition of the system instead of giving
instructions. "How many people use the product and how much they depend on it"
becomes "audience size and product reliance". "Until someone supplies what the
route asks for" becomes "pending submission of the required documentation".

Wrong: "A route pauses the review before a final decision, until someone supplies
what the route asks for."
Right: "A route halts the review before a final decision, pending submission of the
required documentation."

The compressed term must be one the reader already has or one the document defines
on first use.

**Describe data flows as structure, not sequence.** When prose explains how data
moves through a model, such as answers into groups, scores into bands or counts
into levels, name the structural relation. Mapped, partitioned, aggregated, capped,
gated and mutually exclusive are relations. Chronological verbs (feeds, takes, adds
up, counts, turns, then) and purpose clauses (so that, so no) narrate a process the
reader has to replay before the structure appears.

Wrong: "Seven exposure questions feed four groups, so no fact counts twice."
Right: "Seven exposure questions map uniquely across four distinct groups to prevent
data duplication."

Wrong: "The group levels combine into a score, and the score sets the band."
Right: "The group levels aggregate into one score. Cut points partition the score range
into three bands, and the band containing the score is the Exposure level."

Use each relation literally, and check what it attaches to. A range or a set can be
partitioned, but a single value falls into one partition. "One score, partitioned into
three bands" says the score splits apart, which is false. A trailing appositive
("…three bands, the Exposure levels before floors") must rename the noun right before
it, and it must not lean on a term defined later.

These two rules govern descriptions of how a system or process behaves, such as rubric
definitions, model documentation and code comments. Where a person has to act, as
in a request or a Plan, "Name who acts" still applies, and the sentence names the
person and the verb.

**Stack nouns only into technical terms.** A noun stack that names one technical
concept is a term, however long it is, provided the reader already knows the concept or
the document defines it. "Task-group pair", "Veracity floor", "TAAP accessibility
statement" and "denial shortfall threshold" are terms. A stack that bundles several
abstractions into a label nobody defines makes the reader unpack it. "Product reliance
measurement framework" names nothing the reader can look up.

Wrong: "Accessibility Services publishes the term calendar and faculty
obligations."
Right: "Accessibility Services sets the deadlines faculty work to."

The same fault hides behind a verb when a document is the actor. A page that
"states the obligation", "sets out the framework" or "holds the guidance" is a noun
stack with a verb dropped in. Say what the page tells a person to do.

Wrong: "CIC 47 states the faculty obligation for LMS course accessibility."
Right: "CIC 47 tells faculty to build Canvas courses that meet WCAG."

## Sentences

**Name who acts.** Passive voice hides the actor, and in this project the actor is
usually the finding. "The course is remediated" leaves out the student assistant
who does the remediation. "Responsibility has been assigned" leaves out whether
anyone signed anything. Put the actor in the subject. Passive is right only when
nobody knows who acted, or when the actor genuinely does not matter.

**Name the relation.** Gesture verbs (stands as, sits under, informs, reflects,
represents, carries) leave the link between two things for the reader to guess.
"The note sits under the YSE" is weaker than "the note is attached to the YSE by
has_note". A gesture verb is fine when the relation literally is containment or
conveyance. "The edge carries a strength rating" is true. "This carries our
commitment to access" is not.

**One claim per sentence, where the claims are independent.** A qualification
rides along with the claim it qualifies. Splitting "the page returns 404, which is
link rot rather than an outage" makes it worse, because the second half is not a
separate claim.

**State a determination once, as a hierarchy.** A value often has several facts about it:
what it rates, how it aggregates, what decides it and what does not. Short sentences that
each fix one of those facts split one claim into pieces, and the reader reassembles the
rule. Put the determined value in the subject, its source in the verb phrase, and its
exclusions in a closing "independent of" or "regardless of" phrase.

Wrong: "Product severity is the maximum across the findings. Task effect decides severity.
The conformance label in a vendor report never does, and neither does the level of the
failed WCAG criterion."
Right: "Product severity derives entirely from maximum task impact, independent of vendor
report conformance labels or the failed WCAG criterion level."

This is the case "one claim per sentence" leaves open. Those sentences are one claim
split apart, not independent claims. Stop consolidating when the sentence needs a second
"where" or "with" clause to hold everything, since the hierarchy is then two claims.

**Keep contrast and cause in one sentence.** When the second clause cuts against
the first, join the clauses with "but" or "though". Two sentences delete the
relationship and leave the reader to reconstruct the link.

Wrong: "The content is good. It only reaches people who turn up."
Right: "The content is good, but it only reaches people who turn up."

Cause works the same way. "It is graded Defined because the attendance list is
missing" beats two sentences that leave the link implied.

**Stop compounding.** Two clauses joined by "and" make a sentence. Four make a list
someone forgot to punctuate, and the reader can no longer tell which pairs matter.
Join with "and" only when the second clause depends on the first. Otherwise use a
full stop.

**State facts in the present tense, not framings.** "Attendance is not tracked per
individual" beats "there is an opportunity to improve attendance tracking". "The
record says no formal process exists" beats "it had been recorded as having no
formal process".

**No metaphor unless the metaphor is the argument.** "The holding pen between a
problem being raised and anyone deciding what would close it" earns its place,
because that is what a Concern is.

**No throat-clearing.** Cut any sentence that announces what the writing is about
to do. "It is worth noting that" and "this section covers" advance nothing.

## Rhythm

Rhythm is where decoration hides best, because a pattern can sound right while
saying nothing.

**No stock frames.** Consultant prose runs on templates. Each one below sounds like
an insight before any content arrives. Uplift endings belong to the same family.

- "In a world where [change], [virtue] becomes [advantage]." Say "Today, [specific
  change]. So [practical implication]."
- "Most people [lazy thing]. The few who [disciplined thing]." Say "Among [group],
  [specific observation]. What works is [tactic]."
- "Stop [X]. Start [Y]." Say "If you are doing [X], switch to [Y] when
  [condition], because [reason]."

**No rule of threes, no balanced pairs.** A triple such as "how it works, what it
does, and why it matters" repeats one frame three times, so the reader hears the
pattern before the content. A balanced pair such as "how many people use it and how
much they depend on it" does the same with two. Say the thing once, in the words it
needs.

Wrong: "The review checks who uses the product, how often they use it, and what
they use it for."
Right: "The review checks product reach. Frequency of use matters less."

**Make sentence length uneven.** A paragraph of medium sentences reads as one flat
tone. Follow a long sentence with a very short one, placed where the point lands.
Dense passages need this most, since a paragraph carrying WCAG, UDOIT and three
product names gives the reader nowhere to rest. Alternating long and short on a
fixed beat is a pattern too, and the reader hears the beat.

**Lists are for items, not cadence.** Grammatical parallelism inside a real list is
required, and it is the only parallelism the guide allows.

- Keep list items the same shape. "Dated waves, a one-page checklist for this year,
  and workshops through the term" changes form twice, so the reader restarts each
  time. Make the items match, or say the thing in a sentence.
- Use bullets for defined terms (outcome values, labels, levels, field names,
  document titles), so each one stands as a term. Keep ordinary concepts in the
  sentence, separated by commas.

Wrong: "The final decision is always Approve, Approve with TAAP or Deny."
Right: a bulleted list of the three values.

Wrong: a bulleted list of "audience", "reach", "duration".
Right: "Exposure combines the product's audience, reach and duration of use."

## Reference documents

Rubrics, glossaries, specifications and decision tables are read to look something up,
not from top to bottom. The rules in this section govern the shape of those documents.
Every other rule in the guide still applies to the sentences inside them.

**Give each term a labelled entry.** In a terms section, put each term in a bold label,
followed by a definition that opens on the defined thing. "**Barrier.** The effect of a
nonconformance on one core task…" is easier to find than a paragraph with the term in the
middle. The opening fragment may drop "is". That fragment is the only sentence fragment
the guide allows. Group the entries under headings that name what the entries share.
Secondary terms still go inside the entry of the term they serve, as the rule on
secondary terms requires.

**Keep a term's facts in its entry.** Facts about a term belong inside that term's entry.
These include what the term attaches to, its scale, and the other names other documents
use for it. A paragraph after the list that adds facts about one item splits one subject
in two.

**Pair every item with its key.** When a list corresponds to numbered rules or to another
list, label each item with its key, as in "**Route 1.** Referred for a formal
determination". A list the reader has to match by position makes the reader count.

**Name the rows of a rule table.** Each row of a decision table, or each line of a code
block of conditions, carries a short name for the case the row decides. Prose and
discussion can then cite the row by name. A name describes the condition literally, as in
"more accessible product" or "below the standard at high pressure". A coined label such
as "Market Alternative Override" sounds like a term and misstates the condition.

**One column per kind of fact.** When one table cell holds two kinds of fact, split them
into separate columns. What a final decision requires and how long it lasts are two
kinds of fact.

## Paragraphs

**Follow one subject.** Consecutive sentences that each open on a different actor
make the reader rebuild the connection every time. Follow one person or one thing
through the passage, and let the others enter as they act on that subject. Where
the subject has to change, name the relation in the sentence where the change happens.

**Each sentence licenses the next.** If sentence three still makes sense with
sentence two deleted, sentence two was decoration.

**A paragraph holds one argument.** Sentences that build a single argument belong
together. Breaking each onto its own line puts white space where the reasoning
should be. Start a new paragraph when the subject changes, not when the sentence
ends.

**Repeated shape means nobody is acting.** If every sentence in a paragraph runs
[document] [verb] [abstract noun phrase], the paragraph is a list of labels. Find
the people. Ask who writes the document, who runs the process and who is left out.

## Messages someone acts on

**State a request as a request.** An ask is an imperative or a direct question,
with the actor named. A noun phrase reads as a topic heading, so it gets filed
rather than answered.

Wrong: "Cheryl, the attendee list and the slide deck you offered."
Right: "Cheryl, please send the attendee list and the slide deck you offered."

Wrong: "A correction I have already made, which you may want to argue with."
Right: "Tell me if I have this wrong, and I will change it back."

**Write an inference from the record as a question.** When you worked something
out from their pages rather than hearing it from them, ask. A statement announces
that you have already decided, and the correction you wanted becomes an argument.

Wrong: "The Learning Circles already solve that."
Right: "Do the Learning Circles already solve that?"

The checkable facts around the inference stay as statements. "They pay 800 dollars
a semester to a lead facilitator" is printed on the page. Whether that payment
solves the problem is a reading of the page, so it is a question.

**Do not pre-empt the answer.** A verdict stated before the question closes the
question, and it invites a defence instead of a correction.

Wrong: "Graded Defined, and I think that is now wrong."
Right: "Graded Defined."

## Register

The rules above govern sentences. Register governs the shape of the whole piece,
and getting it wrong wastes prose that passes every other test. Three readers
recur in this project.

**An executive** reads one document and has to describe it afterwards, in a
meeting, without opening what sits underneath. A provost, a vice president, a
Chancellor's Office reviewer. Open with the assessment in one sentence they can
repeat. Spend the middle earning that assessment with named specifics, enough that
a claim like "interconnected" is visible rather than asserted. Close on what is
missing.

Do not open on a scene. "There is one way to do this at East Bay, and faculty can
look it up" is clean prose, but it tells a provost nothing in the second they spend
on the first line. Narrative voice suits a piece read for pleasure. It does not
suit a piece read to make a decision.

**A practitioner** runs the work and already knows its shape. Lead with the change
or the ask. Context they supplied is not worth their time.

**Someone you are asking something of** gets the ask as an imperative and your
inferences as questions.

**Keep internal vocabulary out of anything a stakeholder reads.** Evidence strength
ratings, signal tiers, node labels and edge names are how the system thinks. A
recipient cannot interpret them, and explaining them costs more than they are
worth. Use them to decide what to say, then say it in the reader's terms.

Wrong: "ScreenSteps was carrying this indicator at full strength."
Right: "I took ScreenSteps off this indicator."

**Gloss a proper name on first use when the reader is outside the work.** UDOIT,
Verbit, Grackle, PopeTech, Ally and ScreenSteps are real product names, not internal
vocabulary, so they stay as written. One clause makes each legible. "Running the
UDOIT accessibility checker" costs three words and keeps the reader in the
sentence.

## Punctuation

**No em dashes.** Heavy em dash use is one of the clearest markers of machine
prose. Use a full stop when the second half explains the first or is a separate
thought, and parentheses for an aside.

**Avoid colons.** Where a colon would explain the first half, start the next
sentence with the verb. Where it would introduce a list, use "among them" or fold
the items into clauses.

Both rules apply to new writing. Older files are not retrofitted unless a rewrite is
asked for.

## Where this is enforced

Skills that write prose reference this file rather than restating the rules. They are
`/ontology-ingest` (Recommendation, Concern and Plan text), `/follow-up` (message
body), `/stakeholder-interview` (guide body) and `/maturity-status-reviewer`
(rationale, and the Evidence Summary the public report publishes). Rules specific
to one artifact stay in that skill. Rules for all prose live here.
