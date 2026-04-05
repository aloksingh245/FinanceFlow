/**
 * Demo Data Seeder
 * Creates 3 demo users + 12 months of realistic financial records
 * Run: node seed-demo.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const green  = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;
const cyan   = s => `\x1b[36m${s}\x1b[0m`;

// ── Demo Users ────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { name: 'Alok Kumar (Admin)',   email: 'admin@demo.com',   password: 'Admin@Demo1234',   role: 'admin'   },
  { name: 'Priya Sharma (Analyst)', email: 'analyst@demo.com', password: 'Analyst@Demo1234', role: 'analyst' },
  { name: 'Rahul Verma (Viewer)', email: 'viewer@demo.com',  password: 'Viewer@Demo1234',  role: 'viewer'  },
];

// ── Financial Record Templates ────────────────────────────────────────────────
const INCOME_TEMPLATES = [
  { category: 'Salary',        min: 80000,  max: 95000  },
  { category: 'Freelance',     min: 15000,  max: 40000  },
  { category: 'Investments',   min: 5000,   max: 20000  },
  { category: 'Rental Income', min: 12000,  max: 18000  },
  { category: 'Bonus',         min: 10000,  max: 50000  },
];

const EXPENSE_TEMPLATES = [
  { category: 'Rent',          min: 25000,  max: 30000  },
  { category: 'Groceries',     min: 4000,   max: 7000   },
  { category: 'Utilities',     min: 2000,   max: 4000   },
  { category: 'Transport',     min: 3000,   max: 6000   },
  { category: 'Dining Out',    min: 2000,   max: 5000   },
  { category: 'Entertainment', min: 1000,   max: 3000   },
  { category: 'Healthcare',    min: 500,    max: 8000   },
  { category: 'Shopping',      min: 3000,   max: 12000  },
  { category: 'Education',     min: 2000,   max: 8000   },
  { category: 'Insurance',     min: 3000,   max: 5000   },
  { category: 'Subscriptions', min: 500,    max: 1500   },
  { category: 'Gym',           min: 800,    max: 1500   },
];

const NOTES = {
  Salary:         ['Monthly salary credit', 'Salary for the month', 'Payroll processed'],
  Freelance:      ['Web development project', 'Design work', 'Consulting fees', 'Client payment received'],
  Investments:    ['Mutual fund returns', 'Stock dividend', 'Fixed deposit interest'],
  'Rental Income':['Flat rent received', 'Monthly rental', 'Tenant payment'],
  Bonus:          ['Performance bonus', 'Quarterly bonus', 'Annual incentive'],
  Rent:           ['Monthly house rent', 'Apartment rent paid'],
  Groceries:      ['Big Bazaar shopping', 'DMart weekly groceries', 'Vegetables & fruits'],
  Utilities:      ['Electricity bill', 'Water & gas bill', 'Internet + mobile recharge'],
  Transport:      ['Fuel expenses', 'Cab & auto rides', 'Metro card recharge'],
  'Dining Out':   ['Lunch with team', 'Family dinner', 'Weekend outing'],
  Entertainment:  ['Movie tickets', 'OTT subscriptions', 'Concert tickets'],
  Healthcare:     ['Pharmacy', 'Doctor consultation', 'Lab tests'],
  Shopping:       ['Amazon order', 'Clothes & accessories', 'Home essentials'],
  Education:      ['Online course', 'Books & materials', 'Workshop fees'],
  Insurance:      ['LIC premium', 'Health insurance EMI', 'Vehicle insurance'],
  Subscriptions:  ['Netflix & Spotify', 'Software subscription', 'Cloud storage'],
  Gym:            ['Gym membership', 'Fitness class fees'],
};

const rand      = (min, max) => Math.round((Math.random() * (max - min) + min) / 100) * 100;
const randInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick      = arr => arr[Math.floor(Math.random() * arr.length)];
const randNote  = cat => pick(NOTES[cat] || ['Payment']);
const dateStr   = (year, month, day) => `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(bold(cyan('\n🌱  DEMO DATA SEEDER — FinanceFlow\n')));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get role IDs
    const rolesRes = await client.query('SELECT id, role_name FROM roles');
    const roleMap  = Object.fromEntries(rolesRes.rows.map(r => [r.role_name, r.id]));
    console.log(green('✅'), 'Roles found:', Object.keys(roleMap).join(', '));

    // 2. Create demo users (skip if email already exists)
    const createdUsers = [];
    const passwordHash = await bcrypt.hash('Admin@Demo1234', 12); // same hash reused for speed

    for (const u of DEMO_USERS) {
      const exists = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (exists.rows.length) {
        console.log(yellow('⚠️ '), `User already exists: ${u.email} — skipping`);
        createdUsers.push({ id: exists.rows[0].id, email: u.email, role: u.role });
        continue;
      }
      const hash   = await bcrypt.hash(u.password, 12);
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role_id, status)
         VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
        [u.name, u.email, hash, roleMap[u.role]]
      );
      createdUsers.push({ id: result.rows[0].id, email: u.email, role: u.role });
      console.log(green('✅'), `Created ${u.role.padEnd(8)} → ${u.email}`);
    }

    // 3. Generate 12 months of records for the admin user
    const adminUser = createdUsers.find(u => u.role === 'admin');
    const now       = new Date();
    let   totalRecords = 0;

    console.log(bold('\n📊  Generating financial records for last 12 months...\n'));

    for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });

      const records = [];

      // Always add salary income
      records.push({
        type: 'income',
        category: 'Salary',
        amount: rand(80000, 95000),
        date: dateStr(year, month, 1),
        notes: randNote('Salary'),
      });

      // 1-2 extra income sources
      const extraIncomes = Math.random() < 0.7 ? 1 : 2;
      for (let i = 0; i < extraIncomes; i++) {
        const t = pick(INCOME_TEMPLATES.slice(1));
        records.push({
          type: 'income',
          category: t.category,
          amount: rand(t.min, t.max),
          date: dateStr(year, month, randInt(5, 25)),
          notes: randNote(t.category),
        });
      }

      // Rent expense always
      records.push({
        type: 'expense',
        category: 'Rent',
        amount: rand(25000, 30000),
        date: dateStr(year, month, 1),
        notes: randNote('Rent'),
      });

      // 6-10 random expenses
      const expenseCount = 6 + Math.floor(Math.random() * 5);
      const picked = [...EXPENSE_TEMPLATES.slice(1)]
        .sort(() => Math.random() - 0.5)
        .slice(0, expenseCount);

      for (const t of picked) {
        records.push({
          type: 'expense',
          category: t.category,
          amount: rand(t.min, t.max),
          date: dateStr(year, month, randInt(2, 28)),
          notes: randNote(t.category),
        });
      }

      // Insert all records for this month
      for (const r of records) {
        await client.query(
          `INSERT INTO financial_records (user_id, amount, type, category, notes, date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [adminUser.id, r.amount, r.type, r.category, r.notes, r.date]
        );
      }

      totalRecords += records.length;
      const monthIncome  = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const monthExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      console.log(
        `  ${label.padEnd(20)}  ${green('+₹' + monthIncome.toLocaleString()).padEnd(20)}  ${`-₹${monthExpense.toLocaleString()}`.padEnd(14)}  ${records.length} records`
      );
    }

    // 4. Add a few records for analyst user too
    const analystUser = createdUsers.find(u => u.role === 'analyst');
    const analystRecords = [
      { type: 'income',  category: 'Salary',    amount: 65000, date: dateStr(now.getFullYear(), now.getMonth()+1, 1),  notes: 'Monthly salary' },
      { type: 'expense', category: 'Rent',       amount: 18000, date: dateStr(now.getFullYear(), now.getMonth()+1, 1),  notes: 'Monthly rent' },
      { type: 'expense', category: 'Groceries',  amount: 5500,  date: dateStr(now.getFullYear(), now.getMonth()+1, 10), notes: 'Weekly groceries' },
      { type: 'income',  category: 'Freelance',  amount: 22000, date: dateStr(now.getFullYear(), now.getMonth()+1, 15), notes: 'Consulting project' },
      { type: 'expense', category: 'Transport',  amount: 3200,  date: dateStr(now.getFullYear(), now.getMonth()+1, 20), notes: 'Cab & fuel' },
    ];

    for (const r of analystRecords) {
      await client.query(
        `INSERT INTO financial_records (user_id, amount, type, category, notes, date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [analystUser.id, r.amount, r.type, r.category, r.notes, r.date]
      );
    }

    await client.query('COMMIT');

    console.log(bold(cyan(`\n✅  Done! Inserted ${totalRecords + analystRecords.length} financial records total\n`)));
    console.log(bold('  Demo Login Credentials:'));
    console.log('  ─────────────────────────────────────────────────');
    for (const u of DEMO_USERS) {
      console.log(`  ${u.role.padEnd(8)}  ${u.email.padEnd(25)}  ${u.password}`);
    }
    console.log('  ─────────────────────────────────────────────────\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\x1b[31m❌  Seeder failed:\x1b[0m', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
