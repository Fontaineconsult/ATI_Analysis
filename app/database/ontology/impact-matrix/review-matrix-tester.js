/**
 * The review tester page: an Alpine.js component over review-matrix.js.
 *
 * Three parts. `fillStatic` renders the parts of the form whose option lists come from the
 * model (kinds, floors, exposure answers, evidence, TAAP requirements) as plain markup before
 * Alpine starts, so x-model binds to selects that already hold their options. `definitionsHtml`
 * renders the Definitions section, which dump-definitions.js reads for the rubric document,
 * so it never depends on Alpine or the network. `Alpine.data('tester')` holds the review and
 * derives the determination from it.
 *
 * Prose follows app/database/ontology/writing-style.md.
 */
(() => {
  const M = window.ReviewMatrix;
  const label = (s) => s.replace(/_/g, ' ');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const FACTORS = M.GROUPS.flatMap((g) => g.factors.map((f) => ({ ...f, group: g.id })));
  const HOLD_TEXT = Object.fromEntries(M.HOLDS.map((h) => [h.id, h.text]));
  const REQUIRES_TEXT = {
    serves_everyone_from_day_one: 'The plan serves every affected person from day one',
    best_meets_record: 'A best-meets record with market research (Section 508 E202.7)',
    exception_record: 'A written undue burden or fundamental alteration determination by the president or a designee (28 CFR 35.204)',
    validation_at_review: 'Severity re-rated on evidence at the Veracity floor at the first TAAP review',
    accommodation_scope: 'Approval limited to the accommodation; use beyond the named person returns the product to review',
  };
  const BYPASS_NOTE = 'Not rated. The product is purchased as an accommodation, which approves it at intake.';
  const SEVERITY_WORD = { S0: 'no barriers', S1: 'minor', S2: 'major', S3: 'critical' };
  const TONE = { approve: 'approve', approve_with_taap: 'taap', deny: 'deny', on_hold: 'hold', needs_taap: 'taap' };
  const holdNo = (id) => M.HOLDS.findIndex((h) => h.id === id) + 1;
  const holdOf = (id) => M.HOLDS.find((h) => h.id === id);
  const holdName = (id) => (holdOf(id) ? `hold ${holdNo(id)}, for ${holdOf(id).waits}` : 'no hold');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const evidenceById = (id) => M.EVIDENCE.find((e) => e.id === id);
  const evidenceAtRank = (rank) => (rank === 0 ? 'any evidence' : `${M.EVIDENCE.find((e) => e.rank === rank)?.id} or better`);

  // ---------------------------------------------------------------------------------------
  // Static form parts, rendered from the model before Alpine starts.
  // ---------------------------------------------------------------------------------------
  function levelOptions(factor) {
    return ['<option value="">Unknown</option>']
      .concat(M.LEVELS.map((l) => `<option value="${l}">${esc(`${l}: ${factor.levels[l]}`)}</option>`)).join('');
  }
  function answerCell(factor, who) {
    const model = `form.answers.${factor.id}.${who}`;
    const name = `${label(factor.id)}, ${who}`;
    if (factor.numeric) {
      return `<input type="number" min="0" inputmode="numeric" placeholder="Unknown" aria-label="${esc(name)}" x-model.number="${model}">`;
    }
    return `<select aria-label="${esc(name)}" x-model="${model}">${levelOptions(factor)}</select>`;
  }
  function fillStatic() {
    const $ = (id) => document.getElementById(id);
    $('version').textContent = M.MATRIX_VERSION;

    $('kindChoices').innerHTML = Object.entries(M.ICT_KINDS).map(([id, k]) => `
      <div class="choice">
        <input type="radio" name="ictKind" id="kind_${id}" value="${id}" x-model="form.ictKind">
        <label for="kind_${id}">${esc(k.label)}</label>
        <span class="desc">${esc(k.standard)}</span>
      </div>`).join('');

    $('floorChoices').innerHTML = M.FLOORS.map((f) => `
      <div class="choice">
        <input type="checkbox" id="floor_${f.id}" value="${f.id}" x-model="form.floors">
        <label for="floor_${f.id}">${esc(f.fact)} <span class="tag">at least ${f.min}</span></label>
      </div>`).join('') + M.BYPASSES.map((b) => `
      <div class="choice">
        <input type="checkbox" id="floor_${b.id}" value="${b.id}" x-model="form.floors">
        <label for="floor_${b.id}">${esc(b.fact)} <span class="tag">${esc(M.OUTCOMES[b.outcome].label)} at intake</span></label>
      </div>`).join('');

    $('answerRows').innerHTML = FACTORS.map((f) => `
      <tr>
        <th scope="row">${esc(label(f.id))}<span class="group">${f.group}</span></th>
        <td>${answerCell(f, 'requester')}</td>
        <td x-show="showReviewer">${answerCell(f, 'reviewer')}</td>
      </tr>`).join('');

    $('evidence').innerHTML = M.EVIDENCE.map((e) => `<option value="${e.id}">${esc(`${e.id}: ${e.holds}`)}</option>`).join('');

    $('taapReqs').innerHTML = M.TAAP_REQUIREMENTS.map((r) => `
      <div class="choice">
        <input type="checkbox" id="taap_${r.id}" x-model="form.taap.meets.${r.id}">
        <label for="taap_${r.id}">${esc(r.text)}</label>
      </div>`).join('');

    // The finding row template: its selects get their options now, before Alpine clones it.
    const tpl = $('findingRow').content;
    const fill = (key, values, names = {}) => {
      tpl.querySelector(`select[data-opts="${key}"]`).innerHTML = values.map((v) => `<option value="${v}">${esc(names[v] ?? label(v))}</option>`).join('');
    };
    fill('role', M.ROLES, { public: 'members of the public' });
    fill('group', M.FUNCTIONAL_GROUPS);
    fill('severity', ['S1', 'S2', 'S3'], { S1: 'S1 minor', S2: 'S2 major', S3: 'S3 critical' });
  }

  // ---------------------------------------------------------------------------------------
  // The review record and the sample reviews.
  // ---------------------------------------------------------------------------------------
  let findingSeq = 0;
  const newFinding = (data = {}) => ({
    key: ++findingSeq,
    role: data.role ?? 'students',
    group: data.group ?? 'without_vision',
    essentialFunction: data.essentialFunction ?? '',
    severity: data.severity ?? 'S2',
  });
  function blankForm() {
    return {
      product: '', vendor: '', unit: '',
      ictKind: 'web',
      floors: [],
      answers: Object.fromEntries(FACTORS.map((f) => [f.id, { requester: null, reviewer: null }])),
      evidence: 'E0',
      validation: 'open',
      findings: [],
      moreAccessibleProductExists: false,
      taap: { exists: false, meets: Object.fromEntries(M.TAAP_REQUIREMENTS.map((r) => [r.id, false])), exception: 'none' },
    };
  }
  function formFromPreset(p) {
    const form = blankForm();
    Object.assign(form, { product: p.product ?? '', vendor: p.vendor ?? '', unit: p.unit ?? '', ictKind: p.ictKind,
      floors: [...p.floors], evidence: p.evidence, validation: p.validation ?? 'open',
      moreAccessibleProductExists: !!p.moreAccessibleProductExists });
    for (const f of FACTORS) form.answers[f.id].requester = p.req[f.id] ?? null;
    form.findings = p.findings.map((f) => newFinding(f));
    form.taap.exists = !!p.taap;
    form.taap.exception = p.exception ?? 'none';
    for (const r of M.TAAP_REQUIREMENTS) form.taap.meets[r.id] = !!p.taap?.includes(r.id);
    return form;
  }
  /** The form as the Review that `evaluate` reads. Blank answers become null. */
  function toReview(form) {
    const answers = {};
    for (const f of FACTORS) {
      const v = (x) => (x === '' || x == null || Number.isNaN(x) ? null : (f.numeric ? Number(x) : x));
      answers[f.id] = { requester: v(form.answers[f.id].requester), reviewer: v(form.answers[f.id].reviewer) };
    }
    return {
      ictKind: form.ictKind,
      floors: M.FLOORS.filter((f) => form.floors.includes(f.id)).map((f) => f.id),
      bypasses: M.BYPASSES.filter((b) => form.floors.includes(b.id)).map((b) => b.id),
      answers,
      evidence: form.evidence,
      validation: form.validation,
      findings: form.findings.map(({ role, group, essentialFunction, severity }) => ({ role, group, essentialFunction, severity })),
      moreAccessibleProductExists: !!form.moreAccessibleProductExists,
      taap: { exists: !!form.taap.exists,
        meets: Object.fromEntries(M.TAAP_REQUIREMENTS.map((r) => [r.id, !!form.taap.meets[r.id]])),
        exception: form.taap.exception },
    };
  }

  const PRESETS = {
    small: { product: 'FormBuilder', vendor: 'Example Forms Inc.', unit: 'Facilities', ictKind: 'web', floors: [], evidence: 'E1',
      req: { users: 10, scope: 'low', required_use: 'low', criticality: 'low', publishes: 'low', frequency: 'medium', contract_length: 'low' },
      findings: [{ role: 'employees', group: 'without_vision', essentialFunction: 'Submit report', severity: 'S2' }] },
    homeworkTaap: { product: 'MathLab Pro', vendor: 'Example Learning', unit: 'Mathematics', ictKind: 'web', floors: ['required_for_grade'], evidence: 'E3',
      taap: M.TAAP_REQUIREMENTS.map((r) => r.id),
      req: { users: 400, scope: 'medium', required_use: 'high', criticality: 'high', publishes: 'low', frequency: 'high', contract_length: 'medium' },
      findings: [{ role: 'students', group: 'without_vision', essentialFunction: 'Submit homework', severity: 'S3' }] },
    homework: { product: 'MathLab Pro', vendor: 'Example Learning', unit: 'Mathematics', ictKind: 'web', floors: ['required_for_grade'], evidence: 'E3',
      req: { users: 400, scope: 'medium', required_use: 'high', criticality: 'high', publishes: 'low', frequency: 'high', contract_length: 'medium' },
      findings: [{ role: 'students', group: 'without_vision', essentialFunction: 'Submit homework', severity: 'S3' }] },
    unknown: { product: 'LabStation desktop app', vendor: 'Example Instruments', unit: 'Chemistry', ictKind: 'nonweb', floors: [], evidence: 'E1',
      req: { scope: 'medium', required_use: 'medium', criticality: 'medium', publishes: 'low', frequency: 'high', contract_length: 'medium' },
      findings: [] },
    public: { product: 'EventSignup', vendor: 'Example Events', unit: 'Student Life', ictKind: 'web', floors: ['public'], evidence: 'E0',
      req: { users: 3, scope: 'low', required_use: 'low', criticality: 'low', publishes: 'high', frequency: 'low', contract_length: 'low' },
      findings: [] },
    weakDeny: { product: 'CampusPay portal', vendor: 'Example Payments', unit: 'Student Financial Services', ictKind: 'web', floors: ['public'], evidence: 'E1',
      taap: M.TAAP_REQUIREMENTS.slice(0, 2).map((r) => r.id),
      req: { users: 5000, scope: 'high', required_use: 'high', criticality: 'high', publishes: 'high', frequency: 'high', contract_length: 'medium' },
      findings: [
        { role: 'students', group: 'without_vision', essentialFunction: 'Pay tuition', severity: 'S3' },
        { role: 'students', group: 'limited_manipulation', essentialFunction: 'Pay tuition', severity: 'S3' },
        { role: 'students', group: 'without_vision', essentialFunction: 'View balance', severity: 'S3' },
        { role: 'students', group: 'limited_manipulation', essentialFunction: 'View balance', severity: 'S3' },
      ] },
    accommodation: { product: 'ZoomText Fusion', vendor: 'Example AT', unit: 'Human Resources', ictKind: 'nonweb',
      floors: ['accommodation_purchase', 'known_user_or_request'], evidence: 'E0',
      req: { users: 1, scope: 'low', required_use: 'high', criticality: 'medium', publishes: 'low', frequency: 'high', contract_length: 'medium' },
      findings: [] },
    clear: { ictKind: 'web', floors: [], evidence: 'E0', req: {}, findings: [] },
  };
  PRESETS.exception = { ...PRESETS.weakDeny, evidence: 'E3', exception: 'determined' };
  PRESETS.exceptionClaimed = { ...PRESETS.weakDeny, evidence: 'E3', exception: 'claimed' };
  PRESETS.strongDeny = { ...PRESETS.weakDeny, evidence: 'E3' };
  PRESETS.weakApprove = { ...PRESETS.homework, evidence: 'E1', findings: [] };
  PRESETS.fallback = { ...PRESETS.weakApprove, validation: 'unavailable' };

  /** The examples, grouped by what they show. Each one's result is computed, never typed. */
  const EXAMPLE_GROUPS = [
    { title: 'Approvals', items: [
      ['small', 'Small optional tool, one S2 barrier'],
      ['homeworkTaap', 'Homework platform, S3, TAAP meets all six'],
      ['exception', 'Public portal, S3, partial TAAP, determination on file'],
      ['accommodation', 'Screen magnifier for one employee, an accommodation purchase'],
    ] },
    { title: 'Holds', items: [
      ['public', 'Public page, no ACR'],
      ['unknown', 'Department tool, user count unknown'],
      ['weakApprove', 'Required math tool, clean ACR, no findings'],
      ['weakDeny', 'Public portal, S3, weak ACR, partial TAAP'],
      ['homework', 'Homework platform, S3, no TAAP yet'],
      ['fallback', 'Required math tool, clean ACR, no demonstration possible'],
      ['exceptionClaimed', 'Public portal, S3, partial TAAP, undue burden claimed'],
    ] },
    { title: 'Denials', items: [
      ['strongDeny', 'Public portal, S3, partial TAAP, strong evidence'],
    ] },
  ];

  // ---------------------------------------------------------------------------------------
  // The Alpine component.
  // ---------------------------------------------------------------------------------------
  document.addEventListener('alpine:init', () => {
    Alpine.data('tester', () => ({
      M, FACTORS, LEVELS: M.LEVELS,
      form: blankForm(),
      showReviewer: false,
      d: null,
      ex: null,
      copyStatus: '',
      tab: 'review',
      tabs: ['review', 'definitions'],
      examples: EXAMPLE_GROUPS.map((g) => ({ ...g, items: g.items.map(([id, name]) => {
        const review = toReview(formFromPreset(PRESETS[id]));
        return { id, name, result: M.explain(review, M.evaluate(review)).headline };
      }) })),
      label, cap,

      init() {
        this.applyPreset('small');
        this.$watch('form', () => this.update());
        // A link into the definitions opens that tab, so a shared URL lands on the term.
        const hash = location.hash.slice(1);
        if (hash === 'definitions' || hash === 'panel-definitions') this.tab = 'definitions';
        else if (hash.startsWith('def-')) this.showDefinition(hash);
      },

      // ---- the two page tabs: the review and the definitions
      selectTab(id) { this.tab = id; },
      tabKey(event) {
        const i = this.tabs.indexOf(this.tab);
        const next = { ArrowRight: this.tabs[(i + 1) % this.tabs.length], ArrowLeft: this.tabs[(i - 1 + this.tabs.length) % this.tabs.length],
          Home: this.tabs[0], End: this.tabs[this.tabs.length - 1] }[event.key];
        if (!next) return;
        event.preventDefault();
        this.tab = next;
        this.$nextTick(() => document.getElementById(`tab-${next}`).focus());
      },
      /** Open the definitions tab at one section, and move focus to its heading. */
      showDefinition(id) {
        this.tab = 'definitions';
        this.$nextTick(() => {
          if (!showSection(id, true)) return;
          document.getElementById(id).scrollIntoView({ block: 'start' });
        });
      },
      // `update` runs on every form change through the watcher, and directly when a preset
      // replaces the form, so the result never lags the inputs.
      update() {
        const review = toReview(this.form);
        this.d = M.evaluate(review);
        this.ex = M.explain(review, this.d, { product: this.form.product, vendor: this.form.vendor, unit: this.form.unit,
          date: new Date().toISOString().slice(0, 10) });
        this.copyStatus = '';
      },
      applyPreset(id) {
        this.form = formFromPreset(PRESETS[id]);
        this.showReviewer = false;
        this.update();
      },
      clearForm() { this.applyPreset('clear'); },

      // ---- derived values the template reads
      get sev() { return this.d ? this.d.severity.slice(0, 2) : 'S?'; },
      get tone() { return this.d ? TONE[this.d.outcome] : 'hold'; },
      get kind() { return M.ICT_KINDS[this.form.ictKind]; },
      get evidence() { return evidenceById(this.form.evidence); },
      get floor() { return this.d ? M.veracityFloor(this.d.exposure.level, this.sev) : 0; },
      get std() { return this.d?.taapStandard ?? null; },
      get hold() { return this.d?.hold ? holdOf(this.d.hold) : null; },
      get holder() { return this.hold ? M.HOLDERS[this.hold.holder] : null; },
      get requestSummary() {
        const parts = [this.form.product.trim(), this.form.vendor.trim() ? `vendor ${this.form.vendor.trim()}` : '',
          this.form.unit.trim() ? `requested by ${this.form.unit.trim()}` : ''].filter(Boolean);
        return parts.length ? parts.join(', ') : 'Not named yet';
      },
      get overrideCount() {
        return FACTORS.filter((f) => { const a = this.form.answers[f.id]; return a.reviewer != null && a.reviewer !== ''; }).length;
      },
      get taapMet() { return M.TAAP_REQUIREMENTS.filter((r) => this.form.taap.meets[r.id]).length; },

      // ---- what the form shows, by relevance
      get validationMatters() { return !!this.d && (this.d.hold === 'severity_unknown' || this.d.hold === 'veracity_below_floor' || this.d.fallback); },
      get remedyShown() { return !!this.std; },
      get moreAccessibleShown() { return this.sev === 'S3'; },
      get exceptionShown() {
        const s = this.std;
        return !!s && this.form.taap.exists && (s.met ?? 0) > 0 && (s.shortfall ?? 0) > 0;
      },
      toggleReviewer() {
        if (this.showReviewer) for (const f of FACTORS) this.form.answers[f.id].reviewer = null;
        this.showReviewer = !this.showReviewer;
      },
      addFinding() { this.form.findings.push(newFinding()); },
      removeFinding(key) { this.form.findings = this.form.findings.filter((f) => f.key !== key); },

      // ---- the status line under each step
      get exposureStatus() {
        if (!this.d) return '';
        if (this.d.bypass) return BYPASS_NOTE;
        const e = this.d.exposure;
        if (e.unknownsMatter) return `${e.unknownCount} unknown ${e.unknownCount === 1 ? 'answer changes' : 'answers change'} the Exposure level. The review holds until the requesting unit answers.`;
        const floors = M.FLOORS.filter((f) => e.floorsApplied.includes(f.id));
        const floorMax = floors.reduce((a, f) => (M.LEVELS.indexOf(f.min) > M.LEVELS.indexOf(a) ? f.min : a), 'low');
        const byFloor = floors.length > 0 && M.LEVELS.indexOf(floorMax) >= M.LEVELS.indexOf(e.level);
        const base = byFloor
          ? `Exposure ${e.level}, set by a floor fact. The answers alone score ${e.scorePct} percent of the maximum.`
          : `Exposure ${e.level}, at ${e.scorePct} percent of the maximum score.`;
        const unknown = e.unknownCount ? ` ${e.unknownCount} unknown ${e.unknownCount === 1 ? 'answer counts' : 'answers count'} as high without changing the level.` : '';
        return base + unknown;
      },
      get severityStatus() {
        if (!this.d) return '';
        if (this.d.bypass) return BYPASS_NOTE;
        if (this.sev === 'S?') return 'Severity unknown. No evidence is on file and no finding is recorded.';
        const b = this.d.breadth;
        const breadth = b.assumed ? 'Breadth 2, assumed without evidence.' : `Breadth ${b.level}, from ${b.blocked} blocked ${b.blocked === 1 ? 'pair' : 'pairs'} and ${b.harder} S2 ${b.harder === 1 ? 'finding' : 'findings'}.`;
        const acc = this.d.accumulation?.escalated;
        const how = this.d.fallback ? 'Severity S3 (provisional), under the fallback.'
          : acc ? `Severity S3 (accumulated): S2 barriers ${acc === 'stacked' ? 'stacked on one function' : 'spread across the product'} add up to a blocked function.`
            : `Severity ${this.sev}, ${SEVERITY_WORD[this.sev]}, from the worst finding.`;
        return `${how} ${breadth}`;
      },
      get evidenceStatus() {
        if (!this.d) return '';
        if (this.d.bypass) return BYPASS_NOTE;
        const ev = this.evidence;
        const f = this.floor;
        const need = `The Veracity floor at ${this.d.exposure.level} exposure for ${this.sev} is ${f === 0 ? 'any evidence' : `rank ${f} (${evidenceAtRank(f)})`}.`;
        if (ev.id === 'E0' && this.sev === 'S?') return `No evidence on file. ${need}`;
        const standing = ev.rank >= f ? 'at or above the floor, so Severity is confirmed'
          : this.d.fallback ? 'below the floor and it cannot be raised, so the fallback applies'
            : 'below the floor, so the ATI review team raises it';
        return `${ev.id} ranks ${ev.rank}, ${standing}. ${need}`;
      },
      get remedyNote() {
        if (!this.d || this.std) return '';
        if (this.d.bypass) return BYPASS_NOTE;
        if (this.d.hold) return `The review is on ${holdName(this.d.hold)}, before the risk grade, so no remedy step applies yet.`;
        return 'The risk grade is No alternate access required, so no TAAP step applies.';
      },
      get warningLevel() {
        // A denial carries no warning: the email omits it too.
        return this.std && this.d.outcome !== 'deny' ? { key: this.std.warning, ...M.WARNING_LEVELS[this.std.warning] } : null;
      },
      get remedyStatus() {
        const s = this.std;
        if (!s) return '';
        const need = s.required === 6 ? 'all 6' : `${s.required} of 6`;
        const plan = !this.form.taap.exists ? 'No TAAP is on file.' : `The TAAP on file meets ${s.met} of 6${s.shortfall ? `, ${s.shortfall} short` : ''}.`;
        return `Pressure ${s.pressure} of 4 sets a TAAP standard of ${need}. ${plan} Warning ${s.warning}${s.provisional ? ', provisional' : ''}.`;
      },

      // ---- the result
      get chips() {
        if (!this.d) return [];
        if (this.d.bypass) return [['Accommodation purchase', 'Approved at intake']];
        const e = this.d.exposure;
        const out = [
          ['Exposure', cap(e.level)],
          ['Severity', this.sev === 'S?' ? 'Unknown' : `${this.d.severity.replace(' (', ', ').replace(')', '')}, ${SEVERITY_WORD[this.sev]}`],
          ['Evidence', this.d.evidence],
        ];
        if (this.std) {
          out.push(['Breadth', String(this.d.breadth.level)], ['Pressure', `${this.std.pressure} of 4`],
            ['TAAP standard', this.std.required === 6 ? 'All 6' : `${this.std.required} of 6`], ['Warning', cap(this.std.warning)]);
        }
        return out;
      },
      get path() {
        const steps = ['Exposure', 'Severity', 'Veracity', 'Risk grade', 'Remedy', 'Decision'];
        const haltAt = { answers_unknown: 0, severity_unknown: 1, veracity_below_floor: 2, taap_needed: 4, exception_claimed: 4 };
        if (this.d?.bypass) return steps.map((name) => ({ name, state: name === 'Decision' ? 'here' : 'todo' }));
        const here = this.d?.hold ? haltAt[this.d.hold] : 5;
        return steps.map((name, i) => ({ name, state: i < here ? 'done' : i === here ? 'here' : 'todo' }));
      },
      get decisionSections() {
        if (!this.ex) return [];
        const open = { 'Why this result': true, 'What happens next': true };
        return this.ex.sections.map((s) => ({ ...s, open: !!open[s.heading] }));
      },
      get factGroups() {
        const d = this.d;
        if (!d) return [];
        const e = d.exposure;
        const review = toReview(this.form);
        return [
          { title: 'Exposure', rows: [
            ['Accommodation purchase', d.bypass ? 'yes, approved at intake' : 'no'],
            ['Level', `${e.level} (score ${e.scorePct}% of maximum)`],
            ['Floors applied', e.floorsApplied.length ? e.floorsApplied.map(label).join(', ') : 'none'],
            ['Groups', Object.entries(e.groupLevels).map(([g, l]) => `${g} ${l}`).join(', ')],
            ['Unknown answers', `${e.unknownCount}${e.unknownsMatter ? ' (they change the band)' : ''}`],
          ] },
          { title: 'Severity and evidence', rows: [
            ['Severity', d.severity],
            ['Evidence', d.evidence],
            ['Veracity floor', `${this.floor === 0 ? 'any evidence' : evidenceAtRank(this.floor)} at ${e.level} exposure for ${this.sev}`],
            ['Fallback', d.fallback ? 'yes, the evidence cannot be raised' : 'no'],
            ['Accumulation', d.accumulation?.escalated
              ? `S2 counted as S3 (${d.accumulation.escalated}: ${d.accumulation.escalated === 'stacked' ? `${d.accumulation.stacked.length} function and group pair(s) with stacked S2` : `${d.accumulation.spreadPairs} function and group pairs`})` : 'none'],
            ['Breadth', d.breadth.assumed ? `${d.breadth.level} (assumed, no evidence yet)` : `${d.breadth.level} (${d.breadth.blocked} blocked pairs, ${d.breadth.harder} S2)`],
          ] },
          { title: 'Hold and remedy', rows: [
            ['Hold', d.hold ? `${cap(holdName(d.hold))}. ${HOLD_TEXT[d.hold]}` : 'none'],
            ['Held by', d.hold ? M.HOLDERS[holdOf(d.hold).holder].label : 'n/a'],
            ['Requires', d.requires.length ? d.requires.map((r) => REQUIRES_TEXT[r] ?? label(r)).join('; ') : 'nothing extra'],
            ['TAAP on file', d.taapOnFile ? 'yes' : 'no'],
            ['TAAP standard', d.taapStandard
              ? `pressure ${d.taapStandard.pressure} of 4, needs ${d.taapStandard.required} of 6, met ${d.taapStandard.met ?? 'no TAAP yet'}, warning ${d.taapStandard.warning}${d.taapStandard.provisional ? ', provisional (fallback, barriers found as a minimum)' : ''}` : 'n/a'],
            ['Deny reason', d.denyReason ? label(d.denyReason) : 'n/a'],
            ['Exception', d.exception ? 'approved under a written determination' : review.taap.exists ? label(review.taap.exception ?? 'none') : 'n/a'],
            ['TAAP signers', d.approver ?? 'not needed'],
            ['TAAP review', d.taapReview ? `every ${d.taapReview.months} months or at renewal; contract ${d.taapReview.contract ?? 'unknown'}` : 'n/a'],
            ['Vendor roadmap', d.roadmap ? 'required' : 'not required'],
            ['Contract terms', d.contractTerms.length ? d.contractTerms.map(label).join(', ') : 'n/a'],
          ] },
        ];
      },
      get json() { return this.d ? JSON.stringify(this.d, null, 2) : ''; },

      // The exposure matrix: one row per Exposure and Breadth, drawn exactly as rubric-core.svg
      // draws it. The TAAP columns show the S3 case with no exception on file. The summary above
      // the table states, in plain sentences, every state the outlines and the fading encode:
      // the row, the floor and the evidence against it, the risk grade, the TAAP standard, the
      // column the plan on file falls in, the warning, and where this review's own result
      // departs from the drawn value.
      get grid() {
        const d = this.d;
        if (!d) return { rows: [], lead: '', summary: [], headDim: { grade: true, taap: true } };
        const review = toReview(this.form);
        const T = M.CALIBRATION.taapStandard;
        const sev = this.sev;
        const s2 = sev === 'S2';
        const warnOf = (w) => (w >= T.warning.high ? 'high' : w >= T.warning.elevated ? 'elevated' : 'low');
        const FULL = M.TAAP_REQUIREMENTS.length;
        // The outcome and the gap to a full TAAP, for a plan meeting `met` requirements.
        const decide = (P, k, met) => {
          if (met === null) return ['on_hold', 0];
          if (met < k) return ['deny', FULL - met];   // meets none, or below the minimum
          return ['approve_with_taap', FULL - met];
        };
        const std = d.taapStandard;
        const state = !std ? null : !d.taapOnFile ? 'none' : std.shortfall > 0 ? 'below' : std.met === FULL ? 'full' : 'min';
        // How far this review gets through the table: Exposure still open (hold 2), the
        // evidence still open (holds 1 and 3), the risk grade alone (No alternate access required), or the remedy
        // step (Alternate access required). Columns past the stage reached are drawn as not considered.
        const stage = d.bypass ? 'bypass' : d.hold === 'answers_unknown' ? 'exposure'
          : (d.hold === 'severity_unknown' || d.hold === 'veracity_below_floor') ? 'evidence'
            : std ? 'remedy' : 'grade';
        const rowKnown = stage !== 'exposure' && stage !== 'bypass';
        // Severity read from the evidence on file is a minimum, so the risk grade cell is known
        // as soon as a finding exists, and only tentative while the evidence is being raised.
        const gradeKnown = rowKnown && sev !== 'S?';
        const gradeTentative = stage === 'evidence';
        const remedyReached = stage === 'remedy';
        const exception = review.taap?.exception ?? 'none';
        const moreAccessible = sev === 'S3' && review.moreAccessibleProductExists;
        // A TAAP cell is outlined only when its drawn value is this review's own outcome.
        const drawnMatches = (o) => o === d.outcome && (o !== 'on_hold' || d.hold === 'taap_needed');
        const ev = M.EVIDENCE.find((e) => e.id === d.evidence);
        const floorRank = M.veracityFloor(d.exposure.level, sev);
        const floorNote = !rowKnown ? ''
          : d.fallback ? `${ev.id} on file, below; fallback`
            : ev.rank >= floorRank ? `${ev.id} on file, at or above` : `${ev.id} on file, below`;
        const rows = M.LEVELS.flatMap((lvl, xi) => [0, 1, 2].map((B) => {
          const P = xi + B;
          const k = T.required[P];
          const onBand = rowKnown && lvl === d.exposure.level;
          const onRow = onBand && B === d.breadth.level;
          const grade = (s) => M.GRID[lvl][s].grade;
          const gradeCell = (s, cols) => ({ text: M.RISK_GRADES[grade(s)], tone: TONE[grade(s)],
            here: gradeKnown && onRow && cols.includes(sev), tentative: gradeTentative, dim: !gradeKnown });
          const taapCell = (col, met) => {
            // "At the minimum" is a plan meeting the minimum but short of all six. Where the
            // minimum is all six, any such plan is below it, so the column reads Deny.
            const [o, gap] = col === 'min' && k === FULL ? ['deny', 1] : decide(P, k, met);
            const hold = o === 'on_hold' ? ` (hold ${holdNo('taap_needed')})` : '';
            return { text: `${M.OUTCOMES[o].label}${hold}`, sub: '', warn: o === 'deny' ? '' : `warning ${warnOf(P + gap)}`, tone: TONE[o],
              here: remedyReached && onRow && state === col && drawnMatches(o, col), dim: !remedyReached };
          };
          return {
            key: `${lvl}-${B}`, level: lvl, first: B === 0, band: B === 0 && xi > 0, B, P, onRow, onBand,
            floor: { text: evidenceAtRank(M.EVIDENCE_LIMITS.floor[lvl]).replace('any evidence', 'any'), here: onBand, note: onBand ? floorNote : '' },
            grades: [gradeCell('S0', ['S0', 'S1']), gradeCell('S2', ['S2']), gradeCell('S3', ['S3'])],
            k: { text: k === 6 ? 'all 6' : `${k} of 6`, here: remedyReached && onRow, dim: !remedyReached },
            taap: [taapCell('none', null), taapCell('below', k - 1), taapCell('min', k), taapCell('full', FULL)],
          };
        }));
        const { lead, summary } = this.gridSummary({ stage, sev, std, state, exception, moreAccessible, ev, floorRank, rows });
        return { rows, stage, lead, summary, headDim: { grade: !gradeKnown, taap: !remedyReached } };
      },

      // The sentences above the table. One fact per sentence, in the order the table reads,
      // so a reader who cannot see the outlines hears the same position a sighted reader sees.
      gridSummary({ stage, sev, std, state, exception, moreAccessible, ev, floorRank, rows }) {
        const d = this.d;
        const FULL = M.TAAP_REQUIREMENTS.length;
        const sevHow = d.severity.includes('provisional') ? ', provisional under the fallback'
          : d.severity.includes('accumulated') ? ', accumulated from S2 barriers' : '';
        const sevText = sev === 'S?' ? '' : `${sev}, ${SEVERITY_WORD[sev]}${sevHow}`;
        const lvl = d.exposure.level;
        const B = d.breadth.level;
        const row = rows.find((r) => r.onRow);
        const bandFloor = rows.find((r) => r.level === lvl && r.first)?.floor.text;
        const floorText = bandFloor === 'any' ? 'any evidence' : bandFloor;
        const out = [];

        if (stage === 'bypass') {
          return { lead: 'This review does not use the table.', summary: [
            'The product is purchased as an accommodation for one named person, so it is approved at intake.',
            'No row applies and nothing is rated. The whole table is shown faded.',
          ] };
        }
        if (stage === 'exposure') {
          const n = d.exposure.unknownCount;
          return { lead: 'This review has not reached the table.', summary: [
            `${n} unknown ${n === 1 ? 'answer changes' : 'answers change'} the Exposure level, so the review is on ${holdName(d.hold)}.`,
            'Until Exposure is settled, no row applies. The whole table is shown faded.',
          ] };
        }

        // The row.
        out.push(`Exposure is ${lvl} and Breadth is ${B}, which gives Pressure ${row.P}.`);

        // The floor and the evidence against it.
        if (sev === 'S?') {
          out.push(`The Veracity floor for ${lvl} exposure is ${floorText}. ${ev.id === 'E0' ? 'No evidence is on file' : `The evidence on file is ${ev.id} and no finding is recorded`}, so Severity is unknown and the review is on ${holdName(d.hold)}.`);
          out.push('Without a severity there is no risk grade. The risk grade columns and the TAAP columns are not reached and are shown faded.');
          return { lead: `This review sits in the ${lvl} exposure band, on the Breadth ${B} row, and stops at the Veracity floor.`, summary: out };
        }
        const floor = floorRank === 0 ? 'any evidence' : evidenceAtRank(floorRank);
        if (d.fallback) {
          out.push(`The Veracity floor for ${sev} at ${lvl} exposure is ${floor}. The evidence on file is ${ev.id}, below the floor, and it cannot be raised, so the fallback applies.`);
        } else if (ev.rank >= floorRank) {
          out.push(`The Veracity floor for ${sev} at ${lvl} exposure is ${floor}. The evidence on file is ${ev.id}, at or above the floor.`);
        } else {
          out.push(`The Veracity floor for ${sev} at ${lvl} exposure is ${floor}. The evidence on file is ${ev.id}, below the floor, so the review is on ${holdName(d.hold)}.`);
        }

        // The risk grade.
        const gradeLabel = M.RISK_GRADES[M.GRID[lvl][sev].grade];
        if (stage === 'evidence') {
          out.push(`Severity ${sevText}, read from the evidence on file, is a minimum, so for now the risk grade is ${gradeLabel}. Stronger evidence can raise it, not lower it. Its cell has a dashed outline.`);
          out.push('The TAAP columns are not reached and are shown faded.');
          return { lead: `This review sits in the ${lvl} exposure band, on the Breadth ${B} row, and stops at the Veracity floor.`, summary: out };
        }
        if (stage === 'grade') {
          out.push(`Severity is ${sevText}, so the risk grade is ${gradeLabel}. The product is approved without a TAAP.`);
          out.push('The TAAP columns do not apply and are shown faded.');
          return { lead: `This review sits in the ${lvl} exposure band, on the Breadth ${B} row, and ends at the risk grade.`, summary: out };
        }

        // The remedy step.
        out.push(`Severity is ${sevText}, so the risk grade is ${gradeLabel}.`);
        const k = std.required;
        out.push(`Pressure ${std.pressure} sets the TAAP standard at ${k === FULL ? `all ${FULL}` : `${k} of the ${FULL}`} requirements.`);
        const met = std.met ?? 0;
        const metText = met === 0 ? `none of the ${FULL}` : met === FULL ? `all ${FULL}` : `${met} of ${FULL}`;
        const drawn = { none: 'on_hold', below: 'deny', min: 'approve_with_taap', full: 'approve_with_taap' }[state];
        // The drawn cell is this review's own result unless a caveat below says otherwise.
        const own = drawn === d.outcome && (drawn !== 'on_hold' || d.hold === 'taap_needed');
        const reads = own ? 'the result for this review is' : 'that column reads';
        if (state === 'none') out.push(`No TAAP is on file, so the review is on ${holdName('taap_needed')}. The warning from pressure alone is ${std.warning}.`);
        else if (state === 'below') out.push(`The TAAP on file meets ${metText}, below the minimum, so ${reads} Deny.`);
        else if (state === 'min') out.push(`The TAAP on file meets ${metText}, at the minimum, so ${reads} Approve with TAAP, warning ${std.warning}.`);
        else out.push(`The TAAP on file meets ${metText}, so ${reads} Approve with TAAP, warning ${std.warning}.`);

        // Where this review's own result departs from the drawn value.
        const claim = exception === 'claimed' ? 'claim' : 'determination';
        if (moreAccessible) {
          out.push('A more accessible product meets the same need, so the result for this review is Deny, whatever the TAAP on file.');
        } else if (d.outcome === 'approve_with_taap' && d.exception) {
          out.push(`A written undue burden or fundamental alteration determination is on file, so the result for this review is Approve with TAAP under a ${std.warning} warning, not Deny.`);
        } else if (d.hold === 'exception_claimed') {
          out.push(`An undue burden or fundamental alteration claim is on file, so the review is on ${holdName(d.hold)}, not denied yet.`);
        } else if (exception !== 'none' && drawn === 'deny' && met === 0) {
          out.push(`An undue burden or fundamental alteration ${claim} is on file, and a plan that meets none of the ${FULL} is denied even so.`);
        }
        return { lead: `This review sits in the ${lvl} exposure band, on the Breadth ${B} row, and reaches the TAAP columns.`, summary: out };
      },

      // ---- copy the reasoning. The async clipboard first; a copy event as the fallback,
      // because a page opened from a local file often has no clipboard permission.
      async copy(mode) {
        const ex = this.ex;
        const html = `<html><body>${ex.html}</body></html>`;
        try {
          if (mode === 'email' && navigator.clipboard?.write && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([ex.text], { type: 'text/plain' }),
            })]);
            this.copyStatus = 'Copied. Paste into the email with Ctrl+V.';
            return;
          }
          if (mode === 'text' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(ex.text);
            this.copyStatus = 'Copied as plain text.';
            return;
          }
        } catch (e) { /* fall through to the copy event */ }
        const onCopy = (event) => {
          event.clipboardData.setData('text/plain', ex.text);
          if (mode === 'email') event.clipboardData.setData('text/html', html);
          event.preventDefault();
        };
        document.addEventListener('copy', onCopy);
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.removeEventListener('copy', onCopy);
        this.copyStatus = ok
          ? (mode === 'email' ? 'Copied. Paste into the email with Ctrl+V.' : 'Copied as plain text.')
          : 'The browser blocked copying. Select the text in the reasoning and copy it by hand.';
      },
    }));
  });

  // ---------------------------------------------------------------------------------------
  // Definitions, built from the model so the numbers never drift. dump-definitions.js reads
  // this markup for the rubric document, so the markup stays h3, p, ul/li, table, strong, code.
  // ---------------------------------------------------------------------------------------
  function definitionsHtml() {
    const C = M.CALIBRATION;
    const T = C.taapStandard;
    const pct = (x) => `${Math.round(x * 100)}%`;
    const evAt = (lvl) => {
      const r = M.EVIDENCE_LIMITS.floor[lvl];
      return r === 0 ? 'any evidence' : `${M.EVIDENCE.filter((e) => e.rank >= r).map((e) => e.id).join(', ')}`;
    };
    const table = (cols, rows) => `<table><thead><tr>${cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>`
      + rows.map(([h, ...cells]) => `<tr><th scope="row">${h}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
    const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    const kText = (k) => (k === 6 ? 'all 6' : `${k} of 6`);
    const pressuresFor = (k) => T.required.map((r, p) => (r === k ? p : null)).filter((p) => p !== null).join(', ');
    const ks = [...new Set(T.required)];

    const term = (name, text) => `<strong>${name}.</strong> ${text}`;
    const ROLE_NAME = { public: 'members of the public' };
    const roles = M.ROLES.map((r) => ROLE_NAME[r] ?? r);
    const GROUP_COVERS = {
      reach: 'Number of users and organizational scope.',
      stakes: 'Required use and criticality.',
      spread: 'Content the product publishes.',
      duration: 'Frequency of use and contract length.',
    };
    const WHEN = {
      exception_claimed: `The TAAP falls below the standard, and the requesting unit claims that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164, 35.204).`,
      severity_unknown: 'No ACR, demonstration or testing exists.',
      answers_unknown: 'Unknown answers could change the exposure level.',
      veracity_below_floor: 'The evidence is below the Veracity floor for this exposure and severity, and a demonstration or ATI testing can still raise it.',
      taap_needed: 'The risk grade is Alternate access required and no TAAP is on file.',
    };
    const RESUMES = {
      severity_unknown: 'The evidence check',
      answers_unknown: 'The exposure check',
      veracity_below_floor: 'The Severity step, with the new findings or the fallback',
      taap_needed: 'The remedy step',
      exception_claimed: 'The remedy step',
    };

    return [
      '<h3>Review standard</h3>',
      '<p>Each review tests one campus-requested product against its <strong>review standard</strong>, WCAG 2.1 AA for web and mobile products or the Section 508 Standards for other software and hardware.</p>',
      '<h3>Essential function</h3>',
      `<p>An <strong>essential function</strong> is a function the product exists to provide. Registering for a class, submitting homework and paying a bill are essential functions.</p>${ul([
        term('Test', 'A function is essential when its removal would change the product\'s use or purpose. WCAG-EM 2.0 defines essential functionality by the same test.'),
        term('Source', 'The requester lists the minimum functional requirements, which CSU Procurement Step 1 calls "essential functionality", and the reviewer confirms the list.'),
        term('Scope', 'An essential function covers its complete process, including sign-in, navigation, the content read along the way and the final submission. WCAG 2.1 requires every page in a complete process to conform.'),
        term('Other names', 'WCAG-EM says "essential functionality". CSU TAAP documents say "essential functions" and "core functionality". The "essential functions" of a job under ADA Title I (29 CFR 1630.2(n)) are a separate concept and never set severity.'),
      ])}`,
      '<h3>Nonconformance and barrier</h3>',
      `<p>The review separates a failure in the product from its effect on users.</p>${ul([
        term('Nonconformance', 'A failed success criterion or provision of the review standard, belonging to the product.'),
        term('Barrier', 'The effect of a nonconformance on one essential function for one of the nine Section 508 <strong>disability groups</strong> listed below. One nonconformance produces a barrier for every essential function and disability group it affects.'),
      ])}`,
      `<p>The Section 508 functional performance criteria name nine disability groups.</p>${ul(M.FUNCTIONAL_GROUPS.map(label))}`,
      '<p>Severity attaches to the barrier and never to the nonconformance, because the level of the failed criterion (A or AA) does not predict the effect on users. S1, S2 and S3 match the GSA severity terms <strong>minor</strong>, <strong>major</strong> and <strong>critical</strong>. CSU procurement documents say "gap" or "issue" for a barrier.</p>',

      '<h3>Minimal impact</h3>',
      `<p>A nonconformance has <strong>minimal impact</strong> only when people with disabilities can still do all four of the following with substantially equivalent timeliness, privacy, independence and ease of use (28 CFR 35.205). The rubric calls these the <strong>four minimal-impact tests</strong>.</p>${ul([
        'Access the same information as people without disabilities.',
        'Engage in the same interactions as people without disabilities.',
        'Conduct the same transactions as people without disabilities.',
        'Participate in or benefit from the same services, programs and activities as people without disabilities.',
      ])}<p><strong>Burden.</strong> The university must demonstrate that all four tests are met, so minimal impact rests on evidence, never on assumption.</p><p><strong>Standard.</strong> The tests come from the Title II web rule. The rubric applies them to non-web products as policy, since the Section 508 Standards have no minimal-impact clause.</p>`,
      '<h3>Finding</h3>',
      `<p>A <strong>finding</strong> records one barrier in four fields.</p>${ul([
        term('Role', `The users the barrier affects, among them ${roles.slice(0, -1).join(', ')} and ${roles[roles.length - 1]}.`),
        term('Disability group', 'The group the barrier affects.'),
        term('Essential function', 'The function the barrier blocks or slows.'),
        term('Severity', 'Impact of the barrier on the function, from S0 (no effect) to S3 (the user cannot perform the function alone).'),
      ])}`,
      '<p>An <strong>ACR lead</strong> is a row marked "Partially Supports" or "Does Not Support" in the vendor\'s ACR (Accessibility Conformance Report). A lead becomes a finding once its remark names the affected feature and the reviewer places that feature on an essential function.</p>',

      '<h3>Exposure</h3>',
      '<p><strong>Exposure</strong> rates audience size and product reliance as low, medium or high.</p>',
      '<p>A single <strong>floor</strong> fact sets a minimum exposure regardless of the answers.</p>',
      table(['Floor', 'Minimum exposure'], M.FLOORS.map((f) => [f.fact, f.min])),
      `<p>The requester's answers map uniquely across four distinct groups.</p>${ul(M.GROUPS.map((g) => term(g.id.charAt(0).toUpperCase() + g.id.slice(1), GROUP_COVERS[g.id] ?? '')))}`,
      `<p>Each group level is the group's highest answer. The exposure level is the range containing the aggregate share of the maximum score, with cut points at ${pct(C.bands.medium)} and ${pct(C.bands.high)} partitioning the share range into low, medium and high, unless a floor sets a higher level.</p>`,
      '<p>An unknown answer maps to its highest level. Where that mapping alters exposure, the review halts pending the requester\'s answers.</p>',

      '<h3>Severity</h3>',
      '<p>Severity is rated on an <strong>essential function</strong>, a function the product exists to provide, such as registering for a class, submitting homework or paying a bill. A function is essential when its removal would change the product\'s use or purpose, the WCAG-EM 2.0 test, and it covers its complete process from sign-in to final submission.</p>',
      '<p>Product <strong>severity</strong> is the maximum impact on an essential function across the findings, raised by the two accumulation conditions below, and independent of vendor report conformance labels or the failed WCAG criterion level.</p>',
      table(['Severity', 'GSA term', 'Meaning'], M.SEVERITY.map((s) => [s.id, s.gsa ?? 'none', s.meaning])),
      '<p><strong>S?</strong> marks unknown severity, in the absence of any ACR, demonstration or testing. <strong>S3 (provisional)</strong> marks the fallback, defined under Evidence.</p>',
      `<p>The levels sort by the four <strong>minimal-impact tests</strong> of 28 CFR 35.205, defined under Minimal impact. People with disabilities must still be able to do all four with substantially equivalent timeliness, privacy, independence and ease of use.</p>${ul([
        'Access the same information.',
        'Engage in the same interactions.',
        'Conduct the same transactions.',
        'Participate in or benefit from the same services, programs and activities.',
      ])}`,
      table(['Severity', 'Against the four tests', 'What the reviewer records'], [
        ['S0', 'Passes all four, with no effect at all', 'No finding'],
        ['S1', 'Passes all four, with the impact shown to be minimal', 'Each test as met, on evidence at E2 or better (E2a, E2b or E3)'],
        ['S2', 'Fails at least one, since clearly unequal time or effort fails substantially equivalent ease of use', 'The function the barrier slows, and for whom'],
        ['S3', 'Fails outright, since the user cannot perform the function independently', 'The function the barrier blocks, and for whom'],
      ]),
      '<p>Two conditions escalate S2 findings to S3, shown as "S3 (accumulated)".</p>',
      table(['Condition', 'What is counted', 'Threshold', 'Exposure', 'Why it escalates'], [
        ['Stacking', 'S2 findings on one pair of essential function and disability group', `${C.accumulation.stack} or more`, 'Any', 'A user performs a function only by passing every barrier on it, so stacked barriers block the function'],
        ['Spread', 'Distinct pairs of essential function and disability group with an S2 finding', `${C.accumulation.spreadPairs} or more`, `${cap(C.accumulation.spreadAt)} only`, 'Barriers across most of the product exceed minimal impact in aggregate'],
      ]),
      `${ul([
        term('Stacking', `${C.accumulation.stack} or more S2 findings on one essential function for one disability group, regardless of exposure. Example: a homework platform, where students who are blind meet ${C.accumulation.stack} S2 barriers on the one function "Submit homework". The upload button has no accessible name, so the screen reader user finds it by trial. The due-date field accepts keyboard input only in an undocumented format. The confirmation is not announced, so the student reloads the page to check that the submission went through. Each barrier alone leaves the submission possible with clearly more effort, so each is S2. The student must pass all ${C.accumulation.stack} in sequence to submit, so together they block the function, and the product is S3 (accumulated).`),
        term('Spread', `S2 findings on ${C.accumulation.spreadPairs} or more pairs of essential function and disability group, at ${C.accumulation.spreadAt} exposure only. Example: a campus-wide student portal at high exposure, where no barrier blocks a function but the reviewer records S2 findings on ${C.accumulation.spreadPairs} different pairs: pay tuition for students who are blind (unlabelled form fields), pay tuition for students with limited use of their hands (small controls with no keyboard shortcut), view balance for students with low vision (3 to 1 contrast on the balance table), register for classes for students who are blind (search results not announced), register for classes for students with cognitive disabilities (a session timeout with a ten-second warning), and view financial aid for students who are deaf (video instructions with the transcript on another page). Barriers across most of the product exceed minimal impact in aggregate, so the product is S3 (accumulated).`),
      ])}`,
      `<p>Neither condition applies to ${C.accumulation.stack - 1} S2 findings on one pair, or to ${C.accumulation.spreadPairs} pairs at medium exposure. Those stay S2, though ${C.breadth.s2AddsAt} or more S2 findings still raise Breadth, defined below. Six S2 findings on one pair are one pair for spread but twice the stacking threshold, so they stack. The pair, not the finding, is the unit spread counts.</p>`,

      '<h3>Evidence (Veracity)</h3>',
      '<p><strong>Veracity</strong> rates the reliability of the evidence behind the findings, by evidence level.</p>',
      table(['Evidence', 'What it is'], M.EVIDENCE.map((e) => [e.id, e.holds])),
      `<p>An ACR passes ${M.ACR_CHECKS.length} quality checks to rank E1. Any failed check drops it to E1-.</p>${ul(M.ACR_CHECKS.map((c) => c.text))}`,
      '<p>A report marked Supports on every criterion fails the sixth check. A perfect result is as likely to mean the evaluation was not done as that no barrier exists, so the report earns E1 only when its remarks show the work.</p>',
      `<p>Severity read from the evidence on file is a minimum. Every review needs evidence at the <strong>Veracity floor</strong> for its exposure and severity before Severity is confirmed.</p>${ul(M.LEVELS.map((l) => term(`${l.charAt(0).toUpperCase() + l.slice(1)} exposure`, `${evAt(l).charAt(0).toUpperCase() + evAt(l).slice(1)}.`)))}`,
      '<p>An S1 finding always needs E2a, E2b or E3, because the reviewer must show the impact is minimal.</p>',
      '<p>Below the floor, the review holds with the ATI review team, which raises the evidence with the requesting unit and the vendor, re-rates Severity and resumes. The need for Veracity rises with exposure and severity, and both parties share the interest in establishing the barriers. A demonstration or ATI testing ranks 4 or 5, which clears every floor, so one loop closes it.</p>',
      '<p>When the evidence cannot be raised, the ATI review team records that and the review proceeds under the <strong>fallback</strong>. Severity is S3 (provisional) and the barriers found are a minimum. Unproven conformance is treated as hiding a blocking barrier, so the review requires an alternate access plan (TAAP, defined below). Deny stands on the evidence in hand, because weak evidence can hide barriers but not invent them.</p>',

      '<h3>Breadth</h3>',
      '<p><strong>Breadth</strong> rates barrier reach across essential functions and disability groups, on a scale of 0 to 2.</p>',
      `<p>Breadth derives from the count of <strong>blocked pairs</strong> (essential function and disability group pairs stopped by an S3 finding or stacked S2 findings), with ${C.breadth.blockedCuts[0]} blocked pairs giving 1 and ${C.breadth.blockedCuts[1]} giving 2, plus 1 for ${C.breadth.s2AddsAt} or more S2 findings, capped at 2. Under the fallback with no evidence at all, the review assumes Breadth 2.</p>`,

      '<h3>TAAP</h3>',
      `<p>A <strong>TAAP</strong> (Temporary Alternate Access Plan) is the CSU's written plan for equally effective access during vendor remediation, held to the six requirements of the CSU TAAP template.</p>${ul(M.TAAP_REQUIREMENTS.map((r) => r.text))}`,
      `<p>Each TAAP includes a campus-written <strong>TAAP accessibility statement</strong>, separate from the vendor's own statement and posted ${M.TAAP_STATEMENT.postedAt}, with the following content.</p>${ul(M.TAAP_STATEMENT.includes.map((x) => x.charAt(0).toUpperCase() + x.slice(1)))}`,
      `<p>Three people sign each TAAP.</p>${ul(M.TAAP_TERMS.signers)}`,
      `<p>A TAAP below the standard is approved only under a written determination by the president or a designee that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164, 35.204). The determination covers this product only, counts all university resources, and lists the support that remains for each missed requirement. High cost alone does not establish an undue burden. The exception is a defence against this one required action, never a property of the product, so the review never asks for it at intake.</p>`,
      `<p>A TAAP lasts ${M.TAAP_TERMS.reviewMonths} months or until contract renewal, whichever comes first, with no extension.</p>`,
      '<p>The department using the product provides TAAP-defined support on any problem report, independent of accommodation, which starts with one person\'s request. The procurement review never relies on accommodation.</p>',

      '<h3>Risk grade</h3>',
      `<p>The <strong>risk grade</strong> is a fixed mapping from each pairing of an exposure level with a severity to one of two values.</p>${ul([
        term('No alternate access required', 'The barriers need no plan at this exposure.'),
        term('Alternate access required', 'The campus owes equally effective alternate access, so a TAAP must be on file before a final decision.'),
      ])}`,
      table(['Exposure', 'S0', 'S1', 'S2', 'S3'], M.LEVELS.map((l) => [l, ...['S0', 'S1', 'S2', 'S3'].map((s) => M.RISK_GRADES[M.GRID[l][s].grade])])),

      '<h3>Pressure and the TAAP standard</h3>',
      '<p>The <strong>TAAP standard</strong>, the minimum number of the six TAAP requirements a plan must meet, derives from <strong>pressure</strong>, the sum of exposure rank (low 0, medium 1, high 2) and Breadth. A <strong>full TAAP</strong> meets all six.</p>',
      table(['Pressure', 'TAAP standard'], ks.map((k) => [pressuresFor(k), kText(k)])),
      '<p>The TAAP on file falls in one of three states against the minimum, each with a fixed outcome.</p>',
      table(['TAAP on file', 'Outcome', 'Warning'], [
        ['Below the minimum', 'Deny, unless a written undue burden or fundamental alteration determination is on file. A plan that meets none of the six is denied even then, since it gives no alternative access', 'None, or from pressure plus the gap under the exception'],
        ['At the minimum, short of all six', 'Approve with TAAP. Where the minimum is all six, at pressure 3 or more, a plan short of six is below the minimum and is denied', 'From pressure plus the gap to a full TAAP'],
        ['Full, all six', 'Approve with TAAP', 'From pressure alone, elevated from pressure 2 and high at pressure 4, so every high exposure carries one'],
      ]),
      '<p>A plan below the standard is denied at any severity and pressure, unless a written undue burden or fundamental alteration determination is on file. TAAP work costs staff time, so purchases with less at stake get a lower standard. The <strong>shortfall</strong>, the count of requirements the plan misses, is stated in the denial and in the hold, so the signers report what the plan does instead of ticking requirements it does not meet.</p>',
      '<p>Under the fallback, the TAAP standard is provisional and may rise when evidence arrives, and the first TAAP review re-rates Severity on evidence at the Veracity floor.</p>',

      '<h3>Warning level</h3>',
      '<p>The <strong>warning level</strong>, the residual risk shown to the purchaser, derives from pressure plus the <strong>gap</strong>, the count of requirements the plan misses short of a full TAAP. The shortfall against the minimum decides a denial, and the gap against a full TAAP sets the warning. The level never moves the TAAP standard.</p>',
      '<p>Each level has a fixed meaning and a required action. The pressure and the gap print with the word, so the label never stands alone.</p>',
      table(['Level', 'Pressure plus gap', 'What it tells the purchaser', 'What the purchaser does'], [
        ['Low', `Under ${T.warning.elevated}`, M.WARNING_LEVELS.low.means, M.WARNING_LEVELS.low.action],
        ['Elevated', `${T.warning.elevated} or ${T.warning.high - 1}`, M.WARNING_LEVELS.elevated.means, M.WARNING_LEVELS.elevated.action],
        ['High', `${T.warning.high} or more`, M.WARNING_LEVELS.high.means, M.WARNING_LEVELS.high.action],
      ]),
      '<p>The warning sentence in the review states, in order: the level with its numbers, who depends on the plan and for which essential functions (cannot perform at S3, only with clearly more time or effort at S2), the audience the pressure counts, what the department carries until the vendor\'s roadmap closes the barriers, and the action.</p>',
      '<p>No TAAP lowers the warning below the pressure level, because a TAAP manages barriers and only the vendor removes barriers. The CSU TAAP template\'s Institutional Risk grades the plan alone, by the count of requirements met, and is a different measure.</p>',

      '<h3>Final decision</h3>',
      '<p>The <strong>final decision</strong> settles the purchase as one of three values.</p>',
      table(['Final decision', 'Meaning'], [
        ['Approve', 'The purchase goes ahead, with any barriers acceptable at this exposure without a TAAP.'],
        ['Approve with TAAP', 'The purchase goes ahead under the TAAP on file, a temporary plan that leaves the product\'s conformance unchanged.'],
        ['Deny', 'The purchase stops, as a procurement decision rather than a verdict on the TAAP.'],
      ]),
      `<p>One fact approves a purchase at intake. ${M.BYPASSES.map((b) => `A product <strong>${lower(b.fact)}</strong> carries out the interactive process between that person and the campus, which settled what the person needs. The four factors are not rated, and the approval is limited to the accommodation.`).join(' ')}</p>`,
      `<p>Two conditions deny a product with an Alternate access required risk grade.</p>${ul([
        'A more accessible product meets the same need, with or without a TAAP (S3 only).',
        'The TAAP on file falls below the TAAP standard, with no written undue burden or fundamental alteration determination on file. A plan that meets none of the six requirements gives no alternative access and is denied even under the exception.',
      ])}`,

      '<h3>Holds</h3>',
      '<p>A <strong>hold</strong> pauses the review until a named party supplies what the review waits for. Holds 1 to 3 come before the risk grade, and the first that applies holds the review. Hold 3 resumes at the Severity step with the new findings, or the review proceeds under the fallback, defined under Evidence, when the evidence cannot be raised. Holds 4 and 5 arise in the remedy step.</p>',
      table(['Hold', 'Waits for', 'When it applies', 'Held by', 'Resumes at'], M.HOLDS.map((h, i) => [String(i + 1), cap(h.waits), WHEN[h.id] ?? h.text, cap(M.HOLDERS[h.holder].label), RESUMES[h.id]])),
    ].join('\n');
  }

  // The full markup stays in the hidden #defsBody, untouched, for the document build. The
  // page shows one section at a time: the section list is a vertical tab list, and the
  // selected section's nodes are cloned into #defsView.
  const DEFS = { sections: [], current: null };
  const slug = (s) => `def-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  function showSection(id, focus = false) {
    const i = DEFS.sections.findIndex((s) => s.id === id);
    if (i < 0) return false;
    const s = DEFS.sections[i];
    DEFS.current = id;
    const view = document.getElementById('defsView');
    view.replaceChildren(...s.nodes.map((n) => n.cloneNode(true)));
    view.firstElementChild.id = id;
    view.firstElementChild.tabIndex = -1;
    view.setAttribute('aria-labelledby', `deftab-${id}`);
    const prev = DEFS.sections[i - 1];
    const next = DEFS.sections[i + 1];
    const pager = document.createElement('p');
    pager.className = 'def-pager';
    pager.innerHTML = [
      prev ? `<button type="button" class="btn quiet small" data-go="${prev.id}">Previous: ${esc(prev.title)}</button>` : '',
      next ? `<button type="button" class="btn quiet small" data-go="${next.id}">Next: ${esc(next.title)}</button>` : '',
    ].join('');
    pager.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
      showSection(b.dataset.go, true);
      document.getElementById(b.dataset.go).scrollIntoView({ block: 'start' });
    }));
    view.append(pager);
    for (const tab of document.querySelectorAll('#defsNav [role="tab"]')) {
      const on = tab.id === `deftab-${id}`;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    }
    if (focus) view.firstElementChild.focus();
    return true;
  }

  function renderDefinitions() {
    const body = document.getElementById('defsBody');
    body.innerHTML = definitionsHtml();
    const sections = [];
    for (const node of body.children) {
      if (node.tagName === 'H3') sections.push({ id: slug(node.textContent), title: node.textContent, nodes: [node] });
      else if (sections.length) sections[sections.length - 1].nodes.push(node);
    }
    DEFS.sections = sections;
    const nav = document.getElementById('defsNav');
    nav.innerHTML = sections.map((s) =>
      `<button type="button" role="tab" id="deftab-${s.id}" aria-controls="defsView" aria-selected="false" tabindex="-1">${esc(s.title)}</button>`).join('');
    nav.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) showSection(tab.id.replace('deftab-', ''));
    });
    nav.addEventListener('keydown', (e) => {
      const ids = sections.map((s) => s.id);
      const i = ids.indexOf(DEFS.current);
      const next = { ArrowDown: ids[(i + 1) % ids.length], ArrowRight: ids[(i + 1) % ids.length],
        ArrowUp: ids[(i - 1 + ids.length) % ids.length], ArrowLeft: ids[(i - 1 + ids.length) % ids.length],
        Home: ids[0], End: ids[ids.length - 1] }[e.key];
      if (!next) return;
      e.preventDefault();
      showSection(next);
      document.getElementById(`deftab-${next}`).focus();
    });
    showSection(sections[0].id);
  }

  // This script sits at the end of the body, so the markup exists and Alpine (deferred) has
  // not started. Alpine then binds to the rendered controls.
  fillStatic();
  renderDefinitions();
  setTimeout(() => { if (!window.Alpine) document.getElementById('noAlpine').hidden = false; }, 4000);
})();
