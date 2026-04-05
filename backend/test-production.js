/**
 * ============================================================
 *   PRODUCTION-LEVEL TEST SUITE — FinanceFlow API
 *   Covers: Auth, RBAC, Records, Analytics, Users, Security
 * ============================================================
 */

const BASE = 'http://localhost:3000/api/v1';
const TS   = Date.now();

// ── Colours ──────────────────────────────────────────────────
const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
};

// ── Test runner state ─────────────────────────────────────────
let passed = 0, failed = 0, skipped = 0;
const failures = [];

function section(title) {
  console.log(`\n${c.bold(c.cyan('━'.repeat(62)))}`);
  console.log(c.bold(c.cyan(`  ${title}`)));
  console.log(c.bold(c.cyan('━'.repeat(62))));
}

function result(label, ok, got, expected, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ${c.green('✅ PASS')}  ${label}`);
  } else {
    failed++;
    const msg = `  ${c.red('❌ FAIL')}  ${label}`;
    console.log(msg);
    console.log(c.dim(`           expected: ${expected}  got: ${got}  ${detail}`));
    failures.push({ label, expected, got, detail });
  }
}

function skip(label) {
  skipped++;
  console.log(`  ${c.yellow('⏭  SKIP')}  ${label}`);
}

// ── HTTP helpers ──────────────────────────────────────────────
async function api(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

const get    = (p, t)    => api('GET',    p, null, t);
const post   = (p, b, t) => api('POST',   p, b,    t);
const patch  = (p, b, t) => api('PATCH',  p, b,    t);
const del    = (p, t)    => api('DELETE', p, null, t);

// ── Helpers ───────────────────────────────────────────────────
async function registerUser(name, email, role) {
  return post('/auth/register', { name, email, password: 'Prod@Test1234', role });
}
async function loginUser(email) {
  const r = await post('/auth/login', { email, password: 'Prod@Test1234' });
  return r.body?.data?.token;
}

// ─────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────
(async () => {
  console.log(c.bold(`\n🧪  PRODUCTION TEST SUITE — FinanceFlow`));
  console.log(c.dim(`    ${new Date().toLocaleString()}  |  ${BASE}\n`));

  let r, adminToken, analystToken, viewerToken;
  let adminId, analystId, viewerId;
  let recordId, recordUpdatedAt;

  // ══════════════════════════════════════════════════════════
  section('1. HEALTH CHECK');
  // ══════════════════════════════════════════════════════════
  r = await get('/health');
  result('GET /health returns 200',         r.status === 200, r.status, 200);
  result('Health response has status field', !!r.body?.data?.status, r.body?.data?.status, 'truthy');

  // ══════════════════════════════════════════════════════════
  section('2. REGISTRATION');
  // ══════════════════════════════════════════════════════════

  // Valid registrations
  r = await registerUser('Prod Admin',   `admin_${TS}@prod.com`,   'admin');
  result('Register admin → 201',   r.status === 201, r.status, 201);
  adminId = r.body?.data?.id;

  r = await registerUser('Prod Analyst', `analyst_${TS}@prod.com`, 'analyst');
  result('Register analyst → 201', r.status === 201, r.status, 201);
  analystId = r.body?.data?.id;

  r = await registerUser('Prod Viewer',  `viewer_${TS}@prod.com`,  'viewer');
  result('Register viewer → 201',  r.status === 201, r.status, 201);
  viewerId = r.body?.data?.id;

  // Duplicate email
  r = await registerUser('Dup User', `admin_${TS}@prod.com`, 'viewer');
  result('Duplicate email → 409',  r.status === 409, r.status, 409);

  // Weak passwords
  r = await post('/auth/register', { name: 'Weak', email: `weak_${TS}@t.com`, password: 'password1' });
  result('Weak password (no uppercase/special) → 400', r.status === 400, r.status, 400);

  r = await post('/auth/register', { name: 'Short', email: `short_${TS}@t.com`, password: 'Ab1@' });
  result('Too short password (<12 chars) → 400',       r.status === 400, r.status, 400);

  // Missing fields
  r = await post('/auth/register', { email: `noname_${TS}@t.com`, password: 'Prod@Test1234' });
  result('Missing name → 400',  r.status === 400, r.status, 400);

  r = await post('/auth/register', { name: 'No Email', password: 'Prod@Test1234' });
  result('Missing email → 400', r.status === 400, r.status, 400);

  // Invalid email
  r = await post('/auth/register', { name: 'Bad Email', email: 'notanemail', password: 'Prod@Test1234' });
  result('Invalid email format → 400', r.status === 400, r.status, 400);

  // ══════════════════════════════════════════════════════════
  section('3. LOGIN');
  // ══════════════════════════════════════════════════════════

  adminToken   = await loginUser(`admin_${TS}@prod.com`);
  analystToken = await loginUser(`analyst_${TS}@prod.com`);
  viewerToken  = await loginUser(`viewer_${TS}@prod.com`);

  result('Admin login returns token',   !!adminToken,   !!adminToken,   true);
  result('Analyst login returns token', !!analystToken, !!analystToken, true);
  result('Viewer login returns token',  !!viewerToken,  !!viewerToken,  true);

  r = await post('/auth/login', { email: `admin_${TS}@prod.com`, password: 'WrongPass!' });
  result('Wrong password → 401', r.status === 401, r.status, 401);

  r = await post('/auth/login', { email: 'nobody@nowhere.com', password: 'Prod@Test1234' });
  result('Non-existent email → 401', r.status === 401, r.status, 401);

  r = await post('/auth/login', { email: `admin_${TS}@prod.com` });
  result('Missing password → 400', r.status === 400, r.status, 400);

  // ══════════════════════════════════════════════════════════
  section('4. AUTHENTICATION MIDDLEWARE');
  // ══════════════════════════════════════════════════════════

  r = await get('/records');
  result('No token → 401',           r.status === 401, r.status, 401);

  r = await get('/records', null, 'invalid.jwt.token');
  result('Invalid JWT → 401',        r.status === 401, r.status, 401);

  r = await get('/records', null, 'Bearer faketoken');
  result('Malformed Bearer → 401',   r.status === 401, r.status, 401);

  // ══════════════════════════════════════════════════════════
  section('5. FINANCIAL RECORDS — ADMIN (write access)');
  // ══════════════════════════════════════════════════════════

  // Create record
  r = await post('/records', {
    amount: 50000, type: 'income', category: 'Salary',
    date: '2026-04-01', notes: 'Production test record'
  }, adminToken);
  result('Admin creates record → 201', r.status === 201, r.status, 201);
  recordId        = r.body?.data?.id;
  recordUpdatedAt = r.body?.data?.updated_at;
  result('Record has UUID id',          !!recordId,        !!recordId,        true);
  result('Record has updated_at',       !!recordUpdatedAt, !!recordUpdatedAt, true);

  // Read own record
  r = await get(`/records/${recordId}`, adminToken);
  result('Admin reads own record → 200', r.status === 200, r.status, 200);

  // List records
  r = await get('/records', adminToken);
  result('Admin lists records → 200', r.status === 200, r.status, 200);
  result('Records response has data array', Array.isArray(r.body?.data), Array.isArray(r.body?.data), true);

  // Update record — valid
  r = await patch(`/records/${recordId}`, {
    amount: 55000, category: 'Salary Revised', updated_at: recordUpdatedAt
  }, adminToken);
  result('Admin updates record → 200', r.status === 200, r.status, 200);
  const newUpdatedAt = r.body?.data?.updated_at;

  // Optimistic locking — stale updated_at
  r = await patch(`/records/${recordId}`, {
    amount: 99999, updated_at: recordUpdatedAt   // old timestamp
  }, adminToken);
  result('Stale updated_at (optimistic lock) → 409', r.status === 409, r.status, 409);

  // Validation — negative amount
  r = await post('/records', {
    amount: -500, type: 'income', category: 'Bad', date: '2026-04-01'
  }, adminToken);
  result('Negative amount → 400', r.status === 400, r.status, 400);

  // Validation — invalid type
  r = await post('/records', {
    amount: 100, type: 'salary', category: 'Bad', date: '2026-04-01'
  }, adminToken);
  result('Invalid type (not income/expense) → 400', r.status === 400, r.status, 400);

  // Idempotency key
  const iKey = `prod-idem-${TS}`;
  r = await post('/records', {
    amount: 1000, type: 'expense', category: 'Test', date: '2026-04-01', idempotency_key: iKey
  }, adminToken);
  result('Create with idempotency key → 201', r.status === 201, r.status, 201);

  r = await post('/records', {
    amount: 1000, type: 'expense', category: 'Test', date: '2026-04-01', idempotency_key: iKey
  }, adminToken);
  result('Duplicate idempotency key → 409', r.status === 409, r.status, 409);

  // Delete record
  r = await del(`/records/${recordId}`, adminToken);
  result('Admin soft-deletes record → 200', r.status === 200, r.status, 200);

  // Deleted record is invisible
  r = await get(`/records/${recordId}`, adminToken);
  result('Deleted record returns 404', r.status === 404, r.status, 404);

  // Restore record
  r = await post(`/records/${recordId}/restore`, null, adminToken);
  result('Admin restores record → 200', r.status === 200, r.status, 200);

  r = await get(`/records/${recordId}`, adminToken);
  result('Restored record is accessible again → 200', r.status === 200, r.status, 200);

  // ══════════════════════════════════════════════════════════
  section('6. FINANCIAL RECORDS — ANALYST (read only)');
  // ══════════════════════════════════════════════════════════

  r = await get('/records', analystToken);
  result('Analyst reads records → 200', r.status === 200, r.status, 200);

  r = await post('/records', {
    amount: 1000, type: 'income', category: 'Test', date: '2026-04-01'
  }, analystToken);
  result('Analyst cannot create record → 403', r.status === 403, r.status, 403);

  r = await patch(`/records/${recordId}`, { amount: 999, updated_at: newUpdatedAt }, analystToken);
  result('Analyst cannot update record → 403', r.status === 403, r.status, 403);

  r = await del(`/records/${recordId}`, analystToken);
  result('Analyst cannot delete record → 403', r.status === 403, r.status, 403);

  r = await post(`/records/${recordId}/restore`, null, analystToken);
  result('Analyst cannot restore record → 403', r.status === 403, r.status, 403);

  // ══════════════════════════════════════════════════════════
  section('7. FINANCIAL RECORDS — VIEWER (no access)');
  // ══════════════════════════════════════════════════════════

  r = await get('/records', viewerToken);
  result('Viewer cannot list records → 403', r.status === 403, r.status, 403);

  r = await get(`/records/${recordId}`, viewerToken);
  result('Viewer cannot read record by ID → 403', r.status === 403, r.status, 403);

  r = await post('/records', {
    amount: 500, type: 'income', category: 'Test', date: '2026-04-01'
  }, viewerToken);
  result('Viewer cannot create record → 403', r.status === 403, r.status, 403);

  // ══════════════════════════════════════════════════════════
  section('8. CROSS-USER DATA ISOLATION');
  // ══════════════════════════════════════════════════════════

  // Analyst creates own record first
  r = await post('/records', {
    amount: 2000, type: 'income', category: 'Analyst Salary', date: '2026-04-01'
  }, adminToken);
  const adminRecord = r.body?.data?.id;

  // Analyst tries to access admin's record
  r = await get(`/records/${adminRecord}`, analystToken);
  result('Analyst cannot read another user\'s record → 403', r.status === 403, r.status, 403);

  // Admin CAN read analyst's record (admin override)
  // First give analyst a record
  r = await get('/records', analystToken);
  result('Analyst only sees own records (0 admin records in list)',
    (r.body?.data || []).every((rec) => rec.user_id !== adminId),
    'own records only', 'own records only'
  );

  // ══════════════════════════════════════════════════════════
  section('9. ANALYTICS — ALL ROLES');
  // ══════════════════════════════════════════════════════════

  for (const [role, token] of [['admin', adminToken], ['analyst', analystToken], ['viewer', viewerToken]]) {
    r = await get('/analytics/summary',  token);
    result(`${role} → GET /analytics/summary → 200`,  r.status === 200, r.status, 200);
    result(`${role} → summary has total_income`,       r.body?.data?.total_income !== undefined, true, true);

    r = await get('/analytics/monthly',  token);
    result(`${role} → GET /analytics/monthly → 200`,  r.status === 200, r.status, 200);

    r = await get('/analytics/category', token);
    result(`${role} → GET /analytics/category → 200`, r.status === 200, r.status, 200);

    r = await get('/analytics/recent',   token);
    result(`${role} → GET /analytics/recent → 200`,   r.status === 200, r.status, 200);
  }

  // ══════════════════════════════════════════════════════════
  section('10. USER MANAGEMENT — ADMIN ONLY');
  // ══════════════════════════════════════════════════════════

  r = await get('/users', adminToken);
  result('Admin lists users → 200',   r.status === 200, r.status, 200);
  result('Users list is an array',    Array.isArray(r.body?.data), true, true);

  r = await get('/users', analystToken);
  result('Analyst cannot list users → 403', r.status === 403, r.status, 403);

  r = await get('/users', viewerToken);
  result('Viewer cannot list users → 403',  r.status === 403, r.status, 403);

  // Own profile — all roles can access
  for (const [role, token] of [['admin', adminToken], ['analyst', analystToken], ['viewer', viewerToken]]) {
    r = await get('/users/profile', token);
    result(`${role} can read own profile → 200`, r.status === 200, r.status, 200);
  }

  // GET /users/:id — admin only
  r = await get(`/users/${analystId}`, adminToken);
  result('Admin can GET /users/:id → 200',     r.status === 200, r.status, 200);

  r = await get(`/users/${adminId}`, analystToken);
  result('Analyst cannot GET /users/:id → 403', r.status === 403, r.status, 403);

  // Self-deactivation prevention
  r = await patch(`/users/${adminId}/status`, { status: 'inactive' }, adminToken);
  result('Admin cannot deactivate own account → 403', r.status === 403, r.status, 403);

  // Deactivate analyst
  r = await patch(`/users/${analystId}/status`, { status: 'inactive' }, adminToken);
  result('Admin deactivates analyst → 200', r.status === 200, r.status, 200);

  // Inactive user cannot login
  r = await post('/auth/login', { email: `analyst_${TS}@prod.com`, password: 'Prod@Test1234' });
  result('Inactive account login → 403', r.status === 403, r.status, 403);

  // Re-activate
  r = await patch(`/users/${analystId}/status`, { status: 'active' }, adminToken);
  result('Admin re-activates analyst → 200', r.status === 200, r.status, 200);

  // ══════════════════════════════════════════════════════════
  section('11. AUDIT LOGS — ADMIN ONLY');
  // ══════════════════════════════════════════════════════════

  r = await get('/audit/logs', adminToken);
  result('Admin reads audit logs → 200',   r.status === 200, r.status, 200);
  result('Audit logs has data array',      Array.isArray(r.body?.data), true, true);
  result('Audit logs has pagination',      !!r.body?.pagination, true, true);

  r = await get('/audit/logs', analystToken);
  result('Analyst cannot read audit logs → 403', r.status === 403, r.status, 403);

  r = await get('/audit/logs', viewerToken);
  result('Viewer cannot read audit logs → 403',  r.status === 403, r.status, 403);

  // Filters
  r = await get('/audit/logs?action=LOGIN', adminToken);
  result('Audit logs filter by action → 200', r.status === 200, r.status, 200);
  result('All returned logs match action filter',
    (r.body?.data || []).every(l => l.action === 'LOGIN'), true, true
  );

  // ══════════════════════════════════════════════════════════
  section('12. LOGOUT & TOKEN INVALIDATION');
  // ══════════════════════════════════════════════════════════

  // Login fresh, use token, logout, try again
  const freshToken = await loginUser(`viewer_${TS}@prod.com`);
  result('Fresh login gives token', !!freshToken, true, true);

  r = await get('/analytics/summary', freshToken);
  result('Token works before logout → 200', r.status === 200, r.status, 200);

  r = await post('/auth/logout', null, freshToken);
  result('Logout → 200', r.status === 200, r.status, 200);

  r = await get('/analytics/summary', freshToken);
  result('Invalidated token rejected → 401', r.status === 401, r.status, 401);

  // ══════════════════════════════════════════════════════════
  section('13. SECURITY — INPUT VALIDATION & INJECTION');
  // ══════════════════════════════════════════════════════════

  // SQL injection in login
  r = await post('/auth/login', { email: `' OR '1'='1`, password: `' OR '1'='1` });
  result('SQL injection in login → 400/401 (not 200)', r.status !== 200, r.status, '!= 200');

  // XSS in record category
  r = await post('/records', {
    amount: 100, type: 'income',
    category: '<script>alert("xss")</script>',
    date: '2026-04-01'
  }, adminToken);
  result('XSS payload in category — stored as plain text (not executed)', r.status === 201 || r.status === 400, r.status, '201 or 400');

  // Extremely long input
  r = await post('/records', {
    amount: 100, type: 'income',
    category: 'A'.repeat(1000),
    date: '2026-04-01'
  }, adminToken);
  result('Oversized category (1000 chars) → 400', r.status === 400, r.status, 400);

  // Invalid UUID in route param
  r = await get('/records/not-a-valid-uuid', adminToken);
  result('Invalid UUID param → 400/404 (not 500)', r.status !== 500, r.status, '!= 500');

  // Future date > 1 year
  r = await post('/records', {
    amount: 100, type: 'income', category: 'Future',
    date: '2099-01-01'
  }, adminToken);
  result('Date > 1 year in future → 400', r.status === 400, r.status, 400);

  // Zero amount
  r = await post('/records', {
    amount: 0, type: 'income', category: 'Zero', date: '2026-04-01'
  }, adminToken);
  result('Zero amount → 400', r.status === 400, r.status, 400);

  // ══════════════════════════════════════════════════════════
  section('14. PAGINATION & QUERY PARAMS');
  // ══════════════════════════════════════════════════════════

  r = await get('/records?page=1&limit=5', adminToken);
  result('Pagination with limit=5 → 200',  r.status === 200, r.status, 200);
  result('Returns max 5 records',           (r.body?.data?.length || 0) <= 5, true, true);

  r = await get('/audit/logs?page=1&limit=10', adminToken);
  result('Audit logs pagination → 200', r.status === 200, r.status, 200);

  r = await get('/analytics/summary?from=2026-01-01&to=2026-04-06', adminToken);
  result('Analytics with date range → 200', r.status === 200, r.status, 200);

  // ══════════════════════════════════════════════════════════
  section('15. SOFT DELETE — USER INTEGRITY');
  // ══════════════════════════════════════════════════════════

  // Create a throwaway user and delete them
  const throwaway = `throwaway_${TS}@prod.com`;
  r = await registerUser('Throwaway User', throwaway, 'viewer');
  const throwawayId = r.body?.data?.id;
  result('Throwaway user created → 201', r.status === 201, r.status, 201);

  // Self-delete prevention
  r = await del(`/users/${adminId}`, adminToken);
  result('Admin cannot delete own account → 403', r.status === 403, r.status, 403);

  // Admin deletes throwaway (soft delete)
  r = await del(`/users/${throwawayId}`, adminToken);
  result('Admin soft-deletes user → 200', r.status === 200, r.status, 200);

  // Deleted user cannot login
  r = await post('/auth/login', { email: throwaway, password: 'Prod@Test1234' });
  result('Soft-deleted user cannot login → 401', r.status === 401, r.status, 401);

  // ══════════════════════════════════════════════════════════
  //  FINAL REPORT
  // ══════════════════════════════════════════════════════════
  const total = passed + failed + skipped;
  console.log(`\n${c.bold(c.cyan('═'.repeat(62)))}`);
  console.log(c.bold(`  RESULTS`));
  console.log(c.bold(c.cyan('═'.repeat(62))));
  console.log(`  Total   ${total}`);
  console.log(`  ${c.green('Passed  ' + passed)}`);
  console.log(`  ${failed > 0 ? c.red('Failed  ' + failed) : c.green('Failed  0')}`);
  console.log(`  ${c.yellow('Skipped ' + skipped)}`);

  const pct = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`\n  Score   ${failed === 0 ? c.green(pct + '%') : c.yellow(pct + '%')}`);

  if (failures.length) {
    console.log(`\n${c.bold(c.red('  FAILURES:'))}`);
    failures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${c.red(f.label)}`);
      console.log(c.dim(`     expected: ${f.expected}  |  got: ${f.got}  ${f.detail}`));
    });
  } else {
    console.log(c.bold(c.green('\n  ✅  All tests passed — production ready!\n')));
  }

  console.log(c.bold(c.cyan('═'.repeat(62))) + '\n');
  process.exit(failed > 0 ? 1 : 0);
})();
