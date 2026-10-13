# Mandatory documents and records

This page lists the documented information ISO/IEC 27001:2022 requires, and
the documents auditors expect on top of it. It keeps three lists apart,
because they are not equally binding:

1. **Required by the clauses.** Missing one is a nonconformity.
2. **Called for by the wording of an Annex A control.** Required once you
   include that control in your Statement of Applicability.
3. **Usually asked for.** Not named anywhere as mandatory, but the simplest way
   to prove a control works, and auditors ask for them routinely.

Part of [the audit-ready handbook](iso-01-certification.md). Previous:
[Annex A.8](iso-12-annex-a-8.md). Next: [Getting audit-ready](iso-14-audit-ready.md).

## Documents and records: the difference

- A **document** says what you intend to do: a policy, a method, a plan. It is
  versioned, approved and reviewed.
- A **record** shows what you did: a training log, an audit report, meeting
  minutes. It is not edited after the fact; it is kept, protected and
  eventually disposed of.

The standard uses one term, **documented information**, for both, so this
page says which kind each item is. The difference matters in practice: you
update a document, but you never rewrite a record.

## 1. Required by clauses 4 to 10

| # | What | Kind | Clause | In Assure |
|---|---|---|---|---|
| 1 | Scope of the ISMS | Document | 4.3 | **ISMS** → ISMS scope |
| 2 | Information security policy | Document | 5.2 | **Policies** |
| 3 | Risk assessment process (your method) | Document | 6.1.2 | **ISMS** → Risk assessment method |
| 4 | Risk treatment process | Document | 6.1.3 | **Policies**, or with the method in **ISMS** |
| 5 | Statement of Applicability | Document | 6.1.3 d | **Applicability**, and its report in **Reports** |
| 6 | Information security objectives | Document | 6.2 | **Objectives** |
| 7 | Evidence of competence | Record | 7.2 | **Training**, **Evidence** |
| 8 | Documented information you decided the ISMS needs | Either | 7.5.1 b | **Policies**, **Evidence** |
| 9 | Evidence that processes ran as planned | Record | 8.1 | **Evidence**, **Testing** |
| 10 | Results of risk assessments | Record | 8.2 | **Risks**, and the **Risk register** report |
| 11 | Results of risk treatment | Record | 8.3 | **Risks**, **Tasks** |
| 12 | Monitoring and measurement results | Record | 9.1 | **Dashboard**, **Objectives**, **Reports** |
| 13 | Internal audit programme, and evidence it was carried out | Record | 9.2.2 | **Audits & reviews** |
| 14 | Internal audit results | Record | 9.2.2 | **Audits & reviews**, **Findings** |
| 15 | Management review results | Record | 9.3.3 | **Audits & reviews**, and the **Management review pack** |
| 16 | Nonconformities and the actions taken | Record | 10.2 | **Findings** |
| 17 | Results of corrective actions | Record | 10.2 | **Findings** |

### About the risk treatment plan

Clause 6.1.3 requires you to write a risk treatment plan and have risk owners
approve it, and clause 8.3 requires you to keep the results. The plan itself is
not separately named as documented information, but you cannot show it was
approved, or show its results, without writing it down. Treat it as required.

### Not required as documents, but tested

These clauses need no document by name, yet the auditor will test them. Records
make them easy to prove.

| Clause | What is tested | Easiest proof |
|---|---|---|
| 4.1 | Your internal and external issues, and your climate change decision | A short context document |
| 4.2 | Interested parties and their requirements | The **Interested parties** register |
| 5.1 | Top management leadership | Management review minutes, policy approval |
| 5.3 | Named roles and responsibilities | A roles document, or owners in Assure |
| 7.3 | Staff awareness | Training records, policy acknowledgements |
| 7.4 | Communication | The **Communications** register |
| 9.1 | What you measure, and how | A short measurement plan |

## 2. Called for by the wording of an Annex A control

Annex A controls are written as "should", not "shall". They become requirements
through clause 6.1.3: once a control is in your Statement of Applicability, the
auditor expects it to be implemented as described. For the controls below, the
description itself calls for something written down, defined, or signed.

| Control | What it calls for |
|---|---|
| A.5.1 Policies for information security | A security policy and topic-specific policies, approved by management, published, communicated to and acknowledged by the people they apply to, and reviewed |
| A.5.9 Inventory of information and other associated assets | An inventory of assets, with owners |
| A.5.10 Acceptable use of information and other associated assets | Documented rules for acceptable use, and procedures for handling information |
| A.5.31 Legal, statutory, regulatory and contractual requirements | A documented list of the legal, regulatory and contractual requirements that apply, and how you meet them |
| A.5.37 Documented operating procedures | Documented operating procedures for your information processing facilities |
| A.6.6 Confidentiality or non-disclosure agreements | Documented confidentiality agreements, signed and regularly reviewed |
| A.8.9 Configuration management | Documented configurations, including security configurations |
| A.8.27 Secure system architecture and engineering principles | Documented principles for engineering secure systems |

## 3. Usually asked for

Not named as mandatory anywhere. An auditor will still ask for most of these
if the related control is in your Statement of Applicability, because a
document plus records is the plainest way to show a control operating.

### Topic-specific policies

ISO/IEC 27002 gives examples of topics that often have their own policy. Write
the ones your risks call for. Several can live in one document.

- Access control (A.5.15 to A.5.18, A.8.2, A.8.3, A.8.5)
- Information classification and handling (A.5.12 to A.5.14)
- Supplier security (A.5.19 to A.5.23)
- Incident management (A.5.24 to A.5.28)
- Backup (A.8.13)
- Cryptography and key management (A.8.24)
- Secure development (A.8.25 to A.8.29), if you build software
- Management of technical vulnerabilities (A.8.8)
- Endpoint devices and remote working (A.8.1, A.6.7)
- Network security (A.8.20 to A.8.22)

### Plans and procedures

| What | Controls |
|---|---|
| Incident response plan | A.5.24 to A.5.28 |
| Business continuity and ICT readiness plan, with test results | A.5.29, A.5.30 |
| Change management procedure | A.8.32 |
| Joiner, mover and leaver procedure | A.5.16, A.5.18, A.6.5 |
| Disciplinary process, communicated to staff | A.6.4 |
| Contact list for authorities | A.5.5 |

### Records auditors sample

| Record | Controls |
|---|---|
| Access reviews | A.5.18, A.8.2 |
| Screening checks for new staff | A.6.1 |
| Signed employment terms | A.6.2 |
| Training records | A.6.3 |
| Returned equipment for leavers | A.5.11 |
| Supplier assessments and contracts | A.5.19 to A.5.22 |
| Incident records, with lessons learned | A.5.24 to A.5.27 |
| Vulnerability scans and patch records | A.8.8 |
| Backup logs and restore tests | A.8.13 |
| Logs, and evidence someone reviews them | A.8.15, A.8.16 |
| Change tickets | A.8.32 |
| Secure disposal certificates | A.7.14 |

## The templates that ship with Assure

Eight starting documents are in **Policies** → **Templates**, as Word files. You
can also read each one here, under Policy templates. None is finished: each
needs your details, your approval and a review date before it counts.

| Template | Mostly supports |
|---|---|
| [ISMS document set (00 to 13)](template-08-isms-document-set.md) | 7.5, document control |
| [Context of the organisation](template-07-context-of-the-organisation-clause4.md) | 4.1, 4.2, 4.3 |
| [Master information security policy](template-01-master-information-security-policy.md) | 5.2, A.5.1 |
| [Acceptable use policy](template-02-acceptable-use-policy.md) | A.5.10 |
| [HR security handbook](template-03-employee-handbook-hr-security.md) | A.6.1 to A.6.6 |
| [IT and security operations manual](template-04-it-security-operations-manual.md) | A.5.37, and technical controls in A.8 |
| [Incident response and business continuity plan](template-05-incident-response-and-bcp.md) | A.5.24 to A.5.30 |
| [Vendor and supplier management policy](template-06-vendor-supplier-management-policy.md) | A.5.19 to A.5.23 |

The templates do not replace the records, and they do not cover your risk
assessment method, Statement of Applicability, objectives, internal audit or
management review. Those come from using Assure.

## Keeping it under control

Every document in lists 1 to 3 needs an owner, a version, an approval, and a
review date, and every record needs a date and a safe place to live (clause
7.5). In Assure, record documents in **Policies** and records in **Evidence**,
and export the **Document control list** before each audit to check nothing is
out of date.
