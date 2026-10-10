# Annex A.5: Organisational controls

The 37 organisational controls are the largest group. They cover the rules and arrangements of the organisation as a whole: policies, roles, managing information and assets, access, suppliers and cloud services, incidents, business continuity, and legal compliance.

Most of the documents an auditor asks for come from this theme. If you are short of time, this is where to start.

Part of [the audit-ready handbook](iso-01-certification.md). Previous: [Clause 10](iso-08-clause-10.md). Next: [Annex A.6: People controls](iso-10-annex-a-6.md).

## How Annex A works

Annex A is a reference list. You do not have to implement every control. Your risk assessment decides which you need, and the Statement of Applicability records every one of the 93, applied or not, with the reason. See [Clause 6](iso-04-clause-6.md).

Once a control is in your Statement of Applicability, the auditor expects to see it working. For each control below:

- **Purpose** is what the control is for.
- **What to do** is the usual way to meet it.
- **What the auditor checks** is how it is typically tested.
- **Have ready** is the evidence to collect and attach.

The control numbers and titles are from ISO/IEC 27001:2022. The wording under each one is ours, not the standard's. For full implementation guidance, read the same control in ISO/IEC 27002:2022.

Controls marked *new in 2022* did not exist in the 2013 edition.

**In Assure.** Open the control in **Controls**. Set its applicability and reason in **Applicability**, attach proof in **Evidence**, and record tests in **Testing**. The same guidance is shown on each control.

## Policies and roles

### A.5.1 Policies for information security

**Purpose.** Ensure security direction is set, approved by leadership, and communicated to everyone.

**What to do.** Write a set of information security policies, get management to formally approve them, publish them to staff, and review them on a fixed schedule.

**What the auditor checks.** The auditor checks that policies exist, were approved by management, reached staff, and are reviewed regularly.

**Have ready.** Approved Information Security Policy; policy review log with dates; evidence staff received/acknowledged it.

### A.5.2 Information security roles and responsibilities

**Purpose.** Make sure every security responsibility has a clearly named owner.

**What to do.** Define who is responsible for each security task and record it in role descriptions and the tool's owner fields.

**What the auditor checks.** The auditor looks for defined, documented security roles with no gaps or overlaps.

**Have ready.** Roles & responsibilities matrix; org chart; job descriptions with security duties.

### A.5.3 Segregation of duties

**Purpose.** Prevent fraud and error by splitting conflicting duties between different people.

**What to do.** Identify conflicting duties (e.g. request vs approve, develop vs deploy) and ensure no single person controls both.

**What the auditor checks.** The auditor tests whether one person can perform and approve a sensitive action alone.

**Have ready.** Segregation-of-duties matrix; approval workflows; access reviews showing the split.

### A.5.4 Management responsibilities

**Purpose.** Ensure management actively requires staff to apply security, not just publish rules.

**What to do.** Have management set expectations, communicate them, and hold staff accountable for following policy.

**What the auditor checks.** The auditor looks for evidence management drives compliance, not just documents it.

**Have ready.** Management communications; onboarding acknowledgements; policy sign-offs.

## Authorities, interest groups, threat intelligence and projects

### A.5.5 Contact with authorities

**Purpose.** Be able to reach the right authorities quickly during an incident.

**What to do.** Maintain contact details for police, regulators and the data protection authority, and a short procedure for using them.

**What the auditor checks.** The auditor checks the contact list is current and staff know when to escalate.

**Have ready.** Authority contact list; incident escalation procedure.

### A.5.6 Contact with special interest groups

**Purpose.** Stay informed through security communities and special interest groups.

**What to do.** Join relevant forums, mailing lists and industry groups, and use what you learn.

**What the auditor checks.** The auditor looks for active membership and evidence the intelligence is used.

**Have ready.** Membership records; subscription lists; notes on advice acted upon.

### A.5.7 Threat intelligence *(new in 2022)*

**Purpose.** Anticipate threats by collecting and acting on threat intelligence.

**What to do.** Subscribe to threat feeds/bulletins, review them, and feed findings into risk and controls.

**What the auditor checks.** The auditor checks threat information is collected and demonstrably acted on.

**Have ready.** Threat intelligence feeds/reports; records of resulting actions or risk updates.

### A.5.8 Information security in project management

**Purpose.** Build security into projects from the start rather than bolting it on later.

**What to do.** Add security requirements and reviews into your project method for every project.

**What the auditor checks.** The auditor samples projects for embedded security activities.

**Have ready.** Project management template with security steps; security review records in projects.

## Information and assets

### A.5.9 Inventory of information and other associated assets

**Purpose.** Maintain an accurate inventory of information and assets, each with an owner.

**What to do.** Record all information assets with owner, type, classification and location, and keep it current.

**What the auditor checks.** The auditor checks the inventory is complete, owned and up to date.

**Have ready.** The asset register (Assets); asset owner assignments.

### A.5.10 Acceptable use of information and other associated assets

**Purpose.** Set and enforce acceptable rules for using information and assets.

**What to do.** Publish an Acceptable Use Policy and make staff accept it.

**What the auditor checks.** The auditor looks for defined usage rules and staff acceptance.

**Have ready.** Acceptable Use Policy; signed staff acknowledgements.

### A.5.11 Return of assets

**Purpose.** Recover all assets when someone leaves or changes role.

**What to do.** Run an offboarding checklist that reclaims laptops, badges, tokens and access.

**What the auditor checks.** The auditor samples leavers to confirm assets were returned.

**Have ready.** Completed offboarding checklists, attached as evidence; asset return records.

### A.5.12 Classification of information

**Purpose.** Classify information by sensitivity so it is handled correctly.

**What to do.** Define a classification scheme (e.g. Public, Internal, Confidential, Restricted) and apply it.

**What the auditor checks.** The auditor checks information is classified consistently against the scheme.

**Have ready.** Classification scheme/policy; examples of classified assets (Asset Register).

### A.5.13 Labelling of information

**Purpose.** Label information so its classification is obvious to handlers.

**What to do.** Apply labels to documents, emails and storage reflecting their classification.

**What the auditor checks.** The auditor samples information for correct labelling.

**Have ready.** Labelling procedure; labelled document/email examples.

### A.5.14 Information transfer

**Purpose.** Protect information whenever it is transferred between people, systems or organisations.

**What to do.** Use secure channels (encryption, secure portals) and agreements for all information transfers.

**What the auditor checks.** The auditor reviews transfer mechanisms to confirm data cannot be intercepted or leaked in transit.

**Have ready.** SFTP/secure transfer configs; TLS/encryption settings; signed data-transfer agreements.

## Access and identity

### A.5.15 Access control

**Purpose.** Control who can access what, based on business need.

**What to do.** Define an access control policy and configure permissions to match it.

**What the auditor checks.** The auditor checks access is granted per policy and least privilege.

**Have ready.** Access Control Policy; permission configurations; role definitions.

### A.5.16 Identity management

**Purpose.** Manage every identity through its full life, uniquely tied to one person.

**What to do.** Create identities when needed, keep them unique (no shared accounts), and remove them when not.

**What the auditor checks.** The auditor tests joiner/leaver identity handling and looks for shared accounts.

**Have ready.** Identity lifecycle procedure; joiner/leaver records; unique-account evidence.

### A.5.17 Authentication information

**Purpose.** Handle passwords and login secrets securely.

**What to do.** Set a password policy, use secure issuance/storage (password manager), and a safe reset process.

**What the auditor checks.** The auditor checks how secrets are issued, stored and reset.

**Have ready.** Password/authentication policy; password manager usage; reset procedure.

### A.5.18 Access rights

**Purpose.** Grant, review and revoke access rights formally.

**What to do.** Approve access requests, review access regularly, and remove access no longer needed.

**What the auditor checks.** The auditor samples access approvals and periodic access reviews.

**Have ready.** Access request approvals; periodic access review reports (e.g. quarterly).

## Suppliers and cloud services

### A.5.19 Information security in supplier relationships

**Purpose.** Manage security risks arising from supplier relationships.

**What to do.** Assess supplier security risk and track suppliers in the Suppliers register.

**What the auditor checks.** The auditor checks suppliers are risk-assessed and monitored.

**Have ready.** Supplier security policy; the Suppliers register, with a risk level for each supplier.

### A.5.20 Addressing information security within supplier agreements

**Purpose.** Put security requirements into supplier agreements.

**What to do.** Include security and data-protection clauses in supplier contracts.

**What the auditor checks.** The auditor samples contracts for security clauses.

**Have ready.** Contract security clauses; data processing agreements (DPAs).

### A.5.21 Managing information security in the ICT supply chain

**Purpose.** Manage security risks across the ICT supply chain, not just direct suppliers.

**What to do.** Assess risks from sub-suppliers and components your services depend on.

**What the auditor checks.** The auditor checks supply-chain risk is considered beyond tier-1 suppliers.

**Have ready.** Supply-chain risk assessments; supplier-of-supplier requirements.

### A.5.22 Monitoring, review and change management of supplier services

**Purpose.** Keep checking suppliers meet expectations and manage changes to their services.

**What to do.** Review suppliers on a schedule and control changes to the services they provide.

**What the auditor checks.** The auditor samples supplier reviews and change records.

**Have ready.** Supplier review records with dates (Suppliers); service change logs.

### A.5.23 Information security for use of cloud services *(new in 2022)*

**Purpose.** Use cloud services securely, from selection to exit.

**What to do.** Set rules for choosing, configuring, using and leaving cloud services.

**What the auditor checks.** The auditor checks cloud usage is governed and securely configured.

**Have ready.** Cloud usage policy; cloud security configuration/posture reports; exit plan.

## Incidents

### A.5.24 Information security incident management planning and preparation

**Purpose.** Be ready to handle incidents before one happens.

**What to do.** Create an incident response plan defining roles, steps and communication.

**What the auditor checks.** The auditor looks for an approved, workable incident plan.

**Have ready.** Approved Incident Response Plan; defined roles and contacts.

### A.5.25 Assessment and decision on information security events

**Purpose.** Assess events and decide which are security incidents.

**What to do.** Triage security events and record the decision on whether each is an incident.

**What the auditor checks.** The auditor samples events for consistent assessment decisions.

**Have ready.** Event triage records; incident classification criteria.

### A.5.26 Response to information security incidents

**Purpose.** Respond to incidents following defined procedures.

**What to do.** Work incidents through your documented response process and record actions.

**What the auditor checks.** The auditor reviews incident records for a proper, documented response.

**Have ready.** Incident records with actions and outcomes (Incidents).

### A.5.27 Learning from information security incidents

**Purpose.** Learn from incidents so they don't recur.

**What to do.** Run post-incident reviews and raise corrective actions from lessons learned.

**What the auditor checks.** The auditor checks lessons are captured and drive improvement.

**Have ready.** Post-incident review notes; the findings raised from them, with their corrective actions (Findings).

### A.5.28 Collection of evidence

**Purpose.** Preserve incident evidence properly in case it is needed legally.

**What to do.** Follow a procedure to collect and protect evidence about incidents.

**What the auditor checks.** The auditor checks evidence handling would stand up if challenged.

**Have ready.** Evidence-handling procedure; chain-of-custody records.

## Business continuity

### A.5.29 Information security during disruption

**Purpose.** Keep security working during disruption or crisis.

**What to do.** Include security in business continuity plans and test them.

**What the auditor checks.** The auditor checks continuity plans address security and are tested.

**Have ready.** Business continuity plan (security sections); BC test results.

### A.5.30 ICT readiness for business continuity *(new in 2022)*

**Purpose.** Ensure IT can recover fast enough to meet business needs.

**What to do.** Maintain a disaster recovery plan and test recovery against targets.

**What the auditor checks.** The auditor checks recovery capability and test evidence.

**Have ready.** Disaster recovery plan; recovery test records (RTO/RPO).

## Legal requirements, privacy and review

### A.5.31 Legal, statutory, regulatory and contractual requirements

**Purpose.** Know and meet every legal, regulatory and contractual security requirement.

**What to do.** Maintain a register of applicable requirements and keep it current.

**What the auditor checks.** The auditor checks legal/contractual obligations are identified and met.

**Have ready.** Legal & contractual requirements register.

### A.5.32 Intellectual property rights

**Purpose.** Respect intellectual property and licensing.

**What to do.** Use only properly licensed software and content; track licences.

**What the auditor checks.** The auditor checks for licence compliance and unlicensed software.

**Have ready.** Software licence inventory; software audit results.

### A.5.33 Protection of records

**Purpose.** Protect important records from loss, tampering and unauthorised access.

**What to do.** Set retention rules and protect key records with access control and backups.

**What the auditor checks.** The auditor checks records are retained and protected appropriately.

**Have ready.** Records retention schedule; protected storage evidence; backups.

### A.5.34 Privacy and protection of PII

**Purpose.** Protect personal data in line with privacy law.

**What to do.** Maintain a privacy policy, data inventory and processing agreements.

**What the auditor checks.** The auditor checks personal data is handled lawfully and protected.

**Have ready.** Privacy policy; data inventory / RoPA; DPAs.

### A.5.35 Independent review of information security

**Purpose.** Have security reviewed independently at planned intervals.

**What to do.** Arrange internal or external independent reviews of your security.

**What the auditor checks.** The auditor looks for independent review evidence.

**Have ready.** Internal audit reports (Audits & reviews); independent review records.

### A.5.36 Compliance with policies, rules and standards for information security

**Purpose.** Check that people and systems actually follow policies and standards.

**What to do.** Verify compliance through reviews, manager checks and the tool's status tracking.

**What the auditor checks.** The auditor samples for evidence of active compliance checking.

**Have ready.** Compliance check records; management reviews; control status tracking.

### A.5.37 Documented operating procedures

**Purpose.** Document operating procedures so key tasks are done correctly every time.

**What to do.** Write runbooks/procedures for important tasks and make them available.

**What the auditor checks.** The auditor checks documented procedures exist and are used.

**Have ready.** Documented operating procedures / runbooks.
