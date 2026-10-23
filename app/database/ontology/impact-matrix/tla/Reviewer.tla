---- MODULE Reviewer ----
(*
The SFBRN accessibility review as a state machine. A state is one review as the analyst has
recorded it: the exposure level, the findings, the evidence and the ACR record, whether the
evidence can still be raised, and the TAAP. The actions are what the analyst, the vendor and
the requesting unit can do next. The outcome of a state is the rule in review-matrix.js,
restated here; conformance.js checks every reachable state against the JavaScript.

The data tables (the grid, the floors, the evidence ranks, the TAAP standard) come from
ReviewerData.tla, which gen-data.js writes from review-matrix.js.

Exposure is abstracted to its level. The findings are abstracted to the worst severity and
the breadth level, with the pairs that are not reachable from any set of findings excluded.
The ACR record is abstracted to its three qualifications and the spot check. Only the fields
that decide an outcome are kept.
*)
EXTENDS Naturals, FiniteSets, ReviewerData

Levels == {"low", "medium", "high"}
Rank(l) == CASE l = "low" -> 0 [] l = "medium" -> 1 [] l = "high" -> 2
Sevs == {"S0", "S1", "S2", "S3"}
SevNum(s) == CASE s = "S0" -> 0 [] s = "S1" -> 1 [] s = "S2" -> 2 [] s = "S3" -> 3
Recorded == {"E0", "E1-", "E1", "E2a", "E2b", "E3b"}
Direct == {"E2a", "E2b", "E3b"}
Ages == {"out", "unknown", "raised", "lowered"}
Quals == {"raised", "lowered"}
Remarks == {"raised", "named", "lowered"}
Spots == {"none", "agrees", "contradicts"}
Mets == {0, 2, 3, 4, 6}
Exceptions == {"none", "claimed", "determined"}

VARIABLES
  level,        \* exposure level; high while the user count is missing
  answersOpen,  \* the user count is missing (hold 2)
  findings,     \* "none" or "some"
  sev,          \* worst severity of the findings on file, S0 when none
  breadth,      \* breadth level 0..2 from the findings
  ev,           \* evidence as recorded: E0, E1-, E1, E2a, E2b, E3b
  age, author, remarks, spot,   \* the ACR record, canonical unless the ACR is clean
  accepted,     \* the analyst accepted a recorded E1- with the defect noted
  validation,   \* "open" or "unavailable": whether the evidence can still be raised
  taapOnFile, met, exception, moreAcc,
  out, lvl, conf, sev1          \* derived, for the conformance check

vars == <<level, answersOpen, findings, sev, breadth, ev, age, author, remarks, spot, accepted, validation,
          taapOnFile, met, exception, moreAcc, out, lvl, conf, sev1>>
caseVars == <<level, answersOpen, findings, sev, breadth, ev, age, author, remarks, spot, accepted, validation,
              taapOnFile, met, exception, moreAcc>>

-----------------------------------------------------------------------------
\* The domain.

ValidBreadth(s, b) == b \in 0..2 /\ (s \in {"S0", "S1"} => b = 0) /\ (s = "S2" => b <= 1)
CanonicalAcr == age = "unknown" /\ author = "lowered" /\ remarks = "lowered" /\ spot = "none"
HasAcr == ev \in {"E1-", "E1"}
Stale == age = "out"
Clean == (ev = "E1" \/ (ev = "E1-" /\ accepted)) /\ ~Stale
Trusted == Clean /\ remarks = "raised" /\ ~(age = "lowered" /\ author = "lowered")
\* Taken at face value: a trusted ACR with no spot check recorded against it.
AtFaceValue == Trusted /\ spot = "none"

Valid ==
  /\ (findings = "none" => sev = "S0" /\ breadth = 0)
  /\ ValidBreadth(sev, breadth)
  /\ (ev /= "E1" /\ ~(ev = "E1-" /\ accepted) => CanonicalAcr)
  /\ (ev /= "E1-" => ~accepted)
  /\ (spot /= "none" => Clean)
  /\ (~taapOnFile => met = 0 /\ exception = "none")
  /\ (answersOpen => level = "high")

-----------------------------------------------------------------------------
\* The rule, restated from evaluate() in review-matrix.js.

AcrLevel == IF ~Clean THEN "E1-"
            ELSE IF spot = "contradicts" THEN "E1-"
            ELSE IF spot = "agrees" THEN "E3a"
            ELSE IF Trusted THEN "E1+"
            ELSE "E1"
EvLevel == IF HasAcr THEN AcrLevel ELSE ev
RaiseBy == IF ~HasAcr THEN "vendor_evidence"
           ELSE IF ~Clean THEN "review_failed_check"
           ELSE IF spot = "contradicts" THEN "review_contradicted"
           ELSE "spot_check"
Severity0 == IF findings = "none" THEN (IF ev = "E0" THEN "S?" ELSE "S0") ELSE sev
Unknown == Severity0 = "S?"
Unavail == validation = "unavailable"
GradeNow == IF Unknown THEN "needs_taap" ELSE Grade(level, Severity0)
Binds == Unknown \/ level = "high" \/ GradeNow = "approve"
Confirmed == ~Unknown /\ EvRank(EvLevel) >= Floor(level)
BelowBinding == Unknown \/ (Binds /\ EvRank(EvLevel) < Floor(level))
Fallback == BelowBinding /\ Unavail
Sev1 == IF Fallback THEN "S3" ELSE Severity0
Breadth1 == IF Unknown THEN 2 ELSE breadth
Pressure == Rank(level) + Breadth1
Std == Required(Pressure)

ResolveTaap ==
  IF Sev1 = "S3" /\ moreAcc THEN "deny_more_accessible_product"
  ELSE IF ~taapOnFile THEN "hold_taap_needed"
  ELSE IF met >= Std THEN "approve_with_taap"
  ELSE IF met = 0 THEN "deny_no_alternative"
  ELSE IF exception = "determined" THEN "approve_with_taap_exception"
  ELSE IF exception = "claimed" THEN "hold_exception_claimed"
  ELSE "deny_taap_below_standard"

Outcome ==
  IF Unknown /\ ~Unavail THEN "hold_severity_unknown"
  ELSE IF answersOpen THEN "hold_answers_unknown"
  ELSE IF BelowBinding /\ ~Unavail THEN "hold_veracity_below_floor"
  ELSE IF Grade(level, Sev1) = "approve" THEN "approve"
  ELSE ResolveTaap

Terminals == {"approve", "approve_with_taap", "approve_with_taap_exception",
              "deny_more_accessible_product", "deny_no_alternative", "deny_taap_below_standard"}
Terminal == out \in Terminals

-----------------------------------------------------------------------------
\* The process.

Derive == out' = Outcome' /\ lvl' = EvLevel' /\ conf' = Confirmed' /\ sev1' = Sev1'

\* New evidence can reveal barriers. Findings are never removed, so the worst severity and
\* the breadth do not fall. minSev is the least the new evidence shows.
Reveal(minSev) ==
  \E s \in Sevs, b \in 0..2 :
    /\ ValidBreadth(s, b)
    /\ SevNum(s) >= SevNum(sev) /\ SevNum(s) >= SevNum(minSev)
    /\ (s = sev => b >= breadth)
    /\ sev' = s /\ breadth' = b
    /\ findings' \in (IF s = "S0" THEN {findings, "some"} ELSE {"some"})

FreshAcr(e) ==
  /\ ev' = e
  /\ accepted' = FALSE
  /\ IF e = "E1" THEN age' \in Ages /\ author' \in Quals /\ remarks' \in Remarks /\ spot' = "none"
     ELSE age' = "unknown" /\ author' = "lowered" /\ remarks' = "lowered" /\ spot' = "none"

\* The vendor supplies an ACR where there was no evidence.
VendorSuppliesAcr ==
  /\ ev = "E0"
  /\ \E e \in {"E1-", "E1"} : FreshAcr(e)
  /\ Reveal("S0")
  /\ UNCHANGED <<level, answersOpen, validation, taapOnFile, met, exception, moreAcc>>
  /\ Derive

\* The vendor corrects an ACR with a report defect.
VendorCorrectsAcr ==
  /\ HasAcr /\ ~Clean
  /\ FreshAcr("E1")
  /\ Reveal("S0")
  /\ UNCHANGED <<level, answersOpen, validation, taapOnFile, met, exception, moreAcc>>
  /\ Derive

\* The analyst spot-checks a clean ACR that is not yet taken at face value. A contradiction
\* is a barrier found, so at least one finding is recorded.
RecordSpotCheck(r) ==
  /\ Clean /\ ~Trusted /\ spot = "none"
  /\ spot' = r
  /\ IF r = "agrees" THEN UNCHANGED <<findings, sev, breadth>> ELSE Reveal("S1")
  /\ UNCHANGED <<level, answersOpen, ev, age, author, remarks, accepted, validation, taapOnFile, met, exception, moreAcc>>
  /\ Derive

\* The analyst accepts an ACR with a report defect, with the reason noted, and reads its
\* qualifications. Acceptance does not reveal findings; the ACR's admissions are on file.
AcceptAcr ==
  /\ ev = "E1-" /\ ~accepted
  /\ accepted' = TRUE
  /\ age' \in Ages /\ author' \in Quals /\ remarks' \in Remarks /\ spot' = "none"
  /\ UNCHANGED <<level, answersOpen, findings, sev, breadth, ev, validation, taapOnFile, met, exception, moreAcc>>
  /\ Derive

\* A demonstration, an audit or the full manual review is recorded. It replaces the ACR as
\* the strongest evidence. Offered while the evidence is unconfirmed, or to rank higher.
RecordDirect(e) ==
  /\ ~Confirmed \/ EvRank(e) > EvRank(EvLevel)
  /\ ev' = e
  /\ age' = "unknown" /\ author' = "lowered" /\ remarks' = "lowered" /\ spot' = "none" /\ accepted' = FALSE
  /\ Reveal("S0")
  /\ UNCHANGED <<level, answersOpen, validation, taapOnFile, met, exception, moreAcc>>
  /\ Derive

\* The ATI review team records that the evidence cannot be raised.
MarkUnavailable ==
  /\ validation = "open" /\ ~Confirmed
  /\ validation' = "unavailable"
  /\ UNCHANGED <<level, answersOpen, findings, sev, breadth, ev, age, author, remarks, spot, accepted, taapOnFile, met, exception, moreAcc>>
  /\ Derive

\* The requesting unit supplies the user count. It sets the start, and the other answers
\* lower it, so any level can follow.
AnswerQuestions ==
  /\ answersOpen
  /\ answersOpen' = FALSE
  /\ level' \in Levels
  /\ UNCHANGED <<findings, sev, breadth, ev, age, author, remarks, spot, accepted, validation, taapOnFile, met, exception, moreAcc>>
  /\ Derive

FileTaap ==
  /\ out = "hold_taap_needed"
  /\ taapOnFile' = TRUE /\ met' \in Mets /\ exception' = "none"
  /\ UNCHANGED <<level, answersOpen, findings, sev, breadth, ev, age, author, remarks, spot, accepted, validation, moreAcc>>
  /\ Derive

ReviseTaap ==
  /\ taapOnFile
  /\ met' \in Mets /\ met' /= met
  /\ UNCHANGED <<level, answersOpen, findings, sev, breadth, ev, age, author, remarks, spot, accepted, validation, taapOnFile, exception, moreAcc>>
  /\ Derive

ClaimException ==
  /\ out = "deny_taap_below_standard"
  /\ exception' = "claimed"
  /\ UNCHANGED <<level, answersOpen, findings, sev, breadth, ev, age, author, remarks, spot, accepted, validation, taapOnFile, met, moreAcc>>
  /\ Derive

Determine ==
  /\ exception = "claimed"
  /\ exception' \in {"determined", "none"}
  /\ UNCHANGED <<level, answersOpen, findings, sev, breadth, ev, age, author, remarks, spot, accepted, validation, taapOnFile, met, moreAcc>>
  /\ Derive

Init ==
  /\ level \in Levels
  /\ answersOpen \in BOOLEAN
  /\ findings \in {"none", "some"}
  /\ sev \in Sevs
  /\ breadth \in 0..2
  /\ ev \in Recorded
  /\ age \in Ages /\ author \in Quals /\ remarks \in Remarks /\ spot \in Spots /\ accepted \in BOOLEAN
  /\ validation \in {"open", "unavailable"}
  /\ taapOnFile \in BOOLEAN /\ met \in Mets /\ exception \in Exceptions /\ moreAcc \in BOOLEAN
  /\ Valid
  /\ out = Outcome /\ lvl = EvLevel /\ conf = Confirmed /\ sev1 = Sev1

Next ==
  \/ VendorSuppliesAcr
  \/ VendorCorrectsAcr
  \/ AcceptAcr
  \/ \E r \in {"agrees", "contradicts"} : RecordSpotCheck(r)
  \/ \E e \in Direct : RecordDirect(e)
  \/ MarkUnavailable
  \/ AnswerQuestions
  \/ FileTaap
  \/ ReviseTaap
  \/ ClaimException
  \/ Determine
  \/ (Terminal /\ UNCHANGED vars)   \* a decision rests; TLC's deadlock check then covers every hold

Spec == Init /\ [][Next]_vars

-----------------------------------------------------------------------------
\* Invariants. Each is one claim the rubric makes.

TypeOK ==
  /\ level \in Levels /\ answersOpen \in BOOLEAN /\ findings \in {"none", "some"} /\ sev \in Sevs
  /\ breadth \in 0..2 /\ ev \in Recorded /\ age \in Ages /\ author \in Quals /\ remarks \in Remarks
  /\ spot \in Spots /\ accepted \in BOOLEAN /\ validation \in {"open", "unavailable"} /\ taapOnFile \in BOOLEAN
  /\ met \in Mets /\ exception \in Exceptions /\ moreAcc \in BOOLEAN
  /\ Valid
  /\ out = Outcome /\ lvl = EvLevel /\ conf = Confirmed /\ sev1 = Sev1

\* A clean ACR taken at face value never waits for stronger evidence.
FaceValue == AtFaceValue => out \notin {"hold_veracity_below_floor", "hold_severity_unknown"}

\* A trusted ACR with no barrier worse than S1 is approved at every exposure.
TrustedApproves == AtFaceValue /\ ~answersOpen /\ Severity0 \in {"S0", "S1"} => out = "approve"

\* An approval that rests on the vendor's denials rests on confirmed evidence.
ApproveNeedsConfirmed == out = "approve" => Confirmed

\* At medium and high exposure, no approval rests on an ACR below face value, or on nothing.
NoApproveOnWeakEvidence == level /= "low" /\ EvLevel \in {"E0", "E1-", "E1"} => out /= "approve"

\* An unknown severity is never confirmed.
UnknownNeverConfirmed == Unknown => ~Confirmed

\* The fallback re-rates to S3 only when the evidence cannot be raised.
FallbackOnlyWhenUnavailable == sev1 /= Severity0 => Unavail /\ sev1 = "S3"

\* An approval without a TAAP is S0 or S1, or S2 at low exposure.
ApproveSeverity == out = "approve" => sev1 \in {"S0", "S1"} \/ (sev1 = "S2" /\ level = "low")

\* At high exposure the TAAP is written only on confirmed evidence or under the fallback.
HighTaapOnConfirmed ==
  level = "high" /\ out \in {"hold_taap_needed", "approve_with_taap", "approve_with_taap_exception",
                             "deny_taap_below_standard", "deny_no_alternative", "hold_exception_claimed"}
  => Confirmed \/ Fallback

\* The step a hold names is a step the analyst can take in that state.
HoldOffersStep ==
  out = "hold_veracity_below_floor" =>
    /\ (RaiseBy = "spot_check" => Clean /\ ~Trusted /\ spot = "none")
    /\ (RaiseBy = "review_failed_check" => HasAcr /\ ~Clean)
    /\ (RaiseBy = "review_contradicted" => spot = "contradicts")
    /\ (RaiseBy = "vendor_evidence" => ev = "E0")
    /\ ~Confirmed

Hold1 == out = "hold_severity_unknown" => ev = "E0" /\ findings = "none" /\ RaiseBy = "vendor_evidence"

\* A TAAP approval meets the standard, or carries a written determination on a plan that
\* meets some requirements.
TaapStandard == out = "approve_with_taap" => taapOnFile /\ met >= Std
ExceptionBasis == out = "approve_with_taap_exception" => exception = "determined" /\ met > 0 /\ met < Std
DenyBasis == out \in {"deny_no_alternative", "deny_taap_below_standard"} => taapOnFile

\* An agreeing spot check clears every floor.
SpotCheckClearsFloor == EvLevel = "E3a" => Confirmed

-----------------------------------------------------------------------------
\* Action properties. Each says what a step achieves.

\* On hold 3 with the spot check offered, an agreeing spot check confirms the evidence.
AgreementConfirms ==
  [][ (out = "hold_veracity_below_floor" /\ RaiseBy = "spot_check" /\ RecordSpotCheck("agrees"))
      => conf' /\ out' /= "hold_veracity_below_floor" ]_vars

\* On hold 3 with a corrected ACR offered, a corrected ACR taken at face value confirms it.
CorrectedTrustedConfirms ==
  [][ (out = "hold_veracity_below_floor" /\ RaiseBy = "review_failed_check" /\ VendorCorrectsAcr /\ AtFaceValue')
      => conf' ]_vars

\* On hold 3 with a report defect, an accepted ACR taken at face value confirms the evidence.
AcceptedTrustedConfirms ==
  [][ (out = "hold_veracity_below_floor" /\ RaiseBy = "review_failed_check" /\ AcceptAcr /\ AtFaceValue')
      => conf' ]_vars

\* A demonstration, an audit or the full manual review confirms the evidence at every exposure.
DirectConfirms == [][ (\E e \in Direct : RecordDirect(e)) => conf' ]_vars

\* A contradiction drops the ACR to E1- and records at least one barrier.
ContradictionRecorded ==
  [][ RecordSpotCheck("contradicts") => lvl' = "E1-" /\ SevNum(sev') >= 1 /\ findings' = "some" ]_vars

\* Stronger evidence with the same findings never changes a decision already reached,
\* unless the decision stood on the fallback.
StrongerEvidenceKeepsDecision ==
  [][ (\E e \in Direct : RecordDirect(e)) /\ UNCHANGED <<findings, sev, breadth>> /\ Terminal /\ ~Fallback
      => out' = out ]_vars

\* The evidence rank never falls, except by a contradiction.
RankMonotone == [][ ~RecordSpotCheck("contradicts") => EvRank(lvl') >= EvRank(lvl) ]_vars
====
