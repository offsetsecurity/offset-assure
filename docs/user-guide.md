# Using Offset

For the people who use it day to day. If you are installing it, read
[INSTALL.md](../INSTALL.md) instead.

You do not need to read this end to end. Find what you are trying to do.

| I want to | Go to |
|---|---|
| Understand what this is for | [What it does](#what-it-does) |
| Sign in the first time | [Getting in](#getting-in) |
| Know what the front page is telling me | [Dashboard](#dashboard) |
| Be told what to do next | [Get ready](#get-ready) |
| Check every risk is treated, and the proof is current | [Golden thread](#golden-thread) |
| Get ready for ISO 27001 certification | [Get ready for ISO 27001](#get-ready-for-iso-27001) |
| Record what we have and have not done | [Controls](#controls) |
| Say which ISO 27001 controls apply, and why | [Statement of Applicability](#statement-of-applicability) |
| Attach proof to a control | [Evidence on a control](#evidence-on-a-control) |
| Set deadlines and chase people | [Due dates and reminders](#due-dates-and-reminders) |
| Attach proof | [Evidence](#evidence) |
| Track risks | [Risks](#risks) |
| Plan a change safely | [Tasks](#the-other-registers) |
| Start a register from ready-made examples | [Sample library](#sample-library) |
| Start a policy from a ready-made document | [Document templates](#document-templates) |
| Keep the ISO 27001 records: suppliers, training, objectives, interested parties, audits | [The management-system registers](#the-management-system-registers) |
| See everything that is due | [Calendar](#calendar) |
| See what is left to do | [Gap analysis](#gap-analysis) |
| Read the guides inside the product | [Help and Documentation](#help-and-documentation) |
| Get data in or out as a spreadsheet | [Spreadsheets](#spreadsheets) |
| Try it with example data | [Example data](#example-data) |
| Produce something for an auditor | [Reports](#reports) |
| Add a colleague | [Users](#users) |
| See who changed what, or give an auditor the record | [Audit trail](#audit-trail) |
| Take or restore a backup | [Backups](#backups) |
| Stop the browser saying "Not secure" | [Settings](#settings) |

---

## What it does

It keeps your compliance programme in one place, so that when somebody asks
"are we doing this, and can you show me" there is an answer.

**Offset Assure** covers **ISO/IEC 27001:2022**: all 93 Annex A controls in
4 themes, with clauses 4 to 10 covered by the [Get ready](#get-ready) plan.
The menu calls them Controls, and asks **is this in place?** You answer with a
status.

The menu is on the left, in groups. Documentation and Help are at the bottom.
To make more room for the page, press the arrow at the top of the menu: it
shrinks to icons, and pointing at an icon shows its name. Press the arrow again
to bring the names back. Your browser remembers which way you left it.

**This does not make you compliant, and it is not a certification.** It is a
place to record and show your own work. Certification is between you and an
accredited body.

---

## Getting in

Your administrator gives you a username and a password, and the address, which
looks like `https://offset.yourcompany.local` or `http://localhost:8080`.

You may also get an email saying an account has been created. **It will not
contain your password.** That is deliberate: email is not a safe place to keep
one. Ask whoever set up your account.

### If you forget your password

**Everyone except administrators:** ask an administrator. They can set a new one
for you under **Users**.

**Administrators:** click **Forgot password?** on the sign-in page and enter
your username or email address. A temporary password is emailed to you.

- It works **once**, for **30 minutes**.
- Signing in with it takes you straight to **Choose a new password**. Nothing
  else opens until you have.
- Your old password keeps working until then, so if you remember it after all,
  just use it.
- Everywhere else you were signed in is signed out once the new password is set,
  and you get an email saying the password was changed.

The page says the same thing whatever you type, whether or not the account
exists. That stops anyone using it to find out who your administrators are. If
no email arrives, email may not be set up: ask another administrator, or see
**Locked out** in `INSTALL.md`.

To change your password when you do know it, use **Change password** at the top
right of any screen.

### If the browser warns you

**"Your connection is not private"** or **"Not secure"** means the server has
no certificate your browser trusts. Do not click through. Tell your
administrator: they can fix it for everyone in a few minutes, under
**Settings → HTTPS certificate**, with a certificate from your IT team. It costs
nothing.

### What you are allowed to do

Four roles. Yours is shown under your name, top right.

| Role | Can do |
|---|---|
| **Administrator** | Everything, plus adding people and changing settings |
| **Contributor** | Read and change all compliance data. Most people. |
| **Auditor** | Read everything, including the audit trail. Cannot change anything. |
| **Read only** | Read everything. Cannot change anything. |

If a button is missing or a change is refused, that is your role, not a fault.

---

## Get ready

If you have never done this before, start here.

It is a plan in 8 stages, from setting the product up to keeping it going,
ending at the certification audit.
Each stage opens into a short list of steps, and each step says three things:
what to do, why it matters, and a button that takes you to the screen where you
do it.

### Your next step

Where a step is a document you write, such as the ISMS scope, it says so, names
the template to start from, and **Open the template** takes you to Policies →
Templates.


The box with the blue border, under the stages, is the one thing to do now: the
first step not yet done, in the order of the plan. It says what to do and why,
with the same buttons as everywhere else: **Take me there**, **Assign it** and
**Does not apply to us**. Underneath, **After that** names the two steps that
follow.

**Nearly there** lists checks that are almost passing, such as "91 of 92 that
apply have an owner". Each is usually one or two fixes. It only appears when
there is something nearly done.

The golden thread box says how many links between your risks, what treats them
and the proof need fixing. Click it to open the [Golden thread](#golden-thread).

The page's longer introduction is behind **How this works**, at the top.

### Green on its own, or ticked by you

Every step is one of two kinds, and it says which:

- **Checked for you.** The product looks at its own data. "Score every control"
  goes green when they are all scored; until then it tells you how far off you
  are, like "104 of 159 answered". You cannot tick these by hand, and you do not
  need to.
- **Ticked by you.** Things no software can see: whether your board approved a
  policy, whether staff actually follow it, whether somebody was made
  accountable. You tick these, and the product records who ticked and when.

The difference is on purpose. A plan that claimed to verify "get management to
approve this" would be lying to you.

### Doing them out of order

Nothing is locked. The numbers are the order most organisations find easiest,
not a rule. If you want to write your policies before assessing anything, click
stage 4 and do it. The rings along the top show where everything stands:
each one fills as its steps are done, and turns solid green with a tick when the
stage is finished. The stage suggested next says **next** under it.

### If something does not apply to you

Any step can be excluded, and the product asks why. Excluded steps stop counting
against you — a stage of four steps with one excluded is finished when the other
three are done.

The same is true of controls. Open one and there is **Does this apply to you?**
near the top. Say no, write the reason, and it comes out of your average, your
percentage and your charts. Your score is kept, so if you change your mind you
get the assessment back rather than doing it again.

**Be strict with yourself.** "We have no payment systems" is a reason. "We have
not got round to it" is not — that one is just outstanding, and an assessor can
tell the difference at a glance.

### Printing it

The **Readiness plan** report puts the whole thing on paper: where each stage
stands, what is still to do, what you excluded and why, and who decided each
one. It is the document to take to your management when nobody has asked you
for a report yet.

### Get ready for ISO 27001

Eight stages, 36 steps. 23 of them are checked for you. Each stage names the
part of the standard it covers, so you can read the requirement in your own
copy of ISO/IEC 27001.

| Stage | Covers | Goes green when |
|---|---|---|
| **1. Set the product up** | — | Colleagues added, email working, your logo on reports, a backup has run |
| **2. Set your ISMS scope** | Clause 4 | Your ISMS scope is written, and your assets are listed |
| **3. Get leadership behind it** | Clause 5, 6.2 | Your policies are approved with an approver and a date, roles are named, objectives are set |
| **4. Assess and treat your risks** | Clauses 6.1, 8.2, 8.3 | Your risk method is written, every risk has an owner, every risk you are reducing is linked to a control |
| **5. Write the Statement of Applicability** | Clause 6.1.3 | Every control has a reason, every control that applies has an owner, and the Statement has been exported |
| **6. Put it in place and prove it** | Clauses 7, 8 | Gaps are tasks, evidence is attached, linked and dated, every document has a review date |
| **7. Check that it works** | Clause 9 | Internal audit findings are recorded and the management review has been held |
| **8. Fix gaps and get certified** | Clause 10 | Every open finding has an owner and a due date; Stage 1 and Stage 2 are passed |

Some things only a person can confirm, such as the management review meeting
or passing Stage 2. You tick those.

**Your auditor can look for themselves.** Before Stage 1, add the auditor under
**Users** with the **Auditor** role. They can read everything, including the
audit trail, and cannot change anything.

**A certificate is not the end.** The certification body comes back every year
for a surveillance audit, and recertifies every three years. The last step of
the plan is booking next year's internal audit, management review and reviews
as tasks, so the ISMS keeps running between visits.

## Golden thread

Every risk, the controls that treat it, and the evidence that they work, drawn as
one map. It is the third tab of **Risks**, beside the register and the sample
library. Each control's own window also opens with **How to fix this**: the same
verdict for that one control, with a button for each thing to fix.

A control is a promise, such as "we back up our data". Evidence is the document
that shows you keep it: a restore test record, a list of who was trained, a
screenshot of the setting. An auditor says "show me", and this is what you show.

It is the line an auditor follows. They pick a risk, ask what reduces it, and
ask to see that working. A break anywhere along the line is where a finding
comes from.

- **Risks** are on the left, **every control** in the middle (grouped as in the
  framework, each with its owner), and **evidence** on the right with its age in
  days.
- **Point at anything** and its whole thread lights up. **Click it** for the
  details: who owns it, what it is linked to, and what is wrong. Press Esc or
  click again to close them.
- **Only problems** hides everything that is fine. The search box finds a risk,
  a control or a piece of evidence by name.

What the colours mean:

| Line | Means |
|---|---|
| Green | Satisfied. A control that is in place, with current evidence and an owner, and the lines that join it |
| Red dashes | Broken. A risk you are reducing has nothing treating it, or a control marked implemented has no evidence |
| Amber dashes | Weak. The newest evidence is over 90 days old or has no date, or the control has no owner |
| Dotted box | Not applicable, so nothing is needed |

**Clauses.** Each risk has three boxes beside it, in a **Clauses** column, in this
order. Green is met, orange is partly met, red is not met. They are worked out
from your records every time, so they are always today's answer, and there is
nothing to keep up to date.

| Box | Clause | Green when | Amber when | Red when |
|---|---|---|---|---|
| 1 | 6.1.2 Risk assessment | The risk is scored and has an owner | It has no owner | |
| 2 | 6.1.3 Risk treatment | Every control that treats it has a reason in the Statement of Applicability | Some controls have no reason | No control treats it |
| 3 | 8.3 Treatment carried out | Every control that treats it is in place | Some are in place, or under way | None are in place |

Click a risk, or one of its boxes, to read what is missing and **To fix**: the
step to take, with a button that opens the right screen. The strip above the map counts
the risks that do not yet meet a clause. A risk that is accepted, avoided or
closed needs no control, so all three are green once the decision is made.

Accepted, avoided and closed risks need no control, so they never count as
broken. A control that is not linked to any risk is shown, and counted, but is
not a problem: it may be there for a law or a contract instead. Auditors do ask.

**Fixing a break from the screen.** Click a broken risk or control and the
details panel offers the fix, if you are allowed to edit:

- A risk with nothing treating it: **Link** the controls that treat it. Type to
  search, click one to add it, then **Save the link**. **change** beside "Treated
  by" edits links that already exist.
- A control marked implemented with no evidence: **Link existing evidence** lists the
  evidence you have recorded. For something new, **Add new evidence** opens Evidence.

The same links are on the risk form in the Risk register, under **Controls that
treat this risk**.

One piece of evidence often backs several controls. Fixing it, by collecting a
fresh copy and updating its date, fixes all of them.

The figures across the top are the same ones the Get ready page shows.
Products with a very large framework open on **Only problems**.

**It links things for you, where it can.**

- Adding a risk from the **Sample library** also links the controls the library
  names for it. Every sample risk comes with its controls.
- Risks you added earlier from the library, with nothing linked, show a banner:
  **Link them to their controls**. One click links them. Risks you wrote
  yourself are never changed.
- When you type a new risk, the form **suggests** controls from its title, for
  example "Ransomware" suggests backup and malware controls. **Add all**, or
  click the ones you want. Nothing is linked until you do.

## Dashboard

The front page. Four figures across the top.

**Profile readiness** — how much of the framework you have implemented, as a
percentage of what is in scope. Anything marked Not Applicable is excluded, so
the number reflects what you actually intend to do.

**Open risks** — risks not yet closed. The note says how many are critical.

**Evidence items** — how many pieces of proof you hold, and how many need
refreshing.

**Evidence gaps** — **the most useful number here.** Controls you have marked
Implemented with no evidence attached. It is the answer to "we say we do this,
but can we prove it". An auditor will find these. Better that you do first.

Below: readiness by theme, and a coverage chart showing where you
are strong and where you are thin.

Every figure is worked out live from the same data as the screens. If a number
looks wrong, open the screen underneath it and the reason is usually obvious.

---

## Controls

The core of the product: every control in your framework, one row each.

**Click a row to open the control.** At the top is what it means in plain
words: what it is, what to do about it, and what an assessor or auditor will
look for. It also lists the records that prove it.

### The four statuses

| Status | Means |
|---|---|
| **Not Started** | Nothing done yet |
| **In Progress** | Being worked on |
| **Implemented** | Done and operating |
| **Not Applicable** | Does not apply to you |

**Not Applicable needs a reason.** Write why in the justification. "We have no
industrial control systems" is a good reason. Blank is not, and an auditor will
ask about every single one.

Not Applicable controls come out of your readiness percentage. That is correct,
and it is also how a percentage gets dishonest — if you mark things Not
Applicable to make the number look better, the number stops meaning anything.

### Working through them

Change the status and the owner straight in the list. No save button; it saves
as you go, and puts it back if the server refuses.

Click a row for the detail: notes, what evidence is attached, related risks.

Filter by status, by theme or function, or search. The usual first job is
filtering to Not Started and giving each one an owner.

**Give everything an owner.** A control with nobody's name against it is one
nobody is doing.

### Testing a control

Open a control and there is a **Testing** box under its evidence. Record the
date you tested it, the result — Pass, Partial or Fail — who did it, and what
you found.

A status says what somebody believes today. A test says what happened on a day,
and the list of them is how you show a control that keeps working rather than
one that was set up once. Saved as soon as you press the button, and each test
stays as its own line.

---

## Statement of Applicability

The document an ISO 27001 certification auditor asks for first. It lists all 93
controls in Annex A and says, for each one, whether it applies to you, why, and
whether it is in place.

Open **Applicability** in the menu.

**At the top**, two boxes:

- **ISMS scope.** What your management system covers: which parts of the
  organisation, services, locations and systems, and what is left out.
- **Risk assessment methodology.** How you score risk, what score is
  acceptable, and who can accept a risk.

Both are things the auditor reads before anything else. Beside them, the
product counts how many controls apply, how many of those are implemented, and
how many exclusions have no reason.

**Below**, one row per control:

| Column | What you do |
|---|---|
| **Applies** | Choose **Applies** or **Excluded** |
| **Status** | Shows how far along it is. Change it in Controls |
| **Justification** | Write the reason, in a few words |

**Write a reason for every control, not only the exclusions.** ISO 27001 asks
for the reasons controls are included too. Good reasons are short and specific:
"treats risk 12", "required by our customer contracts", "data protection law".
For an exclusion, say why it cannot apply: "no premises of our own; staff work
from home" is a reason, "not a priority" is not.

The filter at the top shows **Excluded without a reason**, which is the list to
clear before an auditor sees it.

**The contradiction warning.** If a control is excluded but one of your risks
points at it, the screen says so and the row is marked. Either the control
applies after all, or the risk should not point at it. It is the first thing an
auditor notices, and it takes a minute to fix.

**Exporting it.** In **Reports**, download **Statement of Applicability**. Have
it approved by whoever owns the ISMS, and keep the approved copy in
**Evidence**. When you change your decisions, export and approve it again: the
auditor will ask which version is current.

---

## Evidence on a control

Anything you mark as in place, you are claiming is defined, approved, in use
and monitored. An assessor will ask you to show it. Attach it while you are looking
at the control, rather than trying to remember later.

Open a control and there is an **Evidence** panel. Three ways to add something:

| Button | Use it when |
|---|---|
| **Upload a file** | You have the document on your computer. It is stored, named after the file, and linked to this control in one step |
| **Link something I already have** | You recorded it earlier against another control. Search and pick it |
| **Record it without a file** | The proof exists but not as a file — signed minutes in a cabinet, a report in another system. Record what it is and who owns it |

**It is the same evidence as the Evidence tab.** Not a copy. Attach something
here and it appears there; link it there and it appears here. One item can
support many controls, which is normal — one approved policy is evidence for a
dozen of them.

**Unlink** removes it from this control only. The evidence itself is kept.

---

## Due dates and reminders

Each control can carry a deadline and the address of whoever owns it. Open a
control and you will find them under Owner:

- **Due by** — when the work should be finished
- **Email reminders to** — where the chasing goes

**Both are needed, or nothing happens.** A date with nobody to tell, and an
address with no deadline, are each harmless on their own. That is deliberate.
The product should not start emailing your colleagues because somebody typed an
address once.

### What gets sent

Once a day, each person gets **one email about their own controls only** —
never a long list of everyone's work, which is how reminders end up in a filter.

It lists anything overdue first, then anything due within the next seven days,
with the reference, the deadline and the current status of each.

To stop the emails for a control, clear the address on it.

### On the register

The **Due** column shows the date. It turns amber as the deadline approaches and
red once it has passed, so you can see the pressure without opening anything.

The date is set on the control rather than edited in the list, on purpose:
deciding to start emailing a colleague deserves the screen where the
explanation sits next to it.

---

## Evidence

Proof. Where most of the real value is, and where most programmes fall down.

Each item records what the proof is, who owns it, when it was collected, and
which controls it supports.

### Freshness

Evidence goes out of date. The colour tells you how far:

| | Age |
|---|---|
| **Fresh** | within 30 days |
| **Ageing** | 30–60 days |
| **Due** | 60–90 days |
| **Stale** | older than 90 days |
| **No date** | never recorded |

Work from Stale downwards. A firewall review from eighteen months ago proves
what was true eighteen months ago.

### Attaching the document

Click **Attach a file** in the Document column. Up to 25 MB.

The file is stored with the record, and a checksum is kept so you can tell
later whether it changed.

**Attach the actual thing.** A row saying "firewall review" is a claim. The
review itself is evidence. When an auditor says "show me", one of those works.

Click the filename to download it. **Remove** takes the file away and keeps the
record.

### Linking to controls

Link each item to the controls it supports. This is what makes the **Evidence
gaps** figure work, and what lets a report say which controls are proven.

One document often supports several controls. Link it to all of them.

---

## Risks

Your risk register, with a heat map.

Score each risk on **likelihood** and **impact**, 1 to 5. Multiplied together:

| Score | Band |
|---|---|
| 20 and above | **Critical** |
| 12 to 19 | **Elevated** |
| Below 12 | **Acceptable** |

Record an inherent score — before your controls — and a residual score after
them. The gap between the two is what your controls are worth, which is a
question you will eventually be asked.

Set a treatment: mitigate, transfer, avoid or accept. **A risk you accept will
not save without a name against it.** Somebody with the authority to accept it
did so, and that is the record. Put the date in too, even though it is not
forced — "who accepted this and when" is one question, not two.

Link risks to the controls that reduce them and to affected assets.

---

## Sample library

A blank register is the hardest place to start, so **Risks**
and **Assets** each have a **Sample library** tab next to the register.

It holds ready-made examples to react to, grouped so you can open only the ones
that fit you:

| | |
|---|---|
| **Assets** | Business processes, data, devices, infrastructure, cloud, security tools, people and facilities, plus six industries: healthcare, finance and insurance, manufacturing, government, education and automotive. 132 in all |
| **Risks** | Risks common to most organisations, plus the same six industries. 111 in all |

Each sample risk comes with a likelihood, an impact, a suggested owner and the
controls that usually treat it. Every one of the 93 Annex A controls has at
least one sample risk against it.

Each sample asset says whether it is a primary asset - the information and
the business processes - or a supporting one that holds or carries them, and
points at the controls that govern assets of that kind.

**Add** copies a row into your register, and that is all. Once added it is
yours: rename it, rescore it, or delete it like anything else. Samples you have
already added are shown dimmed, so you do not lose your place.

**Scores are a first guess, not an answer.** Change them to fit your
organisation. Ten risks that are really yours beat a hundred copied without
thought, and an auditor can tell the difference.

---

## Document templates

**Policies → Templates.** Two sets of Word documents to start from.

**The ISMS document set (00 to 13).** Fourteen documents covering what ISO 27001
asks you to keep: the master list, scope, ISMS policy, roles, the risk process,
control of documents, the communication plan, internal audits, management review,
corrective action, the objectives plan, the Statement of Applicability (an Excel
workbook), the register of laws and contracts, and the risk treatment plan.

**Fill them in here, not in Word.** Press **Fill in** at the top of the tab.

1. **About your company.** Name, address, what you do, who runs the ISMS, where
   documents are kept. Asked once, and used in every document that needs it.
2. **Your choices.** How long records are kept, how often you review risks, how
   quickly a nonconformity is fixed. They already have the usual answer.
3. **Each document** then asks only what is specific to it, such as the cost bands
   for risk impact, or the teams and locations inside your scope. For the laws
   register you can pick from common laws and standards.

Your **risks, objectives, suppliers, interested parties, issues, audits, findings,
scope, policies and controls** are not asked for again. They go into the document
from the screens where you already keep them, one row for each record. Download
a document whenever you like: it is made fresh each time, so it matches the
screens. Anything you could not answer stays **yellow**, so you can finish it in
Word. **Download all filled (zip)** gives you the whole set in one go.

**The starter policies.** Seven more documents (master policy, acceptable use,
HR security, IT operations, incident response and continuity, supplier management,
context of the organisation) fill in the same way. They are listed under the ISMS
set in **Fill in**, and your company name and contacts go into them, including the
page header.

Whichever you use, have the document approved, then record it under **Documents** with
its version, owner and review date. **Add to my policies** does the first step
for you, with the filled document attached.

---

## The management-system registers

The records ISO 27001 asks for that are not controls, not risks and not
evidence. Each is a list with a search, a filter and an add button, like every
other register.

**Suppliers.** Who you rely on, and what they do for you. How sensitive the
information they hold is. What assurance they gave you - a certificate, a
report, a questionnaire. And when you will look at them again. Link a supplier to the
controls it supports and to the risks it carries. Covers A.5.19 to A.5.23.

**Training.** Who was trained, on what, when, and when it is due again. Covers
clause 7.2 and 7.3 and control A.6.3. Auditors sample these records, so keep
them as you go.

**Objectives.** What you are aiming at, how it is measured, the target, who owns
it, and by when. Clause 6.2 wants objectives that can be measured rather than
good intentions.

**Interested parties.** Who cares about your security — customers, your
regulator, staff, suppliers, owners — what they need from you, and how you meet
it. Clause 4.2, and the reason several of your controls exist.

**Audits and reviews.** Internal audits, management reviews, external audits and
supplier audits. A planned entry with a date is your audit programme (clause
9.2); a completed one records who took part and what came of it. Record anything
found in **Findings**.

**Communications.** What you tell people about security, to whom, how often,
and when it is next due.

For example: the policy to all staff on joining and once a year, phishing
reminders each quarter, supplier duties when a contract is signed, incident
reporting to the board. Clause 7.4 asks for the plan, not a folder of sent emails. Put a
next-due date on each and it appears in the **Calendar**.

**Corrective action, on the finding.** A finding in Assure also asks for the
root cause, what you changed, how you checked the change worked, and who checked
it. Clause 10.2 in four boxes. The list shows whether each finding has been
acted on and checked.

---

## Gap analysis

The Controls screen answers "where does this control stand". This one answers
"what is left", which is the question asked before an audit.

Four numbers at the top:

| | |
|---|---|
| **Done and proved** | Implemented, with evidence attached |
| **Not started** | Nothing recorded yet |
| **In progress** | Started, not finished |
| **Claimed, unproved** | Marked implemented with nothing attached to prove it |

That last one matters most. A control you claim without proof is the one an
auditor finds, and it is worse than an honest gap.

Under that, each theme with a bar, and the list itself. Filter by what kind of
gap it is, or by theme. **Raise a task** on any row creates a task linked to
that control, with its owner and due date, so the gap becomes work with a name
against it.

---

## Help and Documentation

Two items in the menu, both readable inside the product.
Nothing is downloaded, and nothing you read leaves the server.

**Help** — short answers: your first hour, what each screen is for, who can do
what, where your data lives, and the questions that come up in the first week.

**Documentation** — five guides: quick start, using it day to day, the
administrator guide, a playbook for the product's framework, and collecting
evidence from AWS, Azure, Microsoft 365 and Google Workspace.

| | |
|---|---|
| **Its playbook** | From a fresh install to certified |
| **Its evidence page points at** | Annex A controls, such as A.8.5 |

They ship with the product, so they describe the version you are running.

**The same documents come in the box.** Every installer has a `docs` folder.
In it: this user guide, the install guide, the security overview, the privacy
sheet, a troubleshooting guide and the release notes. On Windows the Start
menu has a shortcut to it.

---

## Spreadsheets

Every register has **Export CSV** and **Import CSV**.

**Export** gives you the rows currently on screen — filters and search
included — with the same column headings the add form uses. It opens in Excel
with accents intact.

**Import** adds rows from a file. The headings are matched to the fields by
name, anything unrecognised is ignored, and **nothing already in the register
is changed or removed**. You see how many rows were found and which columns
matched before anything is added.

If the file has no column for a required field, it says so and adds nothing.
The quickest way to get the headings right is to export first and fill in the
file you get back.

Rows are added one at a time through the same checks the form uses, so one bad
date does not stop the other forty-nine rows.

---

## Example data

**Settings → Example data.** Loads a small software company: assets, risks,
policies, suppliers, training, objectives, interested parties, an internal
audit, a management review, findings with a corrective action, tasks,
incidents, evidence, and an opinion on a third of the controls.

It is there to be looked at. The dashboard, the gap list and the calendar all
show something, so you can judge the product before spending a week filling it
in.

**Removing it takes back exactly what it added.** Every example row is marked
as one. Anything you add yourself is untouched, and an example row you edit —
a control you take over as your own — is left alone too.

---

## Calendar

Everything with a date on it, in one place: policy reviews, tasks, findings,
evidence going stale, supplier reviews, objectives, training due again, planned
audits and control due dates.

Three groups: **overdue**, **the next 30 days**, and **after that**. Look ahead
30 days, 90 days, six months or a year.

Nothing is edited here. Each row has a button to the screen it came from, which
is where its date is changed.

---

## The other registers

Same shape: a list, a filter, a search, a dialog to add and edit.

**Assets** — what you hold that matters. Primary or supporting, with a
criticality and a classification.

**Policies** — Draft, In Review, or Approved. Set a review date. Version history
is kept, so "which version was in force in March" has an answer.

**Tasks** — the work outstanding. Owner, due date, priority. Anything overdue
appears in the daily email.

Set **Kind** to **Change** for a planned change - to the way you work, or to
a system. Then fill in **what this change means for security**: what it
affects, what could go wrong, and what you will do about it. That is clause 6.3 in two
boxes, and it keeps planned changes in the same list as the work, rather than in
a second list nobody updates. Filter the list by kind to show only changes.

**Incidents** — what happened. Severity Low to Critical; status from Open
through Investigating, Contained and Resolved, to Closed.

**Findings** — raised against you, by an auditor or internally. **A closed
finding must say what closed it.** "Closed" on its own is not a record of
anything.

---

## Reports

PDFs to hand to someone. Click **Download** on any of them.

| Report | What it is for |
|---|---|
| **Executive summary** | One or two pages for a board or a manager |
| **Gap report** | Everything not yet implemented, and who owns it |
| **Risk register** | The full register with scores and treatments |
| **Evidence register** | What proof you hold and how fresh it is |
| **Readiness plan** | Your Get ready plan on paper |
| **Management review pack** | The inputs clause 9.3 asks for, in one document |
| **Document control list** | Every document, its version, approval and review date |
| **Statement of Applicability** | Which controls apply, and why |

### Your own logo

Administrators can upload your organisation's logo under Reports. It appears at
the top of every report, where an auditor expects to see the name of the
organisation being audited.

Without one, reports carry the Offset Security mark instead.

### What is in them

Whatever is in the system when you press the button, with the date and your
name on it. A report that cannot say when it was produced is not evidence of
anything.

---

## Users

Administrators only.

Add someone with a name, a username, an email and a role. They get told the
account exists — **not the password.** Give them that yourself, in person or
through a password manager.

**Disable, do not delete.** The audit trail points at people. Deleting an
account would leave "who approved this" without an answer, which is the one
question an audit trail exists to answer. Disabling stops them signing in and
keeps the history.

If somebody is locked out after too many wrong passwords, **Unlock** clears it.

Two limits stop password guessing. Five wrong passwords lock that account for
15 minutes. Twenty failed sign-ins from one address, to any accounts, block
that address for 15 minutes, so one computer cannot guess at everyone's
password or lock everyone out.

---

## Audit trail

Administrators and auditors only. Nobody else sees it in the menu: it holds
failed sign-ins and addresses, which are security information.

It lists everything that happened, newest first: who, when, what they did,
which record, and the address they came from.

- **Search**, or pick a person, an action, or dates.
- **Click an entry** to see what it changed: each field, before and after.
  For something added or deleted, it shows the values it had.
- **Download CSV** gives everything that matches the filters, as a
  spreadsheet. Hand it to an auditor as evidence. The download is itself
  recorded.

**Nothing here can be changed or deleted**, by anybody, including
administrators. Entries are kept for ever unless whoever runs the server sets
a retention period (`AUDIT_RETENTION_DAYS`).

---

## Backups

Administrators only.

A backup is one file holding everything: the database and every evidence
document. One is taken automatically every night. The newest three backups are
kept, counting every kind together, and older ones are deleted.

**Take a backup now** before a big change, such as importing a lot of data.

**Download** saves a backup to your computer. Do this now and then and keep the
file somewhere other than the server. The file holds everyone's password hashes
and every document, so keep it safe.

**Upload a backup** adds a file you downloaded earlier back to the list. It is
checked first, and refused if it is damaged, not an Offset backup, from a
different product, or from a newer version.

**Restore** puts everything back as it was in that backup. You are asked to type
RESTORE first, because anything added or changed since that backup is replaced.
Before it starts, a backup of everything as it is now is taken, so a restore of
the wrong one can be undone. Everyone is signed out afterwards and signs in with
the accounts as they were in the backup.

---

## Settings

Administrators only.

**Outgoing email** — optional. Everything works without it. Set it up and you
can send the daily digest.

**Daily digest** — one message a day listing what needs attention: evidence out
of date, overdue tasks and findings, policies due for review, open risks in the
top band.

**It sends nothing on a day when nothing needs attention.** That is on purpose.
A message that arrives every morning saying nothing is one people stop reading,
and the morning it matters they will not read that one either.

Use **Preview today's** to see what it would say before turning it on.

**HTTPS certificate** — stops the browser saying "Not secure". Ask your IT team
for a certificate for the name people type to reach this server, issued by your
company's own certificate authority. It is free, and every company computer
already trusts it. A `.pfx` file with its password works, and so do a
certificate and key as PEM files.

Click **Choose files**, pick them, type the password if there is one, and click
**Upload certificate**. It is checked first. Anything worth knowing - it is for
a different name, it is self-signed, it expires soon - is shown before it
replaces the one you have.

If the product is already on HTTPS, the new certificate is used at once. That
is how you renew it each year. If it is still on plain HTTP, it needs a restart,
and the screen says how. Old `http://` links keep working afterwards: they are
sent on to `https://`.

The section also shows the certificate in use: who it is for, who issued it,
and when it expires. It warns 30 days before. Installing and network settings
are in `INSTALL.md`, under **Turning on HTTPS**.

**Updates** — shows which version you have. **Check for updates** asks Offset
Security's release server whether there is a newer one, and shows what changed.
Nothing is checked until somebody presses it.

If there is one, **Update** installs it. A backup is taken first. The product
is then unavailable for a minute or two while it restarts. If the new version
does not start properly, the old one and your data are put back for you. The
section shows each step as it happens. When it says **Updated**, reload the page.

If the button is not offered, the section says why: usually that the server
cannot reach the internet, or that this copy was installed without the updater.
Whoever installed it can see **Updating** in `INSTALL.md`.

---

## Things worth knowing

**Everything is recorded.** Every change is written to an audit trail with who,
what and when. That is the point of the tool, and it means nothing is quietly
undone.

**It is backed up nightly**, automatically, documents included. Administrators
can take, download and restore backups under [Backups](#backups). Ask whether a
restore has ever been tested. An untested backup is a hope.

**Your data does not leave your organisation.** There is no cloud service behind
this, no telemetry, and no update check. It runs on your own machines.

**Two numbers to watch**, if you only watch two:

1. **Evidence gaps** on the dashboard — controls you claim without proof.
2. **Stale evidence** — proof that has aged out.

Both are things you can fix quietly now, or have found for you later.

---

Questions your administrator cannot answer: **info@offsetsecurity.net**
