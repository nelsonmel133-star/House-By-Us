import { eq, and, desc, asc, like, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, landlords, listings, media, approvals, notifications, InsertListing, InsertMedia, InsertApproval, InsertNotification, Listing, Landlord, Media, Approval, Notification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Landlord queries
export async function getLandlordByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(landlords).where(eq(landlords.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLandlord(data: typeof landlords.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(landlords).values(data);
  return result;
}

// Listing queries
export async function createListing(data: InsertListing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(listings).values(data);
  return result;
}

export async function getListing(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getListingsByLandlord(landlordId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(listings).where(eq(listings.landlordId, landlordId)).orderBy(desc(listings.createdAt));
}

export async function getApprovedListings(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(listings)
    .where(eq(listings.status, "approved"))
    .orderBy(desc(listings.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function searchListings(filters: { location?: string; minPrice?: number; maxPrice?: number; services?: string[] }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(listings.status, "approved")];
  
  if (filters.location) {
    conditions.push(like(listings.address, `%${filters.location}%`));
  }
  if (filters.minPrice !== undefined) {
    conditions.push(sql`${listings.pricePerMonth} >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(sql`${listings.pricePerMonth} <= ${filters.maxPrice}`);
  }
  
  return await db.select().from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt));
}

export async function getPendingListings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(listings).where(eq(listings.status, "pending")).orderBy(asc(listings.createdAt));
}

export async function getAllListings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(listings).orderBy(desc(listings.createdAt));
}

export async function updateListingStatus(listingId: number, status: "pending" | "approved" | "rejected", rejectionReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (status === "approved") {
    updateData.approvedAt = new Date();
  }
  if (status === "rejected" && rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }
  
  return await db.update(listings).set(updateData).where(eq(listings.id, listingId));
}

// Media queries
export async function createMedia(data: InsertMedia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(media).values(data);
}

export async function getMediaByListing(listingId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(media).where(eq(media.listingId, listingId)).orderBy(asc(media.displayOrder));
}

export async function deleteMedia(mediaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(media).where(eq(media.id, mediaId));
}

// Approval queries
export async function createApproval(data: InsertApproval) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(approvals).values(data);
}

export async function getApprovalByListing(listingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(approvals).where(eq(approvals.listingId, listingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Notification queries
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(notifications).values(data);
}

export async function getNotifications(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.role, "admin"));
}
