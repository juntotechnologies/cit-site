# Comprehensive Website Audit & Project Proposals: chem-is-try.com

**Date Audited:** 27 Feb, 2026
**Auditor:** Reliqus (Ankit Bhatia, CEO)
**Status:** 🚨 CRITICAL VULNERABILITIES IDENTIFIED

---

## 🛑 EMERGENCY SECURITY ALERT
**Issue:** The website intermittently triggers the **WordPress Installation Screen**.
**Risk:** This is a catastrophic security flaw. Any user reaching this screen can reconfigure the site, granting themselves full administrative access and potentially deleting the entire database and file system. This requires **immediate** intervention.

---

## 1. Executive Summary
The audit of `chem-is-try.com` reveals a site suffering from technical debt, outdated core infrastructure, and a complete lack of mobile optimization. While the current site functions as a basic catalog, it is difficult for the staff to maintain and presents a significant security risk to company data.

### Key Technical Findings
1.  **Outdated Infrastructure:** Running WordPress 5.6.16 and PHP 7.4.33 (Security risk).
2.  **Broken UX:** No mobile responsiveness; the "hamburger" menu is missing on small screens.
3.  **Maintenance Blockers:** Difficulties in updating chemical structures and making manual backups.
4.  **Performance:** Heavy plugins (Slider Revolution) and unoptimized images causing high load times.

---

## 2. Detailed Audit Results

### Security & Backend
| Check | Status | Details |
| :--- | :--- | :--- |
| **WordPress Core** | ❌ Outdated | Version 5.6.16 (Current: 6.9.1) |
| **PHP Version** | ❌ Outdated | Version 7.4.33 (Below recommended 8.0+) |
| **Security Plugin** | ⚠️ Warning | Wordfence installed but **not configured** |
| **Backup Status** | ⚠️ Warning | UpdraftPlus installed but **no automated schedule** |
| **SSL / HTTPS** | ✅ Pass | Valid certificate and redirect active |

### Performance Metrics
* **Mobile PageSpeed Score:** 56/100
* **Largest Contentful Paint (LCP):** 11.9s (Mobile)
* **HTTP Requests:** 173 (Extremely high)
* **Image Optimization:** None (Large PNG/JPEGs, no WebP format)

### Mobile & Tablet Compatibility
The site currently lacks a responsive CSS framework.
* **Layout:** Serves a desktop-fixed width to mobile devices (requires pinching/zooming).
* **Navigation:** Primary menu fails to collapse into a mobile-friendly format.
* **UI Elements:** Call-to-action (CTA) buttons and product text are below touch-target size standards.

---

## 3. Operational Pain Points
Based on communications with Ushma Srivastava, the internal team is facing significant hurdles:
* **Content Management:** Difficulty updating text and images without breaking design harmony.
* **Chemical Structures:** Current system makes modifying chemical data complicated.
* **Slider Instability:** Slider Revolution displays inconsistently across different browsers.
* **Data Integrity:** Lack of a staging environment means changes are "tested" on the live site.

---

## 4. Proposed Solutions

### Option A: Website Deficiency Correction (The "Patch")
*Focus: Stabilizing and securing the current site.*
* **Investment:** $650
* **Timeline:** 2 Weeks
* **Scope:**
    * Fix the Installation Screen vulnerability.
    * Upgrade WP Core, PHP, and all plugins.
    * Configure Wordfence Firewall and login protection.
    * Setup automated off-site backups.
    * Perform basic mobile CSS fixes (Layout stacking).
    * Cleanup 20+ unnecessary/junk public pages.
* **Note:** This fixes the *bugs* but does not fix the *architecture*. Editing difficulties will remain.

### Option B: New Development & Modernization (The "Rebuild")
*Focus: Long-term scalability and ease of use.*
* **Investment:** $3,000 – $4,000
* **Timeline:** 8–10 Weeks
* **Scope:**
    * **AI-Ready Data:** Chemical structures managed via schemas for Google indexing.
    * **User Experience:** Modern, fast, and 100% mobile-responsive design.
    * **Ease of Use:** New backend structure for simple "no-code" content updates.
    * **Advanced Features:** Secure customer sign-in implementation.
    * **Performance:** Built on a lightweight, optimized architecture.

---

## 5. Next Steps & Recommendations

1.  **Immediate:** Provide credentials (if not already shared via WhatsApp) to allow the audit team to investigate the database connection strings causing the install screen error.
2.  **Short-Term:** Proceed with the **$650 Fix** immediately to close security loopholes while considering the long-term rebuild.
3.  **Long-Term:** Schedule a follow-up call with Dr. Romi Singh and Dr. Praful Porwal to review the "New Development" scope of work.



---
**Auditor Note:** *Regardless of which proposal is chosen, the unused themes and plugins (Twenty Nineteen, Twenty Twenty-One, etc.) should be removed immediately to reduce the attack surface.*

---

## Rebuild Status (as of 2026-03-02)

The Astro 5 static rebuild at this repository addresses the following original issues:

### ✅ Resolved by Rebuild
- WordPress Install Screen vulnerability — no WordPress, static HTML
- Outdated WP/PHP stack — replaced by Astro 5 / Node build pipeline
- Wordfence not configured — N/A
- No automated backups — source controlled in git
- Slider Revolution heavy plugin — replaced with ~20-line vanilla JS
- No mobile hamburger menu — implemented in `src/layouts/Layout.astro`
- 173 HTTP requests — reduced to 1 CSS bundle + minimal JS
- No staging environment — git-based PR workflow

### ⚠️ Remaining Gaps (addressed in commit following this doc)
- No JSON-LD structured data (Product + Organization schemas) — **now added**
- No sitemap.xml — **now added via @astrojs/sitemap**
- No robots.txt — **now added**
- No Open Graph / Twitter Card meta tags — **now added**
- Formspree IDs still placeholders (`YOUR_FORM_ID`) — requires real account credentials
