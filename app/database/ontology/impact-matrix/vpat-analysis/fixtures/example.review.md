# ACR analysis: MathLab Pro 7.2

The rubric rates this ACR E1-, below face value, because of a report defect. The analyst confirms each call below before the rating goes into the review.

The extraction cannot settle one check, which the analyst decides.

- Older than 24 months or the last major release. The evaluation is 5 months old. The month of the last major release was not given, so the analyst checks it.

## Report checks

### Document checks

- **Passes. Reports WCAG 2.0 only (508 edition) for a web or mobile product.** The report covers WCAG 2.1.
- **Passes. No month and year, no product version, or a different version.** The report is dated 2026-05 for version 7.2.
- **Analyst decides. Older than 24 months or the last major release.** The evaluation is 5 months old. The month of the last major release was not given, so the analyst checks it.
- **Passes. No evaluation methods named.** The report describes its evaluation methods.
  > Manual testing with NVDA 2025.1 and JAWS 2025 on Chrome and Firefox, plus keyboard-only testing. (page 1)
- **Passes. Tested on one browser and one screen reader only.** The report names NVDA and JAWS and Chrome and Firefox.
- **Passes. "Not Evaluated" outside the AAA table, or "Not Applicable" without a reason.** Every Level A and AA row carries a rating, and every Not Applicable row gives a reason.
- **Fails. Does not cover every interface or platform being bought.** The purchase includes iOS app, which the report does not cover. It covers Web application (student and instructor views).
- **Passes. Scope carve-outs in the notes that exclude part of the product.** The notes exclude no part of the product.

### Remarks checks

- **Passes. "Partially Supports" or "Does Not Support" without remarks.** Every admission has a remark.
- **Passes. "Supports" on complex criteria without remarks that show the work.** Every Supports row on a complex criterion shows the work.
- **Passes. A remark describes a failure under a "Supports" rating.** No remark contradicts its rating.
- **Passes. Remarks hedge with "some", "most" or "generally".** No remark hedges.

## Qualifications

- **Age: raised.** Evaluated 2026-05. 5 months before 2026-10.
- **Author: raised.** A named outside firm wrote it: Example Audits LLC.
  > Evaluation performed by Example Audits LLC, an independent accessibility firm. (page 1)
- **Remarks: raised.** All 2 admissions read like a bug report, and every Supports row on a complex criterion gives an example or the method.

## Leads

The report admits 2 failures. Each becomes a finding once the analyst places it on an essential function and rates its severity. The rating in the report does not set severity.

- **1.4.3 Contrast (Minimum), Partially Supports.** Names "Gradebook search field". Affects users with low vision.
  > On the Gradebook screen, placeholder text in the search field has a 3.1:1 contrast ratio, which users with low vision may not read. (page 4)
- **2.4.7 Focus Visible, Does Not Support.** Names "equation editor toolbar". Affects users with limited use of their hands and with low vision.
  > The equation editor toolbar shows no focus indicator, so keyboard users cannot tell which button is selected. (page 4)

## SFBRN process flags

The SFBRN VPAT Review Process raises these. The matrix has no check for them, so they do not move the rating.

- The extraction found 11 WCAG Level A and AA rows. WCAG 2.1 has 50, so the analyst checks for rows the report or the extraction missed.

## Rules applied

- Complex criteria for the bare-Supports check: 1.1.1, 1.2.2, 1.3.1, 1.4.1, 2.1.1, 2.2.2, 2.4.1, 2.4.3, 4.1.2.
- A remark repeated on 3 or more rows counts as repeated.
- Remarks rate raised when every admission reads like a bug report, lowered when any admission is blank, restated, generic, hedged or repeated, and named otherwise.
- These rules are proposals for the pilot to calibrate. Matrix version 3, run on 2026-10, extraction by none.
