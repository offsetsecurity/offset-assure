# Clause 4: Context of the organisation

Clause 4 draws the boundary around everything else. Your risk assessment, your
Statement of Applicability and the audit itself all happen inside the scope you
set here. If the scope is vague, every later answer is vague too.

Part of [the audit-ready handbook](iso-01-certification.md). Next:
[Clause 5](iso-03-clause-5.md).

## 4.1 Understanding the organisation and its context

**What it asks.** Work out the internal and external issues that matter to
your purpose and that affect whether the ISMS can achieve what it is for.

**Climate change.** Since Amendment 1 (2024), you must also decide whether
climate change is a relevant issue for you. For most organisations it is
relevant through physical risk: floods, heat or power failures hitting your
offices, your data centre or a key supplier. Some also face customer or
regulator expectations about it. If you decide it is not relevant, write down
why. The auditor will ask either way.

**Examples of issues.**

| External | Internal |
|---|---|
| Laws and regulators you answer to | Size, structure and how decisions are made |
| What customers demand in contracts | Culture and attitude to security |
| Your market and competitors | Technology, and how old it is |
| The threats aimed at your sector | Skills you have, and skills you lack |
| Dependence on cloud providers and other suppliers | Strategy and planned changes |
| Economic and political conditions | Past incidents and audit results |
| Climate and physical conditions | Money and people available for security |

**Documents.** The standard does not name a document for 4.1. But the auditor
will ask how you decided on your issues, and a short written context document
is the simplest answer. Keep it to two or three pages.

**What the auditor looks for.** Issues that are specific to you, not a generic
list. And a thread from each issue to what you did about it: an issue that
never appears in the risk register, the scope or the objectives is a question
waiting to be asked.

**In Assure.** List the issues in **ISMS** → Context of the organisation.
**Insert starter issues** gives you a list for your industry to edit down. If
you also want a written document, start from the **Context of the organisation**
template in **Policies** → **Templates**. Where an issue creates a risk, add it
in **Risks**.

## 4.2 Understanding the needs and expectations of interested parties

**What it asks.** Three things:

1. Who the interested parties relevant to the ISMS are.
2. What they require of you that is relevant to information security.
3. Which of those requirements you will address through the ISMS. This third
   point was added in 2022.

Their requirements can include laws, regulations and contract terms. Amendment
1 (2024) adds a note that interested parties can have requirements about
climate change.

**Examples.**

| Interested party | What they typically require |
|---|---|
| Customers | Security clauses in contracts, a certificate, breach notification within a set time |
| Regulators | Data protection law, sector rules, incident reporting |
| Staff | A safe place to work, fair treatment, protection of their own personal data |
| Suppliers | Clear requirements, secure access to your systems |
| Owners, investors, the board | Protection of the business and its reputation |
| Insurers | Minimum controls as a condition of cyber cover |

**Documents.** Not named as mandatory, but keep a register. It is the input to
your legal and contractual requirements (Annex A control 5.31) and to your
management review.

**What the auditor looks for.** They pick one party and follow it through: a
customer contract requires encryption at rest, so which control covers it, and
where is the evidence?

**In Assure.** **Interested parties**: one row per party, what they require, and
whether the ISMS addresses it.

## 4.3 Determining the scope of the ISMS

**What it asks.** Decide the boundaries of the ISMS and what it applies to.
When you do, take account of:

- the issues from 4.1,
- the requirements from 4.2,
- the interfaces and dependencies between what you do and what other
  organisations do for you.

**Required document.** The scope must be available as documented information.

**A good scope says:**

- which legal entity or part of the organisation,
- which products and services,
- which locations, including remote working,
- which information, systems and people,
- what depends on other organisations (cloud hosting, outsourced IT), and how
  those dependencies are handled,
- what is deliberately left out, and why.

Leaving a site or a business unit out of scope is allowed if the reason is
sound and the scope does not mislead. Leaving out any requirement of clauses 4
to 10 is not allowed.

**Common problems.**

- A scope so vague it cannot be tested, such as "all IT".
- A scope that leaves out the service your customers actually buy.
- A scope that treats a cloud provider as out of scope instead of as a
  supplier you manage. The provider is outside your boundary, but managing it
  is inside: see Annex A controls 5.19 to 5.23.

**In Assure.** Write the scope in **ISMS** → ISMS scope. The same text is
shown at the top of **Applicability**.

## 4.4 Information security management system

**What it asks.** Establish, implement, maintain and continually improve an
ISMS, including the processes it needs and how they interact. The part about
processes and their interactions was added in 2022.

**What it means.** This is the clause the rest of the standard fulfils. The
auditor may ask you to describe your ISMS processes and how they connect: how
a new risk leads to a control, how an audit finding leads to a change. A short
process description or diagram answers this well. It is not a mandatory
document.

**In Assure.** Each screen is one of those processes, and **Get ready** shows
the order they fit together in.

## Clause 4 checklist

- A written context document naming your internal and external issues.
- A decision on climate change, with the reason.
- An interested parties register, with requirements and whether each is
  addressed.
- A written scope, with boundaries, dependencies and exclusions explained.
- A description of your ISMS processes.
