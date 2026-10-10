# Clause 6: Planning

Clause 6 is the core of ISO 27001. It is where you decide what could go wrong,
how bad it would be, and what you will do about it. The Statement of
Applicability, the document auditors ask for first, comes out of this clause.

Part of [the audit-ready handbook](iso-01-certification.md). Previous:
[Clause 5](iso-03-clause-5.md). Next: [Clause 7](iso-05-clause-7.md).

## 6.1.1 Actions to address risks and opportunities: general

**What it asks.** When you plan the ISMS, look at the issues from 4.1 and the
requirements from 4.2, and decide which risks and opportunities you need to
deal with so that the ISMS:

- achieves what it is meant to,
- prevents or reduces things going wrong,
- keeps improving.

Then plan how you will deal with them, build that into the ISMS, and check
whether it worked.

**What it means.** These are risks and opportunities **to the ISMS itself**, as
well as to information. Examples: the one person who runs the ISMS leaves; the
budget is cut; a new customer requirement arrives; a new tool could automate
evidence collection.

**In Assure.** Record them in **Risks** alongside information security risks,
and turn the actions into **Tasks**.

## 6.1.2 Information security risk assessment

**What it asks.** Define a risk assessment process and apply it. The process
must:

1. **Set risk criteria**, including when a risk is acceptable and when an
   assessment must be done.
2. **Give consistent results**, so that assessing the same risk twice, or by
   two people, gives comparable answers.
3. **Identify risks**: the ways confidentiality, integrity and availability of
   information in scope could be lost, and a **risk owner** for each one.
4. **Analyse risks**: the consequences if the risk happens, how likely it
   realistically is, and the resulting level of risk.
5. **Evaluate risks**: compare each level with your criteria and put them in
   order for treatment.

**Required document.** Documented information about the risk assessment
process. This is your risk assessment method.

**Your method document should say:**

- the likelihood scale, with a definition for each point,
- the impact scale, with a definition for each point, covering money,
  customers, legal exposure and reputation,
- how the risk level is worked out,
- the level above which a risk must be treated, and who may accept a risk
  below it,
- who owns risks,
- how often you reassess, and what triggers an early reassessment.

**Your choice of method.** The standard does not prescribe one. Starting from
assets, or starting from threat scenarios, are both acceptable. ISO/IEC 27005
is the guidance standard for risk management if you want more detail.

**What the auditor looks for.** A method that is written down, and a risk
register that visibly follows it. Scores with no definitions behind them, or
risks with no owner, are common findings.

**In Assure.** Write the method in **ISMS** → Risk assessment method. There
is a suggested 5×5 method to start from. Assure scores likelihood and impact from 1 to 5 and multiplies
them. A score of 20 or more shows as critical, 12 to 19 as elevated, and below
12 as acceptable. If your method uses a different threshold, say so in the
method and apply it when you decide treatment.

## 6.1.3 Information security risk treatment

**What it asks.** Define a risk treatment process and apply it, to:

1. **Choose a treatment** for each risk.
2. **Decide every control needed** to carry out that treatment. The controls
   can come from anywhere.
3. **Compare your controls with Annex A**, to check you have not missed one you
   need.
4. **Produce a Statement of Applicability** that lists:
   - the controls you need,
   - why each one is included,
   - whether each one is implemented yet,
   - why any Annex A control is excluded.
5. **Write a risk treatment plan**.
6. **Get risk owners to approve the plan** and to accept the risk that remains.

**Required documents.** Documented information about the risk treatment
process, and the Statement of Applicability.

**Treatment options.**

| Option | What it means | In Assure |
|---|---|---|
| Modify the risk | Add or improve controls | Mitigate |
| Retain the risk | Accept it, knowingly, with a named person's approval | Accept |
| Share the risk | Move part of it to someone else, such as an insurer or a supplier | Transfer |
| Avoid the risk | Stop doing the thing that causes it | Avoid |

**Annex A is a checklist, not the limit.** If you need a control that is not in
Annex A, add it to your treatment plan anyway.

**What the auditor looks for.** They follow a thread: a high risk, its
treatment, the controls chosen, those controls in the Statement of
Applicability, and evidence that they operate. Two things often break the
thread:

- an Annex A control excluded without a reason, or excluded while a risk in
  the register depends on it,
- residual risk accepted by nobody in particular.

**In Assure.**

- **Applicability** is the Statement of Applicability. Record whether each
  control applies, the reason, and how far along it is. Give reasons for
  inclusions as well as exclusions.
- The **Statement of Applicability** report in **Reports** is the document you
  hand over. Have it approved.
- **Risks** holds the treatment, the residual score, and who accepted the
  remaining risk and when. A risk cannot be marked Accepted without a named
  person.
- **Tasks** linked to risks and controls are your risk treatment plan.

## 6.2 Information security objectives and planning to achieve them

**What it asks.** Set security objectives at the functions and levels where
they are needed. Objectives must:

- be consistent with the security policy,
- be measurable, where that is practical,
- take account of your security requirements and your risk results,
- be monitored,
- be communicated,
- be updated when things change,
- be available as documented information.

For each objective, plan what will be done, what resources it needs, who is
responsible, when it will be finished, and how you will judge the result.

**Required document.** Documented information on the security objectives.

**Examples of good objectives.**

- Every new starter completes security awareness training within 30 days of
  joining.
- 90% of critical vulnerabilities are fixed within 14 days of discovery.
- A restore from backup is tested every quarter, and succeeds.
- Every supplier with access to customer data is reviewed at least once a
  year.

"Improve security" is not an objective. It cannot be measured.

**In Assure.** **Objectives**: each with a target, an owner, a due date and a
status.

## 6.3 Planning of changes

**What it asks.** When the ISMS needs to change, the change is carried out in a
planned way. This clause was added in 2022.

**Documents.** Not named as mandatory. Show that changes to the ISMS, such as a
new scope, a new site, a new system or a restructured team, were planned and
their security impact considered.

**In Assure.** Record the change in **Tasks**, set its kind to **Change**, and
fill in what it means for security.

## Clause 6 checklist

- A written risk assessment method with defined scales and acceptance
  criteria.
- A risk register that follows the method, with an owner for every risk.
- A written risk treatment process.
- A Statement of Applicability covering all 93 Annex A controls, with reasons,
  approved.
- A risk treatment plan, approved by risk owners, with residual risk accepted
  by name.
- Measurable security objectives, each with an owner and a date.
- Planned changes to the ISMS recorded.
