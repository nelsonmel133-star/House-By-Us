import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "landlord"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Landlord profiles extending user information
 */
export const landlords = mysqlTable("landlords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  companyName: text("companyName"),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  alternatePhone: varchar("alternatePhone", { length: 20 }),
  bankAccountName: text("bankAccountName"),
  bankAccountNumber: text("bankAccountNumber"),
  bankName: text("bankName"),
  verificationStatus: mysqlEnum("verificationStatus", ["unverified", "verified", "rejected"]).default("unverified").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Landlord = typeof landlords.$inferSelect;
export type InsertLandlord = typeof landlords.$inferInsert;

/**
 * Boarding house listings
 */
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  landlordId: int("landlordId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  pricePerMonth: decimal("pricePerMonth", { precision: 10, scale: 2 }).notNull(),
  numberOfRooms: int("numberOfRooms"),
  occupancyPerRoom: int("occupancyPerRoom"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  services: json("services").$type<string[]>().default([]).notNull(),
  rules: text("rules"),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  approvedAt: timestamp("approvedAt"),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

/**
 * Media files (images and videos) for listings
 */
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  type: mysqlEnum("type", ["image", "video"]).notNull(),
  url: text("url").notNull(),
  storageKey: text("storageKey").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

/**
 * Admin approvals and decisions
 */
export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull().unique(),
  adminId: int("adminId").notNull(),
  decision: mysqlEnum("decision", ["approved", "rejected"]).notNull(),
  reason: text("reason"),
  paymentVerified: boolean("paymentVerified").default(false),
  inspectionNotes: text("inspectionNotes"),
  decidedAt: timestamp("decidedAt").defaultNow().notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

/**
 * Notifications for admins and landlords
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["new_submission", "approval", "rejection", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedListingId: int("relatedListingId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  landlord: one(landlords, {
    fields: [users.id],
    references: [landlords.userId],
  }),
  notifications: many(notifications),
}));

export const landlordsRelations = relations(landlords, ({ one, many }) => ({
  user: one(users, {
    fields: [landlords.userId],
    references: [users.id],
  }),
  listings: many(listings),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  landlord: one(landlords, {
    fields: [listings.landlordId],
    references: [landlords.id],
  }),
  media: many(media),
  approval: one(approvals, {
    fields: [listings.id],
    references: [approvals.listingId],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  listing: one(listings, {
    fields: [media.listingId],
    references: [listings.id],
  }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  listing: one(listings, {
    fields: [approvals.listingId],
    references: [listings.id],
  }),
  admin: one(users, {
    fields: [approvals.adminId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
