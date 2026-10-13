# Getting audit-ready

The last page of the handbook: a checklist to work through before you book the
audit, what the auditor will sample, the findings organisations most often get,
and what happens on the day.

Part of [the audit-ready handbook](iso-01-certification.md). Previous:
[Mandatory documents](iso-13-mandatory-documents.md).

## The readiness checklist

Work through this in order. Everything before "Checking it" should be true
before Stage 1; everything should be true before Stage 2.

### Foundations

- The scope is written, with boundaries, dependencies and exclusions explained.
- Internal and external issues are written down, including your decision on
  climate change.
- Interested parties and their requirements are recorded.
- The information security policy is approved by top management and in date.
- A named person is responsible for the ISMS, and for reporting on it to top
  management.
- Legal, regulatory and contractual requirements are listed.

### Risk and the Statement of Applicability

- The risk assessment method is written, with defined scales and acceptance
  criteria.
- Every risk has an owner, a score, a treatment and a review date.
- The Statement of Applicability covers all 93 Annex A controls, each with a
  reason, and is approved.
- No excluded control is one that a risk depends on.
- The risk treatment plan is approved by risk owners, and residual risk is
  accepted by name.
- Security objectives are measurable, with owners and dates.

### Doing it

- Topic-specific policies exist for the controls you apply, approved and in
  date.
- Staff have received the policies, and acknowledgements are recorded.
- Awareness training is complete for everyone in scope, and recorded.
- Evidence of competence is on file for people in security roles.
- Every applied control has an owner and current evidence attached.
- Records show controls operating over time, not only this week.
- Suppliers that handle your information are assessed, and their contracts
  include security terms.
- Incidents are logged, handled and reviewed for lessons.
- Changes to the ISMS and to systems are planned and recorded.

### Checking it

- You have decided what to measure, and you have results.
- An internal audit programme exists and covers the whole ISMS.
- At least one internal audit is complete, by someone independent of what they
  audited, with a report.
- At least one management review is complete, attended by top management,
  covering every required input, with decisions recorded.
- Every finding has a root cause, a corrective action, an owner and a date.
- The document control list shows nothing past its review date.

**In Assure.** **Get ready** tracks most of this list for you. The **Gap
report** and **Gap analysis** show what is still missing, and the **Readiness
plan** report turns it into a dated list of work.

## What the auditor will sample at Stage 2

The auditor cannot check everything, so they sample. Expect to be asked to
show, for a few examples each:

| They pick | They ask to see |
|---|---|
| A recent joiner | Screening, signed terms, training, access approved for their role |
| A recent leaver | Access removed on time, equipment returned |
| A privileged account | Who approved it, and when it was last reviewed |
| A high risk | Its treatment, the controls, and evidence the controls work |
| An excluded control | The reason, and that no risk depends on it |
| A policy | Approval, review date, and proof staff received it |
| An incident | How it was handled, who was told, and what was learned |
| A supplier | Its risk assessment, contract security terms and last review |
| A production change | Approval, testing, and rollback plan |
| A critical vulnerability | When it was found, and when it was fixed |
| Backups | The last successful restore test |
| An internal audit finding | Root cause, action, and proof the action worked |

They will also interview people: top management, the ISMS manager, the owners
of the controls they sample, and ordinary staff about awareness.

## The findings organisations most often get

- **The risk assessment is out of date**, or does not follow the written
  method.
- **The Statement of Applicability contradicts the risk register**: a control
  is excluded while a risk relies on it, or a control is marked implemented
  with no evidence.
- **Policies are past their review date**, or were never approved.
- **No proof staff received the policies**, or completed training.
- **The internal audit was done by the person who built the ISMS**, so it was
  not independent.
- **The management review missed required inputs**, or top management did not
  attend.
- **Corrective actions fixed the symptom but not the cause.**
- **Leavers kept access** past their last day.
- **Suppliers were never assessed**, especially cloud providers.
- **Access reviews were planned but not done.**
- **Restore tests were never performed**, so backups were never shown to work.
- **Objectives cannot be measured**, or nobody tracks them.

Every item on this list is something you can check yourself before the auditor
does. Use it as the scope of your internal audit.

## Preparing people for interviews

- Make sure top management can explain, in their own words, what the ISMS is
  for, what the main risks are, and what they decided at the last management
  review.
- Make sure every control owner knows which controls they own and where the
  evidence is.
- Remind staff where the security policy is and how to report an incident.
- Tell people it is fine to say "I don't know, but I know where to find out"
  and then show the auditor where. Guessing is worse.

## On the day

1. **Opening meeting.** The auditor confirms the scope, the plan, and who they
   need to see.
2. **Audit.** Interviews, document review, sampling of records, and sometimes a
   walk round the site or a screen share of systems.
3. **Daily wrap-up.** Many auditors summarise what they have found at the end
   of each day. Ask if they do not.
4. **Closing meeting.** The auditor presents the findings and their grade. Ask
   questions now if you do not understand a finding; this is the time to
   clarify, not to argue.

**Tips.**

- Have one person act as guide, who can find any document quickly.
- Answer the question asked. Do not volunteer extra material.
- If a record is missing, say so. Do not create one on the spot.
- Keep a list of everything the auditor asked for and was shown.

**In Assure.** Give the auditor an **Auditor** account in **Users** before the
audit, so they can look up evidence themselves. Export the **Statement of
Applicability**, **Risk register**, **Evidence register** and **Document
control list** from **Reports** beforehand in case they want copies.

## After the audit

- Record every finding in **Findings**, with its type and source.
- Send the certification body your corrective action plan by their deadline.
  Major nonconformities must be fixed and verified before the certificate is
  issued.
- Once certified, plan the year so surveillance audits hold no surprises.

### A yearly cycle

| When | What |
|---|---|
| Every month | Check **Calendar** for reviews and evidence falling due; work through open **Tasks** and **Findings** |
| Every quarter | Access reviews; restore test; review measures and objectives; refresh ageing evidence |
| Twice a year | Review the risk register; review suppliers that handle sensitive information |
| Every year | Awareness training for everyone; review every policy; internal audit; management review; review scope and context |
| Before each surveillance audit | Run through the readiness checklist above |
