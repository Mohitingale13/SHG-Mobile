// @ts-nocheck
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { getDb } from './db';
import * as schema from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

async function run() {
  const db = getDb();
  console.log('[migrate-identity] Starting data migration...');

  const users = await db.select().from(schema.users);
  console.log('[migrate-identity] Found ' + users.length + ' users to migrate.');

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const existingIdentity = await db
      .select()
      .from(schema.identities)
      .where(eq(schema.identities.phone, user.phone));

    let identityId;

    if (existingIdentity.length === 0) {
      identityId = randomUUID();
      const now = new Date();
      await db.insert(schema.identities).values({
        id: identityId,
        phone: user.phone,
        password: user.password,
        name: user.name,
        preferredLanguage: user.preferredLanguage || 'en',
        createdAt: now,
        updatedAt: now,
      });
      console.log('[migrate-identity] Created identity for ' + user.phone);
    } else {
      identityId = existingIdentity[0].id;
      console.log('[migrate-identity] Identity already exists for ' + user.phone);
    }

    const existingMembership = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, user.id));

    if (existingMembership.length === 0) {
      const membershipId = randomUUID();
      const now = new Date();
      await db.insert(schema.memberships).values({
        id: membershipId,
        identityId,
        groupId: user.groupId,
        userId: user.id,
        role: user.role,
        status: user.status,
        createdAt: now,
      });

      if (!existingIdentity[0] || !existingIdentity[0].lastOpenedMembershipId) {
        await db
          .update(schema.identities)
          .set({ lastOpenedMembershipId: membershipId, updatedAt: new Date() })
          .where(eq(schema.identities.id, identityId));
      }

      created++;
      console.log('[migrate-identity] Created membership for user ' + user.id);
    } else {
      skipped++;
      console.log('[migrate-identity] Membership already exists for user ' + user.id);
    }
  }

  // Drop the UNIQUE constraint on users.phone (idempotent)
  try {
    await db.execute(sql.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_unique'));
    console.log('[migrate-identity] Dropped users.phone UNIQUE constraint.');
  } catch (e) {
    console.log('[migrate-identity] Note: ' + e.message);
  }

  console.log('[migrate-identity] Done. Created: ' + created + ', Skipped: ' + skipped);
  process.exit(0);
}

run().catch((e) => {
  console.error('[migrate-identity] Fatal error:', e);
  process.exit(1);
});
