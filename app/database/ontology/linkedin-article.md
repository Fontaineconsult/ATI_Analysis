Accessibility compliance is made of relationships. Store it that way.
Daniel Fontaine · Accessibility Lead, San Francisco Bay Region Network (SF State · Sonoma State · Cal State East Bay)

Every accessibility office hears the same demand: "Show me the evidence." It comes from auditors, from the chancellor's office, from a student with a complaint. At most institutions the honest response is a scramble through spreadsheets, inboxes, and shared drives.

The policy exists. The work happens. But the distance between "we have a policy" and "we can prove it" is wide, and no one manages it. Accessibility makes this worse than most compliance domains, because every unit touches it and no unit owns it.

The gap survives because of how we store the evidence. That is the argument of this piece.

A compliance claim is a chain
A compliance claim is not a fact about one thing. It asserts a chain: a law requires a policy. The policy sets a measure. Work ran against that measure. A record proves the work — at one campus, in one year.

Here is a real chain from our system. Section 508 informs a campus goal. The goal carries success indicator 7.11: build accessibility into how the library acquires, digitizes, and maintains its collections. For one campus and one year, that indicator holds an evidence record. The library's e-resource acquisition procedure stands as the work behind it. The procedure document proves the work. Five links. Remove any one and the claim fails — quietly.

No link proves anything alone. A signed policy proves nothing about a library database. A remediation project proves nothing unless it names the system it fixed. A status of "Established" proves nothing unless evidence sits under it.

If the claim is a chain, the evidence is the set of links. Whatever stores the evidence must store the links.

[GRAPHIC 1 — one real evidence chain, law to document · article-graphics/graphic-1-evidence-chain.svg]

Tables throw the links away
Compliance records live in tables: spreadsheets, report templates, tracking systems. A table stores rows about single things. The links survive only as prose in a notes column, where the same people, systems, and projects appear again and again as text. A mention is not a connection. You cannot query a mention, count it, or follow it.

That is why the year-end report costs so much work. The links the report needs were never stored, so every year someone rebuilds them from memory and old email.

[GRAPHIC 2 — flat rows against the web of links they describe · article-graphics/graphic-2-table-vs-graph.svg]

Graphs store the links
A graph database stores two kinds of record: things, and the links between them. A link has a type, carries its own data, and points at the two things it connects, so a query can follow it in one step. The whiteboard picture of circles and arrows is a fair picture of what sits on disk. We use Neo4j — mature since 2007, free in its open edition — but the argument does not depend on the vendor. It depends on the shape of the data.

The model matters more than the database
A graph without rules is a pile of arrows. The real work is the ontology: name every kind of thing, define each one where users can read the definition, and state what may link to what. Ours separates five layers, because they change at different speeds.

Mandates. Laws, policies, directives, guidelines. They change rarely. They point at the goals they inform.

Measures. Goals and success indicators — the CSU reporting framework. This is shared reference data: one indicator record serves every campus. Our current cycle tracks 122 indicators.

Evidence. One record per indicator, per campus, per year, carrying that year's status from Not Started to Optimizing. This is the only layer that belongs to a year.

Work. Processes, projects, procedures, and services — things that operate. Each links to the evidence it supports, the systems it fixes, the tools it uses, and the group accountable for it.

Things and people. The systems whose accessibility the institution must maintain, the interfaces where a barrier meets a person, and the people themselves — with their roles, working groups, and communities of practice.

Two distinctions in the model do the most work.

Accountability is a link, not a label. "The web team owns this" is a link you can query, not a word in a cell. So is stewardship: who procured a system, who maintains it, who uses it. The model keeps "who keeps this accessible" separate from "what work fixes it" — and that separation exposes the most dangerous shape in the domain: a system with a steward but no remediation work behind it. Under Title II, that gap belongs to the institution. In our graph, it is one query.

Time is part of the model. Only evidence is year-scoped. At year end nothing is assembled and nothing is overwritten. The new year copies the living context forward and lets the dead rest: retired work stops at its final year, deprecated documents stay with theirs, departed staff stop carrying assignments forward. An indicator retired in 2024 keeps its history on screen. An indicator introduced for 2026 cannot leak into 2023's record. Each year closes like a book and stays on the shelf.

[GRAPHIC 3 — the five layers, with evidence as the only year-scoped one · article-graphics/graphic-3-five-layers.svg]

What the right storage buys
Missing proof shows itself. In a table, a gap is invisible: the status cell still reads "Established." In a graph, a claim without proof is a shape. One query returns every such claim before an auditor finds one.

[GRAPHIC 4 — the same chain with the document missing · article-graphics/graphic-4-missing-proof.svg]

The report becomes a snapshot. Evidence accumulates all year against the records that will be reported. Set a review date, have each responsible person confirm their links, and the report is done when the checks are done.

The stakeholder map comes free. Communities of practice — library, alternative media, faculty development — link to the indicators their work supports, and people link to their communities. One query then answers the question every evidence hunt starts with: who do I talk to about this claim? When I prepared to interview our library dean about indicator 7.11, the graph volunteered her counterpart at East Bay. No table would have made that introduction.

People and machines read the same meaning. Every type of thing, every field, and every type of link carries its definition inside the database. No one guesses what a column heading meant in 2023 — and the same definitions let AI tools work against the graph without inventing their own.

[GRAPHIC 5 — three years of evidence accumulating on one indicator · article-graphics/graphic-5-three-years.svg]

At SFBRN we are testing this argument in practice: one graph carrying the accessibility evidence for SF State, Sonoma State, and Cal State East Bay, from federal mandate down to the individual document, for every indicator, every campus, every year. I presented the work at the second annual ATI Summit at CSU Monterey Bay. If "show me the evidence" makes your stomach drop, I'd like to hear how your campus handles it.
