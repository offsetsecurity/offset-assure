# Collecting evidence from the cloud

Most of the proof an auditor wants already exists in your cloud console. The
work is exporting it, dating it, and attaching it to the right control.

Export as PDF or CSV, name it so the date is obvious, and record the collected
date in **Evidence**. Re-collect quarterly; anything older than 90 days is
flagged here.

## Microsoft 365 and Entra ID

| Proof | Where | Controls |
|---|---|---|
| Multi-factor authentication is enforced | Entra ID → Conditional Access → policy, exported | A.8.5, A.5.17 |
| Who has admin roles | Entra ID → Roles and administrators | A.8.2, A.5.18 |
| Access review results | Entra ID Governance → Access reviews | A.5.18 |
| Leavers disabled | Entra ID → Users, filtered by sign-in status | A.6.5 |
| Mailbox audit log | Purview → Audit search, exported | A.8.15 |
| Data loss prevention rules | Purview → Data loss prevention | A.8.12 |
| Device compliance | Intune → Devices → Compliance | A.8.1 |

## AWS

| Proof | Where | Controls |
|---|---|---|
| Root account has MFA and is unused | IAM → Credential report | A.8.2, A.8.5 |
| Who can do what | IAM → Access Analyzer findings, policy export | A.5.15, A.8.3 |
| Logging is on and kept | CloudTrail → Trails, S3 lifecycle rules | A.8.15, A.5.33 |
| Encryption at rest | KMS key list, S3 bucket settings | A.8.24 |
| Backups run and restore | AWS Backup → Jobs, and a restore test record | A.8.13 |
| Patch level | Systems Manager → Patch compliance | A.8.8 |
| Network exposure | Security Groups, Config rules | A.8.20, A.8.22 |

## Google Workspace and Google Cloud

| Proof | Where | Controls |
|---|---|---|
| Two-step verification enforced | Admin console → Security → Authentication | A.8.5 |
| Admin activity | Admin console → Reporting → Audit | A.8.15 |
| Sharing rules | Admin console → Apps → Drive → Sharing settings | A.5.14, A.8.12 |
| Who has project access | IAM & Admin → IAM, exported | A.5.15, A.8.2 |
| Logging and retention | Cloud Logging → Log buckets | A.8.15, A.5.33 |

## What makes an export good evidence

**It shows the date it was taken.** A screenshot with no date proves nothing.

**It shows the whole setting, not the part that flatters you.** An auditor who
finds the crop will ask what else was cropped.

**It says who took it.** The evidence record does that for you.

**It matches what the control claims.** If the control says reviews happen
quarterly, the export should show four of them.

## A quarterly routine that works

1. Export the ten items above that apply to you, on the same day each quarter.
2. Attach each to its control, with the collected date.
3. Fix what the exports reveal — they usually reveal something.
4. Note the round in **Audits & reviews** if somebody independent checked it.
