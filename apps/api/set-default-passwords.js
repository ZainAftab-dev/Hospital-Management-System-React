/**
 * set-default-passwords.js
 * Sets a sensible default password for every user based on their role.
 * Safe to run multiple times — only updates users whose password does NOT
 * already match the role default (i.e. it won't overwrite a custom password).
 *
 * Default passwords:
 *   ADMIN         -> Admin@12345
 *   DOCTOR        -> Doctor@123
 *   RECEPTIONIST  -> Recept@123
 *   PHARMACIST    -> Pharma@123
 *   STAFF         -> Staff@123
 */

const { PrismaClient } = require('@prisma/client');
const { hash, compare } = require('bcryptjs');

const ROLE_PASSWORDS = {
  ADMIN:         'Admin@12345',
  DOCTOR:        'Doctor@123',
  RECEPTIONIST:  'Recept@123',
  PHARMACIST:    'Pharma@123',
  STAFF:         'Staff@123',
};

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, passwordHash: true }
    });

    console.log(`Found ${users.length} user(s). Checking passwords...\n`);

    for (const user of users) {
      const defaultPass = ROLE_PASSWORDS[user.role] ?? 'Password@123';
      const alreadyCorrect = await compare(defaultPass, user.passwordHash);

      if (alreadyCorrect) {
        console.log(`  [OK]      ${user.name} (${user.role}) — password already set correctly`);
      } else {
        const newHash = await hash(defaultPass, 12);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash }
        });
        console.log(`  [UPDATED] ${user.name} (${user.role}) — password set to: ${defaultPass}`);
      }
    }

    console.log('\nDone. Default passwords applied.\n');
    console.log('  ADMIN        -> Admin@12345');
    console.log('  DOCTOR       -> Doctor@123');
    console.log('  RECEPTIONIST -> Recept@123');
    console.log('  PHARMACIST   -> Pharma@123');
    console.log('  STAFF        -> Staff@123');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Error setting passwords:', err.message);
  process.exit(1);
});
