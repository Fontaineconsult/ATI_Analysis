# Impact matrix: the logic

This describes the accessibility impact assessment implemented by `impactform.php` and
`Impactscript.js` in this folder. It states what the tool decides and how, without
reference to the code, so the rubric can be modeled, reviewed or rebuilt from this page
alone. Where the code does something the form's wording does not suggest, the
behavior is listed under "Behavior that differs from intent" at the end.

## Purpose

The tool rates a technology request on a procurement ticket as Low, Medium or High
accessibility impact. The rating decides how much review the request needs. The tool
also produces a list of follow-up questions the requester must answer, and a printed
matrix showing where the request sits on each dimension.

## Inputs

**Ticket information.** Ticket number, vendor or product, and requesting department are
required text. The date is filled in automatically.

**Criteria.** Forty-two checkboxes sit in five dimensions. Each criterion belongs to one
level: Low, Medium or High. A criterion can also carry one or more tags. A tag ties
criteria together across levels and across dimensions, and the selection rules below
work through tags.

### 1. Intended audience, users and groups

| Level | Heading | Criterion | Tags |
|---|---|---|---|
| Low | Affects optional program or service | 0-1 users | users |
| Low | | Non public facing | public-facing |
| Low | | Research (faculty and a small group of dedicated students) | research |
| Medium | Affects important but non-critical program or service | 2-20 users | users |
| Medium | | Considerable number of faculty or staff | faculty-count, faculty-use |
| Medium | | Considerable number of students | student-count, student-use-link |
| Medium | | Public facing component | public-facing |
| High | Affects critical program or service | 21+ users | users |
| High | | All faculty or staff | faculty-count |
| High | | All students | student-count, student-use |
| High | | Public facing | public-facing |

### 2. Access

| Level | Criterion | Tags |
|---|---|---|
| Low | Does not limit access to the program or service for people with disabilities | access |
| Medium | Limits access to the program or service for people with disabilities | access |
| High | Denies access to the program or service for people with disabilities | access |

### 3. Legal exposure

| Level | Heading | Criterion | Tags |
|---|---|---|---|
| Low | Little to none | No to low student use | student-use, legal |
| Low | | Use of the product is optional | legal |
| Low | | Not required for academic or employment purposes | academic-use |
| Medium | Moderate exposure | Student use | student-use, student-use-link, legal, campus-follow |
| Medium | | Moderate faculty or staff use (non-identified personnel) | faculty-use, legal |
| Medium | | Consideration for required academic purposes (if the requirement timeline is short and student users are low) | academic-use, legal |
| Medium | | Required for employment purposes | academic-use, required, legal |
| High | Significant exposure | Campus-wide | campus, scope, legal |
| High | | All student access | student-use, campus-follow, legal |
| High | | All faculty or staff access | campus-follow, legal |
| High | | Public facing | public-facing, legal |
| High | | Required for academic purposes | academic-use, required, research-academic, legal |

### 4. Use

| Level | Criterion | Tags |
|---|---|---|
| Low | Single purchase or annual renewal without scope change | none |
| Low | Does not publish materials | publishing |
| Low | Not rolled out at all | rollout |
| Medium | May publish materials used by specific (limited) audiences | publishing |
| Medium | Product may be rolled out to a larger audience | rollout |
| High | Publishes public facing materials | publishing |
| High | Product will be rolled out to a large audience or campus-wide | rollout |

### 5. Areas or location of use

| Level | Criterion | Tags |
|---|---|---|
| Low | 1 department, organization or course (one-time instruction) | department, scope |
| Low | Non-public (office or restricted area) | public-facing, location |
| Low | Research | research |
| Medium | Classroom, lab | none |
| Medium | Multiple departments, organizations or courses | department, scope |
| Medium | Semi-public (service offices, public space) | public-facing, location |
| High | Campus-wide | campus, scope |
| High | Specific courses (all sections, part of the curriculum) | department |
| High | Public (lab such as a learning commons, classroom, public space) | public-facing, location |

**Further detail.** When "21+ users" is selected, the tool asks how many: Not sure
(the default), 21-100, or 100+.

## Selection rules

### One level per tag

Within each of these tags, only one level can be selected at a time:

users, public-facing, student-use, academic-use, publishing, rollout, department,
faculty-count, student-count, access.

Selecting a criterion clears any selected criterion with the same tag at a different
level. The cleared criteria are shown crossed out. Several criteria at the same level
may be selected together.

These groups cross dimensions. The public-facing group holds criteria from Intended
audience, Legal exposure and Location. Selecting "Public facing" (High) in Intended
audience therefore clears "Non-public" (Low) and "Semi-public" (Medium) in Location.

### Required purposes

"Required for employment purposes" (Medium) and "Required for academic purposes"
(High) can both be selected together. Selecting either one clears "Not required for
academic or employment purposes" (Low). Selecting either one crosses out the other
academic-use criteria without clearing them.

### Linked pairs

Some criteria in different dimensions describe the same fact, and selecting or
clearing one does the same to the other:

| Criterion | Linked to |
|---|---|
| Considerable number of faculty or staff (Audience, Medium) | Moderate faculty or staff use (Legal, Medium) |
| Considerable number of students (Audience, Medium) | Student use (Legal, Medium) |
| Campus-wide (Legal, High) | Campus-wide (Location, High) |

### Campus-wide cascade

Selecting a Campus-wide criterion also selects every campus-follow criterion: Student
use, All student access, and All faculty or staff access. Clearing any campus-follow
criterion clears Campus-wide.

## Scoring

Every selected criterion adds points for its level:

| Level | Points per selected criterion |
|---|---|
| Low | -0.45 |
| Medium | 4 |
| High | 16 |

The score is the sum. The rating comes from the score:

| Score | Rating |
|---|---|
| below 22 | Low |
| 22 to below 64 | Medium |
| 64 or more | High |

The score counts selections, not dimensions. Four High criteria reach High on their own.
Sixteen Medium criteria also reach High. A single "Denies access" adds 16 and does not
make a request High by itself. Low criteria lower the score slightly, so a request with
many Low selections reads as lower impact.

### Research override

Research is selected when either Research criterion (Audience or Location) is selected.

- Research without "Required for academic purposes" rates **Low**, whatever else is
  selected.
- Research with "Required for academic purposes" rates **Medium**.

## The matrix

The printed matrix has five rows. Each row names the current position and marks one
column (Low, Medium or High) as current. The matrix rows are not the same as the input
dimensions: Use has no matrix row, and Scope is derived from two dimensions.

| Matrix row | Read from | Result |
|---|---|---|
| Audience / number of users | the users tag, and the further-detail answer | None selected: unknown number of users. 0-1 or 2-20 users: Low, "affects optional program or service". 21+ users and Not sure: Medium and High both marked. 21+ users and 21-100: Medium. 21+ users and 100+: High. |
| Access | the access tag | None or Low: Low, "does not limit access". Medium: "limits access". High: "denies access". |
| Legal exposure | every criterion tagged legal | The highest level selected. None selected: Low, "little to no exposure". |
| Scope | the scope tag (Legal and Location campus-wide, Location departments) | Campus-wide: High. Multiple departments: Medium. One department: Low. None: unknown use of departments. |
| Location | the location tag | Public: High. Semi-public: Medium. Non-public: Low. None: unknown location of use. |

Below the matrix sit the rating and the remarks.

## Remarks: follow-up questions

Each selected criterion below adds a question or statement to the remarks. The
requester answers these as part of the review.

| Selected | Remark |
|---|---|
| 21+ users, with the count answered Not sure | Confirm the total number of users for each applicable group (faculty, staff, students). |
| Public facing component (Audience, Medium) | The product may contain publicly accessible components. Describe in detail how they may be used or accessed. |
| Public facing (Audience, High) | The product is public facing and must be accessible. Further detail about its proposed use may be needed. Describe how users may interact with its public facing components. |
| Limits access | The product may limit access for persons with disabilities to a program or service. Supplemental documentation may be required. |
| Denies access | The product may deny access for persons with disabilities to a program or service. Supplemental documentation will be required if its use is recommended. |
| Required for employment purposes | The product must be accessible to faculty and staff. Employment should not be denied to persons with disabilities applying for positions that require it. Describe how the product is required for employment. |
| Required for academic purposes | The product must be accessible to students. Describe the academic requirement. State what workarounds exist for students who cannot use the product as intended. |
| May publish materials for limited audiences | Is the product used to create, publish or distribute electronic content? If so, describe what content, where it can be accessed, and by whom. |
| Publishes public facing materials | The product may publish publicly accessible content. Describe what content or documents it creates, where they can be accessed, and by whom. |
| Multiple departments, organizations or courses | Describe which departments, organizations or courses will use the product and how. |
| Semi-public location | Describe the semi-public physical location or virtual environment and how the product will be accessed and used. |
| Public location | Describe the public physical or virtual environment and how the product will be accessed and used. |

**Research.** When research is selected:

- With "Consideration for required academic purposes" or "Required for academic
  purposes" also selected, the remarks add: describe how the product will be used for
  research, the estimated users in each group, the duration of use, and the impact on
  student academics.
- Otherwise every other remark is replaced by one line: low impact for research
  purposes, no further review required.

The research test for remarks counts "Consideration for required academic purposes"
(Medium). The research test for the rating does not.

## Completion gates

The assessment cannot be printed until:

1. Ticket number, vendor or product, and requesting department are filled in.
2. When the rating is High, an Access criterion is selected.
3. When the rating is High, a publishing criterion (Use) is selected.

The remarks section is printed only when there is at least one remark.

## Behavior that differs from intent

These are places where the tool's behavior departs from what the form's wording
suggests. A rebuild should decide each one deliberately.

1. **2-20 users shows as Low in the matrix.** The Audience row treats any users
   selection below 21+ as "affects optional program or service". The form places
   2-20 users under Medium.
2. **The research override does not hold.** Research without an academic requirement
   locks the rating at Low until a research criterion is cleared, even if High
   criteria are added later. Research with an academic requirement sets Medium only
   until the next selection of any other criterion, after which the ordinary score
   applies again.
3. **The campus-wide cascade conflicts with one-level-per-tag.** Campus-wide selects
   both Student use (Medium) and All student access (High). Both carry the
   student-use tag, which allows one level at a time, so the cascade and the rule
   undo each other and the final state depends on the order of the clicks.
4. **"All faculty or staff" and "All students" in Audience are not in the cascade.**
   Their tag differs by name from the cascade's, so campus-wide does not select them,
   although the markup suggests it was meant to.
5. **The score is a count, not a profile.** The rating ignores which dimensions the
   selections come from. Denying access to people with disabilities weighs the same as
   any other High criterion.
6. **Linked pairs cross levels of meaning.** "Considerable number of students"
   (Audience) is linked to "Student use" (Legal), and "Student use" is in the
   campus-wide cascade. Selecting campus-wide therefore also changes the Audience
   dimension through the link.
7. **Classroom, lab** (Location, Medium) carries no tag. It adds to the score and
   affects nothing else, including the Location row of the matrix.
8. **"Single purchase or annual renewal without scope change"** carries no tag. It
   adds to the score only.
