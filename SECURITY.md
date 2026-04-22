# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.17.x  | :white_check_mark: |
| < 1.17  | :x:                |

## Reporting a Vulnerability

We take the security of Blocklet Server seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

Please report security vulnerabilities through GitHub's Security Advisory feature:

1. Go to the **Security** tab of this repository
2. Click **"Report a vulnerability"**
3. Fill in the vulnerability details

Alternatively, you can email us at **blocklet@arcblock.io** with the subject line "Security Vulnerability Report".

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., buffer overflow, SQL injection, cross-site scripting)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability and how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 7-14 days
  - High: 30 days
  - Medium: 60 days
  - Low: 90 days

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.

2. **Communication**: We will keep you informed of the progress toward a fix and full announcement.

3. **Credit**: We will credit you in the security advisory if you wish (please let us know your preferred name/handle).

4. **Disclosure**: We follow coordinated disclosure practices. We ask that you give us reasonable time to address the issue before any public disclosure.

## Security Best Practices for Users

When deploying Blocklet Server, please follow these security best practices:

### Environment Configuration

- Always use HTTPS in production
- Keep your `ABT_NODE_SK` and other secrets secure
- Never commit secrets to version control
- Use environment variables for sensitive configuration

### Network Security

- Configure proper firewall rules
- Use a reverse proxy (nginx, Caddy) with TLS termination
- Limit access to management interfaces

### Updates

- Keep Blocklet Server updated to the latest version
- Subscribe to security announcements
- Regularly review and update dependencies
