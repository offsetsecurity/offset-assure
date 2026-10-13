# Annex A.8: Technological controls

The 34 technological controls are the technical measures: endpoints, privileged access, authentication, malware, vulnerabilities, configuration, data protection, backups, logging and monitoring, networks, cryptography, and secure development.

These are where auditors ask to see systems, not documents: a screenshot of MFA settings, a vulnerability scan, a backup log, a firewall rule set. Collect the evidence straight from the systems, and date it.

Part of [the audit-ready handbook](iso-01-certification.md). Previous: [Annex A.7: Physical controls](iso-11-annex-a-7.md). Next: [Mandatory documents](iso-13-mandatory-documents.md).

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

## Endpoints, access and authentication

### A.8.1 User endpoint devices

**Purpose.** Secure every endpoint that touches company information.

**What to do.** Manage and secure laptops, desktops and phones (encryption, MDM).

**What the auditor checks.** The auditor checks endpoint protection coverage.

**Have ready.** MDM/endpoint policy; disk encryption reports; device inventory.

### A.8.2 Privileged access rights

**Purpose.** Strictly control powerful/administrator access.

**What to do.** Limit, approve and regularly review privileged accounts.

**What the auditor checks.** The auditor samples privileged accounts and their approvals/reviews.

**Have ready.** Privileged account list; approvals; periodic privileged access reviews.

### A.8.3 Information access restriction

**Purpose.** Restrict information access to those who need it.

**What to do.** Configure access so users only reach what their role requires.

**What the auditor checks.** The auditor tests access against need-to-know.

**Have ready.** Access configurations; role-permission mappings.

### A.8.4 Access to source code

**Purpose.** Control access to source code and dev tools.

**What to do.** Restrict who can read/change source code and protect branches.

**What the auditor checks.** The auditor checks repository access and controls.

**Have ready.** Repository permissions; branch protection settings.

### A.8.5 Secure authentication

**Purpose.** Use strong authentication, including MFA where it matters.

**What to do.** Enforce strong sign-in and multi-factor authentication on key systems.

**What the auditor checks.** The auditor checks MFA and authentication strength.

**Have ready.** MFA configuration screenshots; authentication policy/settings.

## Capacity, malware, vulnerabilities and configuration

### A.8.6 Capacity management

**Purpose.** Manage capacity so systems keep running.

**What to do.** Monitor storage/compute/people capacity and plan ahead.

**What the auditor checks.** The auditor checks capacity is monitored and planned.

**Have ready.** Capacity monitoring dashboards; capacity plans.

### A.8.7 Protection against malware

**Purpose.** Protect against malware with tools and awareness.

**What to do.** Deploy anti-malware/EDR and train users to spot threats.

**What the auditor checks.** The auditor checks malware protection coverage and awareness.

**Have ready.** Antivirus/EDR coverage reports; malware awareness training records.

### A.8.8 Management of technical vulnerabilities

**Purpose.** Find and fix technical vulnerabilities in good time.

**What to do.** Scan for vulnerabilities and patch within defined timeframes.

**What the auditor checks.** The auditor checks scanning cadence and remediation SLAs.

**Have ready.** Vulnerability scan reports; patch records; remediation SLA/policy.

### A.8.9 Configuration management *(new in 2022)*

**Purpose.** Configure systems securely and keep them that way.

**What to do.** Apply hardened baselines and monitor for configuration drift.

**What the auditor checks.** The auditor checks secure baselines and drift monitoring.

**Have ready.** Configuration baselines/standards; config monitoring or posture reports.

## Protecting data

### A.8.10 Information deletion *(new in 2022)*

**Purpose.** Delete information when no longer needed.

**What to do.** Apply deletion rules and record deletions.

**What the auditor checks.** The auditor checks data is deleted per rules.

**Have ready.** Data deletion policy; deletion logs.

### A.8.11 Data masking *(new in 2022)*

**Purpose.** Mask sensitive data where full detail is not required.

**What to do.** Mask or anonymise data in test and non-essential contexts.

**What the auditor checks.** The auditor checks masking where appropriate.

**Have ready.** Data masking settings; anonymised test data samples.

### A.8.12 Data leakage prevention *(new in 2022)*

**Purpose.** Prevent sensitive data leaking out.

**What to do.** Deploy data leakage prevention on email, uploads and devices.

**What the auditor checks.** The auditor checks DLP rules and alerts.

**Have ready.** DLP policy/rules; DLP alert/review records.

### A.8.13 Information backup

**Purpose.** Back up information and prove restores work.

**What to do.** Back up systems/data and test restores regularly.

**What the auditor checks.** The auditor checks backups run and restores are tested.

**Have ready.** Backup configuration; successful restore test records.

### A.8.14 Redundancy of information processing facilities

**Purpose.** Build in redundancy so single failures don't take you down.

**What to do.** Provide redundant infrastructure and test failover.

**What the auditor checks.** The auditor checks redundancy and failover tests.

**Have ready.** Redundancy architecture; failover test results.

## Logging and monitoring

### A.8.15 Logging

**Purpose.** Record, protect and review activity logs.

**What to do.** Enable logging, protect logs, and review them.

**What the auditor checks.** The auditor checks logging coverage, retention and review.

**Have ready.** Logging configuration; log retention settings; log review notes.

### A.8.16 Monitoring activities *(new in 2022)*

**Purpose.** Watch systems for suspicious behaviour.

**What to do.** Monitor and alert on anomalies that could indicate attacks.

**What the auditor checks.** The auditor checks monitoring and investigated alerts.

**Have ready.** Monitoring/alerting setup; investigated alert records.

### A.8.17 Clock synchronization

**Purpose.** Keep clocks synchronised so logs line up.

**What to do.** Synchronise system clocks via NTP.

**What the auditor checks.** The auditor checks time synchronisation.

**Have ready.** NTP/time-sync configuration.

## Utilities, software installation, networks and cryptography

### A.8.18 Use of privileged utility programs

**Purpose.** Restrict powerful utilities that can bypass controls.

**What to do.** Limit and control use of privileged utility programs.

**What the auditor checks.** The auditor checks utility use is restricted and logged.

**Have ready.** Restricted utility list; usage approvals/logs.

### A.8.19 Installation of software on operational systems

**Purpose.** Control software installation on operational systems.

**What to do.** Govern what software can be installed via allow-listing and change control.

**What the auditor checks.** The auditor checks installation is controlled.

**Have ready.** Software installation policy; allow-list; change approvals.

### A.8.20 Networks security

**Purpose.** Secure and manage networks.

**What to do.** Configure and manage network security to protect data in transit.

**What the auditor checks.** The auditor reviews network security configuration.

**Have ready.** Firewall rules; network security settings/diagram.

### A.8.21 Security of network services

**Purpose.** Secure network services and hold providers to requirements.

**What to do.** Define security requirements for network services and enforce them.

**What the auditor checks.** The auditor checks service security requirements and delivery.

**Have ready.** Network service configurations; provider agreements/SLAs.

### A.8.22 Segregation of networks

**Purpose.** Segregate networks so a breach can't reach everything.

**What to do.** Split networks into zones (VLANs/segments) to contain breaches.

**What the auditor checks.** The auditor checks network segmentation.

**Have ready.** Network diagram showing segmentation; VLAN/segment configuration.

### A.8.23 Web filtering *(new in 2022)*

**Purpose.** Filter access to dangerous or inappropriate sites.

**What to do.** Deploy web filtering/proxy controls.

**What the auditor checks.** The auditor checks web filtering is in place.

**Have ready.** Web filter/proxy configuration.

### A.8.24 Use of cryptography

**Purpose.** Use cryptography properly, including key management.

**What to do.** Apply encryption to the right data and manage keys securely.

**What the auditor checks.** The auditor checks encryption use and key management.

**Have ready.** Cryptography policy; encryption standards; key management records.

## Development, change, test data and audit testing

### A.8.25 Secure development life cycle

**Purpose.** Build security into the whole development lifecycle.

**What to do.** Define a secure development lifecycle with security gates.

**What the auditor checks.** The auditor checks security is built into development.

**Have ready.** Secure development policy; pipeline security gate evidence.

### A.8.26 Application security requirements

**Purpose.** Define the security an application must have.

**What to do.** Set security requirements for apps you build or buy.

**What the auditor checks.** The auditor checks security requirements exist and are met.

**Have ready.** Application security requirements in specs/purchase decisions.

### A.8.27 Secure system architecture and engineering principles

**Purpose.** Design systems using secure architecture principles.

**What to do.** Apply secure architecture and engineering principles in design.

**What the auditor checks.** The auditor reviews design and architecture decisions.

**Have ready.** Architecture/design documents; architecture review records.

### A.8.28 Secure coding *(new in 2022)*

**Purpose.** Write code securely so common flaws never appear.

**What to do.** Follow secure coding standards and use code analysis tools.

**What the auditor checks.** The auditor checks coding standards and analysis results.

**Have ready.** Secure coding standards; SAST/code analysis reports.

### A.8.29 Security testing in development and acceptance

**Purpose.** Test security during development and before go-live.

**What to do.** Run security testing in development and at acceptance.

**What the auditor checks.** The auditor checks security testing evidence.

**Have ready.** Security test reports; penetration test results.

### A.8.30 Outsourced development

**Purpose.** Keep control of security when development is outsourced.

**What to do.** Set security requirements for outsourced development and review the output.

**What the auditor checks.** The auditor checks outsourced work meets security requirements.

**Have ready.** Outsourcing security requirements; review/acceptance records.

### A.8.31 Separation of development, test and production environments

**Purpose.** Separate development, test and production.

**What to do.** Keep environments separate with different access and credentials.

**What the auditor checks.** The auditor checks environment separation.

**Have ready.** Environment architecture; separate credentials/access evidence.

### A.8.32 Change management

**Purpose.** Control changes to systems.

**What to do.** Manage changes through a defined process with approvals and rollback.

**What the auditor checks.** The auditor samples changes for proper control.

**Have ready.** Change management policy; change requests/approvals; rollback plans.

### A.8.33 Test information

**Purpose.** Protect data used for testing.

**What to do.** Avoid real data in testing; protect any test data used.

**What the auditor checks.** The auditor checks test data handling.

**Have ready.** Test data policy; anonymised test datasets.

### A.8.34 Protection of information systems during audit testing

**Purpose.** Protect live systems during audits and tests.

**What to do.** Agree scope and protections before audit tests touch production.

**What the auditor checks.** The auditor checks audit activities were controlled.

**Have ready.** Agreed audit scope/access; protective arrangements during testing.
