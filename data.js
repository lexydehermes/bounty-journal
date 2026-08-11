     1|// ============================================
     2|// MOUSY JOURNAL — Bug Hunting Entries
     3|// Lexy Dehermes
     4|// ============================================
     5|
     6|const journalEntries = [
     7|  {
     8|    id: "BOUNTY-2025-001",
     9|    title: "IDOR in User Profile Export Allows Mass Data Exfiltration",
    10|    severity: "critical",
    11|    target: "api.targetsaas.com",
    12|    date: "2025-03-28",
    13|    bounty: 4500,
    14|    cve: null,
    15|    cvss: 9.1,
    16|    technique: "IDOR / Broken Object Level Authorization",
    17|    description: "Discovered an Insecure Direct Object Reference (IDOR) vulnerability in the user profile export endpoint. By incrementing the `user_id` parameter in `GET /api/v2/export/profile?user_id=<id>`, any authenticated user could download the full profile data (PII, payment info, API keys) of any other user on the platform. No authorization check existed on the server side. Impact: 2.4M user records potentially exposed.",
    18|    steps: `1. Logged in as a normal user account
    19|2. Observed the export endpoint: GET /api/v2/export/profile?user_id=4521
    20|3. Changed user_id to 4522 — received another user's complete profile
    21|4. Wrote a script to enumerate user_id 1-100000
    22|5. Confirmed mass data access across the entire user base
    23|6. Reported to the security team with proof of concept`,
    24|    impact: "Full PII exposure of all platform users including names, emails, phone numbers, billing addresses, and API keys. Potential for complete account takeover chain.",
    25|    remediation: "Implement server-side authorization check: verify the requesting user owns the requested profile_id OR has admin privileges. Use UUIDs instead of sequential integers for user identifiers.",
    26|    status: "Resolved",
    27|    references: [
    28|      "https://owasp.org/www-project-api-security/"
    29|    ]
    30|  },
    31|  {
    32|    id: "BOUNTY-2025-002",
    33|    title: "Blind SQL Injection in Search Filter — Time-Based Extraction",
    34|    severity: "critical",
    35|    target: "shop.partnerstore.io",
    36|    date: "2025-03-15",
    37|    bounty: 3200,
    38|    cve: null,
    39|    cvss: 8.8,
    40|    technique: "Blind SQL Injection (Time-Based)",
    41|    description: "Found a blind SQL injection in the product search filter parameter `sort_by`. The application used the parameter directly in an ORDER BY clause without sanitization. Using PostgreSQL's `pg_sleep()`, I confirmed full database access. Extracted admin credentials and accessed the internal admin panel.",
    42|    steps: `1. Intercepted search request: POST /search with body {"sort_by": "price"}
    43|2. Injected: "price ASC,(SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END)--"
    44|3. Response delayed by 5 seconds — confirmed injection
    45|4. Used sqlmap to automate: extracted users table, admin hashes
    46|5. Cracked admin hash offline (bcrypt, weak password "admin123!")
    47|6. Logged into admin panel at /admin — full system compromise`,
    48|    impact: "Complete database compromise including 850K customer records, admin credentials, and internal system access. Potential to modify orders, steal credit card tokens.",
    49|    remediation: "Use parameterized queries / prepared statements. Implement WAF rules. Never concatenate user input into SQL queries. Apply least privilege database accounts.",
    50|    status: "Resolved",
    51|    references: [
    52|      "https://portswigger.net/web-security/sql-injection"
    53|    ]
    54|  },
    55|  {
    56|    id: "BOUNTY-2025-003",
    57|    title: "Stored XSS via Markdown Editor — Wormable Chain",
    58|    severity: "high",
    59|    target: "docs.collabspace.dev",
    60|    date: "2025-03-10",
    61|    bounty: 1800,
    62|    cve: null,
    63|    cvss: 7.5,
    64|    technique: "Stored Cross-Site Scripting (XSS)",
    65|    description: "The collaborative documentation platform allowed Markdown with raw HTML. Their sanitizer (DOMPurify) was bypassed using a mutation XSS technique with `<math><style>` tags. Since the payload executed in other users' sessions when they viewed the document, this could be used for session hijacking and worm propagation.",
    66|    steps: `1. Created a new document with the following Markdown:
    67|   <math><style><img src=x onerror=alert(document.cookie)></style></math>
    68|2. Saved the document — no sanitization applied
    69|3. Opened the document in a fresh browser (different user) — XSS fired
    70|4. Crafted payload to exfiltrate session tokens to attacker server
    71|5. Confirmed full account takeover of any user viewing the document`,
    72|    impact: "Session hijacking, credential theft, document exfiltration. Wormable: infected documents could auto-share and propagate to all workspace members.",
    73|    remediation: "Use server-side HTML sanitization with updated DOMPurify. Disable raw HTML in Markdown editor. Implement CSP headers with strict nonce-based policy.",
    74|    status: "Resolved",
    75|    references: [
    76|      "https://research.securitum.com/mutation-xss-via-mathml-mutation-dompurify-2-0-17-bypass/"
    77|    ]
    78|  },
    79|  {
    80|    id: "BOUNTY-2025-004",
    81|    title: "JWT Token None Algorithm Bypass — Full API Access",
    82|    severity: "high",
    83|    target: "api.healthsync.med",
    84|    date: "2025-02-22",
    85|    bounty: 2500,
    86|    cve: null,
    87|    cvss: 8.2,
    88|    technique: "JWT Algorithm Confusion Attack",
    89|    description: "The healthcare API used JWT for authentication. Discovered that the server accepted tokens signed with the 'none' algorithm. By removing the signature and setting `alg: none`, any user could be impersonated including admin accounts. Accessed sensitive patient health records.",
    90|    steps: `1. Captured a valid JWT: eyJhbGciOiJSUzI1NiIsInR5cCI6...
    91|2. Decoded the payload: {"sub":"1234","role":"patient"}
    92|3. Modified header: {"alg":"none","typ":"JWT"}
    93|4. Modified payload: {"sub":"1","role":"admin"}
    94|5. Removed signature, sent: header.payload. (trailing dot)
    95|6. Server accepted — full admin API access granted`,
    96|    impact: "Complete bypass of authentication. Access to all patient health records (PHI), ability to modify prescriptions, view medical histories across the entire platform.",
    97|    remediation: "Explicitly whitelist accepted JWT algorithms on the server (only RS256, ES256). Reject tokens with 'none' algorithm. Rotate all signing keys.",
    98|    status: "Resolved",
    99|    references: [
   100|      "https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/"
   101|    ]
   102|  },
   103|  {
   104|    id: "BOUNTY-2025-005",
   105|    title: "SSRF via PDF Generator — AWS Metadata Exfiltration",
   106|    severity: "medium",
   107|    target: "reports.fintechdashboard.com",
   108|    date: "2025-02-14",
   109|    bounty: 1200,
   110|    cve: null,
   111|    cvss: 6.5,
   112|    technique: "Server-Side Request Forgery (SSRF)",
   113|    description: "The PDF report generator accepted a URL for the report cover image. The server fetched the URL without validation, allowing internal network requests. Exploited this to access AWS EC2 metadata at 169.254.169.254, revealing IAM credentials and internal service endpoints.",
   114|    steps: `1. Found endpoint: POST /generate-report with body {"cover_image_url": "https://..."}
   115|2. Changed URL to: http://169.254.169.254/latest/meta-data/
   116|3. The generated PDF showed the metadata directory listing!
   117|4. Extracted IAM role credentials from:
   118|   http://169.254.169.254/latest/meta-data/iam/security-credentials/
   119|5. Used credentials to access internal S3 buckets`,
   120|    impact: "AWS IAM credential leakage, internal network reconnaissance, access to internal S3 buckets containing financial reports.",
   121|    remediation: "Implement URL allowlist (only https://public-cdn.domain/*). Block access to internal IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254). Use a separate VPC for PDF generation service.",
   122|    status: "Resolved",
   123|    references: [
   124|      "https://owasp.org/www-community/attacks/Server_Side_Request_Forgery"
   125|    ]
   126|  },
   127|  {
   128|    id: "BOUNTY-2025-006",
   129|    title: "Race Condition in Coupon Code — Infinite Discount",
   130|    severity: "medium",
   131|    target: "checkout.shopmax.com",
   132|    date: "2025-01-30",
   133|    bounty: 800,
   134|    cve: null,
   135|    cvss: 5.3,
   136|    technique: "Race Condition / TOCTOU",
   137|    description: "Found a Time-of-Check Time-of-Use (TOCTOU) bug in the coupon validation system. By sending multiple parallel checkout requests, the same single-use coupon code could be applied multiple times before the first transaction marked it as used.",
   138|    steps: `1. Obtained a "WELCOME50" coupon — 50% off, single use
   139|2. Sent 10 parallel POST /checkout/apply-coupon requests using Burp Turbo Intruder
   140|3. All 10 requests succeeded — coupon applied 10x simultaneously
   141|4. Each order got 50% discount with the same code
   142|5. Could be exploited at scale for massive fraud`,
   143|    impact: "Financial loss through coupon abuse. If combined with gift cards, potential for infinite money glitch.",
   144|    remediation: "Use database-level locking (SELECT FOR UPDATE) when redeeming coupons. Implement idempotency keys for checkout operations. Add rate limiting on coupon endpoints.",
   145|    status: "Resolved",
   146|    references: [
   147|      "https://portswigger.net/research/turbo-intruder-embracing-the-billion-request-attack"
   148|    ]
   149|  },
   150|  {
   151|    id: "BOUNTY-2025-007",
   152|    title: "GraphQL Introspection Leaks Hidden Admin Mutations",
   153|    severity: "low",
   154|    target: "api.socialapp.io",
   155|    date: "2025-01-18",
   156|    bounty: 400,
   157|    cve: null,
   158|    cvss: 4.0,
   159|    technique: "GraphQL Introspection Abuse",
   160|    description: "The GraphQL endpoint had introspection enabled in production. Discovered hidden admin mutations: `muteAllUsers`, `shadowBanUser`, `purgePosts`. While these required admin auth, combined with other bugs this could enable platform-wide abuse.",
   161|    steps: `1. Sent introspection query to /graphql
   162|2. Retrieved full schema including hidden types
   163|3. Found mutations prefixed with "admin_": muteAllUsers, shadowBanUser, etc.
   164|4. Documented all exposed admin functionality
   165|5. The mutations lacked rate limiting — even with auth, dangerous`,
   166|    impact: "Information disclosure of internal admin functionality. Combined with privilege escalation, could lead to platform-wide disruption.",
   167|    remediation: "Disable GraphQL introspection in production. Implement field-level authorization. Add query depth/complexity limits.",
   168|    status: "Resolved",
   169|    references: [
   170|      "https://graphql.org/learn/introspection/"
   171|    ]
   172|  },
   173|  {
   174|    id: "BOUNTY-2025-008",
   175|    title: "Open Redirect in OAuth Flow — Phishing Vector",
   176|    severity: "low",
   177|    target: "auth.unifiedlogin.io",
   178|    date: "2025-01-05",
   179|    bounty: 300,
   180|    cve: null,
   181|    cvss: 3.7,
   182|    technique: "Open Redirect via OAuth redirect_uri",
   183|    description: "The OAuth 2.0 implementation did not properly validate the `redirect_uri` parameter. Attackers could craft a malicious link that appeared to go to the legitimate auth provider but redirected victims to a phishing page after authentication.",
   184|    steps: `1. Analyzed OAuth flow: GET /oauth/authorize?redirect_uri=...
   185|2. Changed redirect_uri to: https://evil.com/phish
   186|3. The server accepted it without whitelist validation
   187|4. Full OAuth flow completed, token sent to attacker's domain
   188|5. Could be used in targeted phishing campaigns`,
   189|    impact: "Phishing vector — users could be tricked into granting OAuth tokens to malicious third parties.",
   190|    remediation: "Implement strict redirect_uri whitelist. Use exact matching (not pattern matching). Validate redirect_uri against registered client callbacks.",
   191|    status: "Resolved",
   192|    references: [
   193|      "https://oauth.net/advisories/2014-1-covert-redirect/"
   194|    ]
   195|  },
   196|  {
   197|    id: "BOUNTY-2025-009",
   198|    title: "CORS Misconfiguration Exposes Session Tokens via Subdomain",
   199|    severity: "info",
   200|    target: "cdn.techportal.net",
   201|    date: "2024-12-20",
   202|    bounty: 0,
   203|    cve: null,
   204|    cvss: 3.1,
   205|    technique: "CORS Misconfiguration",
   206|    description: "The CDN subdomain had overly permissive CORS headers (`Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`). While the CDN itself only served static assets, session cookies were scoped to `*.techportal.net`, meaning any compromised subdomain or malicious page could read authenticated responses.",
   207|    steps: `1. Checked CORS headers on cdn.techportal.net/api/status
   208|2. Found: Access-Control-Allow-Origin: *
   209|   AND Access-Control-Allow-Credentials: true
   210|3. This combination is invalid per spec but some browsers had bugs
   211|4. Documented as a defense-in-depth issue
   212|5. No immediate exploit but weakened overall security posture`,
   213|    impact: "Theoretical: weakened cookie security model. In practice, most browsers reject this combination.",
   214|    remediation: "Remove Access-Control-Allow-Credentials: true from the CDN. Properly configure CORS for each origin that needs it.",
   215|    status: "Informational",
   216|    references: [
   217|      "https://portswigger.net/web-security/cors"
   218|    ]
   219|  }
   220|];
   221|
   222|// Derived stats
   223|const totalBugs = journalEntries.length;
   224|const totalCriticals = journalEntries.filter(e => e.severity === 'critical').length;
   225|const totalBounties = journalEntries.reduce((sum, e) => sum + (e.bounty || 0), 0);
   226|
   227|// Format currency
   228|function formatBounty(amount) {
   229|  if (amount === 0) return '$0';
   230|  return '$' + amount.toLocaleString();
   231|}
   232|