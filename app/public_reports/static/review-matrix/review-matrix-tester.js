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
  // The matrix draws the "No alternate access required" risk grade as the final decision it
  // maps to, Approve, since that cell ends the review. The rubric keeps the risk grade's name.
  const MATRIX_GRADE = { approve: M.OUTCOMES.approve.label, needs_taap: M.RISK_GRADES.needs_taap };
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
      const required = who === 'requester';
      return `<input type="number" min="0" inputmode="numeric" placeholder="${required ? 'Required' : 'Unknown'}"${required ? ' aria-required="true"' : ''} aria-label="${esc(name)}" x-model.number="${model}">`;
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

    // E1+ is derived from the ACR record, so the analyst never records it.
    $('evidence').innerHTML = M.EVIDENCE.filter((e) => !e.derived).map((e) => `<option value="${e.id}">${esc(`${e.id}: ${e.record ?? e.holds}`)}</option>`).join('');

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
  // The reviewer's signature survives presets and reloads, since it never changes with the review.
  const SIGNER_KEY = 'reviewTester.signer';
  const loadSigner = () => { try { return localStorage.getItem(SIGNER_KEY) || ''; } catch (e) { return ''; } };
  const saveSigner = (s) => { try { localStorage.setItem(SIGNER_KEY, s); } catch (e) { /* storage blocked: the field still works for the session */ } };
  function blankForm() {
    return {
      product: '', vendor: '', unit: '', requester: '', requisition: '', contact: '', signer: loadSigner(),
      // A loaded test review fixes its date, so the ACR's age does not drift. Null means today.
      reviewDate: null,
      ictKind: 'web',
      floors: [],
      answers: Object.fromEntries(FACTORS.map((f) => [f.id, { requester: null, reviewer: null }])),
      evidence: 'E0',
      evidenceNote: '',
      // Author and remarks start unanswered. The ACR is rated once both are read off it.
      acr: { issued: '', lastMajorRelease: '', defects: [], author: null, authorName: '', remarks: null, spotCheck: 'none', spotCheckNote: '', accepted: false, acceptedNote: '' },
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
    Object.assign(form.acr, p.acr ?? {});
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
      reviewDate: form.reviewDate || undefined,
      ictKind: form.ictKind,
      floors: M.FLOORS.filter((f) => form.floors.includes(f.id)).map((f) => f.id),
      bypasses: M.BYPASSES.filter((b) => form.floors.includes(b.id)).map((b) => b.id),
      answers,
      evidence: form.evidence,
      evidenceNote: form.evidenceNote.trim() || undefined,
      acr: { issued: form.acr.issued || undefined, lastMajorRelease: form.acr.lastMajorRelease || undefined,
        defects: form.acr.defects.filter((id) => { const c = M.ACR_CHECKS.find((x) => x.id === id); return c && (c.scope === 'document' || form.acr.remarks === 'restated'); }),
        author: form.acr.author, authorName: form.acr.authorName.trim() || undefined, remarks: form.acr.remarks,
        spotCheck: form.acr.spotCheck, spotCheckNote: form.acr.spotCheckNote.trim() || undefined,
        accepted: form.acr.accepted, acceptedNote: form.acr.acceptedNote.trim() || undefined },
      validation: form.validation,
      findings: form.findings.map(({ role, group, essentialFunction, severity }) => ({ role, group, essentialFunction, severity })),
      moreAccessibleProductExists: !!form.moreAccessibleProductExists,
      taap: { exists: !!form.taap.exists,
        meets: Object.fromEntries(M.TAAP_REQUIREMENTS.map((r) => [r.id, !!form.taap.meets[r.id]])),
        exception: form.taap.exception },
    };
  }

  /** A stored review, in the shape `evaluate` reads, as form state. The inverse of toReview. */
  function formFromReview(r, request = {}) {
    const form = blankForm();
    Object.assign(form, {
      product: request.product ?? '', vendor: request.vendor ?? '', unit: request.unit ?? '', requester: request.requester ?? '',
      contact: request.contact ?? '', requisition: request.requisition ?? '',
      reviewDate: r.reviewDate ?? null, ictKind: r.ictKind ?? 'web',
      floors: [...(r.floors ?? []), ...(r.bypasses ?? [])], evidence: r.evidence ?? 'E0', evidenceNote: r.evidenceNote ?? '',
      validation: r.validation ?? 'open', moreAccessibleProductExists: !!r.moreAccessibleProductExists,
    });
    for (const f of FACTORS) {
      const a = r.answers?.[f.id];
      form.answers[f.id] = { requester: a?.requester ?? null, reviewer: a?.reviewer ?? null };
    }
    Object.assign(form.acr, {
      issued: r.acr?.issued ?? '', lastMajorRelease: r.acr?.lastMajorRelease ?? '', defects: [...(r.acr?.defects ?? [])],
      author: r.acr?.author ?? null, authorName: r.acr?.authorName ?? '', remarks: r.acr?.remarks ?? null,
      spotCheck: r.acr?.spotCheck ?? 'none', spotCheckNote: r.acr?.spotCheckNote ?? '',
      accepted: !!r.acr?.accepted, acceptedNote: r.acr?.acceptedNote ?? '',
    });
    form.findings = (r.findings ?? []).map((f) => newFinding(f));
    form.taap.exists = !!r.taap?.exists;
    form.taap.exception = r.taap?.exception ?? 'none';
    for (const req of M.TAAP_REQUIREMENTS) form.taap.meets[req.id] = !!r.taap?.meets?.[req.id];
    return form;
  }
  /** The parts of a determination a test review pins, in the order the list reports them. */
  const pinned = (d) => ({
    outcome: d.outcome, hold: d.hold, exposure: d.exposure.level, evidence: d.evidence, severity: d.severity,
    breadth: d.breadth.level, taapStandard: d.taapStandard ? d.taapStandard.required : null,
    warning: d.taapStandard ? d.taapStandard.warning : null, raiseBy: d.veracity.raise ? d.veracity.raise.by : null,
  });
  const resultWord = (e) => (e.hold ? M.HEADLINE[e.hold] : (M.OUTCOMES[e.outcome] ? M.OUTCOMES[e.outcome].label : e.outcome));

  // ACR records for the examples: dated relative to today, so the age qualification holds as written.
  const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 7); };
  const RECENT_VENDOR = { issued: monthsAgo(4), author: 'vendor', remarks: 'restated' };
  const RECENT_OUTSIDE = { issued: monthsAgo(4), author: 'outside', authorName: 'Example Audits LLC, manual testing with NVDA and keyboard', remarks: 'bug_report' };
  const OLD_VENDOR = { issued: monthsAgo(16), author: 'vendor', remarks: 'restated' };
  const PRESETS = {
    small: { product: 'FormBuilder', vendor: 'Example Forms Inc.', unit: 'Facilities', ictKind: 'web', floors: [], evidence: 'E1', acr: RECENT_VENDOR,
      req: { users: 10, scope: 'low', required_use: 'low', criticality: 'low', publishes: 'low', frequency: 'medium', contract_length: 'low' },
      findings: [{ role: 'employees', group: 'without_vision', essentialFunction: 'Submit report', severity: 'S2' }] },
    deptClean: { product: 'RoomBooker', vendor: 'Example Scheduling', unit: 'Student Life', ictKind: 'web', floors: [], evidence: 'E1', acr: RECENT_VENDOR,
      req: { users: 100, scope: 'medium', required_use: 'medium', criticality: 'medium', publishes: 'low', frequency: 'medium', contract_length: 'medium' },
      findings: [] },
    homeworkTaap: { product: 'MathLab Pro', vendor: 'Example Learning', unit: 'Mathematics', ictKind: 'web', floors: ['required_for_grade'], evidence: 'E3b',
      taap: M.TAAP_REQUIREMENTS.map((r) => r.id),
      req: { users: 400, scope: 'medium', required_use: 'high', criticality: 'high', publishes: 'low', frequency: 'high', contract_length: 'medium' },
      findings: [{ role: 'students', group: 'without_vision', essentialFunction: 'Submit homework', severity: 'S3' }] },
    homework: { product: 'MathLab Pro', vendor: 'Example Learning', unit: 'Mathematics', ictKind: 'web', floors: ['required_for_grade'], evidence: 'E3b',
      req: { users: 400, scope: 'medium', required_use: 'high', criticality: 'high', publishes: 'low', frequency: 'high', contract_length: 'medium' },
      findings: [{ role: 'students', group: 'without_vision', essentialFunction: 'Submit homework', severity: 'S3' }] },
    unknown: { product: 'LabStation desktop app', vendor: 'Example Instruments', unit: 'Chemistry', ictKind: 'nonweb', floors: [], evidence: 'E1', acr: RECENT_OUTSIDE,
      req: { scope: 'medium', required_use: 'medium', criticality: 'medium', publishes: 'low', frequency: 'high', contract_length: 'medium' },
      findings: [] },
    public: { product: 'EventSignup', vendor: 'Example Events', unit: 'Student Life', ictKind: 'web', floors: ['public'], evidence: 'E0',
      req: { users: 3, scope: 'low', required_use: 'low', criticality: 'low', publishes: 'high', frequency: 'low', contract_length: 'low' },
      findings: [] },
    weakDeny: { product: 'CampusPay portal', vendor: 'Example Payments', unit: 'Student Financial Services', ictKind: 'web', floors: ['public'], evidence: 'E1', acr: OLD_VENDOR,
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
  PRESETS.exception = { ...PRESETS.weakDeny, evidence: 'E3b', exception: 'determined' };
  PRESETS.exceptionClaimed = { ...PRESETS.weakDeny, evidence: 'E3b', exception: 'claimed' };
  PRESETS.strongDeny = { ...PRESETS.weakDeny, evidence: 'E3b' };
  PRESETS.weakApprove = { ...PRESETS.homework, evidence: 'E1', acr: RECENT_OUTSIDE, findings: [] };
  PRESETS.fallback = { ...PRESETS.weakApprove, acr: RECENT_VENDOR, validation: 'unavailable' };
  PRESETS.trustedVendor = { ...PRESETS.homework, evidence: 'E1', acr: { ...RECENT_VENDOR, remarks: 'bug_report' },
    findings: [{ role: 'students', group: 'limited_vision', essentialFunction: 'Submit homework', severity: 'S1' }] };
  PRESETS.acceptedVendor = { ...PRESETS.homework, evidence: 'E1',
    acr: { ...RECENT_OUTSIDE, remarks: 'restated', defects: ['no_date_or_version'], accepted: true, acceptedNote: 'the version line reads 4.2 and the product bought is 4.2.1, a patch release', spotCheck: 'agrees', spotCheckNote: 'Submit homework, NVDA and keyboard' },
    findings: [{ role: 'students', group: 'limited_vision', essentialFunction: 'Submit homework', severity: 'S1' }] };
  PRESETS.deptDefect = { ...PRESETS.deptClean, acr: { ...RECENT_VENDOR, defects: ['no_methods'] } };
  PRESETS.deptOutside = { ...PRESETS.deptClean, acr: RECENT_OUTSIDE };
  PRESETS.deptSpot = { ...PRESETS.deptClean, acr: { ...RECENT_VENDOR, spotCheck: 'agrees', spotCheckNote: 'Book a room and cancel a booking, NVDA and keyboard' } };
  PRESETS.deptContradicted = { ...PRESETS.deptClean, acr: { ...RECENT_OUTSIDE, spotCheck: 'contradicts', spotCheckNote: 'Book a room, keyboard only' },
    findings: [{ role: 'students', group: 'limited_manipulation', essentialFunction: 'Book a room', severity: 'S2' }] };
  PRESETS.deptAdmits = { ...PRESETS.deptClean,
    findings: [{ role: 'students', group: 'without_vision', essentialFunction: 'Book a room', severity: 'S2' }] };

  /** The examples, grouped by what they show. Each one's result is computed, never typed. */
  const EXAMPLE_GROUPS = [
    { title: 'Approvals', items: [
      ['small', 'Small optional tool, one S2 barrier'],
      ['deptOutside', 'Department tool, clean ACR by an outside firm, no findings'],
      ['deptSpot', 'Department tool, clean vendor ACR, spot check agrees'],
      ['weakApprove', 'Required math tool, outside-firm ACR taken at face value, no findings'],
      ['trustedVendor', 'Required math tool, vendor ACR that reads like a bug report, one S1 barrier'],
      ['acceptedVendor', 'Required math tool, outside-firm ACR with a report defect accepted, spot check agrees, one S1 barrier'],
      ['homeworkTaap', 'Homework platform, S3, TAAP meets all six'],
      ['exception', 'Public portal, S3, partial TAAP, determination on file'],
      ['accommodation', 'Screen magnifier for one employee, an accommodation purchase'],
    ] },
    { title: 'Holds', items: [
      ['public', 'Public page, no ACR'],
      ['unknown', 'Department tool, user count unknown'],
      ['deptClean', 'Department tool, clean vendor ACR, no findings, no spot check yet'],
      ['deptDefect', 'Department tool, vendor ACR with a report defect, no methods named'],
      ['deptContradicted', 'Department tool, clean ACR, spot check found a barrier'],
      ['deptAdmits', 'Department tool, clean vendor ACR admits one S2 barrier'],
      ['homework', 'Homework platform, S3, no TAAP yet'],
      ['fallback', 'Required math tool, vendor ACR not yet trusted, no demonstration possible'],
      ['weakDeny', 'Public portal, S3, partial TAAP, old vendor ACR (high exposure raises the evidence first)'],
      ['exceptionClaimed', 'Public portal, S3, partial TAAP, undue burden claimed'],
    ] },
    { title: 'Denials', items: [
      ['strongDeny', 'Public portal, S3, partial TAAP, full manual review'],
    ] },
  ];

  // ---------------------------------------------------------------------------------------
  // The Alpine component.
  // ---------------------------------------------------------------------------------------
  document.addEventListener('alpine:init', () => {
    // `x-month="form.acr.issued"` binds a text input to a YYYY-MM model value through flatpickr's
    // month picker, which renders the same in every browser (type="month" does not). The input
    // stays typeable, so the keyboard path is the text field and the picker is a convenience.
    // The model can change from outside (a preset), so an effect pushes it back into the picker.
    Alpine.directive('month', (el, { expression }, { evaluate, effect, cleanup }) => {
      const set = (value) => evaluate(`${expression} = $month`, { scope: { $month: value } });
      const fp = flatpickr(el, {
        dateFormat: 'Y-m', altInput: true, altFormat: 'F Y', allowInput: true, disableMobile: true,
        plugins: [new monthSelectPlugin({ shorthand: false, dateFormat: 'Y-m', altFormat: 'F Y' })],
        onChange: (dates, value) => set(value || ''),
      });
      effect(() => {
        const value = evaluate(expression) || '';
        if ((fp.input.value || '') === value) return;
        if (value) fp.setDate(value, false, 'Y-m'); else fp.clear(false);
      });
      cleanup(() => fp.destroy());
    });
    Alpine.data('tester', () => ({
      M, FACTORS, LEVELS: M.LEVELS,
      form: blankForm(),
      showReviewer: false,
      d: null,
      ex: null,
      emails: [],
      emailId: null,
      includeReasoning: true,
      copyStatus: '',
      determinationStatus: '',
      open: { messages: false, reviewer: false, data: false },
      analysis: null,
      testSet: null,
      activeTest: null,
      tab: 'review',
      tabs: ['review', 'definitions'],
      examples: EXAMPLE_GROUPS.map((g) => ({ ...g, items: g.items.map(([id, name]) => {
        const review = toReview(formFromPreset(PRESETS[id]));
        return { id, name, result: M.explain(review, M.evaluate(review)).headline };
      }) })),
      label, cap,

      init() {
        this.applyPreset('clear');
        this.$watch('form', () => this.update());
        this.$watch('form.signer', (s) => saveSigner(s));
        this.$watch('includeReasoning', () => this.update());
        this.$watch('emailId', () => { this.copyStatus = ''; });
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
        const ctx = { product: this.form.product, vendor: this.form.vendor, unit: this.form.unit, requester: this.form.requester,
          requisition: this.form.requisition, contact: this.form.contact, signer: this.form.signer, date: this.form.reviewDate || new Date().toISOString().slice(0, 10) };
        this.ex = M.explain(review, this.d, ctx);
        // The messages for this state. The selection holds while it still applies, else the recommended one.
        this.emails = window.ReviewEmails.templates(review, this.d, this.ex, ctx, { reasoning: this.includeReasoning });
        if (!this.emails.some((t) => t.id === this.emailId)) this.emailId = this.emails[0]?.id ?? null;
        this.copyStatus = '';
        this.determinationStatus = '';
      },
      applyPreset(id) {
        const signer = this.form.signer;
        this.form = formFromPreset(PRESETS[id]);
        this.form.signer = signer;
        this.emailId = null;   // a new review starts on its recommended message
        this.analysis = null;  // an ACR analysis belongs to the review it was loaded into
        this.activeTest = null;
        this.showReviewer = false;
        this.update();
      },
      clearForm() { this.applyPreset('clear'); },

      // ---- derived values the template reads
      get sev() { return this.d ? this.d.severity.slice(0, 2) : 'S?'; },
      get tone() { return this.d ? TONE[this.d.outcome] : 'hold'; },
      get kind() { return M.ICT_KINDS[this.form.ictKind]; },
      get evidence() { return evidenceById(this.form.evidence); },
      /** The level after the ACR record: E1+ when the qualifications or the spot check earn it. */
      get derived() { return this.d ? evidenceById(this.d.evidence) : this.evidence; },
      get floor() { return this.d ? M.veracityFloor(this.d.exposure.level) : 0; },
      get acrShown() { return M.ACR_LEVELS.includes(this.form.evidence); },
      /** The qualifications are read off every ACR that is not stale. The remarks open the report checks. */
      get qualificationsShown() { return this.acrShown && !this.isStale; },
      /** A clean ACR is rated once its author and remarks are answered. The date may stay unknown. */
      get acrRated() {
        if (!this.qualificationsShown) return true;
        if (this.form.acr.accepted && !this.form.acr.acceptedNote.trim()) return false;
        return this.form.acr.author != null && this.form.acr.remarks != null;
      },
      /** Findings are entered once the ACR is rated, so the ACR is read before any barrier is recorded. */
      get findingsShown() { return this.form.findings.length > 0 || this.acrRated; },
      /** The document checks, with the stale one read from the dates, and the remarks checks. */
      get documentChecks() { return M.ACR_CHECKS.filter((c) => c.scope === 'document' && c.id !== 'stale'); },
      get remarksChecks() { return M.ACR_CHECKS.filter((c) => c.scope === 'remarks'); },
      get staleCheck() { return M.ACR_CHECKS.find((c) => c.id === 'stale'); },
      get isStale() { return !!this.d?.veracity?.acr?.stale; },
      get hasDefect() { return !!this.d?.veracity?.acr?.defective; },
      /** The document checks show for every ACR. The remarks checks open when the remarks fall short, and their ticks apply only while open. */
      get reportChecksShown() { return this.qualificationsShown; },
      get remarksChecksShown() { return this.qualificationsShown && this.form.acr.remarks === 'restated'; },
      /** Acceptance is offered for a ticked defect; a stale report is not accepted. */
      get acceptanceShown() { return this.reportChecksShown && this.hasDefect; },
      get findingsNote() { return 'Record WCAG failures once you have rated the ACR.'; },
      /** What an empty failure list says about the product, as the review stands. */
      get noFailuresFlag() {
        if (!this.d) return '';
        if (this.d.evidence === 'E0') return 'No WCAG failure recorded and no evidence on file. The review cannot rate Severity and holds for evidence.';
        return `No WCAG failure recorded. As it stands, the review reads the ${this.d.evidence} evidence as showing no barrier on any essential function, severity S0, and grades the product on that. Add a row for each failure the evidence shows.`;
      },
      /** The spot check applies to a clean ACR only, so its fieldset shows for one. */
      get spotCheckApplies() { return !!this.d?.veracity?.acr?.clean; },
      /** The step that lifts the evidence, from the model, for the raising block. */
      get raiseNote() {
        if (this.d?.veracity?.raise?.text) return this.d.veracity.raise.text;
        if (this.spotCheckApplies && !this.d?.veracity?.acr?.trusted) return 'This result needs no raising. You can still record a spot check, and an agreeing one makes the evidence E3a.';
        return 'The evidence is at the floor, so nothing needs raising.';
      },
      get raiseBy() { return this.d?.veracity?.raise?.by ?? null; },
      /** True when the evidence on file is a demonstration, audit or review rather than an ACR. */
      get evidenceIsDirect() { return ['E2a', 'E2b', 'E3b'].includes(this.form.evidence); },
      /** An ACR record that the direct evidence supersedes, for the note under the select. */
      get supersededAcr() {
        const a = this.form.acr;
        const recorded = a.issued || a.authorName || a.spotCheck !== 'none' || a.author === 'outside' || a.remarks === 'bug_report' || a.remarks === 'feature_named' || a.accepted || a.defects.length;
        if (!this.evidenceIsDirect || !recorded) return '';
        const who = a.author === 'outside' ? (a.authorName || 'an outside firm') : 'the vendor';
        return `The ACR on record (${a.issued ? `evaluated ${a.issued}, ` : ''}by ${who}${a.spotCheck !== 'none' ? `, spot check ${a.spotCheck}` : ''}) is superseded as the strongest evidence. Its details stay on the record, and the findings stay.`;
      },
      // The result of the raising step, as one control. A Done option records the demonstration,
      // audit or review as the strongest evidence on file, which replaces the ACR; a corrected
      // or newly supplied ACR records as E1 with no spot check yet; Unavailable is the fallback.
      get raiseResult() { return this.form.validation === 'unavailable' ? 'unavailable' : 'open'; },
      set raiseResult(value) {
        if (value === 'unavailable' || value === 'open') { this.form.validation = value; return; }
        this.form.validation = 'open';
        if (value === 'acr') { this.form.evidence = 'E1'; this.form.acr.defects = []; this.form.acr.accepted = false; this.form.acr.acceptedNote = ''; this.form.acr.spotCheck = 'none'; this.form.acr.spotCheckNote = ''; return; }
        this.form.evidence = value;
      },
      get std() { return this.d?.taapStandard ?? null; },
      get hold() { return this.d?.hold ? holdOf(this.d.hold) : null; },
      get holder() { return this.hold ? M.HOLDERS[this.hold.holder] : null; },
      get requestSummary() {
        const parts = [this.form.product.trim(), this.form.vendor.trim() ? `vendor ${this.form.vendor.trim()}` : '',
          this.form.unit.trim() ? `requested by ${this.form.unit.trim()}` : '',
          this.form.requisition.trim() ? `requisition ${this.form.requisition.trim()}` : ''].filter(Boolean);
        return parts.length ? parts.join(', ') : 'Not named yet';
      },
      /** The selected message, with its preview blocks. */
      get email() { return this.emails.find((t) => t.id === this.emailId) ?? null; },
      /** The picker's label for each message: what it is and who reads it. */
      emailOption(t) { return `${t.label}, to ${t.to}${t.recommended ? ' (recommended)' : ''}`; },
      get overrideCount() {
        return FACTORS.filter((f) => { const a = this.form.answers[f.id]; return a.reviewer != null && a.reviewer !== ''; }).length;
      },
      get taapMet() { return M.TAAP_REQUIREMENTS.filter((r) => this.form.taap.meets[r.id]).length; },

      // ---- what the form shows, by relevance
      get validationMatters() { return !!this.d && (this.d.hold === 'severity_unknown' || this.d.hold === 'veracity_below_floor' || this.d.fallback); },
      /** The raising block shows whenever a clean ACR is not yet taken at face value, so the spot check can be recorded, and stays once one is. */
      get raisingShown() { return this.acrRated && (this.validationMatters || (this.spotCheckApplies && (!this.d.veracity.acr.trusted || this.form.acr.spotCheck !== 'none'))); },
      /** The result options for the branch in hand. The ACR options appear only where an ACR is the step. */
      get raiseOptions() {
        const by = this.raiseBy;
        const acr = by === 'review_failed_check' ? [{ value: 'acr', label: 'Corrected ACR received, no report defect (E1)' }]
          : by === 'vendor_evidence' ? [{ value: 'acr', label: 'Vendor ACR received, no report defect (E1)' }] : [];
        return [{ value: 'open', label: 'Not done yet' }, ...acr,
          { value: 'E2a', label: 'Vendor demonstration done (E2a)' },
          { value: 'E2b', label: 'Third-party audit received (E2b)' },
          { value: 'E3b', label: 'Full manual review done (E3b)' },
          { value: 'unavailable', label: 'Cannot be arranged (fallback)' }];
      },
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

      // ---- an ACR analysis from vpat-analysis/apply_rules.js. It fills the ACR record the
      // analyst would otherwise read off the report, and lists the admitted failures as leads.
      // The analyst still places each lead on an essential function and rates its severity.
      /** Reads a JSON file and routes it by kind: a set of test reviews, or an ACR analysis. */
      async loadFile(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        let a;
        try { a = JSON.parse(await file.text()); } catch (e) { a = null; }
        if (a && a.kind === 'sfbrn-review-tests' && Array.isArray(a.reviews)) {
          this.loadTestSet(a, file.name);
          // A test file loaded at the ACR button says so there, since its list sits at the top of the page.
          if (event.target === this.$refs.acrFile && this.testSet.reviews.length) {
            this.analysis = { file: file.name, leads: [],
              message: `${file.name} is a set of test reviews, not an ACR analysis. The form now shows its first review, "${this.testSet.reviews[0].name}". The full list is under Load an example review, at the top of the page.` };
          }
          return;
        }
        return this.loadAnalysis(a, file.name);
      },
      /** A set of test reviews: each review's inputs and the determination it should give. */
      loadTestSet(t, fileName) {
        const reviews = t.reviews.map((r) => {
          let actual = null;
          let error = null;
          try { actual = pinned(M.evaluate(r.review)); } catch (e) { error = `The review does not run: ${e.message}`; }
          const diff = actual && r.expected
            ? Object.keys(r.expected).filter((k) => JSON.stringify(r.expected[k]) !== JSON.stringify(actual[k]))
              .map((k) => `${k}: expected ${r.expected[k] ?? 'none'}, got ${actual[k] ?? 'none'}`)
            : [];
          return { ...r, actual, error, diff, match: !error && diff.length === 0 };
        });
        this.testSet = { file: fileName, description: t.description ?? '', matrixVersion: t.matrixVersion ?? null, request: t.request ?? {}, reviews };
        // Loading shows a result at once: the form takes the first review, and the list opens.
        if (reviews.length) this.applyTest(reviews[0].id);
        if (this.$refs.examples) this.$refs.examples.open = true;
      },
      applyTest(id) {
        const t = this.testSet?.reviews.find((r) => r.id === id);
        if (!t) return;
        const signer = this.form.signer;
        this.form = formFromReview(t.review, this.testSet.request);
        this.form.signer = signer;
        this.emailId = null;
        this.analysis = null;
        this.activeTest = id;
        this.update();
      },
      get testSetStatus() {
        const t = this.testSet;
        if (!t) return '';
        const bad = t.reviews.filter((r) => !r.match).length;
        const version = t.matrixVersion && String(t.matrixVersion) !== String(M.MATRIX_VERSION)
          ? ` The file was built under matrix version ${t.matrixVersion}, and this page runs version ${M.MATRIX_VERSION}, so a mismatch may be a rule change rather than a bug.` : '';
        const count = t.reviews.length === 1 ? 'one review' : `${t.reviews.length} reviews`;
        const result = bad ? `${bad} ${bad === 1 ? 'differs' : 'differ'} from the expected determination` : 'all match the expected determination';
        return `Loaded ${t.file}: ${count}, ${result}.${version}`;
      },
      testResult(r) { return r.error ? 'Error' : `${r.match ? 'Match' : 'Mismatch'}: ${resultWord(r.actual)}`; },
      async loadAnalysis(a, fileName) {
        const file = { name: fileName };
        if (!a || !a.record || !Array.isArray(a.leads)) {
          this.analysis = { file: file.name, problem: 'The file is neither an ACR analysis nor a set of test reviews. Load a .review.json file from apply_rules.js or a .reviews.json test file.', leads: [] };
          return;
        }
        const r = a.record;
        this.form.evidence = 'E1';
        Object.assign(this.form.acr, {
          issued: r.issued || '', lastMajorRelease: r.lastMajorRelease || '', author: r.author ?? null,
          authorName: r.authorName || '', remarks: r.remarks ?? null, defects: [...(r.defects || [])],
          spotCheck: 'none', spotCheckNote: '', accepted: false, acceptedNote: '',
        });
        if (!this.form.product.trim() && a.product?.name) this.form.product = a.product.name;
        const analystChecks = Object.entries(a.checks || {}).filter(([, c]) => c.result === 'analyst').map(([id]) => id);
        this.analysis = { file: file.name, level: a.level?.level ?? null, analystChecks, today: a.today,
          leads: a.leads.map((l) => ({ ...l, added: false })) };
        this.$nextTick(() => {
          // The tester rates the record itself. A different level means the review date differs
          // from the analysis run, or the analyst has changed the record since.
          if (this.analysis.level && this.derived.id !== this.analysis.level) {
            this.analysis.problem = `The analysis rated the ACR ${this.analysis.level} on ${a.today}, and the tester rates it ${this.derived.id} today. Check the dates before relying on either.`;
          }
        });
      },
      addLead(lead) {
        this.form.findings.push(newFinding({ group: lead.suggestedGroups?.[0] ?? 'without_vision', essentialFunction: '' }));
        lead.added = true;
      },
      get analysisStatus() {
        const a = this.analysis;
        if (!a) return '';
        if (a.problem) return a.problem;
        if (a.message) return a.message;
        const open = a.analystChecks.length
          ? ` The analyst still decides ${a.analystChecks.length === 1 ? 'one check' : `${a.analystChecks.length} checks`}: ${a.analystChecks.map((id) => M.ACR_CHECKS.find((c) => c.id === id)?.text.toLowerCase()).join('; ')}.`
          : '';
        return `Loaded ${a.file}. The analysis rates the ACR ${a.level} and lists ${a.leads.length === 1 ? 'one lead' : `${a.leads.length} leads`}. Confirm each call against the report.${open}`;
      },
      removeFinding(key) { this.form.findings = this.form.findings.filter((f) => f.key !== key); },

      // ---- the status line under each step
      get exposureStatus() {
        if (!this.d) return '';
        if (this.d.bypass) return BYPASS_NOTE;
        const e = this.d.exposure;
        if (e.unknownsMatter) return `Exposure unknown. The review needs the user count and holds until the requester supplies it.${e.unknownCount > 1 ? ` ${e.unknownCount - 1} other ${e.unknownCount === 2 ? 'answer is' : 'answers are'} blank and count as high.` : ''}`;
        const floors = M.FLOORS.filter((f) => e.floorsApplied.includes(f.id));
        const floorMax = floors.reduce((a, f) => (M.LEVELS.indexOf(f.min) > M.LEVELS.indexOf(a) ? f.min : a), 'low');
        const byFloor = floors.length > 0 && M.LEVELS.indexOf(floorMax) >= M.LEVELS.indexOf(e.level);
        const lv = (l) => M.LEVELS.indexOf(l);
        const answers = `the user count starts Exposure at ${e.start}, and the other answers score ${e.points} of ${e.maxPoints} points, ${e.answerBand}, ${lv(e.answerBand) >= lv(e.start) ? `so it stays ${e.start}` : `so they lower it to ${e.lowered}`}.`;
        const base = byFloor
          ? `Exposure ${e.level}, set by a floor fact. Without it, ${answers}`
          : `Exposure ${e.level}. ${cap(answers)}`;
        const unknown = e.unknownCount ? ` ${e.unknownCount} blank ${e.unknownCount === 1 ? 'answer counts' : 'answers count'} as high. An answer entered can lower the level.` : '';
        return base + unknown;
      },
      get severityStatus() {
        if (!this.d) return '';
        if (this.d.bypass) return BYPASS_NOTE;
        if (this.sev === 'S?') return 'Severity unknown. The record holds no evidence and no finding.';
        const b = this.d.breadth;
        const breadth = b.assumed ? 'Breadth 2, assumed without evidence.' : `Breadth ${b.level}, from ${b.blocked} blocked ${b.blocked === 1 ? 'pair' : 'pairs'} and ${b.harder} S2 ${b.harder === 1 ? 'finding' : 'findings'}.`;
        const acc = this.d.accumulation?.escalated;
        const how = this.d.fallback ? 'Severity S3 (provisional), under the fallback.'
          : acc ? `Severity S3 (accumulated): S2 barriers ${acc === 'stacked' ? 'stacked on one function' : 'spread across the product'} add up to a blocked function.`
            : this.form.findings.length ? `Severity ${this.sev}, ${SEVERITY_WORD[this.sev]}, from the worst finding.`
              : 'Severity S0. The record holds no WCAG failure, so the review reads the evidence as showing no barrier.';
        return `${how} ${breadth}`;
      },
      /** How the ACR record moved the level. */
      get acrStatus() {
        const a = this.d?.veracity?.acr;
        if (!a) return '';
        const named = a.defects.map((id) => M.ACR_CHECKS.find((c) => c.id === id)?.text).filter(Boolean).map((t) => t.charAt(0).toLowerCase() + t.slice(1)).join('; ');
        if (a.stale) return `The ACR is ${a.months != null && a.months > M.CALIBRATION.acrMaxAgeMonths ? `${a.months} months old` : 'dated before the last major release'}, so it is stale and ranks E1-. The vendor supplies a current report, or a full manual review or a demonstration is next.`;
        if (!a.clean) return `The report fails a check (${named}), so the ACR ranks E1-. The vendor corrects the report, the analyst accepts the defect with the reason noted, or a full manual review or a demonstration is next.`;
        const pre = a.accepted ? `Report defect accepted (${named}). ` : '';
        if (!this.acrRated) return a.accepted && !this.form.acr.acceptedNote.trim() ? `Report defect ticked (${named}). Note why it does not matter for this purchase.` : 'Read the author and the remarks off the ACR to rate it.';
        const note = a.spotCheckNote ? ` (${a.spotCheckNote})` : '';
        if (a.spotCheck === 'agrees') return `${pre}The spot check agrees${note}, so the evidence is E3a and the review proceeds.`;
        if (a.spotCheck === 'contradicts') return `${pre}The spot check contradicts the ACR${note}, which drops it to E1-. A full manual review or a demonstration is next.`;
        const age = a.age === 'unknown' ? 'it records no date' : `it is ${a.months} ${a.months === 1 ? 'month' : 'months'} old`;
        const author = a.author === 'raised' ? 'it is by an outside firm' : 'it is by the vendor\'s own staff';
        if (a.trusted) return `${pre}Taken at face value (E1+). Its remarks read like a bug report, ${age}, and ${author}. The review proceeds on it.`;
        const reason = a.remarks === 'lowered' ? 'its remarks are blank, restate the criterion, repeat across rows or hedge'
          : a.remarks === 'named' ? 'its remarks name the feature with issues but not where it is or how it falls short'
          : `${age} and ${author.replace('it is ', '')}`;
        return `${pre}Not yet taken at face value (E1), because ${reason}. ${this.d.hold === 'veracity_below_floor' ? 'The analyst\'s spot check comes next, under Raising the evidence.' : 'The review proceeds without the spot check at this exposure and grade, and you can still record one under Raising the evidence.'}`;
      },
      get evidenceStatus() {
        if (!this.d) return '';
        if (this.d.bypass) return BYPASS_NOTE;
        if (!this.acrRated) return '';
        const ev = this.derived;
        const v = this.d.veracity;
        const f = v.floor;
        const need = this.d.exposure.unknownsMatter ? 'The Exposure level, once known, sets the Veracity floor.'
          : `The Veracity floor at ${this.d.exposure.level} exposure is ${f === 0 ? 'any evidence' : `rank ${f} (${evidenceAtRank(f)})`}.`;
        if (ev.id === 'E0' && this.sev === 'S?') return `No evidence on file. ${need}`;
        const standing = ev.rank >= f ? 'at or above the floor, which confirms Severity'
          : this.d.fallback ? 'below the floor with no way to raise it, so the fallback applies'
            : !v.binds ? 'below the floor, but the risk grade rests on the barriers found, so the review proceeds with the TAAP standard provisional'
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
          ['Exposure', e.unknownsMatter ? 'Unknown' : cap(e.level)],
          ['Severity', this.sev === 'S?' ? 'Unknown' : `${this.d.severity.replace(' (', ', ').replace(')', '')}, ${SEVERITY_WORD[this.sev]}`],
          ['Evidence', this.d.evidence],
        ];
        if (this.std) {
          out.push(['Breadth', String(this.d.breadth.level)], ['Pressure', `${this.std.pressure} of 4`],
            ['TAAP standard', this.std.required === 6 ? 'All 6' : `${this.std.required} of 6`], ['Warning', cap(this.std.warning)]);
        }
        return out;
      },
      /** The steps in the order the review takes them. The step a hold stops at is marked, the
       *  steps before it are done, and the steps after it are to do. */
      get path() {
        const steps = ['Exposure', 'Veracity', 'Severity', 'Risk grade', 'Remedy', 'Decision'];
        const d = this.d;
        if (d?.bypass) return steps.map((name) => ({ name, state: name === 'Decision' ? 'here' : 'todo' }));
        const haltAt = { answers_unknown: 0, severity_unknown: 1, veracity_below_floor: 1, taap_needed: 4, exception_claimed: 4 };
        const here = d?.exposure?.unknownsMatter ? 0 : d?.hold ? haltAt[d.hold] : 5;
        return steps.map((name, i) => ({ name, state: i < here ? 'done' : i === here ? 'here' : 'todo' }));
      },
      get decisionSections() {
        if (!this.ex) return [];
        const open = { 'Why this result': true, 'What happens next': true };
        return this.ex.sections.map((s) => ({ ...s, key: s.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-'), open: !!open[s.heading] }));
      },
      // ---- the accordions in the result column. Each heading stays a heading and holds the
      // button that shows its panel, so a headings map lists it whether the panel is open or
      // not. `open` records a choice the reader made; a section with no choice yet uses its
      // default.
      isOpen(key, fallback = false) { return this.open[key] ?? fallback; },
      toggle(key, fallback = false) { this.open[key] = !this.isOpen(key, fallback); },
      get factGroups() {
        const d = this.d;
        if (!d) return [];
        const e = d.exposure;
        const review = toReview(this.form);
        return [
          { title: 'Exposure', rows: [
            ['Accommodation purchase', d.bypass ? 'yes, approved at intake' : 'no'],
            ['Level', e.unknownsMatter ? `unknown (${e.unknownCount} ${e.unknownCount === 1 ? 'answer' : 'answers'} missing)` : e.level],
            ['Start from the user count', e.unknownsMatter ? 'not set, the user count is missing' : `${e.start} (${e.usersValue} users, lowest ${e.lowest})`],
            ['Other answers', `${e.points} of ${e.maxPoints} points, ${e.answerBand}`],
            ['Floors applied', e.floorsApplied.length ? e.floorsApplied.map(label).join(', ') : 'none'],
            ['Blank answers', `${e.unknownCount}${e.unknownsMatter ? ' (the review needs the user count)' : ', scored high'}`],
          ] },
          { title: 'Severity and evidence', rows: [
            ['Severity', d.severity],
            ['Evidence', d.veracity.acr ? `${d.evidence} (recorded ${review.evidence}; report defects ${d.veracity.acr.defects.length ? d.veracity.acr.defects.join(', ') + (d.veracity.acr.accepted ? ', accepted' : '') : 'none'}; age ${d.veracity.acr.age}, author ${d.veracity.acr.author}${d.veracity.acr.authorName ? `, ${d.veracity.acr.authorName}` : ''}, remarks ${d.veracity.acr.remarks}, spot check ${d.veracity.acr.spotCheck}${d.veracity.acr.spotCheckNote ? `, ${d.veracity.acr.spotCheckNote}` : ''})` : d.evidence],
            ['Review date', d.reviewDate],
            ['Veracity floor', e.unknownsMatter ? 'follows the Exposure level once known' : `${this.floor === 0 ? 'any evidence' : evidenceAtRank(this.floor)} at ${e.level} exposure`],
            ['Floor binds', d.veracity.binds ? (d.exposure.level === 'high' ? 'yes, exposure is high' : 'yes, the risk grade rests on the vendor\'s Supports rows') : 'no, the risk grade rests on the barriers found at low or medium exposure'],
            ['Supports rows confirmed', d.veracity.confirmed ? 'yes' : 'no'],
            ['Raised by', !d.veracity.raise ? 'nothing needed, the evidence is at the floor'
              : (d.veracity.binds || d.hold === 'severity_unknown') ? d.veracity.raise.label
                : `not needed now, the grade rests on the barriers found; the first TAAP review re-rates on evidence at the floor (${d.veracity.raise.label})`],
            ...(review.evidenceNote ? [['Evidence supplied by', review.evidenceNote]] : []),
            ['Fallback', d.fallback ? 'yes, the ATI review team cannot raise the evidence' : 'no'],
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
        const stage = d.bypass ? 'bypass' : (d.hold === 'answers_unknown' || d.exposure.unknownsMatter) ? 'exposure'
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
        const floorRank = M.veracityFloor(d.exposure.level);
        const floorNote = !rowKnown ? ''
          : d.fallback ? `${ev.id} on file, below; fallback`
            : ev.rank >= floorRank ? `${ev.id} on file, at or above`
              : d.veracity.binds ? `${ev.id} on file, below` : `${ev.id} on file, below; not binding`;
        const rows = M.LEVELS.flatMap((lvl, xi) => [0, 1, 2].map((B) => {
          const P = xi + B;
          const k = T.required[P];
          const onBand = rowKnown && lvl === d.exposure.level;
          const onRow = onBand && B === d.breadth.level;
          const grade = (s) => M.GRID[lvl][s].grade;
          const gradeCell = (s, cols) => ({ text: MATRIX_GRADE[grade(s)], tone: TONE[grade(s)],
            here: gradeKnown && onRow && cols.includes(sev), tentative: gradeTentative, dim: !gradeKnown });
          const taapCell = (col, met) => {
            // "At the minimum" is a plan meeting the minimum but short of all six. Where the
            // minimum is all six, any such plan is below it, so the column reads Deny.
            const [o, gap] = col === 'min' && k === FULL ? ['deny', 1] : decide(P, k, met);
            const hold = o === 'on_hold' ? ` (hold ${holdNo('taap_needed')})` : '';
            const ownCell = remedyReached && onRow && state === col;
            // On this review's own cell, draw the review's own result where it departs from the
            // drawn value: a plan below the minimum approved under a written determination, a
            // claim referred for one (hold 5), or a more accessible product that denies the
            // request whatever the plan says.
            if (ownCell && (!drawnMatches(o, col) || moreAccessible)) {
              const own = d.outcome;
              const ownHold = own === 'on_hold' ? ` (hold ${holdNo(d.hold)})` : '';
              const sub = moreAccessible ? 'more accessible product'
                : d.hold === 'exception_claimed' ? 'claim referred for a determination'
                  : d.exception ? 'under the written determination' : '';
              return { text: `${M.OUTCOMES[own].label}${ownHold}`, sub, warn: own === 'approve_with_taap' ? `warning ${std.warning}` : '', tone: TONE[own],
                here: true, dim: false };
            }
            return { text: `${M.OUTCOMES[o].label}${hold}`, sub: o === 'deny' ? `or hold ${holdNo('exception_claimed')} on a claim` : '', warn: o === 'deny' ? '' : `warning ${warnOf(P + gap)}`, tone: TONE[o],
              here: ownCell && drawnMatches(o, col), dim: !remedyReached };
          };
          return {
            key: `${lvl}-${B}`, level: lvl, first: B === 0, band: B === 0 && xi > 0, B, P, onRow, onBand,
            floor: { text: M.EVIDENCE_LIMITS.floor[lvl] === 0 ? 'any' : M.EVIDENCE_LIMITS.floor[lvl] === 3 ? 'E1+, taken at face value' : evidenceAtRank(M.EVIDENCE_LIMITS.floor[lvl]), here: onBand, note: onBand ? floorNote : '' },
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
            'The campus buys the product as an accommodation for one named person, so the review approves it at intake.',
            'No row applies and the review rates nothing. The whole table shows faded.',
          ] };
        }
        if (stage === 'exposure') {
          const n = d.exposure.unknownCount;
          return { lead: 'This review has not reached the table.', summary: [
            `The Exposure level is unknown, because the user count is missing. The review is on ${holdName(d.hold)}.`,
            'No row applies until the review knows Exposure. The whole table shows faded.',
          ] };
        }

        // The row.
        out.push(`Exposure is ${lvl} and Breadth is ${B}, which gives Pressure ${row.P}.`);

        // The floor and the evidence against it.
        if (sev === 'S?') {
          out.push(`The Veracity floor for ${lvl} exposure is ${floorText}. ${ev.id === 'E0' ? 'The record holds no evidence' : `The evidence on file is ${ev.id} with no finding recorded`}, so the review cannot rate Severity and sits on ${holdName(d.hold)}.`);
          out.push('Without a severity there is no risk grade. The risk grade columns and the TAAP columns lie past the stage reached and show faded.');
          return { lead: `This review sits in the ${lvl} exposure band, on the Breadth ${B} row, and stops at the Veracity floor.`, summary: out };
        }
        const floor = floorRank === 0 ? 'any evidence' : evidenceAtRank(floorRank);
        if (d.fallback) {
          out.push(`The Veracity floor at ${lvl} exposure is ${floor}. The evidence on file is ${ev.id}, below the floor with no way to raise it, so the fallback applies.`);
        } else if (ev.rank >= floorRank) {
          out.push(`The Veracity floor at ${lvl} exposure is ${floor}. The evidence on file is ${ev.id}, at or above the floor.`);
        } else if (!d.veracity.binds) {
          out.push(`The Veracity floor at ${lvl} exposure is ${floor}. The evidence on file is ${ev.id}, below the floor, but the risk grade rests on the barriers found and not on the vendor's Supports rows, so the floor does not bind and the TAAP standard is provisional.`);
        } else {
          out.push(`The Veracity floor at ${lvl} exposure is ${floor}. The evidence on file is ${ev.id}, below the floor, so the review is on ${holdName(d.hold)}.`);
        }

        // The risk grade.
        const gradeLabel = MATRIX_GRADE[M.GRID[lvl][sev].grade];
        if (stage === 'evidence') {
          out.push(`Severity ${sevText}, read from the evidence on file, is a minimum, so for now the risk grade is ${gradeLabel}. Stronger evidence can raise it, not lower it. Its cell has a dashed outline.`);
          out.push('The TAAP columns lie past the stage reached and show faded.');
          return { lead: `This review sits in the ${lvl} exposure band, on the Breadth ${B} row, and stops at the Veracity floor.`, summary: out };
        }
        if (stage === 'grade') {
          out.push(`Severity is ${sevText}, so the risk grade is ${gradeLabel}. The review approves the product without a TAAP.`);
          out.push('The TAAP columns do not apply and show faded.');
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
          out.push(`An undue burden or fundamental alteration ${claim} is on file, and the review denies a plan that meets none of the ${FULL} even so.`);
        }
        return { lead: `This review sits in the ${lvl} exposure band, on the Breadth ${B} row, and reaches the TAAP columns.`, summary: out };
      },

      // ---- copy the determination or the selected message. The async clipboard first; a copy
      // event as the fallback, because a page opened from a local file often has no clipboard
      // permission. `which` is 'message' (the picker's selection) or 'determination' (the
      // reasoning panel), and each panel shows its own status.
      async copy(mode, which = 'message') {
        const ex = which === 'determination' ? this.ex : this.email;
        if (!ex) return;
        const html = `<html><body>${ex.html}</body></html>`;
        const report = (s) => { if (which === 'determination') this.determinationStatus = s; else this.copyStatus = s; };
        try {
          if (mode === 'email' && navigator.clipboard?.write && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([ex.text], { type: 'text/plain' }),
            })]);
            report('Copied. Paste into the email with Ctrl+V.');
            return;
          }
          if (mode === 'text' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(ex.text);
            report('Copied as plain text.');
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
        report(ok
          ? (mode === 'email' ? 'Copied. Paste into the email with Ctrl+V.' : 'Copied as plain text.')
          : 'The browser blocked copying. Select the text and copy it by hand.');
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
    const tierRows = C.userTiers.map((t, i, all) => [
      i === 0 ? `Up to ${t.upTo}` : t.upTo === Infinity ? `More than ${all[i - 1].upTo.toLocaleString('en-US')}` : `${(all[i - 1].upTo + 1).toLocaleString('en-US')} to ${t.upTo.toLocaleString('en-US')}`,
      t.start, t.lowest]);
    const weightRows = M.GROUPS.flatMap((g) => g.factors).filter((f) => !f.numeric)
      .map((f) => [cap(label(f.id)), '0', String(C.answerWeights[f.id]), String(2 * C.answerWeights[f.id])]);
    const WHEN = {
      exception_claimed: `The TAAP falls below the standard, and the requester claims that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164, 35.204).`,
      severity_unknown: 'No ACR, demonstration or testing exists.',
      answers_unknown: 'The user count is missing.',
      veracity_below_floor: 'The evidence is below the Veracity floor for this exposure, the floor binds, because the exposure is high or the risk grade rests on the vendor\'s Supports rows, and the spot check, a demonstration or ATI testing can still raise it.',
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
      ])}<p><strong>Burden.</strong> The university must demonstrate that the product meets all four tests, so minimal impact rests on evidence, never on assumption.</p><p><strong>Standard.</strong> The tests come from the Title II web rule. The rubric applies them to non-web products as policy, since the Section 508 Standards have no minimal-impact clause.</p>`,
      '<h3>Finding</h3>',
      `<p>A <strong>finding</strong> records one WCAG failure, a barrier in the product, in four fields. The failure comes from a "Partially Supports" or "Does Not Support" row of the ACR, or from a demonstration, an audit or ATI testing. No finding means the evidence shows no barrier on any essential function, severity S0.</p>${ul([
        term('Role', `The users the barrier affects, among them ${roles.slice(0, -1).join(', ')} and ${roles[roles.length - 1]}.`),
        term('Disability group', 'The group the barrier affects.'),
        term('Essential function', 'The function the barrier blocks or slows.'),
        term('Severity', 'Impact of the barrier on the function, from S0 (no effect) to S3 (the user cannot perform the function alone).'),
      ])}`,
      '<p>An <strong>ACR lead</strong> is a row marked "Partially Supports" or "Does Not Support" in the vendor\'s ACR (Accessibility Conformance Report). A lead becomes a finding once its remark names the affected feature and the reviewer places that feature on an essential function. A remark in the form of the GSA issue-level supplement, which names the feature, the disability groups affected and any workaround, gives the reviewer what the finding needs.</p>',

      '<h3>Exposure</h3>',
      '<p><strong>Exposure</strong> rates audience size and product reliance as low, medium or high.</p>',
      '<p>A single <strong>floor</strong> fact sets a minimum exposure regardless of the answers.</p>',
      table(['Floor', 'Minimum exposure'], M.FLOORS.map((f) => [f.fact, f.min])),
      `<p>The review needs the user count and halts until the requester supplies it. The count sets the starting level and the lowest level the other answers can reach.</p>${table(['User count', 'Start', 'Answers can lower it to'], tierRows)}`,
      `<p>The other six answers are optional and score points. A blank answer scores as high, so an answer entered can only keep or lower the level.</p>${table(['Answer', 'Low', 'Medium', 'High or blank'], weightRows)}`,
      `<p>Under ${C.answerBands.medium} points is low, from ${C.answerBands.medium} to under ${C.answerBands.high} is medium, and from ${C.answerBands.high} up is high. Exposure is the lower of the start and the points band, held at the lowest level for the user count. Research use by one group, lab or project rates low for scope and for criticality. A floor fact then raises it.</p>`,

      '<h3>Severity</h3>',
      '<p>The reviewer rates Severity on an <strong>essential function</strong>, a function the product exists to provide, such as registering for a class, submitting homework or paying a bill. A function is essential when its removal would change the product\'s use or purpose, the WCAG-EM 2.0 test, and it covers its complete process from sign-in to final submission.</p>',
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
        ['S1', 'Passes all four, with the impact shown to be minimal', 'Each test as met, on a remark or evidence that names the function and the impact'],
        ['S2', 'Fails at least one, since clearly unequal time or effort fails substantially equivalent ease of use', 'The function the barrier slows, and for whom'],
        ['S3', 'Fails outright, since the user cannot perform the function independently', 'The function the barrier blocks, and for whom'],
      ]),
      '<p>Two conditions escalate S2 findings to S3, shown as "S3 (accumulated)".</p>',
      table(['Condition', 'What the condition counts', 'Threshold', 'Exposure', 'Why it escalates'], [
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
      '<p>A vendor ACR has two halves with different credibility. Its <strong>admissions</strong>, the "Partially Supports" and "Does Not Support" rows, are credible at any evidence level, because a vendor has no reason to invent a barrier. Its <strong>denials</strong>, the "Supports" rows, are the vendor grading itself, and the published audits of vendor reports found about one row in five wrong. The three E1 levels grade the denials.</p>',
      `<p>${({ 8: 'Eight', 12: 'Twelve' })[M.ACR_CHECKS.length] ?? M.ACR_CHECKS.length} <strong>report checks</strong> rate the ACR. A failed check is a <strong>report defect</strong>, and an ACR with one ranks E1-. An ACR with no report defect is <strong>clean</strong>. A barrier the product has is a finding, recorded in the Severity step and credible at any evidence level.</p><p>The document checks rate the report's front matter and scope and apply to every ACR.</p>${ul(M.ACR_CHECKS.filter((c) => c.scope === 'document').map((c) => c.text))}<p>The remarks checks rate the Remarks column and open when the remarks fall short of a bug report.</p>${ul(M.ACR_CHECKS.filter((c) => c.scope === 'remarks').map((c) => c.text))}`,
      '<p>The analyst may <strong>accept</strong> an ACR with a report defect when the defect does not bear on the purchase, such as a version line one patch release behind, and records why it does not matter here. The review rates an accepted ACR like a clean one, by its qualifications and the spot check, and the determination prints the defect and the acceptance. Acceptance never cures a stale report, since the report\'s age is a fact, and never restores an ACR the spot check contradicted.</p>',
      '<p>A report marked Supports on every criterion passes the bare-Supports check only when its remarks show the work, as a remark in the form of the GSA issue-level supplement does. A perfect result is as likely to mean the evaluation was not done as that no barrier exists, so a clean all-Supports report is the case the three qualifications and the spot check below exist for.</p>',
      `<p>Three <strong>qualifications</strong> decide whether the analyst <strong>takes a clean ACR at face value</strong> (E1+) or runs the spot check first (E1). The remarks decide. A finding in an ACR should read like a bug report, with the fields of the GSA issue-level supplement, since a vendor that writes its admissions that way has done the evaluation, which is the best evidence on paper for its Supports rows. Remarks that name the feature with issues but not where it is, how it falls short or who is affected meet the floor the VPAT instructions set. They neither raise nor lower, and the ACR takes the spot check first. Remarks that are blank, restate the criterion, repeat across rows or hedge lower the ACR and open the remarks checks. The analyst reads the age and the author off the front page, and they lower the ACR only together. The analyst does not take an ACR more than a year old by the vendor's own staff at face value even with good remarks. A missing date counts as unknown and neither raises nor lowers. The age reads the evaluation date in the ACR's methods section, or the report date when the methods name none. A major release changes the first version component or carries the vendor's own major label, and an unknown release date neither raises nor lowers. An <strong>outside firm</strong> is any firm other than the vendor, and its name and method print in the determination.</p>${table(['Qualification', 'Raised', 'Lowered', 'Report defect'], [
        ['Age', M.ACR_QUALIFICATIONS.age.raised, M.ACR_QUALIFICATIONS.age.lowered, M.ACR_QUALIFICATIONS.age.out],
        ['Author', M.ACR_QUALIFICATIONS.author.raised, M.ACR_QUALIFICATIONS.author.lowered, 'No method named (the methods report check)'],
        ['Remarks', M.ACR_QUALIFICATIONS.remarks.raised, `${M.ACR_QUALIFICATIONS.remarks.lowered}. ${M.ACR_QUALIFICATIONS.remarks.named}`, 'A blank remark on an admission, a bare Supports on a complex criterion, a remark that contradicts its rating, or hedged remarks (the remarks checks)'],
      ])}`,
      `<p>ATI testing takes two forms. The <strong>spot check</strong> (E3a) is the analyst's own pass over the essential functions with a screen reader and the keyboard, done on top of a clean ACR. It is the cheapest independent look at the product, and it ranks with a demonstration or an audit, so it clears every floor. The <strong>full manual review</strong> (E3b) is the ATI coordinator's evaluation of the product by a named method, and it ranks highest. The spot check applies to a clean or accepted ACR, since a report defect is cured by the vendor or accepted by the analyst, not by a spot check, and the determination records the functions covered and the assistive technology used.</p>${ul([
        term('Agrees', `${M.ACR_QUALIFICATIONS.spotCheck.agrees}.`),
        term('Contradicts', `${M.ACR_QUALIFICATIONS.spotCheck.contradicts}, and the analyst records the barriers found as findings.`),
      ])}`,
      `<p>Every risk grade that rests on the denials needs evidence at the <strong>Veracity floor</strong> for its exposure before the review confirms the denials. The floor binds every risk grade at high exposure, and at low and medium a No alternate access required grade, which rests on the vendor's claim of no barrier on an essential function.</p>${ul(M.LEVELS.map((l) => term(`${l.charAt(0).toUpperCase() + l.slice(1)} exposure`, `${evAt(l).charAt(0).toUpperCase() + evAt(l).slice(1)}.`)))}`,
      '<p>Severity does not move the floor. An S1 rating rests on a remark or evidence that names the function and the impact, which a trusted ACR\'s bug-report remark does, because the reviewer must be able to show the impact is minimal.</p>',
      '<p>At low and medium exposure an Alternate access required grade rests on the barriers found, which are credible at any level, so the review proceeds on them at any evidence level. Below the floor the barriers found are a minimum, the TAAP standard (defined below) is provisional, and the first TAAP review re-rates Severity on evidence at the floor. At high exposure the plan\'s scope rests on the denials too, since a barrier the vendor denies gets no alternative, so the review raises the evidence before the plan is written.</p>',
      `<p>Below the floor where it binds, the review holds with the ATI review team, and the evidence in hand decides the step that raises it.</p>${ul([
        term('A clean ACR not yet taken at face value', 'The analyst\'s spot check comes first. If it agrees, the evidence is E3a and the review proceeds.'),
        term('A contradicted ACR', 'The spot check found a barrier the ACR denies, so its Supports rows are no longer trusted and a second spot check cannot restore them. The ATI coordinator\'s full manual review or a vendor demonstration re-rates the product.'),
        term('An ACR with a report defect', 'A spot check cannot cure it. The vendor corrects the ACR, the analyst accepts it with the defect and the reason noted, or a full manual review or a demonstration supplies the evidence.'),
        term('No ACR', 'The vendor supplies one, or a full manual review or a demonstration supplies the evidence.'),
      ])}<p>The spot check, a demonstration, an audit and a full manual review rank 4 or 5, which clears every floor, so one loop closes it.</p>`,
      '<p>When the ATI review team cannot raise the evidence, it records that and the review proceeds under the <strong>fallback</strong>. Severity is S3 (provisional) and the barriers found are a minimum. The review treats unproven conformance as hiding a blocking barrier, so it requires an alternate access plan (TAAP, defined below). A medium exposure review of a clean vendor ACR with no findings, no spot check and no demonstration ends here, with a TAAP whose documentation states that the product could not be evaluated. Deny stands on the evidence in hand, because weak evidence can hide barriers but not invent them.</p>',

      '<h3>Reading an ACR</h3>',
      '<p>An <strong>ACR</strong> is the vendor\'s completed VPAT, the Voluntary Product Accessibility Template published by the Information Technology Industry Council (ITI). The template is a set of tables with one row per success criterion, and the vendor fills each row with a conformance level and a remark. Nobody certifies the result.</p>',
      `<p>The vendor\'s own staff write most ACRs, often from knowledge of the product rather than a fresh test. The published audits found the reports wrong often enough that the matrix reads an ACR as a claim to grade, not as a result to copy.</p>${ul([
        'About one row in five was wrong when seventeen library vendors\' reports were scanned.',
        'Only 10 of 227 library databases matched their reports in full under manual testing.',
        'Every vendor spot-checked in a third audit had issues its report did not mention.',
      ])}`,
      '<p>Two parts of the report feed two parts of the review. The document checks rate the front matter, which says what the vendor evaluated, when, by whom and how. The remarks qualification and the findings rate the conformance tables, which say what the vendor admits and what the vendor denies.</p>',

      `<p class="def-lead">${term('Edition', 'ITI publishes the template in four editions, and the edition prints on the first page.')}</p><div class="def-entry">${ul([
        'The 508 edition reports against the Revised Section 508 Standards, which incorporate WCAG 2.0, so it has no rows for the 2.1 and 2.2 criteria.',
        'The EU edition reports against EN 301 549.',
        'The WCAG edition includes the WCAG 2.1 and 2.2 criteria.',
        'The international edition combines all three standards.',
      ])}<p><strong>The matrix.</strong> A web or mobile product reported on the 508 edition fails the edition check, because the review standard for those products is WCAG 2.1 AA and the report cannot speak to the 2.1 criteria at all. Desktop software and hardware reported on the 508 edition are on the right edition, since their review standard is the Section 508 Standards.</p><p>A report on a VPAT 1.x template predates the 2017 refresh of Section 508, so nobody has revised the report since then, and the Date entry applies.</p></div>`,

      `<p class="def-lead">${term('Product and version', 'The "Name of Product/Version" line on the first page names what the vendor evaluated.')}</p><div class="def-entry"><p><strong>The sources.</strong> A report describes one version of one product at one time, and the audits found platforms changing while the reviewers worked. Vendors also reuse one report across a product line.</p><p><strong>The matrix.</strong> The product named must be the product on the requisition, and the version must be the version the campus will run. A report on a different version fails the date and version check.</p>${ul([
        'A version one patch release behind is the usual case for accepting the defect, because a patch rarely changes the interface.',
        'A report older than the product\'s last major release is stale, under the Date entry, because a redesign makes every row unverified.',
      ])}</div>`,

      `<p class="def-lead">${term('Date', 'The first page carries a "Report Date", and the "Evaluation Methods Used" section often carries a second date, the date of the testing the report describes.')}</p><div class="def-entry"><p>The two can be years apart when a vendor reissues an old evaluation on a new template. The matrix reads the age from the evaluation date, or from the report date when the methods name no date.</p><p><strong>The sources.</strong> The sources accept an ACR for between twelve and twenty-four months. The matrix takes the shorter figure for the qualification and the longer one for the defect.</p><p><strong>The matrix.</strong></p>${ul([
        'An evaluation more than a year old lowers the ACR when the vendor\'s own staff wrote the report, since a self-assessment loses what credibility it had as releases accumulate.',
        'A report more than two years old, or older than the product\'s last major release, is stale. Stale is the one report defect acceptance never cures, because the report then describes a product that no longer exists.',
        'A report with no date is of unknown age, which neither raises nor lowers, and no date at all fails the date and version check.',
      ])}</div>`,

      `<p class="def-lead">${term('Author and methods', 'The template has no author field, so the analyst reads the author from the cover page, the "Evaluation Methods Used" section or a firm named in the notes.')}</p><div class="def-entry"><p>When none of those names anyone, the author is the vendor. The author matters because an ACR is a self-assessment unless an outside firm did the work. The matrix treats any firm other than the vendor as an <strong>outside firm</strong>.</p><p><strong>The sources.</strong> The practitioner sources trace most ACR errors to lack of expertise rather than dishonesty, so a vendor\'s product team can misrate a row in good faith. An outside firm names itself and its method because its name is its credential.</p><p>The methods section says how the vendor tested. The VPAT instructions accept "knowledge of general product functionality" as a method, which means nobody tested anything, and it is the weakest method the instructions allow. A thorough evaluation names the browsers, the screen readers and the versions used.</p><p><strong>The matrix.</strong></p>${ul([
        'A report that names no method fails the methods check.',
        'A method that names one browser and one screen reader fails the single-browser check, because screen readers disagree with each other on the same markup and one pairing misses how the product behaves on every other browser and assistive technology.',
      ])}</div>`,

      `<p class="def-lead">${term('Scope and notes', 'The "Notes" and "Applicable Standards/Guidelines" sections on the first page say what the vendor evaluated and against which standards.')}</p><div class="def-entry"><p>A product is often several products, such as a web app for students and a mobile app, and a report covers one of them unless it says otherwise. Vendors also narrow the scope in the notes. A sentence such as "the reporting module was not evaluated" or "third-party components are out of scope" removes part of the product from every row below it, and the Supports claims then say nothing about the excluded part.</p><p><strong>The sources.</strong> A description of the product that is vague or inaccurate suggests the author does not know the product, and the notes are where that shows first.</p><p><strong>The matrix.</strong></p>${ul([
        'Each platform the campus buys needs its own report or its own set of tables, since a mobile app shares no interface with the web app. A report that misses one fails the missing-interface check.',
        'A note that excludes part of the product fails the carve-out check.',
      ])}</div>`,

      `<p class="def-lead">${term('The conformance tables', 'The body of the report is the conformance tables, one per standard, with one row per success criterion. Each row holds a conformance level and a remark.')}</p><div class="def-entry"><p>The template defines four levels, and allows a fifth on the AAA table. The levels do not carry severity.</p>${ul([
        '"Supports" requires one method that meets the criterion, so a product with one accessible path and three inaccessible ones can claim it.',
        '"Partially Supports" means some functionality does not meet the criterion. GSA reads it as non-conformance, and so does the matrix.',
        '"Does Not Support" means most of the functionality fails under ITI\'s definition, while other authors decide it by user impact or by the share of pages that fail, so the same product earns different levels from different authors.',
        '"Not Applicable" means the criterion has nothing in the product to apply to.',
        '"Not Evaluated" is allowed on the AAA table only.',
      ])}<p><strong>The matrix.</strong> The matrix reads the rows in two halves.</p>${ul([
        'The "Partially Supports" and "Does Not Support" rows are the vendor\'s <strong>admissions</strong>. The matrix credits them at any evidence level, because a vendor has no reason to invent a barrier.',
        'The "Supports" rows are the vendor\'s <strong>denials</strong>. The matrix grades them by the three qualifications, the report checks and the spot check, because the audits found the denials wrong about one row in five.',
      ])}</div>`,

      `<p class="def-lead">${term('The remarks', 'The Remarks column is where a report shows its work, and it is the column the sources weigh most.')}</p><div class="def-entry"><p>ITI\'s instructions tell the author to say, on every "Partially Supports" and "Does Not Support" row, which functions or features have issues and how they fall short. The best reports go further and read like a bug list.</p><p><strong>The sources.</strong> The General Services Administration (GSA) publishes an issue-level supplement for ACRs, and a remark with its fields is a bug report. The fields are</p>${ul([
        'the severity',
        'the page, screen, component or workflow affected',
        'the user group',
        'the workaround',
      ])}<p>A vendor that writes its admissions that way has done the evaluation, which is the best evidence on paper that it tested its Supports rows too. "Some images do not include alternative text" is the opposite case, since it does not say whether the login button is one of them.</p><p><strong>The matrix.</strong> The analyst reads the remarks on the admission rows first and picks the remarks answer in Step 2 that describes the pattern most of them follow.</p>${ul([
        'A remark with the fields above raises the ACR.',
        'A remark that names the feature with issues and stops there meets the floor the instructions set. The report takes the spot check before the matrix trusts it.',
        'A blank remark, a remark that restates the criterion, one sentence repeated across rows, or a remark hedged with "some", "most" or "generally" falls below that floor and lowers the ACR.',
      ])}<p>The analyst then reads the "Supports" rows on the complex criteria, such as 1.3.1 Info and Relationships and 4.1.2 Name, Role, Value, where a product of any size has work to show.</p>${ul([
        'A bare "Supports" there fails the bare-Supports check.',
        'A remark that describes a failure under a "Supports" rating contradicts the rating, and the matrix believes the remark.',
      ])}</div>`,

      `<p class="def-lead">${term('Not Applicable and Not Evaluated', 'Both levels take a row out of the evaluation, and vendors use both to shrink the number of rows they have to defend.')}</p><div class="def-entry"><p>A report with many of them covers less of the product than its page count suggests.</p><p><strong>The sources.</strong> "Not Applicable" needs a remark that says what is absent. "No prerecorded video" is a reason on 1.2.1 Audio-only and Video-only. A bare "Not Applicable" on 1.1.1 Non-text Content is not a reason, since every product with an image meets or fails 1.1.1, and the sources treat an unexplained "Not Applicable" as a denial in disguise.</p><p>"Not Evaluated" says the author did not look. The VPAT instructions allow it on the AAA table only, and GSA says it gives no assurance.</p><p><strong>The matrix.</strong></p>${ul([
        'The matrix reads "Not Evaluated" on any table but AAA as "Does Not Support".',
        'A "Not Applicable" without a reason, or a "Not Evaluated" outside the AAA table, fails the not-evaluated check.',
      ])}</div>`,

      `<p class="def-lead">${term('All Supports', 'A report with "Supports" on every row is a warning sign rather than a good result.')}</p><div class="def-entry"><p><strong>The sources.</strong> A thorough evaluation takes about a hundred hours and finds at least one failure in a product of any size. In one audit the vendor that claimed full compliance performed worst, and one university tells its buyers that a flawless ACR raises the question of whether the author understands accessibility.</p><p><strong>The matrix.</strong></p>${ul([
        'A report with "Supports" on every row and no remark that shows the work fails the bare-Supports check, because such a report is as likely to mean the vendor did not evaluate as that no barrier exists.',
        'A report with "Supports" everywhere and remarks that show the work on the complex criteria passes the check, and the review rates it like any other ACR.',
      ])}</div>`,

      `<p class="def-lead">${term('The spot check', 'An ACR is a claim, and the spot check is the cheapest test of the claim.')}</p><div class="def-entry"><p>The analyst spends three to five minutes on one essential function with a screen reader and the keyboard.</p>${ul([
        'Tab through the function.',
        'Read its headings and form labels.',
        'Try the controls the ACR marks "Supports".',
      ])}<p><strong>The sources.</strong> The sources draw the same test from 65 Big Ten Academic Alliance reports. They name a keyboard failure as the strongest single sign of deeper problems, since a control the keyboard cannot reach fails for every assistive technology at once.</p><p><strong>The matrix.</strong> The check tests the denials, not the admissions, so the analyst picks a function the ACR marks "Supports" rather than one the ACR already admits is broken.</p>${ul([
        'A spot check that agrees with the ACR raises the evidence to E3a.',
        'A barrier the ACR denies drops the ACR to E1-, because one wrong denial means the vendor did not test the rest either. A second spot check cannot restore the Supports rows.',
        'The spot check applies to a clean or accepted ACR only, since a report defect is a fact about the document that no test of the product cures.',
      ])}</div>`,

      `<p class="def-lead">${term('From rows to findings', 'A row of the ACR is a lead, not a grade.')}</p><div class="def-entry"><p><strong>The sources.</strong> Severity is judged per barrier, against a user group and a task, because nothing in the row predicts it.</p>${ul([
        'The conformance level says nothing about how badly a barrier hurts.',
        'The criterion\'s level, A or AA, does not predict severity.',
        'The success criteria, all of them together, covered only half of blind users\' problems.',
        'Two experienced reviewers agree on a conformance call about three times in four.',
      ])}<p>The GSA supplement rates each issue on a three-point scale.</p>${ul([
        '<strong>Critical</strong> prevents people with disabilities from completing core functionality.',
        '<strong>Major</strong> substantially impairs access to important functionality.',
        '<strong>Minor</strong> is a partial barrier.',
      ])}<p><strong>The matrix.</strong> The analyst records a finding once the remark names the feature and the analyst can place that feature on an essential function, with the role and disability group the barrier stops. Critical and Major map to S3 and S2.</p><p>A remark that does not name the feature leaves the barrier unknown, not minor, so the review raises the evidence rather than rating the barrier minor. The disagreement figure is why the Severity entry fixes each level by the task effect on a named group rather than leaving the call to the reviewer\'s sense of the barrier.</p></div>`,

      '<p>The audit figures come from DeLancey (2015), Willis and O\'Reilly (2020) and Zavala and Reidsma (2020). The agreement figure comes from Brajnik, Yesilada and Harper (2010 and 2012), and the coverage figure from Power, Freire, Petrie and Swallow (2012). The readings come from the VPAT 2.5 instructions, the GSA issue-level supplement, the Section508.gov guidance on ACRs, the Minnesota, University of Michigan and University of Washington Libraries scoring rubrics, WebAIM\'s article on procurement, and the practitioner guides by McNeilly, Bahram, Roselli and Groves. The file acr-interpretation-research.md collects them with their findings. None of them binds the CSU. They guide the reading of a report, not the standard the review holds the product to.</p>',

      '<h3>Breadth</h3>',
      '<p><strong>Breadth</strong> rates barrier reach across essential functions and disability groups, on a scale of 0 to 2.</p>',
      `<p>Breadth derives from the count of <strong>blocked pairs</strong> (essential function and disability group pairs stopped by an S3 finding or stacked S2 findings), with ${C.breadth.blockedCuts[0]} blocked pairs giving 1 and ${C.breadth.blockedCuts[1]} giving 2, plus 1 for ${C.breadth.s2AddsAt} or more S2 findings, capped at 2. Under the fallback with no evidence at all, the review assumes Breadth 2.</p>`,

      '<h3>TAAP</h3>',
      `<p>A <strong>TAAP</strong> (Temporary Alternate Access Plan) is the CSU's written plan for equally effective access during vendor remediation, held to the six requirements of the CSU TAAP template.</p>${ul(M.TAAP_REQUIREMENTS.map((r) => r.text))}`,
      `<p>Each TAAP includes a campus-written <strong>TAAP accessibility statement</strong>, separate from the vendor's own statement and posted ${M.TAAP_STATEMENT.postedAt}, with the following content.</p>${ul(M.TAAP_STATEMENT.includes.map((x) => x.charAt(0).toUpperCase() + x.slice(1)))}`,
      `<p>Three people sign each TAAP.</p>${ul(M.TAAP_TERMS.signers)}`,
      `<p>The review approves a TAAP below the standard only under a written determination by the president or a designee that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164, 35.204). The determination covers this product only, counts all university resources, and lists the support that remains for each missed requirement. High cost alone does not establish an undue burden. The exception is a defence against this one required action, never a property of the product, so the review never asks for it at intake.</p>`,
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
        ['Below the minimum', 'Deny, unless a written undue burden or fundamental alteration determination is on file. The review denies a plan that meets none of the six even then, since it gives no alternative access', 'None, or from pressure plus the gap under the exception'],
        ['At the minimum, short of all six', 'Approve with TAAP. Where the minimum is all six, at pressure 3 or more, a plan short of six falls below the minimum, and the review denies it', 'From pressure plus the gap to a full TAAP'],
        ['Full, all six', 'Approve with TAAP', 'From pressure alone, elevated from pressure 2 and high at pressure 4, so every high exposure carries one'],
      ]),
      '<p>The review denies a plan below the standard at any severity and pressure, unless a written undue burden or fundamental alteration determination is on file. TAAP work costs staff time, so purchases with less at stake get a lower standard. The denial and the hold state the <strong>shortfall</strong>, the count of requirements the plan misses, so the signers report what the plan does instead of ticking requirements it does not meet.</p>',
      '<p>Under the fallback, and whenever the vendor\'s denials are below the Veracity floor, the TAAP standard is provisional and may rise when evidence arrives, and the first TAAP review re-rates Severity on evidence at the floor.</p>',

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
      `<p>One fact approves a purchase at intake. ${M.BYPASSES.map((b) => `A product <strong>${lower(b.fact)}</strong> carries out the interactive process between that person and the campus, which settled what the person needs. The review rates none of the four factors and limits the approval to the accommodation.`).join(' ')}</p>`,
      `<p>Two conditions deny a product with an Alternate access required risk grade.</p>${ul([
        'A more accessible product meets the same need, with or without a TAAP (S3 only).',
        'The TAAP on file falls below the TAAP standard, with no written undue burden or fundamental alteration determination on file. A plan that meets none of the six requirements gives no alternative access, and the review denies it even under the exception.',
      ])}`,

      '<h3>Holds</h3>',
      '<p>A <strong>hold</strong> pauses the review until a named party supplies what the review waits for. Holds 1 to 3 come before the risk grade, and the first that applies holds the review. Hold 3 applies at high exposure, and at low and medium to a risk grade that rests on the vendor\'s Supports rows, and it resumes at the Severity step with the new findings, or the review proceeds under the fallback, defined under Evidence, when the evidence cannot be raised. Holds 4 and 5 arise in the remedy step.</p>',
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
