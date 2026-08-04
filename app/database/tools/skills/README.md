# Database / ontology skills

Claude Code only auto-discovers skills from `.claude/skills/`, so the skill content
lives there; this folder indexes the database-facing ones.

- **ontology-ingest** (`.claude/skills/ontology-ingest/SKILL.md`) — routing rubric +
  signal-strength scale for turning source material (transcripts in
  `../../ontology/raw_transcripts/`, documents, emails) into batch Cypher saved to
  `../../batch/auto-assignments/`. Decides which ontology element each fact maps to
  (Note vs Plan vs Query vs Implementation vs Person vs Tool) and how strong the
  evidence must be for each node and edge. A decision manifest (all decisions under
  clear headings, with reasoning) is presented for user approval BEFORE any Cypher
  is written or run. Invoke with `/ontology-ingest` or just ask to "ingest this
  transcript".

- **stakeholder-interview** (`.claude/skills/stakeholder-interview/SKILL.md`) —
  the upstream of the ingest: recons the graph before each stakeholder interview
  and generates a one-page guide (`../../ontology/interviews/`) with follow-ups,
  open Queries to settle live, and SI coverage gaps to probe, plus the standing
  interview protocol and transcript-hygiene habits. Invoke with
  `/stakeholder-interview` or "prep an interview with X".

Ingest output is validated and executed only through the standalone runner
`python -m app.database.cypher_runner.run_file <file> [--execute]`; curated
single-query recon lives in `app/database/cypher_runner/run_query.py`.

Related but app-lifecycle rather than ingest: `/semester-migration`,
`/accessibility-scan` (also in `.claude/skills/`).
