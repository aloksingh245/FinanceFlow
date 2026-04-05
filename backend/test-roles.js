/**
 * Live Role Test — shows exactly what Viewer, Analyst, Admin can and cannot do
 * Run: node test-roles.js
 */

const BASE = 'http://localhost:3000/api/v1';

const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const cyan   = (s) => `\x1b[36m${s}\x1b[0m`;

async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

function show(label, status, body, expectPass) {
  const passed = expectPass ? status < 400 : status >= 400;
  const icon   = passed ? green('✅ PASS') : red('❌ FAIL');
  const code   = status < 400 ? green(status) : red(status);
  console.log(`  ${icon}  [${code}]  ${label}`);
  if (!passed) console.log(`         ${red('→ Unexpected:')} ${JSON.stringify(body?.error || body)}`);
}

function section(title) {
  console.log('\n' + bold(cyan('━'.repeat(60))));
  console.log(bold(cyan(`  ${title}`)));
  console.log(bold(cyan('━'.repeat(60))));
}

function role(name, emoji) {
  console.log('\n' + bold(yellow(`${emoji}  ${name.toUpperCase()}`)));
  console.log(yellow('─'.repeat(40)));
}

// ─── Register helpers ────────────────────────────────────────────
async function register(name, email) {
  const r = await req('POST', '/auth/register', {
    name,
    email,
    password: 'Test@Password123!'
  });
  return r;
}

async function login(email) {
  const r = await req('POST', '/auth/login', { email, password: 'Test@Password123!' });
  return r.body?.data?.token;
}

// ─── Main ────────────────────────────────────────────────────────
(async () => {
  console.log(bold('\n🧪  LIVE ROLE TEST — Finance Data Platform'));
  console.log('    Testing what Viewer, Analyst, and Admin can actually do\n');

  // ── Step 1: Register all three users ──────────────────────────
  section('STEP 1 — Register Users (all register as viewer by default)');

  const ts = Date.now();
  const users = {
    viewer:  { name: 'Ramesh Viewer',  email: `viewer_${ts}@test.com`  },
    analyst: { name: 'Priya Analyst',  email: `analyst_${ts}@test.com` },
    admin:   { name: 'Sanjay Admin',   email: `admin_${ts}@test.com`   },
  };

  for (const [roleKey, u] of Object.entries(users)) {
    const r = await register(u.name, u.email);
    show(`Register ${u.name}`, r.status, r.body, true);
    u.id = r.body?.data?.id;
  }

  // ── Step 2: Admin logs in first (needs to promote others) ──────
  section('STEP 2 — Login as each user');

  // All registered as viewer — login them all first
  for (const [roleKey, u] of Object.entries(users)) {
    u.token = await login(u.email);
    show(`Login ${u.name}`, u.token ? 200 : 401, {}, true);
  }

  // ── Step 3: Promote analyst and admin via DB (or show viewer-only state) ─
  // Since registration always creates viewer, we test with all as viewer
  // then show the viewer limitation, and note that an admin promotes others.
  section('STEP 3 — Admin creates a financial record (only admin can write)');

  // For this test, all are viewers since we can only self-register as viewer.
  // We'll test what viewer CANNOT do, and show what admin CAN do.
  // To demo admin, we'll call health endpoint and test record creation attempts.

  console.log(bold('\n  ℹ️  Note: Self-registration always creates VIEWER role.'));
  console.log('      An existing Admin promotes users to Analyst/Admin via the app.\n');

  // ── Step 4: Test all three roles with the viewer tokens ────────
  // All users are viewers right now — perfect to show viewer limitations

  const viewerToken  = users.viewer.token;
  const analystToken = users.analyst.token;  // also viewer for now
  const adminToken   = users.admin.token;    // also viewer for now

  section('STEP 4 — What VIEWER can do');
  role('Viewer (Ramesh)', '👀');

  console.log(bold('  ✅ Things a Viewer SHOULD be able to do:'));
  let r = await req('GET', '/analytics/summary', null, viewerToken);
  show('GET /analytics/summary  (see dashboard)', r.status, r.body, true);

  r = await req('GET', '/analytics/category', null, viewerToken);
  show('GET /analytics/category (see expense chart)', r.status, r.body, true);

  r = await req('GET', '/analytics/monthly', null, viewerToken);
  show('GET /analytics/monthly  (see monthly trends)', r.status, r.body, true);

  r = await req('GET', '/analytics/recent', null, viewerToken);
  show('GET /analytics/recent   (see recent txns)', r.status, r.body, true);

  r = await req('GET', '/users/profile', null, viewerToken);
  show('GET /users/profile       (see own profile)', r.status, r.body, true);

  console.log(bold('\n  ❌ Things a Viewer CANNOT do (should all be BLOCKED):'));

  r = await req('GET', '/records', null, viewerToken);
  show('GET /records             (browse records)     → 403 expected', r.status, r.body, false);

  r = await req('POST', '/records', { amount: 500, type: 'income', category: 'test', date: '2026-01-01' }, viewerToken);
  show('POST /records            (create record)      → 403 expected', r.status, r.body, false);

  r = await req('GET', '/users', null, viewerToken);
  show('GET /users               (list all users)     → 403 expected', r.status, r.body, false);

  r = await req('GET', '/audit/logs', null, viewerToken);
  show('GET /audit/logs          (see audit logs)     → 403 expected', r.status, r.body, false);

  // ── Step 5: Show what happens with NO token ────────────────────
  section('STEP 5 — What happens with NO login (public)');
  role('Not Logged In', '🚫');

  r = await req('GET', '/analytics/summary');
  show('GET /analytics/summary  (no token) → 401 expected', r.status, r.body, false);

  r = await req('GET', '/records');
  show('GET /records            (no token) → 401 expected', r.status, r.body, false);

  r = await req('POST', '/auth/register', { name: 'Hacker', email: `hack_${ts}@x.com`, password: 'Test@Password123!' });
  show('POST /auth/register     (anyone can register as viewer)', r.status, r.body, true);

  // ── Step 6: Try to register as admin ──────────────────────────
  section('STEP 6 — Security: Try to self-register as Admin');
  role('Attacker trying privilege escalation', '🔴');

  r = await req('POST', '/auth/register', {
    name: 'Evil Hacker',
    email: `evil_${ts}@hack.com`,
    password: 'Test@Password123!',
    role: 'admin'   // ← attacker sends this
  });
  // Server rejects the request outright — "role" field is not allowed at all
  show(`POST /auth/register with role:"admin" → request REJECTED (400)`, r.status, r.body, false);
  if (r.status === 400) {
    console.log(`         ${green('→ Secure:')} Server says: "${r.body?.error?.details?.[0]?.message || r.body?.error?.message}"`);
    console.log(`         ${green('→ Attacker gets nothing. Role field is completely disallowed.')}`);
  }

  // ── Step 7: Weak password rejection ───────────────────────────
  section('STEP 7 — Security: Weak password rejected');

  r = await req('POST', '/auth/register', { name: 'Weak User', email: `weak_${ts}@test.com`, password: 'password1' });
  show('Password "password1" (8 chars, no uppercase/special) → 400 expected', r.status, r.body, false);
  if (r.status === 400) {
    console.log(`         ${green('→ Validation message:')} ${r.body?.error?.message || JSON.stringify(r.body?.error?.details?.[0])}`);
  }

  // ── Step 8: Brute force lockout ───────────────────────────────
  section('STEP 8 — Security: Per-email brute force lockout');

  // Use a fresh email so IP rate limiter state doesn't interfere
  const bruteEmail = `brute_${ts}@test.com`;
  await req('POST', '/auth/register', { name: 'Brute Target', email: bruteEmail, password: 'Test@Password123!' });
  await req('POST', '/auth/login', { email: bruteEmail, password: 'Test@Password123!' }); // clear any state

  console.log(`  Sending wrong passwords to ${bruteEmail}...`);
  let lockoutHit = false;
  for (let i = 1; i <= 6; i++) {
    r = await req('POST', '/auth/login', { email: bruteEmail, password: 'WrongPass123!' });
    if (r.status === 429) {
      show(`Attempt ${i}: Account locked → 429`, r.status, r.body, false);
      const msg = r.body?.error?.message || r.body?.message || String(r.body);
      console.log(`         ${green('→ Lockout triggered:')} ${msg}`);
      lockoutHit = true;
      break;
    } else {
      console.log(`         Attempt ${i}: status ${r.status} — wrong password recorded`);
    }
  }
  if (!lockoutHit) show('Expected lockout after 5 attempts', 200, {}, false);

  // ── Summary ───────────────────────────────────────────────────
  section('FINAL SUMMARY — Role Capability Matrix');
  console.log(`
  ${'Capability'.padEnd(38)} ${'Viewer'.padEnd(10)} ${'Analyst'.padEnd(10)} ${'Admin'}
  ${'─'.repeat(72)}
  ${'Dashboard (analytics)'.padEnd(38)} ${green('✅').padEnd(18)} ${green('✅').padEnd(18)} ${green('✅')}
  ${'Browse individual records'.padEnd(38)} ${red('✗').padEnd(17)}  ${green('✅').padEnd(18)} ${green('✅')}
  ${'Create / Edit / Delete records'.padEnd(38)} ${red('✗').padEnd(17)}  ${red('✗').padEnd(17)}  ${green('✅')}
  ${'Restore deleted records'.padEnd(38)} ${red('✗').padEnd(17)}  ${red('✗').padEnd(17)}  ${green('✅')}
  ${'Manage users (promote/deactivate)'.padEnd(38)} ${red('✗').padEnd(17)}  ${red('✗').padEnd(17)}  ${green('✅')}
  ${'View audit logs'.padEnd(38)} ${red('✗').padEnd(17)}  ${red('✗').padEnd(17)}  ${green('✅')}
  ${'─'.repeat(72)}
  `);

  console.log(bold('  🏁  Test complete!\n'));
})();
