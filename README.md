# DVWA Setup Guide

> A clean, beginner-friendly installation guide for **Damn Vulnerable Web Application** on Ubuntu and Kali Linux — with a polished web interface and copyable terminal commands.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-3b82f6?style=flat-square&logo=github)](https://muhammad-aqib-bashir.github.io/DVWA-setup-guide/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/Muhammad-Aqib-Bashir/DVWA-setup-guide/pulls)
[![Stars](https://img.shields.io/github/stars/Muhammad-Aqib-Bashir/DVWA-setup-guide?style=flat-square&color=yellow)](https://github.com/Muhammad-Aqib-Bashir/DVWA-setup-guide/stargazers)

---

## What Is This?

This is a **static web guide** that walks you through installing DVWA on Ubuntu or Kali Linux in 13 clear steps. Every command is copyable with one click. No registration, no ads, no fluff.

DVWA itself is a PHP/MySQL web app built by [digininja](https://github.com/digininja) to help developers and security students practice exploiting common web vulnerabilities in a safe, legal environment.

---

## Features

- 13 numbered steps covering the full LAMP + DVWA setup
- One-click copy buttons on every code block
- Sticky sidebar navigation with active-step highlighting
- Responsive — works on desktop and mobile
- Info, warning, and success callout boxes
- Quick Reference section for common service commands
- No dependencies, no build step — pure HTML/CSS/JS

---

## Live Guide

**[https://muhammad-aqib-bashir.github.io/DVWA-setup-guide/](https://muhammad-aqib-bashir.github.io/DVWA-setup-guide/)**

---

## What You'll Install

| Component       | Purpose                              |
| --------------- | ------------------------------------ |
| Apache2         | Serves the DVWA web interface        |
| MySQL / MariaDB | Stores user data and challenge state |
| PHP 8.2         | Runs DVWA's backend logic            |
| DVWA            | The vulnerable application itself    |

---

## Quick Overview of Steps

1. Verify and start Apache + MySQL services
2. Navigate to the Apache web root (`/var/www/html`)
3. Clone the DVWA repository from GitHub
4. Set correct file permissions for `www-data`
5. Create the config file from the provided template
6. Edit database credentials in `config.inc.php`
7. Connect to MySQL as root
8. Create the `dvwa` database and user with full privileges
9. Configure PHP settings (`allow_url_include`, `display_errors`)
10. Restart Apache to apply changes
11. Verify required PHP modules are installed
12. Open `http://localhost/DVWA` and initialize the database
13. Log in with default credentials and start practicing

---

## Prerequisites

- Ubuntu 22.04+ or Kali Linux (latest rolling release)
- `sudo` privileges
- Internet access (to clone DVWA from GitHub)
- Apache2, MySQL/MariaDB, and PHP 8.2 installed
  ```bash
  sudo apt update && sudo apt install apache2 mysql-server php php-mysqli php-gd php-curl libapache2-mod-php -y
  ```

---

## Local Development

This guide is a single self-contained HTML file. To run it locally:

```bash
git clone https://github.com/Muhammad-Aqib-Bashir/DVWA-setup-guide.git
cd DVWA-setup-guide
# Open index.html in your browser
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

No build tools or package installs needed.

---

## Deploying to GitHub Pages

1. Go to your repository **Settings → Pages**
2. Under **Source**, select `Deploy from a branch`
3. Choose `main` branch and `/ (root)` folder
4. Click **Save** — your site will be live in ~60 seconds

---

## Security Notice

> ⚠️ DVWA is intentionally vulnerable. **Never** expose it on a public network or production server. Run it only on a local machine or an isolated lab environment. The PHP settings enabled in this guide (`allow_url_include = On`) are dangerous in any real-world context.

---

## Contributing

Bug reports, corrections, and improvements are welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b fix/typo-step-9`
3. Commit your changes: `git commit -m "fix: corrected PHP version in step 9"`
4. Push and open a Pull Request

Please keep pull requests focused on a single change.

---

## Related Resources

- [DVWA Official Repository](https://github.com/digininja/DVWA) — by digininja
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — the vulnerability categories DVWA covers
- [OWASP](https://owasp.org/) — Open Web Application Security Project
- [Kali Linux Downloads](https://www.kali.org/downloads/)
- [Ubuntu Downloads](https://ubuntu.com/download)

---

## License

This guide is released under the [MIT License](LICENSE).  
DVWA itself is licensed separately — see the [DVWA license](https://github.com/digininja/DVWA/blob/master/LICENSE.md).

---

<p align="center">Made to help beginners get into web security without the setup headache.</p>
