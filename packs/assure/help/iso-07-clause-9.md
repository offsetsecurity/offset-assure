# Clause 9: Performance evaluation

Clause 9 is how the ISMS checks itself: measuring, auditing, and top management
reviewing the results. The internal audit and the management review are both
mandatory, and certification bodies expect at least one of each to be complete
before Stage 2.

Part of [the audit-ready handbook](iso-01-certification.md). Previous:
[Clause 8](iso-06-clause-8.md). Next: [Clause 10](iso-08-clause-10.md).

## 9.1 Monitoring, measurement, analysis and evaluation

**What it asks.** Decide:

- what to monitor and measure, including security processes and controls,
- the methods, so that results are valid, comparable and repeatable,
- when to monitor and measure,
- who does it,
- when the results are analysed and evaluated,
- who analyses and evaluates them.

Then evaluate how well security is performing and how effective the ISMS is.

**Required record.** Evidence of the results.

**Examples of measures.**

| Measure | What it tells you |
|---|---|
| Percentage of staff who completed awareness training | Whether 7.3 is being met |
| Time to fix critical vulnerabilities | Whether patching works |
| Number of incidents, and time to contain them | Whether incident response works |
| Access reviews completed on time | Whether access control operates |
| Restore tests passed | Whether backups can actually be used |
| Objectives met, at risk or missed | Whether 6.2 is being delivered |
| Findings open, and how old they are | Whether improvement is happening |

Measure what tells you something. Ten measures you act on are better than fifty
you file.

**What the auditor looks for.** A written decision on what you measure, results
over time, and evidence that someone looked at the results and did something.

**In Assure.** The **Dashboard** shows control status and evidence freshness.
**Objectives** tracks objective status. **Testing** records control tests. The
**Gap report**, **Executive summary** and **Management review pack** in
**Reports** capture results at a point in time.

## 9.2 Internal audit

### 9.2.1 General

**What it asks.** Carry out internal audits at planned intervals, to find out
whether the ISMS:

- meets your own requirements for it,
- meets ISO/IEC 27001,
- is effectively implemented and maintained.

### 9.2.2 Internal audit programme

**What it asks.**

- Plan an audit programme: how often, which methods, who is responsible, how
  audits are planned and how results are reported.
- Base the programme on how important each process is and on the results of
  earlier audits.
- For each audit, define the criteria and the scope.
- Choose auditors who are objective and impartial.
- Report the results to the relevant managers.

**Required records.** Evidence that the audit programme was carried out, and
the audit results.

**Practical rules.**

- Cover the whole ISMS, clauses 4 to 10 and every Annex A control you apply,
  over the three-year certificate cycle. Many organisations audit all clauses
  every year and a third of the controls each year.
- **Auditors must not audit their own work.** In a small organisation, where
  everyone built part of the ISMS, use an outside internal auditor, or have two
  people audit each other's areas.
- An internal audit report should say what was audited, against what, what
  was sampled, what was found, and who it was reported to.
- Every problem found becomes a finding, handled under [Clause 10](iso-08-clause-10.md).

**What the auditor looks for.** A programme with dates, audits actually done to
it, auditors who were independent of what they audited, and findings that were
followed up.

**In Assure.**

- **Audits & reviews**: add each audit with kind **Internal audit**, with its
  planned date, scope and auditor. The list of planned audits is your audit
  programme.
- **Findings**: every problem the audit found, with its type.
- Give an outside internal auditor an **Auditor** account in **Users**.

## 9.3 Management review

### 9.3.1 General

**What it asks.** Top management reviews the ISMS at planned intervals, to make
sure it is still suitable, adequate and effective.

### 9.3.2 Management review inputs

The review must consider:

1. the status of actions from earlier management reviews,
2. changes in internal and external issues relevant to the ISMS,
3. changes in the needs and expectations of interested parties relevant to the
   ISMS (added in 2022),
4. feedback on security performance, including trends in:
   - nonconformities and corrective actions,
   - monitoring and measurement results,
   - audit results,
   - whether security objectives are being met,
5. feedback from interested parties,
6. the results of risk assessment and the status of the risk treatment plan,
7. opportunities for continual improvement.

### 9.3.3 Management review results

The results must include decisions about improvement opportunities and any
changes needed to the ISMS.

**Required record.** Evidence of the results of management reviews.

**Practical rules.**

- Hold it at least once a year, and before Stage 2.
- Top management must actually attend. A review held by the security team
  alone is not a management review.
- Minute it against the seven inputs above, so the auditor can see each one
  was covered.
- Record decisions and actions, with owners and dates. A review with no
  decisions is hard to defend.

**In Assure.**

- Export the **Management review pack** from **Reports**. It gathers most of
  the inputs in one document.
- Add the meeting in **Audits & reviews** with kind **Management review**, and
  record the decisions.
- Turn each action into a **Task** with an owner and a date.

## Clause 9 checklist

- A written list of what you measure, how, when and by whom.
- Measurement results over time, and evidence they were reviewed.
- An internal audit programme covering the whole ISMS.
- At least one completed internal audit, by someone independent of the area
  audited, with a report.
- At least one management review, attended by top management, covering all
  the required inputs, with decisions recorded.
