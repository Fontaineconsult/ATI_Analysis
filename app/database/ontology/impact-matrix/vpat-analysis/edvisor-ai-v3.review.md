# ACR analysis: Edvisor.ai - Courses Platform (Instructor and Student)

The rubric rates this ACR E1-, below face value, because of a report defect. The analyst confirms each call below before the rating goes into the review.

The extraction cannot settle 2 checks, which the analyst decides.

- Older than 24 months or the last major release. The evaluation is less than a month old. The month of the last major release was not given, so the analyst checks it.
- Does not cover every interface or platform being bought. The interfaces being bought were not given. The report covers Courses Module, instructor workflows (web) and Courses Module, student workflows (web).

## Report checks

### Document checks

- **Passes. Reports WCAG 2.0 only (508 edition) for a web or mobile product.** The report covers WCAG 2.0, WCAG 2.1, WCAG 2.2 and Revised Section 508.
- **Fails. No month and year, no product version, or a different version.** The report names no product version.
- **Analyst decides. Older than 24 months or the last major release.** The evaluation is less than a month old. The month of the last major release was not given, so the analyst checks it.
- **Passes. No evaluation methods named.** The report describes its evaluation methods.
  > Accessibility evaluation was conducted through manual inspection and assistive technology testing, including keyboard-only navigation and screen reader testing with NVDA/JAWS. Color contrast was verified using contrast analysis tools, and reflow behavior was assessed at 200 percent and 400 percent magnification on a 1280 by 1024 display. (page 3)
- **Passes. Tested on one browser and one screen reader only.** The report names NVDA and JAWS and no browser.
- **Passes. "Not Evaluated" outside the AAA table, or "Not Applicable" without a reason.** Every Level A and AA row carries a rating, and every Not Applicable row gives a reason.
- **Analyst decides. Does not cover every interface or platform being bought.** The interfaces being bought were not given. The report covers Courses Module, instructor workflows (web) and Courses Module, student workflows (web).
- **Passes. Scope carve-outs in the notes that exclude part of the product.** The notes exclude no part of the product.

### Remarks checks

- **Passes. "Partially Supports" or "Does Not Support" without remarks.** Every admission has a remark.
- **Fails. "Supports" on complex criteria without remarks that show the work.** 2 Supports rows on complex criteria give no example or method.
  > No issues were identified for this criterion during the audit within the evaluated scope. (page 11) [2.2.2]
  > No issues were identified for this criterion during the audit within the evaluated scope. (page 12) [2.4.1]
- **Passes. A remark describes a failure under a "Supports" rating.** No remark contradicts its rating.
- **Passes. Remarks hedge with "some", "most" or "generally".** No remark hedges.

## Qualifications

- **Age: raised.** Evaluated 2026-10. Less than a month old.
- **Author: raised.** A named outside firm wrote it: WCAG Designs.
  > This Accessibility Conformance Report documents an independent accessibility evaluation of the Edvisor.ai Courses Module conducted by WCAG Designs (Sana Kapasi). (page 3)
- **Remarks: lowered.** 2 Supports rows on complex criteria show no work, and 15 rated rows repeat the same remark, such as "No issues were identified for this criterion during the audit within the evaluated scope".

## Leads

The report admits no failure. The analyst places no lead.

## SFBRN process flags

The SFBRN VPAT Review Process raises these. The matrix has no check for them, so they do not move the rating.

- The report rates every applicable Level A and AA criterion Supports. A clean report is the case the spot check exists for.
- The report names no browser. The SFBRN heading checks look for named browsers and operating systems.

## What the extraction could not read

- The report names no product version. It says the evaluation "reflects the product version available as of October 7, 2026" (page 3).
- The report names no browser. The methods section names NVDA, JAWS and keyboard-only testing (page 3).
- The evaluation covers one course the vendor chose: "Testing was conducted against 'Intro to WCAG 2.2: The Accessibility Audit Course' (course code 3I7E4H), provided by the vendor as a representative sample of instructor-created course content" (page 4). The report calls the pages in it representative of the platform. This is recorded here, not as a scope carve-out, because the report does not say any part of the product was left out.
- The evaluation covers the Courses Module. The report does not say whether Edvisor.ai has other modules, such as the Chat feature named under 3.2.6.
- The initial audit found 161 defects. Every rating reflects the state after remediation and revalidation as of October 7, 2026 (page 4).
- The report rates every Level AAA criterion Not Applicable with the remark that AAA was not evaluated. The template term for that is Not Evaluated.
- The 26 Section 508 rows without a rating are chapter and section headings, such as "402 Closed Functionality", and are left out. The EN 301 549 tables are left out, since the report marks EN 301 549 as not included.
- The file name reads "Updated 09_28_2026"; the report date inside is 10/07/2026. The extraction uses the date inside.

## Rules applied

- Complex criteria for the bare-Supports check: 1.1.1, 1.2.2, 1.3.1, 1.4.1, 2.1.1, 2.2.2, 2.4.1, 2.4.3, 4.1.2.
- A remark repeated on 3 or more rated rows counts as repeated. Not Applicable and Level AAA rows do not count.
- A Supports remark on a complex criterion shows the work when it names where it was checked or the method. A blank, restated or generic remark does not.
- Remarks rate raised when every admission reads like a bug report, lowered when any admission is blank, restated, generic, hedged or repeated, and named otherwise.
- These rules are proposals for the pilot to calibrate. Matrix version 3, run on 2026-10, extraction by claude-opus-5-5, in-session reading (not extract_acr.py).
