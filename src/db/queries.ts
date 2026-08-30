import { db } from './index.ts';
import { users, vaultConfigs, vaultPositions, tradeLogs } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error('Database user sync failed', { cause: error });
  }
}

export async function getUserVaultConfig(userId: number) {
  try {
    const records = await db.select().from(vaultConfigs).where(eq(vaultConfigs.userId, userId));
    return records[0] || null;
  } catch (error) {
    console.error('Failed to get user vault config:', error);
    throw new Error('Database config lookup failed', { cause: error });
  }
}

export async function upsertUserVaultConfig(userId: number, configData: Partial<typeof vaultConfigs.$inferInsert>) {
  try {
    const result = await db.insert(vaultConfigs)
      .values({
        userId,
        ...configData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: vaultConfigs.userId,
        set: {
          ...configData,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert vault config:', error);
    throw new Error('Database config update failed', { cause: error });
  }
}

export async function getUserPositions(userId: number) {
  try {
    return await db.select().from(vaultPositions)
      .where(eq(vaultPositions.userId, userId))
      .orderBy(desc(vaultPositions.openedAt));
  } catch (error) {
    console.error('Failed to get user positions:', error);
    throw new Error('Database positions query failed', { cause: error });
  }
}

export async function saveUserPosition(userId: number, pos: typeof vaultPositions.$inferInsert) {
  try {
    const result = await db.insert(vaultPositions)
      .values({
        ...pos,
        userId,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to save position:', error);
    throw new Error('Database position insertion failed', { cause: error });
  }
}

export async function getUserTradeLogs(userId: number, limit = 50) {
  try {
    return await db.select().from(tradeLogs)
      .where(eq(tradeLogs.userId, userId))
      .orderBy(desc(tradeLogs.timestamp))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get user trade logs:', error);
    throw new Error('Database logs query failed', { cause: error });
  }
}

export async function insertUserTradeLog(userId: number, log: typeof tradeLogs.$inferInsert) {
  try {
    const result = await db.insert(tradeLogs)
      .values({
        ...log,
        userId,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to insert trade log:', error);
    throw new Error('Database log insertion failed', { cause: error });
  }
}
