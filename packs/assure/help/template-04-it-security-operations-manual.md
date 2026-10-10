# IT and Security Operations Manual

> A starting point, not a finished document. Download the Word version from **Policies** → **Templates**, replace every highlighted `<placeholder>` with your own text, have it approved, then record it in **Policies** with its owner and review date.

The technical standard behind the policies: access, logging, backups, patching and change.

| Field | Value |
|---|---|
| Document ID | POL-04 |
| Owner | <IT or security role title> |
| Approver | <role title> |
| Classification | Internal |

## 1. Purpose and audience

This manual is the technical standard for <Company name>'s ISMS. It is for the people who run IT, engineering and security. Each section gives the rules for one technical area.

## 2. Assets

- Every hardware, software, data store and cloud service is recorded in the asset register, with an owner, how critical it is and how sensitive its data is.
- The register is checked every <quarter>. Assets are added when they are bought and removed when they are safely disposed of.

## 3. Access and identity

- Least access.People get the access their job needs and no more, through roles. Anything outside the role needs written approval.
- One person, one account.Shared accounts are not allowed. Service accounts have a named owner.
- Strong sign-in.Multi-factor authentication is required for <remote access, administrators and cloud services>.
- Privileged access.Limited to named administrators and reviewed every <quarter>.
- Reviews.All access is reviewed at least every <quarter> and whenever a role changes.

## 4. Encryption

- Stored data.Laptops, servers and databases holding Confidential or Restricted information are encrypted, using <standard, for example AES-256>.
- Data in transit.Traffic over the internet uses TLS 1.2 or later. Plain-text protocols are not used.
- Keys and secrets.Kept in <secrets store or password manager>, never in code or shared files. Who looks after each key, and when it is changed, is written down.

## 5. Vulnerabilities and patching

Systems are scanned for weaknesses at least <monthly>. Fixes are made within these times, counted from when the weakness is found.

| Severity | Fix within |
|---|---|
| Critical | <14 days> |
| High | <30 days> |
| Medium | <90 days> |
| Low | <next planned maintenance> |

A fix that cannot be made in time needs a recorded decision from <role title>, with the reason and the date it will be fixed.

## 6. Backups

- Production data is backed up <daily>. Backups are encrypted, and at least one copy is kept somewhere other than the system it protects.
- A restore is tested at least <twice a year>, and the result is recorded.

## 7. Logging and monitoring

- Security-relevant logs (sign-ins, administrator actions, changes) are kept in <log tool or location> and protected from change.
- Logs are kept for at least <12 months> and checked for unusual activity <how often and by whom>.
- System clocks are kept in step through <time source>.

## 8. Networks

- Networks are separated by purpose and sensitivity. Production is kept apart from the office network.
- Firewalls block everything not specifically allowed. Rule changes go through change management.
- Guest and personal-device Wi-Fi is kept apart from company systems.

## 9. Building and changing software

- Code changes are reviewed by a second person before they go live.
- Development, test and live systems are kept apart, with different credentials. Real customer data is not used for testing unless it is made anonymous.
- Software libraries are checked for known weaknesses. Releases are made only through <the approved build process>.

## 10. Change management

1. Request.Say what is changing and why.
2. Assess.Judge the risk and the effect on security and on users.
3. Approve.<role title> approves, or the change is refused.
4. Prepare.Test it, and write down how to undo it.
5. Check.Confirm after the change that everything works.

An emergency change is done first and written up within <two working days>.

## Where this comes from

| Reference | Requirement addressed |
|---|---|
| Annex A 5.9 | Inventory of information and other associated assets |
| Annex A 5.15 to 5.18 | Access control, identity, authentication information, access rights |
| Annex A 8.2 to 8.5 | Privileged access, access restriction, source code, secure authentication |
| Annex A 8.7 to 8.9 | Malware, technical vulnerabilities, configuration |
| Annex A 8.13 to 8.17 | Backup, redundancy, logging, monitoring, clock synchronisation |
| Annex A 8.20 to 8.22 | Network security |
| Annex A 8.24 | Use of cryptography |
| Annex A 8.25 to 8.32 | Secure development and change management |
