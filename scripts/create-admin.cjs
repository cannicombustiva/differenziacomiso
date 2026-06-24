// Onboard a passwordless admin: create the auth.users row (no password,
// email confirmed) AND the admins row, in one idempotent command.
//
//   SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_PROJECT_REF=... ADMIN_EMAIL=you@example.com \
//     node scripts/create-admin.cjs
//
// Re-running for an existing admin is safe.

const { createClient } = require('@supabase/supabase-js');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!SERVICE_KEY || !PROJECT_REF || !ADMIN_EMAIL) {
  console.error('ERROR: Set the following environment variables:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  SUPABASE_PROJECT_REF');
  console.error('  ADMIN_EMAIL');
  process.exit(1);
}

// The admins table enforces email = lower(email).
const email = ADMIN_EMAIL.trim().toLowerCase();

const supabase = createClient(`https://${PROJECT_REF}.supabase.co`, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isAlreadyRegistered(error) {
  const msg = (error && error.message ? error.message : '').toLowerCase();
  return msg.includes('already been registered') || msg.includes('already exists');
}

async function main() {
  // 1. Passwordless auth user (no password, email pre-confirmed so OTP works).
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (error && !isAlreadyRegistered(error)) {
    throw error;
  }
  if (error) {
    console.log(`Auth user for ${email} already exists — ensuring admins row.`);
  } else {
    console.log(`Created passwordless auth user: ${data.user.id} (${email})`);
  }

  // 2. Admins row (authorization). Idempotent: ignore an existing row.
  const { error: adminError } = await supabase
    .from('admins')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

  if (adminError) {
    throw adminError;
  }

  console.log(`Admin ${email} is provisioned. They can now request an OTP code and reach /admin.`);
}

main().catch((err) => {
  console.error('Failed to onboard admin:', err.message || err);
  process.exit(1);
});
