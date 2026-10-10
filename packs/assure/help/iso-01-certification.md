# How ISO 27001 certification works

This handbook takes you through ISO/IEC 27001:2022 in the order an auditor
reads it: the clauses first, then Annex A, then the documents you must have,
then how to get ready for the audit itself. Each page says what the standard
asks, what to write down, what the auditor looks for, and where you do it in
Offset Assure.

The wording in this handbook is ours. It explains the standard; it is not the
standard's text. Buy a copy of ISO/IEC 27001:2022 from ISO or your national
standards body and keep it next to this. Where this handbook and the standard
differ, the standard wins.

## What a certificate says

A certificate says that your information security management system (ISMS)
meets ISO/IEC 27001, **inside the scope you defined**. The scope is printed on
the certificate. It does not say your organisation is secure. It says you run a
working system for managing security risk, and that an independent auditor
checked it.

ISO itself does not certify anybody. Certificates are issued by certification
bodies.

## The two halves of the standard

| Part | What it is | Can you leave any of it out? |
|---|---|---|
| Clauses 4 to 10 | The management system: scope, leadership, risk assessment, documents, audits, review, improvement | **No.** Every requirement in clauses 4 to 10 applies to every organisation that claims conformity. |
| Annex A | A reference list of 93 security controls | **Yes, with a reason.** Your risk assessment decides which controls you need. The Statement of Applicability records each decision and the reason for it. |

Clauses 1 to 3 are the scope of the standard, its references and its terms.
Nothing in them is audited.

## Which edition

- **ISO/IEC 27001:2022** is the current edition. Certificates to the 2013
  edition stopped being valid on 31 October 2025, at the end of the transition
  period.
- **Amendment 1 (2024)** added climate change to clauses 4.1 and 4.2. Auditors
  now check that you decided whether climate change is relevant to you. See
  [Clause 4](iso-02-clause-4.md).
- **ISO/IEC 27002:2022** is the companion guide. It explains how to implement
  each Annex A control, and it holds the control attributes (control type,
  security properties and so on). You are not certified against 27002, but it is
  the best help there is for Annex A.

## Choosing a certification body

Choose an **accredited** certification body. Accreditation means a national
accreditation body has checked that the certification body itself works
properly. In the UK that is UKAS, in the US it is ANAB, and most countries
have their own. Ask to see the accreditation, and check that it covers ISO/IEC
27001.

Certificates from unaccredited bodies exist and are cheaper. Many customers
and regulators do not accept them. Check with the customers who asked you for
the certificate before you choose.

## The three-year cycle

| Step | When | What happens |
|---|---|---|
| Stage 1 | Start | The auditor reviews your documents and decides whether you are ready for Stage 2. Weaknesses found here are raised as areas of concern that could become nonconformities at Stage 2. |
| Stage 2 | Usually a few weeks after Stage 1 | The auditor checks that the ISMS is actually working: interviews people, samples records, and looks at controls in operation. |
| Certification decision | After Stage 2 | The certification body decides, not the auditor on the day. Major nonconformities must be fixed and verified first. |
| Surveillance audit | At least once every calendar year | A shorter audit of part of the ISMS. The first one is due within 12 months of the certification decision. |
| Recertification audit | Before the certificate expires in year 3 | A full audit again, to renew for another three years. |

## What the auditor can find

| Finding | What it means | What you must do |
|---|---|---|
| Major nonconformity | A requirement is not met at all, or a failure puts the ISMS's ability to achieve its outcomes in doubt | Fix it, and have the fix verified, before the certificate is issued or kept |
| Minor nonconformity | A requirement is partly met, or there is a one-off lapse | Agree a corrective action plan with the certification body, and show it done at the next audit |
| Opportunity for improvement, or observation | Not a failure; advice | Nothing is required, but the auditor will ask next time what you did with it |

Record every finding in **Findings**, with its type. [Clause 10](iso-08-clause-10.md)
explains how to close one properly.

## How long it takes

The standard sets no timetable. Organisations starting from little often take
four to nine months to reach Stage 2. The time goes on writing things down,
getting them approved, and then running the system long enough to have
records.

The records matter. Stage 2 is a check that the system is **working**, so the
auditor needs to see it working: risks assessed, controls operating, incidents
handled, at least one internal audit completed and at least one management
review held. Stage 1 checks that the internal audit and management review are
planned and under way. Book Stage 2 for after both are done.

## How many audit days

The certification body works out the number of audit days from a table in
ISO/IEC 27006, mainly from the number of people working inside your scope,
then adjusts it for how complex your organisation is. More sites, more people
and more technology mean more days. Ask for the calculation in the quote.

## What the auditor is really asking

Every question in an audit comes back to three:

1. **Is it written down?** The clauses require certain documents and records.
   [Mandatory documents](iso-13-mandatory-documents.md) lists every one.
2. **Is it done?** Records show that what you wrote is what happens.
3. **Does it work?** Measurement, internal audit and management review show
   that you check the system and fix what is wrong.

A document with no records behind it fails the second question. Records with
no review behind them fail the third.

## Reading this handbook

1. [Clause 4: Context](iso-02-clause-4.md)
2. [Clause 5: Leadership](iso-03-clause-5.md)
3. [Clause 6: Planning](iso-04-clause-6.md)
4. [Clause 7: Support](iso-05-clause-7.md)
5. [Clause 8: Operation](iso-06-clause-8.md)
6. [Clause 9: Performance evaluation](iso-07-clause-9.md)
7. [Clause 10: Improvement](iso-08-clause-10.md)
8. [Annex A.5: Organisational controls](iso-09-annex-a-5.md)
9. [Annex A.6: People controls](iso-10-annex-a-6.md)
10. [Annex A.7: Physical controls](iso-11-annex-a-7.md)
11. [Annex A.8: Technological controls](iso-12-annex-a-8.md)
12. [Mandatory documents](iso-13-mandatory-documents.md)
13. [Getting audit-ready](iso-14-audit-ready.md)

## In Offset Assure

- **Get ready** walks the same ground as this handbook, one step at a time,
  and tracks how far you have got.
- Give your auditor an **Auditor** account in **Users**. They can read
  everything and change nothing, and they can look up evidence themselves
  instead of sending you document requests.
