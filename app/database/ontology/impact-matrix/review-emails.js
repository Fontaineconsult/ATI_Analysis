/**
 * Email templates over review-matrix.js.
 *
 * `templates(review, d, ex, ctx, opts)` returns the messages the review's state calls for,
 * each pre-filled from the determination. `d` is the result of `evaluate(review)` and `ex`
 * the result of `explain(review, d, ctx)`. Each template names its reader, states its
 * purpose, and renders as plain text and as HTML for an email body. Bracketed placeholders
 * mark what the review does not know, and `placeholders` lists them so the sender replaces
 * each one.
 *
 * The messages a requester or a supplier reads keep the vocabulary of the SFBRN
 * Accessibility Compliance Email Templates: VPAT or ACR, supplier, the requisition's
 * Comments section, the accessibility compliance review, the ICT Impact Level, "does not
 * serve as a purchase order", the VPAT Summary Report and its workarounds, and the roadmap.
 * The matrix's own terms (Exposure, Severity, Veracity, evidence levels) stay out of them.
 * The reasoning block each carries, under "How the review reached this result", says the
 * same facts in the reader's words. The message to the ATI review team and the full
 * determination keep the matrix's terms, since that reader works in them.
 *
 * Works in a browser (`<script src>` after review-matrix.js, global `ReviewEmails`) and in
 * Node (`require`). Prose follows app/database/ontology/writing-style.md.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./review-matrix.js'));
  else root.ReviewEmails = factory(root.ReviewMatrix);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (M) {
  'use strict';

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lower = (s) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
  const list = (items) => (items.length < 2 ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  const count = (n) => Number(n).toLocaleString('en-US');
  const unique = (xs) => [...new Set(xs.filter(Boolean))];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---- readers, and the words each reader knows
  const TO = {
    unit: 'the requester',
    supplier: 'the supplier',
    team: 'the ATI review team',
    signers: 'the requester and the TAAP signers',
    president: 'the president or a designee',
    record: 'the requisition record',
  };
  const ROLE_WORD = { students: 'students', employees: 'employees', applicants: 'applicants', public: 'members of the public' };
  const EFFECT = { S1: 'meet a minor barrier in', S2: 'need clearly more time or effort to', S3: 'cannot independently' };
  /** The VPAT edition the review reads, by kind of technology. */
  const EDITION = {
    web: 'the WCAG edition of the VPAT (version 2.4 or later), which reports WCAG 2.1 Level A and AA',
    nonweb: 'the Section 508 edition of the VPAT',
    mixed: 'the INT edition of the VPAT, or the WCAG and Section 508 editions together',
  };
  /** The standard, named for a requester. */
  const STANDARD = { web: 'WCAG 2.1 AA', nonweb: 'the Section 508 Standards', mixed: 'WCAG 2.1 AA' };
  /** The documentation on file, in the requester's words. */
  const EVIDENCE_WORDS = {
    E0: 'no accessibility documentation',
    'E1-': 'a VPAT or ACR from the supplier with defects we did not accept',
    E1: 'a VPAT or ACR from the supplier that we have not yet confirmed',
    'E1+': 'a current VPAT or ACR from the supplier with remarks specific enough to rely on',
    E2a: 'a live demonstration of the product with assistive technology',
    E2b: 'an audit by an outside firm',
    E3a: 'a VPAT or ACR from the supplier, confirmed by our own check of the product',
    E3b: 'a full manual review by the ATI team',
  };
  /** The exposure questions as the requester reads them, keyed by factor id. */
  const QUESTION = {
    users: 'How many people will use the product?',
    scope: 'How widely will the product be deployed?',
    required_use: 'Is anyone required to use the product?',
    criticality: 'How critical is the program or service the product serves?',
    publishes: 'Does the product publish content, and for whom?',
    frequency: 'How often will the product be used?',
    contract_length: 'How long does the contract run?',
  };
  const FACTORS = M.GROUPS.flatMap((g) => g.factors);
  const QUALIFICATION_REASON = {
    age: { lowered: 'the vendor evaluated it more than a year ago', unknown: 'it records no evaluation date' },
    author: { lowered: 'the vendor\'s own staff wrote it' },
    remarks: {
      named: 'its remarks name the features with issues but not where each issue is, how it falls short or who it affects',
      lowered: 'its remarks are blank, restate the criteria, repeat across rows or hedge',
    },
  };
  const QUESTIONS_CLOSE = 'If you have any questions, please let me know.';
  const NOT_A_PO = 'Please note that this confirmation does not serve as a purchase order. It only confirms that the accessibility review has been completed.';

  // ---- the review, read for the templates
  function facts(review, d, ctx) {
    const sev = d.severity.slice(0, 2);
    const product = ctx.product?.trim() || '[Product name]';
    const supplier = ctx.vendor?.trim() || '[Supplier]';
    const unit = ctx.unit?.trim() || '[Requesting department]';
    const requisition = ctx.requisition?.trim() || '[Requisition number]';
    const first = ctx.requester?.trim() || '[First name]';
    const signer = ctx.signer?.trim() || '[Your name]';
    const date = ctx.date ?? d.reviewDate;
    const findingLines = review.findings.map((f) =>
      `${cap(ROLE_WORD[f.role])} ${M.WHO[f.group]} ${EFFECT[f.severity] ?? 'meet no barrier in'} ${f.essentialFunction ? `"${lower(f.essentialFunction)}"` : 'an essential function'}.`);
    const functions = unique(review.findings.map((f) => f.essentialFunction));
    const unknownAnswers = FACTORS.filter((f) => { const a = review.answers[f.id]; return !a || (a.reviewer ?? a.requester) == null; });
    const floors = M.FLOORS.filter((x) => d.exposure.floorsApplied.includes(x.id)).map((x) => lower(x.fact));
    const std = d.taapStandard;
    const need = std ? (std.required === 6 ? 'all six' : `at least ${std.required} of the six`) : '';
    const level = cap(d.exposure.level);
    const users = d.exposure.usersValue;
    return { sev, product, supplier, unit, requisition, first, signer, date, findingLines, functions, unknownAnswers, floors, std, need,
      level, users, acr: d.veracity.acr, raise: d.veracity.raise?.by ?? null, standard: STANDARD[review.ictKind],
      evidence: EVIDENCE_WORDS[d.evidence] ?? 'the documentation on file' };
  }
  /** One exposure question with its answers, for a list the requester answers. */
  function questionLine(factor) {
    if (factor.numeric) return `${QUESTION[factor.id]} Reply with a number.`;
    return `${QUESTION[factor.id]} Reply with one of these answers. ${M.LEVELS.map((l) => factor.levels[l]).join(' / ')}.`;
  }
  /** What the VPAT or ACR fails, named for the supplier. */
  function defectLines(acr) {
    const lines = (acr?.defects || []).map((id) => M.ACR_CHECKS.find((c) => c.id === id)).filter(Boolean).map((c) => `${c.text}.`);
    if (acr?.stale && !acr.defects?.includes('stale')) lines.unshift(`${M.ACR_CHECKS.find((c) => c.id === 'stale').text}.`);
    return lines;
  }
  /** Why a clean ACR is not taken at face value, for the ATI review team. */
  function notTrustedBecause(acr) {
    const reasons = [];
    if (acr.remarks !== 'raised') reasons.push(QUALIFICATION_REASON.remarks[acr.remarks] ?? QUALIFICATION_REASON.remarks.lowered);
    if (acr.age === 'lowered' && acr.author === 'lowered') reasons.push(`${QUALIFICATION_REASON.age.lowered} and ${QUALIFICATION_REASON.author.lowered}`);
    return reasons.length ? list(reasons) : 'its qualifications leave it short of face value';
  }
  /** What the ICT Impact Level rests on, in the requester's words. */
  function impactBecause(f) {
    const who = f.users != null ? `${count(f.users)} people will use the product` : 'the requisition does not say how many people will use the product';
    return f.floors.length ? `${who}, and the product is ${list(f.floors)}` : who;
  }
  /** What the barriers do, in the requester's words. */
  function barriersPhrase(f, d) {
    if (d.fallback) return 'the review could not verify the product\'s accessibility, so it treats the functions it could not check as barriers';
    if (f.sev === 'S3') return 'barriers stop some users from completing functions the product exists to provide';
    if (f.sev === 'S2') return 'barriers make some functions the product exists to provide clearly harder for some users without preventing them';
    if (f.sev === 'S1') return 'the barriers reported do not prevent any function the product exists to provide';
    return 'the documentation shows no barrier on any function the product exists to provide';
  }

  // ---- blocks: the body of a message before rendering
  const p = (text) => ({ type: 'p', text });
  const h = (text) => ({ type: 'h', text });
  const ul = (items) => ({ type: 'ul', items });
  const ol = (items) => ({ type: 'ol', items });
  const REASON_HEADING = 'How the review reached this result';
  /** The plain-language reasoning block, which the reasoning toggle removes. */
  const why = (lines) => [h(REASON_HEADING), { type: 'ps', lines }];
  /** The sections of the determination named in `headings`, as blocks, for readers who work in the matrix's terms. */
  function determination(ex, headings) {
    const out = [];
    for (const s of ex.sections.filter((s) => headings.includes(s.heading))) {
      out.push(h(s.heading));
      out.push(s.bullets ? ul(s.lines) : { type: 'ps', lines: s.lines });
    }
    return out;
  }
  const contractBlocks = (d) => (d.contractTerms.length ? [
    p('The purchase order or contract carries the CSU accessibility terms below.'),
    ul(M.CONTRACT_TERMS.filter((t) => d.contractTerms.includes(t.id)).map((t) => `${cap(t.text)}.`)),
  ] : []);
  const roadmapBlock = (d, f) => (d.roadmap
    ? [p(`${f.supplier} completes the CSU Vendor Accessibility Roadmap, which records each barrier, its status and its remediation date, and the contract commits the supplier to the roadmap's milestones.`)] : []);
  /** What a usable VPAT or ACR covers, said once for the requester and once for the supplier. */
  const reportCovers = (review, ctx) => [
    `Use ${EDITION[review.ictKind]}.`,
    'Name the product version evaluated, the month and year of the evaluation, the evaluation method and the evaluator. We cannot use a report older than two years, or one that predates the product\'s last major release.',
    `Cover every part of the product in the purchase${ctx.interfaces ? ` (${ctx.interfaces})` : ', such as the web application, the mobile app and any administrator console'}.`,
    'On each item marked Partially Supports or Does Not Support, name the feature affected, how it falls short and who it affects.',
  ];

  // ---- the templates. `when` says whether the state calls for the message.
  const TEMPLATES = [
    {
      id: 'evidence_request', label: 'VPAT or ACR documentation required', to: 'unit',
      purpose: 'Hold 1. The customer notice that the VPAT or ACR was not included, with any open questions in the same message and the supplier request enclosed.',
      when: (d) => d.hold === 'severity_unknown',
      build: (review, d, ex, f, ctx) => ({
        subject: `VPAT or ACR Documentation Required for ${f.product}`,
        greeting: `Hello ${f.first},`,
        blocks: [
          p(`The required VPAT (Voluntary Product Accessibility Template) or Accessibility Conformance Report (ACR) was not included with your request for ${f.product}, requisition ${f.requisition}.`),
          p('Please contact the supplier and request a current VPAT or ACR for the product. Once you receive it, attach the document to your requisition in the Comments section so we can complete the accessibility compliance review.'),
          p('As of April 2026, the CSU requires all software-related purchase requests to include a current VPAT or ACR as part of the compliance review process.'),
          p('Ask the supplier for a report that meets the points below, so the review can use it.'),
          ul(reportCovers(review, ctx)),
          ...(f.unknownAnswers.length ? [
            p(`Please also answer the ${f.unknownAnswers.length === 1 ? 'question' : 'questions'} below in your reply, so we can complete the review as soon as the document arrives.${f.unknownAnswers.some((q) => q.numeric) ? ' The review needs the number of users.' : ''} ${f.unknownAnswers.filter((q) => !q.numeric).length ? 'The other answers are optional, and a blank answer counts as the highest level, so an answer can only lower what the review asks of you.' : ''}`.trim()),
            ol(f.unknownAnswers.map(questionLine)),
          ] : []),
          p('You may use the supplier request below to request the required documentation. If a live demonstration of the product with a screen reader is easier for the supplier to arrange than a report, tell us, and we will set one up.'),
          ...why([
            `The review rates ${f.product} on the barriers the supplier reports and on how many people rely on the product. ${cap(impactBecause(f))}. Without the VPAT or ACR we cannot tell which functions people with disabilities can use, so the review does not proceed.`,
          ]),
          p(QUESTIONS_CLOSE),
          h('Supplier request'),
          { type: 'quote', blocks: supplierRequestBlocks(review, f, ctx) },
        ],
        footer: true,
      }),
    },
    {
      id: 'supplier_request', label: 'Supplier VPAT or ACR request', to: 'supplier',
      purpose: 'Asks the supplier for the current VPAT or ACR, says what a report we can use carries, and offers the roadmap or a demonstration when no report exists.',
      when: (d, f) => d.hold === 'severity_unknown' || (d.hold === 'veracity_below_floor' && f.raise === 'vendor_evidence'),
      build: (review, d, ex, f, ctx) => ({
        subject: `Request for VPAT or ACR for ${f.product}`,
        greeting: 'Hello,',
        blocks: supplierRequestBlocks(review, f, ctx),
        footer: false,
      }),
    },
    {
      id: 'supplier_correction', label: 'Supplier VPAT or ACR corrections', to: 'supplier',
      purpose: 'Hold 3. Names the points the VPAT or ACR fails and asks the supplier for a corrected report, or a demonstration while the supplier corrects the report.',
      when: (d, f) => d.hold === 'veracity_below_floor' && f.raise === 'review_failed_check',
      build: (review, d, ex, f) => ({
        subject: `Corrections Needed to the VPAT or ACR for ${f.product}`,
        greeting: 'Hello,',
        blocks: [
          p(`Thank you for the VPAT or ACR for ${f.product}${review.acr?.issued ? `, dated ${review.acr.issued}` : ''}. Before we can complete the accessibility compliance review, the report needs the corrections below.`),
          ul(defectLines(f.acr)),
          p('Please send a corrected VPAT or ACR, or tell us why a point does not apply to this purchase. A corrected report names the version evaluated, the evaluation date and the method, and on each item marked Partially Supports or Does Not Support names the feature affected, how it falls short and who it affects.'),
          p(`If a corrected report is not available, a live demonstration of ${f.product} with a screen reader and the keyboard can stand in for it. Please let us know if you can arrange one.`),
        ],
        footer: false,
      }),
    },
    {
      id: 'answers_request', label: 'Information needed to complete the review', to: 'unit',
      purpose: 'Hold 2. Asks the requester for the number of users and any other unanswered question, with the choices for each.',
      when: (d) => d.hold === 'answers_unknown',
      build: (review, d, ex, f) => ({
        subject: `Information Needed to Complete the Accessibility Review of ${f.product}`,
        greeting: `Hello ${f.first},`,
        blocks: [
          p(`The accessibility compliance review of ${f.product}, requisition ${f.requisition}, needs the number of people who will use the product. Please reply with the answers to the ${f.unknownAnswers.length === 1 ? 'question' : 'questions'} below.`),
          ol(f.unknownAnswers.map(questionLine)),
          ...(f.unknownAnswers.length > 1 ? [p('The review needs the number of users. The other answers are optional, and a blank answer counts as the highest level, so an answer can only lower what the review asks of you.')] : []),
          ...why([
            'The answers set the ICT Impact Level, which rates how many people use the product and how much they rely on it. The Impact Level sets the documentation the review requires and the terms of an approval. It never decides the result by itself.',
          ]),
          p(QUESTIONS_CLOSE),
        ],
        footer: true,
      }),
    },
    {
      id: 'demonstration_request', label: 'Supplier demonstration request', to: 'supplier',
      purpose: 'Hold 3. Asks the supplier to demonstrate the product\'s main functions with assistive technology, and says why the report on file cannot carry the review.',
      when: (d, f) => d.hold === 'veracity_below_floor' && f.raise !== 'spot_check',
      build: (review, d, ex, f) => {
        const because = {
          review_contradicted: `Our own check of ${f.product} found a barrier your report rates as Supports${f.acr?.spotCheckNote ? ` (${f.acr.spotCheckNote})` : ''}, so the review cannot rely on the report's Supports rows.`,
          review_failed_check: 'The VPAT or ACR on file has defects that keep the review from relying on it, and a demonstration can supply the evidence while you correct the report.',
          vendor_evidence: 'No VPAT or ACR is on file, and a demonstration can supply the evidence while you prepare the report.',
        }[f.raise] ?? 'The review needs evidence beyond the report on file.';
        const fns = f.functions.length ? f.functions : ['[Essential function 1]', '[Essential function 2]'];
        return {
          subject: `Request for an Accessibility Demonstration of ${f.product}`,
          greeting: 'Hello,',
          blocks: [
            p(`The SFBRN Procurement team is reviewing ${f.product} for purchase by the ${f.unit} department. ${because}`),
            p('Please demonstrate the functions below in a live session that our analyst joins, using a screen reader (NVDA or JAWS on desktop, VoiceOver on mobile) and the keyboard alone, with no mouse.'),
            ul(fns),
            p('During the session we record what a user of each assistive technology can complete on each function, and that record stands as evidence for the review. Please propose two or three times in the next two weeks.'),
            p('If a demonstration cannot be arranged, we complete the review on the documentation we have and treat the functions we could not verify as barriers.'),
          ],
          footer: false,
        };
      },
    },
    {
      id: 'spot_check_assignment', label: 'Spot check assignment', to: 'team',
      purpose: 'Hold 3. Hands the analyst\'s spot check to the ATI review team, with why the analyst does not take the ACR at face value and what each result means.',
      when: (d, f) => d.hold === 'veracity_below_floor' && f.raise === 'spot_check',
      build: (review, d, ex, f) => {
        const fns = f.functions.length ? f.functions : ['[Essential function 1]', '[Essential function 2]'];
        return {
          subject: `Spot check needed on ${f.product}, requisition ${f.requisition}`,
          greeting: 'Team,',
          blocks: [
            p(`The ACR for ${f.product} passes the report checks, but its qualifications keep it short of face value, because ${notTrustedBecause(f.acr)}. At ${lower(f.level)} exposure the vendor's Supports rows need confirmation before the review proceeds, and the spot check comes first.`),
            p('Exercise the essential functions below with a screen reader and the keyboard, and record the functions covered and the assistive technology used.'),
            ul(fns),
            p('If nothing turns up that the ACR does not report, the spot check agrees, the evidence clears the floor, and the review proceeds on the report. If a barrier appears that the ACR rates as Supports, record the barrier as a finding with its function and the users affected. The ACR\'s Supports rows then drop out, and the ATI coordinator\'s full manual review or a vendor demonstration re-rates the product.'),
            ...determination(ex, ['How we graded it']),
          ],
          footer: true,
        };
      },
    },
    {
      id: 'approval_notice', label: 'ICT accessibility review completed', to: 'unit',
      purpose: 'Tells the requester the review is complete and no further review is needed, with the ICT Impact Level, the VPAT Summary Report of barriers to plan workarounds for, the users covered and the contract terms.',
      when: (d) => !d.hold && d.outcome === 'approve',
      build: (review, d, ex, f) => ({
        subject: `ICT Accessibility Review Completed for ${f.product}`,
        greeting: `Hello ${f.first},`,
        blocks: [
          p(`The accessibility review for ${f.product}, requisition ${f.requisition}, has been completed, and no further review is needed at this time.`),
          ...(d.bypass ? [
            p('The campus buys the product as an accommodation for one named person, so the review does not rate it for a general audience. The approval covers that accommodation only, and use of the product beyond the named person returns it to review.'),
          ] : [
            p(`The ICT Impact Level for this product is ${f.level}.`),
            ...(review.findings.length ? [
              h('VPAT Summary Report'),
              p(`The VPAT Summary Report identifies the accessibility barriers below.${f.sev === 'S2' ? ' The product still falls short of the accessibility standard, and this approval records that.' : ''}`),
              ul(f.findingLines),
              p('Please review the report with the faculty and staff who will use the product, and plan a workaround for each barrier before rollout. The workaround your team will offer is [workaround].'),
            ] : []),
            p(`The approval covers ${f.users != null ? plural(count(f.users), 'user') : '[number] users'}. Growth beyond that number returns the product to review, as does renewal. A user who cannot use the product contacts [support contact].`),
          ]),
          p(NOT_A_PO),
          ...roadmapBlock(d, f),
          ...contractBlocks(d),
          ...why(d.bypass ? [
            'An accommodation purchase carries out what the campus and the person agreed in the interactive process, so the review approves it at intake.',
          ] : [
            `The ICT Impact Level is ${f.level} because ${impactBecause(f)}.`,
            `The review rested on ${f.evidence}. ${cap(barriersPhrase(f, d))}${f.sev === 'S2' ? ', and at Low impact the CSU does not require an alternate access plan' : ''}, so we approve the purchase.`,
          ]),
          p(QUESTIONS_CLOSE),
        ],
        footer: true,
      }),
    },
    {
      id: 'taap_request', label: 'Temporary alternate access plan required', to: 'unit',
      purpose: 'Hold 4. Tells the requester what the review found, why the purchase needs a TAAP before approval, that the SFBRN Procurement team drafts the plan with the requester, the number of requirements the plan must meet, and who signs.',
      when: (d) => d.hold === 'taap_needed',
      build: (review, d, ex, f) => {
        const moreAccessible = f.sev === 'S3' && f.std?.warning !== 'low';
        return {
          subject: `Temporary Alternate Access Plan Required for ${f.product}`,
          greeting: `Hello ${f.first},`,
          blocks: [
            p(`The accessibility review for ${f.product}, requisition ${f.requisition}, found that ${barriersPhrase(f, d)}.`),
            ...(review.findings.length ? [ul(f.findingLines)] : []),
            p('Before we can approve the purchase, the SFBRN Procurement team will work with you to draft a Temporary Alternate Access Plan (TAAP). The TAAP is the CSU\'s written plan for giving people with disabilities equally effective access another way while the supplier removes the barriers. The plan covers access for a set time and does not make the product compliant.'),
            ...(moreAccessible ? [p('Please tell us first whether another product meets the same need with fewer barriers. The CSU buys the most accessible product that meets the need, and a more accessible product ends this review in a denial.')] : []),
            p(`For this purchase the plan must meet ${f.need} CSU requirements below${f.std?.provisional ? '. The number may rise once we confirm the supplier\'s documentation, because the barriers found so far are a minimum' : ''}.`),
            ol(M.TAAP_REQUIREMENTS.map((r) => `${r.text}.`)),
            p('To draft the plan, we meet with the person on your team who will administer and support the product, and record the four points below. Please reply with that person\'s name and two or three times for the meeting.'),
            ul(['How your team will use the product.', 'The known barriers, named.', 'The alternative method of access for each barrier.', 'Your team\'s responsibilities for supporting access, with the contacts a user reaches and when they are available.']),
            p(`The plan includes a product-specific accessibility statement, which we draft with you, with ${list(M.TAAP_STATEMENT.includes)}. Post the statement ${M.TAAP_STATEMENT.postedAt}.`),
            p(`${cap(d.approver)} sign the finished plan. We file the signed plan with requisition ${f.requisition}, and the review resumes. We attach the CSU TAAP Authoring Template so you can see what the plan covers.`),
            ...why([
              `The ICT Impact Level is ${f.level} because ${impactBecause(f)}. The review rested on ${f.evidence}.`,
              f.sev === 'S3' || d.fallback
                ? 'The CSU requires equally effective access for everyone a purchase serves, so we approve a product that blocks some users only with a plan that provides that access another way.'
                : `At ${f.level} impact too many people rely on the product for barriers of this kind to count as minimal, so the CSU requires a plan that provides equally effective access another way.`,
              `The plan must meet ${f.need} requirements because of how many people rely on the product and how widely the barriers reach. ${M.WARNING_LEVELS[f.std.warning].means}`,
            ]),
            p(QUESTIONS_CLOSE),
          ],
          footer: true,
        };
      },
    },
    {
      id: 'taap_approval', label: 'ICT accessibility review completed, approved with a TAAP', to: 'signers',
      purpose: 'Tells the requester and the signers the review is complete and the purchase approved with the plan on file, the risk the warning level states, the review term and the contract terms.',
      when: (d) => !d.hold && d.outcome === 'approve_with_taap',
      build: (review, d, ex, f) => {
        const std = f.std;
        const w = M.WARNING_LEVELS[std.warning];
        return {
          subject: `ICT Accessibility Review Completed for ${f.product}, Approved with a TAAP`,
          greeting: `Hello ${f.first},`,
          blocks: [
            p(`The accessibility review for ${f.product}, requisition ${f.requisition}, has been completed. We approve the purchase with the Temporary Alternate Access Plan (TAAP) on file, which meets ${std.met === 6 ? 'all six' : `${std.met} of the six`} CSU requirements${d.exception ? ', as a Non-Equal Alternative under the written determination on file' : ''}.`),
            p(`The ICT Impact Level for this product is ${f.level}.`),
            ...(review.findings.length ? [p('The plan covers the barriers below.'), ul(f.findingLines)] : []),
            p(`The warning level is ${std.warning}. ${w.means} ${w.action}`),
            p('The plan runs twelve months or until contract renewal, whichever comes first. Each review requires measurable progress on the supplier\'s roadmap, and without that progress the plan lapses.'),
            p(`Post the plan's accessibility statement ${M.TAAP_STATEMENT.postedAt}. A user who reports a problem with the product receives the support the plan names, with no accommodation request needed.`),
            p(NOT_A_PO),
            ...roadmapBlock(d, f),
            ...contractBlocks(d),
            ...why([
              `The ICT Impact Level is ${f.level} because ${impactBecause(f)}. The review rested on ${f.evidence}.`,
              `${cap(barriersPhrase(f, d))}, so the CSU requires equally effective access another way, and the plan on file provides that access${std.met < 6 ? ` on ${std.met} of the six requirements. Your team supports access on the rest until the supplier's roadmap closes the barriers` : ''}.`,
            ]),
            p(QUESTIONS_CLOSE),
          ],
          footer: true,
        };
      },
    },
    {
      id: 'denial_notice', label: 'ICT accessibility review completed, not approved', to: 'unit',
      purpose: 'Tells the requester the review is complete and the purchase not approved, the barriers and the standard behind the decision, and the path to a new review.',
      when: (d) => !d.hold && d.outcome === 'deny',
      build: (review, d, ex, f) => {
        const because = {
          more_accessible_product: 'a more accessible product meets the same need, and the CSU buys the most accessible product that meets its requirements',
          no_alternative: 'the alternate access plan on file meets none of the six CSU requirements, so it provides no alternative access',
          taap_below_standard: `the alternate access plan on file meets ${f.std.met} of the six CSU requirements, ${plural(f.std.shortfall, 'requirement')} short of the ${f.std.required} this purchase requires`,
        }[d.denyReason] ?? 'the documentation does not support an approval';
        const path = d.denyReason === 'more_accessible_product'
          ? 'A supplier fix that removes the blocking barrier allows a new review.'
          : `A plan that meets ${f.need} requirements, a supplier fix that removes the blocking barrier, or a different product allows a new review.`;
        const unmet = M.TAAP_REQUIREMENTS.filter((r) => d.taapUnmet.includes(r.id));
        return {
          subject: `ICT Accessibility Review Completed for ${f.product}, Not Approved`,
          greeting: `Hello ${f.first},`,
          blocks: [
            p(`The accessibility review for ${f.product}, requisition ${f.requisition}, has been completed, and we do not approve the purchase, because ${because}.`),
            ...(review.findings.length ? [p(`The review found the barriers below against ${f.standard}.`), ul(f.findingLines)] : []),
            ...(d.denyReason === 'taap_below_standard' ? [p('We approve a plan below the required number only under a written determination by the president or a designee that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164 and 35.204). You may ask for that determination.')] : []),
            p(`${path} You may ask for reconsideration through your campus process.`),
            ...why([
              `The ICT Impact Level is ${f.level} because ${impactBecause(f)}. The review rested on ${f.evidence}.`,
              `${cap(barriersPhrase(f, d))}, so the CSU requires equally effective access another way before the purchase can proceed.`,
              ...(unmet.length && d.denyReason !== 'more_accessible_product' ? [`The plan on file falls short where ${list(unmet.map((r) => r.failed))}.`] : []),
            ]),
            p(QUESTIONS_CLOSE),
          ],
          footer: true,
        };
      },
    },
    {
      id: 'determination_referral', label: 'Referral for a written determination', to: 'president',
      purpose: 'Hold 5. Refers the requester\'s undue burden or fundamental alteration claim for the written determination, with the shortfall and what the determination has to contain.',
      when: (d) => d.hold === 'exception_claimed',
      build: (review, d, ex, f) => {
        const unmet = M.TAAP_REQUIREMENTS.filter((r) => d.taapUnmet.includes(r.id));
        return {
          subject: `Written Determination Requested for the Purchase of ${f.product} (28 CFR 35.164 and 35.204)`,
          greeting: 'Dear [Name],',
          blocks: [
            p(`The ${f.unit} department requests ${f.product} from ${f.supplier}, requisition ${f.requisition}. The accessibility review found that ${barriersPhrase(f, d)}, so the purchase requires a Temporary Alternate Access Plan (TAAP).`),
            ...(review.findings.length ? [ul(f.findingLines)] : []),
            p(`The plan the SFBRN Procurement team drafted with the requester meets ${f.std.met} of the six CSU requirements, ${plural(f.std.shortfall, 'requirement')} short of the ${f.std.required} this purchase requires. The plan falls short where ${list(unmet.map((r) => r.failed))}.`),
            p('The requester claims that equally effective access would be an undue burden or a fundamental alteration. Under 28 CFR 35.164 that determination belongs to the head of the public entity or a designee, in writing, after considering all resources available for use in the funding and operation of the program. High cost alone does not establish an undue burden.'),
            p('With the determination on file, we approve the plan as a Non-Equal Alternative under 28 CFR 35.204, and the university still provides access to the maximum extent possible. The determination lists the support that remains for each requirement the plan misses, and the Dean or Division Vice President acknowledges the residual risk in the plan.'),
            p('We attach the review, the barriers found and the plan. The review resumes on receipt of the determination, or of a revised plan that meets the required number.'),
            ...why([
              `The ICT Impact Level is ${f.level} because ${impactBecause(f)}. The review rested on ${f.evidence}.`,
              `The plan must meet ${f.std.required} of the six requirements because of how many people rely on the product and how widely the barriers reach.`,
            ]),
          ],
          footer: true,
        };
      },
    },
    {
      id: 'requisition_comment', label: 'Requisition comment', to: 'record',
      purpose: 'The short note for the requisition\'s Comments section in CSUBuy or P2P, with the result, the ICT Impact Level, the reason and the next step.',
      when: () => true,
      build: (review, d, ex, f) => {
        const hold = d.hold ? M.HOLDS.find((x) => x.id === d.hold) : null;
        const reason = d.bypass ? 'Accommodation purchase, approved at intake.'
          : d.hold === 'severity_unknown' ? 'No VPAT or ACR on the requisition. Requested from the requester.'
            : d.hold === 'answers_unknown' ? 'The number of users is missing. Requested from the requester.'
              : d.hold === 'veracity_below_floor' ? `The VPAT or ACR on file cannot carry the review yet. ${cap(d.veracity.raise.label)} is next.`
                : `${cap(barriersPhrase(f, d))}.`;
        const nextStep = hold ? `${cap(ex.headline)}, held by ${M.HOLDERS[hold.holder].label}.`
          : d.outcome === 'approve' ? 'Approved for this purchase with the CSU accessibility terms in the contract.'
            : d.outcome === 'approve_with_taap' ? `Approved with the TAAP on file, which meets ${f.std.met === 6 ? 'all six' : `${f.std.met} of the six`} requirements, warning level ${f.std.warning}. The SFBRN Procurement team files the signed TAAP with the requisition.`
              : 'Not approved.';
        return {
          subject: null,
          greeting: null,
          blocks: [
            p(`ICT accessibility review of ${f.product}, ${f.date}. The result is ${ex.headline}.${d.bypass || d.hold === 'answers_unknown' ? '' : ` The ICT Impact Level is ${f.level}.`}`),
            p(reason),
            p(nextStep),
          ],
          footer: true,
        };
      },
    },
    {
      id: 'full_determination', label: 'Full determination', to: 'unit',
      purpose: 'The complete grading and reasoning in the matrix\'s own terms, every section in order with the grade line and the matrix version.',
      when: () => true,
      build: (review, d, ex, f) => ({
        subject: `Accessibility Review of ${f.product}, Requisition ${f.requisition}`,
        greeting: null,
        blocks: [
          p(`The result is ${ex.headline}.`),
          p(ex.grade),
          ...ex.sections.flatMap((s) => [h(s.heading), s.bullets ? ul(s.lines) : { type: 'ps', lines: s.lines }]),
        ],
        footer: true,
        always: true,   // the reasoning toggle does not apply, since the reasoning is the message
      }),
    },
  ];

  /** The supplier request, shared by its own message and the enclosure in the customer notice. */
  function supplierRequestBlocks(review, f, ctx) {
    return [
      p(`I am writing to request the current Voluntary Product Accessibility Template (VPAT) or Accessibility Conformance Report (ACR) for ${f.product}, version [product version], on ${EDITION[review.ictKind]}.`),
      p('This documentation is required for software purchases and renewals funded by the University. The VPAT or ACR outlines the product\'s accessibility features and its conformance with Section 508 and WCAG.'),
      p(`Please send the current VPAT or ACR for ${f.product} for our review. A report we can use meets the points below.`),
      ul(reportCovers(review, ctx)),
      p('If a VPAT or ACR is not available, please let us know. We can provide a roadmap to help document the product\'s supported and unsupported accessibility features, and a live demonstration of the product with a screen reader can stand in for the report while you prepare it.'),
    ];
  }

  // ---- rendering
  const P = 'margin:0 0 8px 0;font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4;color:#1a1a1a;';
  function blocksToText(blocks, indent = '') {
    const out = [];
    for (const b of blocks) {
      if (b.type === 'p') out.push(`${indent}${b.text}`, '');
      else if (b.type === 'ps') { for (const l of b.lines) out.push(`${indent}${l}`); out.push(''); }
      else if (b.type === 'h') out.push(`${indent}${b.text}`);
      else if (b.type === 'ul') { for (const i of b.items) out.push(`${indent}- ${i}`); out.push(''); }
      else if (b.type === 'ol') { b.items.forEach((i, n) => out.push(`${indent}${n + 1}. ${i}`)); out.push(''); }
      else if (b.type === 'quote') { out.push(`${indent}----`, ...blocksToText(b.blocks, `${indent}    `), `${indent}----`, ''); }
    }
    return out;
  }
  function blocksToHtml(blocks) {
    return blocks.map((b) => {
      if (b.type === 'p') return `<p style="${P}">${esc(b.text)}</p>`;
      if (b.type === 'ps') return b.lines.map((l) => `<p style="${P}">${esc(l)}</p>`).join('');
      if (b.type === 'h') return `<p style="${P}margin-top:12px;"><strong>${esc(b.text)}</strong></p>`;
      if (b.type === 'ul') return `<ul style="margin:0 0 8px 20px;padding:0;">${b.items.map((i) => `<li style="${P}margin-bottom:4px;">${esc(i)}</li>`).join('')}</ul>`;
      if (b.type === 'ol') return `<ol style="margin:0 0 8px 20px;padding:0;">${b.items.map((i) => `<li style="${P}margin-bottom:4px;">${esc(i)}</li>`).join('')}</ol>`;
      if (b.type === 'quote') return `<blockquote style="margin:0 0 8px 0;padding:0 0 0 12px;border-left:3px solid #999999;">${blocksToHtml(b.blocks)}</blockquote>`;
      return '';
    }).join('\n');
  }
  /**
   * The original templates say "supplier" where the matrix says "vendor". A stakeholder
   * message uses the templates' word, except in the title of the CSU Vendor Accessibility
   * Roadmap, which keeps its capital.
   */
  const forStakeholder = (s) => s.replace(/\bvendor('s)?\b/g, 'supplier$1');
  function stakeholderBlocks(blocks) {
    return blocks.map((b) => {
      if (b.type === 'p' || b.type === 'h') return { ...b, text: forStakeholder(b.text) };
      if (b.type === 'ps') return { ...b, lines: b.lines.map(forStakeholder) };
      if (b.type === 'ul' || b.type === 'ol') return { ...b, items: b.items.map(forStakeholder) };
      if (b.type === 'quote') return { ...b, blocks: stakeholderBlocks(b.blocks) };
      return b;
    });
  }
  const STAKEHOLDERS = ['unit', 'supplier', 'signers', 'president'];
  /** Drops the reasoning blocks (a reasoning heading and what follows it until the next heading). */
  function withoutReasoning(blocks, headings) {
    const out = [];
    let skipping = false;
    for (const b of blocks) {
      if (b.type === 'h') skipping = headings.includes(b.text);
      if (!skipping) out.push(b);
    }
    return out;
  }
  const REASONING_HEADINGS = [REASON_HEADING, 'How we graded it', 'Why this result', 'What happens next', 'The rules behind this result'];

  /**
   * The messages the review's state calls for, the recommended one first, then the requisition
   * comment and the full determination.
   * @param {Object} review          the Review `evaluate` reads
   * @param {Object} d               the Determination from `evaluate(review)`
   * @param {Object} ex              the write-up from `explain(review, d, ctx)`
   * @param {{product?: string, vendor?: string, unit?: string, requester?: string, requisition?: string,
   *          signer?: string, interfaces?: string, date?: string}} [ctx]
   * @param {{reasoning?: boolean}} [opts]   include the reasoning block (default true)
   * @returns {{id: string, label: string, to: string, toKey: string, purpose: string, subject: string|null,
   *            greeting: string|null, blocks: Object[], text: string, html: string, placeholders: string[],
   *            recommended: boolean}[]}
   */
  function templates(review, d, ex, ctx = {}, opts = {}) {
    const includeReasoning = opts.reasoning !== false;
    const f = facts(review, d, ctx);
    const out = [];
    for (const t of TEMPLATES) {
      if (!t.when(d, f)) continue;
      const m = t.build(review, d, ex, f, ctx);
      const kept = includeReasoning || m.always ? m.blocks : withoutReasoning(m.blocks, REASONING_HEADINGS);
      const blocks = STAKEHOLDERS.includes(t.to) && !m.always ? stakeholderBlocks(kept) : kept;
      const footer = m.footer ? `Graded with the SFBRN accessibility review matrix, version ${M.MATRIX_VERSION}, on ${f.date}.` : null;
      const signature = t.to === 'record' ? null : `Thanks,\n${f.signer}`;
      const text = [
        m.subject ? `Subject: ${m.subject}` : null, m.subject ? '' : null,
        m.greeting, m.greeting ? '' : null,
        ...blocksToText(blocks),
        signature, signature ? '' : null,
        footer,
      ].filter((l) => l !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();
      const html = [
        m.subject ? `<p style="${P}"><strong>Subject: ${esc(m.subject)}</strong></p>` : '',
        m.greeting ? `<p style="${P}">${esc(m.greeting)}</p>` : '',
        blocksToHtml(blocks),
        signature ? `<p style="${P}">Thanks,<br>${esc(f.signer)}</p>` : '',
        footer ? `<p style="${P}color:#444444;font-size:10pt;margin-top:12px;">${esc(footer)}</p>` : '',
      ].filter(Boolean).join('\n');
      const placeholders = unique(text.match(/\[[^\]\n]{1,40}\]/g) || []);
      out.push({ id: t.id, label: t.label, to: TO[t.to], toKey: t.to, purpose: t.purpose, subject: m.subject, greeting: m.greeting,
        blocks, text, html, placeholders, recommended: false });
    }
    // The recommended message is the first one written for the state. The two that apply to
    // every state go last.
    const general = ['requisition_comment', 'full_determination'];
    const ordered = [...out.filter((t) => !general.includes(t.id)), ...out.filter((t) => general.includes(t.id))];
    if (ordered.length) ordered[0].recommended = true;
    return ordered;
  }

  return { templates, TEMPLATE_IDS: TEMPLATES.map((t) => t.id), TO, QUESTION, EDITION, EVIDENCE_WORDS, REASONING_HEADINGS };
});
