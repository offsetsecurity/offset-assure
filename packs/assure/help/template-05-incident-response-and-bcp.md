# Incident Response and Business Continuity Plan

> A starting point, not a finished document. Download the Word version from **Policies** → **Templates**, replace every highlighted `<placeholder>` with your own text, have it approved, then record it in **Policies** with its owner and review date.

Who does what when something goes wrong, and how the organisation keeps running.

| Field | Value |
|---|---|
| Document ID | POL-05 |
| Owner | <role title> |
| Approver | <role title> |
| Classification | Internal |

## 1. Purpose

This plan says how <Company name> responds to information security incidents and how it keeps working through a serious disruption. It has to work under pressure, so every step is short and has a named owner.

*Guidance: Print it, or keep a copy somewhere that does not depend on your own systems. A plan you cannot open during an outage does not help.*

## 2. What counts as an incident

An incident is any event that harms, or could harm, the confidentiality, integrity or availability of information. Examples: a lost laptop, a phishing email that was clicked, ransomware, information sent to the wrong person, a supplier breach, or a system outage.

## 3. Roles

| Role | Who | Does |
|---|---|---|
| Incident manager | <name and role> | Leads the response, decides how serious it is, and keeps the log. |
| Technical lead | <name and role> | Contains the problem and recovers the systems. |
| Executive sponsor | <name and role> | Decides on telling regulators, customers and the public. |
| Communications | <name and role> | Handles messages to staff, customers and the press. |
| Deputy | <name and role> | Steps in if anyone above is not available. |

## 4. Responding to an incident

1. Report.Anyone reports it straight away to <contact, phone number or mailbox>.
2. Assess.The incident manager rates it within <4 working hours>: Low, Medium, High or Critical, and opens a log entry.
3. Contain.Stop it spreading: isolate affected systems and accounts. Keep evidence (logs, images, times) and do not delete anything.
4. Fix.Remove the cause, restore from a known good copy, and check that normal service is back.
5. Tell.Decide who must be told and by when: leadership, customers, <regulator>, insurers, the police. Where personal data is involved, check the legal deadline (for example <72 hours>).
6. Learn.For every Medium incident or above, hold a review within <10 working days>. Turn what is learned into actions with owners and dates.

| Level | Meaning | Who is told |
|---|---|---|
| Critical | Major harm, or a legal duty to report | Executive sponsor at once |
| High | Serious harm to a service or to data | Incident manager and leadership the same day |
| Medium | Limited harm, contained | Incident manager |
| Low | No real harm, a near miss | Logged and reviewed |

## 5. Business continuity

The services below matter most. For each, the plan says how long it can be down and how much recent data can be lost.

| Service | Longest acceptable outage | Most data we can lose | Recovery steps in |
|---|---|---|---|
| <Critical service 1> | <hours> | <hours> | <document or runbook> |
| <Critical service 2> | <hours> | <hours> | <document or runbook> |
| <Critical service 3> | <hours> | <hours> | <document or runbook> |

- If the office is not available, people work from <home or the alternative site>. No critical service depends on one building.
- Backups can be restored to <the alternative location>.
- Key contacts (staff, suppliers, regulators) are kept in <where the contact list is kept>.

## 6. Testing and keeping it current

- The recovery steps are tested at least <once a year>, and the result and the fixes are recorded.
- This plan is reviewed after every Critical incident, after every test, and at least once a year.

## Where this comes from

| Reference | Requirement addressed |
|---|---|
| Annex A 5.24 | Incident management planning and preparation |
| Annex A 5.25 to 5.27 | Assessing, responding to and learning from incidents |
| Annex A 5.28 | Collection of evidence |
| Annex A 5.29 | Information security during disruption |
| Annex A 5.30 | ICT readiness for business continuity |
| Annex A 6.8 | Information security event reporting |
