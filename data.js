// ============================================
// BOUNTY JOURNAL — Bug Hunting Entries
// Lexy Dehermes · Hermes Agentic AI
// ============================================

const staticEntries = [
  {
    id: "BOUNTY-2025-001",
    title: "IDOR in User Profile Export Allows Mass Data Exfiltration",
    severity: "critical",
    target: "api.targetsaas.com",
    date: "2025-03-28",
    bounty: 4500,
    cve: null,
    cvss: 9.1,
    technique: "IDOR / Broken Object Level Authorization",
    description: "Discovered an Insecure Direct Object Reference (IDOR) vulnerability in the user profile export endpoint. By incrementing the `user_id` parameter in `GET /api/v2/export/profile?user_id=<id>`, any authenticated user could download the full profile data (PII, payment info, API keys) of any other user on the platform. No authorization check existed on the server side. Impact: 2.4M user records potentially exposed.",
    steps: `1. Logged in as a normal user account
2. Observed the export endpoint: GET /api/v2/export/profile?user_id=4521
3. Changed user_id to 4522 — received another user's complete profile
4. Wrote a script to enumerate user_id 1-100000
5. Confirmed mass data access across the entire user base
6. Reported to the security team with proof of concept`,
    impact: "Full PII exposure of all platform users including names, emails, phone numbers, billing addresses, and API keys. Potential for complete account takeover chain.",
    remediation: "Implement server-side authorization check: verify the requesting user owns the requested profile_id OR has admin privileges. Use UUIDs instead of sequential integers for user identifiers.",
    status: "Resolved",
    references: [
      "https://owasp.org/www-project-api-security/"
    ]
  },
  {
    id: "BOUNTY-2025-002",
    title: "Blind SQL Injection in Search Filter — Time-Based Extraction",
    severity: "critical",
    target: "shop.partnerstore.io",
    date: "2025-03-15",
    bounty: 3200,
    cve: null,
    cvss: 8.8,
    technique: "Blind SQL Injection (Time-Based)",
    description: "Found a blind SQL injection in the product search filter parameter `sort_by`. The application used the parameter directly in an ORDER BY clause without sanitization. Using PostgreSQL's `pg_sleep()`, I confirmed full database access. Extracted admin credentials and accessed the internal admin panel.",
    steps: `1. Intercepted search request: POST /search with body {"sort_by": "price"}
2. Injected: "price ASC,(SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)--"
3. Response delayed by 5 seconds — confirmed injection
4. Used sqlmap to automate: extracted users table, admin hashes
5. Cracked admin hash offline (bcrypt, weak password "admin123!")
6. Logged into admin panel at /admin — full system compromise`,
    impact: "Complete database compromise including 850K customer records, admin credentials, and internal system access. Potential to modify orders, steal credit card tokens.",
    remediation: "Use parameterized queries / prepared statements. Implement WAF rules. Never concatenate user input into SQL queries. Apply least privilege database accounts.",
    status: "Resolved",
    references: [
      "https://portswigger.net/web-security/sql-injection"
    ]
  },
  {
    id: "BOUNTY-2025-003",
    title: "Stored XSS via Markdown Editor — Wormable Chain",
    severity: "high",
    target: "docs.collabspace.dev",
    date: "2025-03-10",
    bounty: 1800,
    cve: null,
    cvss: 7.5,
    technique: "Stored Cross-Site Scripting (XSS)",
    description: "The collaborative documentation platform allowed Markdown with raw HTML. Their sanitizer (DOMPurify) was bypassed using a mutation XSS technique with `<math><style>` tags. Since the payload executed in other users' sessions when they viewed the document, this could be used for session hijacking and worm propagation.",
    steps: `1. Created a new document with the following Markdown:
   <math><style><img src=x onerror=alert(document.cookie)></style></math>
2. Saved the document — no sanitization applied
3. Opened the document in a fresh browser (different user) — XSS fired
4. Crafted payload to exfiltrate session tokens to attacker server
5. Confirmed full account takeover of any user viewing the document`,
    impact: "Session hijacking, credential theft, document exfiltration. Wormable: infected documents could auto-share and propagate to all workspace members.",
    remediation: "Use server-side HTML sanitization with updated DOMPurify. Disable raw HTML in Markdown editor. Implement CSP headers with strict nonce-based policy.",
    status: "Resolved",
    references: [
      "https://research.securitum.com/mutation-xss-via-mathml-mutation-dompurify-2-0-17-bypass/"
    ]
  },
  {
    id: "BOUNTY-2025-004",
    title: "JWT Token None Algorithm Bypass — Full API Access",
    severity: "high",
    target: "api.healthsync.med",
    date: "2025-02-22",
    bounty: 2500,
    cve: null,
    cvss: 8.2,
    technique: "JWT Algorithm Confusion Attack",
    description: "The healthcare API used JWT for authentication. Discovered that the server accepted tokens signed with the 'none' algorithm. By removing the signature and setting `alg: none`, any user could be impersonated including admin accounts. Accessed sensitive patient health records.",
    steps: `1. Captured a valid JWT: eyJhbGciOiJSUzI1NiIsInR5cCI6...
2. Decoded the payload: {"sub":"1234","role":"patient"}
3. Modified header: {"alg":"none","typ":"JWT"}
4. Modified payload: {"sub":"1","role":"admin"}
5. Removed signature, sent: header.payload. (trailing dot)
6. Server accepted — full admin API access granted`,
    impact: "Complete bypass of authentication. Access to all patient health records (PHI), ability to modify prescriptions, view medical histories across the entire platform.",
    remediation: "Explicitly whitelist accepted JWT algorithms on the server (only RS256, ES256). Reject tokens with 'none' algorithm. Rotate all signing keys.",
    status: "Resolved",
    references: [
      "https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/"
    ]
  },
  {
    id: "BOUNTY-2025-005",
    title: "SSRF via PDF Generator — AWS Metadata Exfiltration",
    severity: "medium",
    target: "reports.fintechdashboard.com",
    date: "2025-02-14",
    bounty: 1200,
    cve: null,
    cvss: 6.5,
    technique: "Server-Side Request Forgery (SSRF)",
    description: "The PDF report generator accepted a URL for the report cover image. The server fetched the URL without validation, allowing internal network requests. Exploited this to access AWS EC2 metadata at 169.254.169.254, revealing IAM credentials and internal service endpoints.",
    steps: `1. Found endpoint: POST /generate-report with body {"cover_image_url": "https://..."}
2. Changed URL to: http://169.254.169.254/latest/meta-data/
3. The generated PDF showed the metadata directory listing!
4. Extracted IAM role credentials from:
   http://169.254.169.254/latest/meta-data/iam/security-credentials/
5. Used credentials to access internal S3 buckets`,
    impact: "AWS IAM credential leakage, internal network reconnaissance, access to internal S3 buckets containing financial reports.",
    remediation: "Implement URL allowlist (only https://public-cdn.domain/*). Block access to internal IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254). Use a separate VPC for PDF generation service.",
    status: "Resolved",
    references: [
      "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery"
    ]
  },
  {
    id: "BOUNTY-2025-006",
    title: "Race Condition in Coupon Code — Infinite Discount",
    severity: "medium",
    target: "checkout.shopmax.com",
    date: "2025-01-30",
    bounty: 800,
    cve: null,
    cvss: 5.3,
    technique: "Race Condition / TOCTOU",
    description: "Found a Time-of-Check Time-of-Use (TOCTOU) bug in the coupon validation system. By sending multiple parallel checkout requests, the same single-use coupon code could be applied multiple times before the first transaction marked it as used.",
    steps: `1. Obtained a "WELCOME50" coupon — 50% off, single use
2. Sent 10 parallel POST /checkout/apply-coupon requests using Burp Turbo Intruder
3. All 10 requests succeeded — coupon applied 10x simultaneously
4. Each order got 50% discount with the same code
5. Could be exploited at scale for massive fraud`,
    impact: "Financial loss through coupon abuse. If combined with gift cards, potential for infinite money glitch.",
    remediation: "Use database-level locking (SELECT FOR UPDATE) when redeeming coupons. Implement idempotency keys for checkout operations. Add rate limiting on coupon endpoints.",
    status: "Resolved",
    references: [
      "https://portswigger.net/research/turbo-intruder-embracing-the-billion-request-attack"
    ]
  },
  {
    id: "BOUNTY-2025-007",
    title: "GraphQL Introspection Leaks Hidden Admin Mutations",
    severity: "low",
    target: "api.socialapp.io",
    date: "2025-01-18",
    bounty: 400,
    cve: null,
    cvss: 4.0,
    technique: "GraphQL Introspection Abuse",
    description: "The GraphQL endpoint had introspection enabled in production. Discovered hidden admin mutations: `muteAllUsers`, `shadowBanUser`, `purgePosts`. While these required admin auth, combined with other bugs this could enable platform-wide abuse.",
    steps: `1. Sent introspection query to /graphql
2. Retrieved full schema including hidden types
3. Found mutations prefixed with "admin_": muteAllUsers, shadowBanUser, etc.
4. Documented all exposed admin functionality
5. The mutations lacked rate limiting — even with auth, dangerous`,
    impact: "Information disclosure of internal admin functionality. Combined with privilege escalation, could lead to platform-wide disruption.",
    remediation: "Disable GraphQL introspection in production. Implement field-level authorization. Add query depth/complexity limits.",
    status: "Resolved",
    references: [
      "https://graphql.org/learn/introspection/"
    ]
  },
  {
    id: "BOUNTY-2025-008",
    title: "Open Redirect in OAuth Flow — Phishing Vector",
    severity: "low",
    target: "auth.unifiedlogin.io",
    date: "2025-01-05",
    bounty: 300,
    cve: null,
    cvss: 3.7,
    technique: "Open Redirect via OAuth redirect_uri",
    description: "The OAuth 2.0 implementation did not properly validate the `redirect_uri` parameter. Attackers could craft a malicious link that appeared to go to the legitimate auth provider but redirected victims to a phishing page after authentication.",
    steps: `1. Analyzed OAuth flow: GET /oauth/authorize?redirect_uri=...
2. Changed redirect_uri to: https://evil.com/phish
3. The server accepted it without whitelist validation
4. Full OAuth flow completed, token sent to attacker's domain
5. Could be used in targeted phishing campaigns`,
    impact: "Phishing vector — users could be tricked into granting OAuth tokens to malicious third parties.",
    remediation: "Implement strict redirect_uri whitelist. Use exact matching (not pattern matching). Validate redirect_uri against registered client callbacks.",
    status: "Resolved",
    references: [
      "https://oauth.net/advisories/2014-1-covert-redirect/"
    ]
  },
  {
    id: "BOUNTY-2025-009",
    title: "CORS Misconfiguration Exposes Session Tokens via Subdomain",
    severity: "info",
    target: "cdn.techportal.net",
    date: "2024-12-20",
    bounty: 0,
    cve: null,
    cvss: 3.1,
    technique: "CORS Misconfiguration",
    description: "The CDN subdomain had overly permissive CORS headers (`Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`). While the CDN itself only served static assets, session cookies were scoped to `*.techportal.net`, meaning any compromised subdomain or malicious page could read authenticated responses.",
    steps: `1. Checked CORS headers on cdn.techportal.net/api/status
2. Found: Access-Control-Allow-Origin: *
   AND Access-Control-Allow-Credentials: true
3. This combination is invalid per spec but some browsers had bugs
4. Documented as a defense-in-depth issue
5. No immediate exploit but weakened overall security posture`,
    impact: "Theoretical: weakened cookie security model. In practice, most browsers reject this combination.",
    remediation: "Remove Access-Control-Allow-Credentials: true from the CDN. Properly configure CORS for each origin that needs it.",
    status: "Informational",
    references: [
      "https://portswigger.net/web-security/cors"
    ]
  }
];

// Derived stats (for static fallback only)
const _staticTotalBugs = staticEntries.length;
