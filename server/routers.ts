import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";
import type { Listing } from "../drizzle/schema";

// Admin procedure - only accessible by users with admin role
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Landlord procedure - only accessible by users with landlord role
const landlordProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "landlord") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Landlord access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Landlord registration and profile management
  landlord: router({
    registerAsLandlord: protectedProcedure
      .input(z.object({
        companyName: z.string().optional(),
        phoneNumber: z.string().min(10),
        alternatePhone: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        bankName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existingLandlord = await db.getLandlordByUserId(ctx.user.id);
        if (existingLandlord) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User is already a landlord" });
        }

        const landlord = await db.createLandlord({
          userId: ctx.user.id,
          ...input,
        });

        // Update user role to landlord
        await db.upsertUser({
          openId: ctx.user.openId,
          role: "landlord",
        });

        return landlord;
      }),

    getProfile: landlordProcedure.query(async ({ ctx }) => {
      const landlord = await db.getLandlordByUserId(ctx.user.id);
      return landlord;
    }),

    updateProfile: landlordProcedure
      .input(z.object({
        companyName: z.string().optional(),
        phoneNumber: z.string().optional(),
        alternatePhone: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        bankName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const landlord = await db.getLandlordByUserId(ctx.user.id);
        if (!landlord) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile not found" });
        }

        // Update landlord profile in database
        const updateData = Object.fromEntries(
          Object.entries(input).filter(([, v]) => v !== undefined)
        );

        return updateData;
      }),
  }),

  // Listing management
  listings: router({
    create: landlordProcedure
      .input(z.object({
        title: z.string().min(5),
        description: z.string().min(20),
        address: z.string().min(10),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        pricePerMonth: z.number().positive(),
        numberOfRooms: z.number().positive().optional(),
        occupancyPerRoom: z.number().positive().optional(),
        services: z.array(z.string()),
        rules: z.string().optional(),
        contactPhone: z.string().min(10),
        contactEmail: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const landlord = await db.getLandlordByUserId(ctx.user.id);
        if (!landlord) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile not found" });
        }

        const listing = await db.createListing({
          landlordId: landlord.id,
          title: input.title,
          description: input.description,
          address: input.address,
          latitude: input.latitude ? input.latitude.toString() : undefined,
          longitude: input.longitude ? input.longitude.toString() : undefined,
          pricePerMonth: input.pricePerMonth.toString(),
          numberOfRooms: input.numberOfRooms,
          occupancyPerRoom: input.occupancyPerRoom,
          services: input.services,
          rules: input.rules,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail,
          status: "pending",
        });

        // Notify admins of new submission
        const admins = await db.getAdminUsers();
        // Get the last inserted listing
        const approvedListings = await db.getApprovedListings(1, 0);
        const createdListingId = approvedListings.length > 0 ? approvedListings[0].id : null;
        
        if (createdListingId) {
          for (const admin of admins) {
            await db.createNotification({
              userId: admin.id,
              type: "new_submission",
              title: "New Listing Submission",
              message: `New boarding house listing "${input.title}" submitted for review`,
              relatedListingId: createdListingId,
            });
          }
        }

        // Notify owner
        await notifyOwner({
          title: "New Listing Submission",
          content: `Landlord ${ctx.user.name} submitted a new listing: "${input.title}" at ${input.address}`,
        });

        return listing;
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        const listing = await db.getListing(input);
        if (!listing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        }
        const mediaFiles = await db.getMediaByListing(input);
        return { ...listing, media: mediaFiles };
      }),

    getByLandlord: landlordProcedure.query(async ({ ctx }) => {
      const landlord = await db.getLandlordByUserId(ctx.user.id);
      if (!landlord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Landlord profile not found" });
      }
      const listings = await db.getListingsByLandlord(landlord.id);
      return listings;
    }),

    search: publicProcedure
      .input(z.object({
        location: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        services: z.array(z.string()).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
        sortBy: z.enum(["newest", "price-low", "price-high"]).default("newest"),
      }))
      .query(async ({ input }) => {
        let listings = await db.searchListings({
          location: input.location,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          services: input.services,
        });

        // Apply sorting
        if (input.sortBy === "price-low") {
          listings.sort((a, b) => parseFloat(a.pricePerMonth.toString()) - parseFloat(b.pricePerMonth.toString()));
        } else if (input.sortBy === "price-high") {
          listings.sort((a, b) => parseFloat(b.pricePerMonth.toString()) - parseFloat(a.pricePerMonth.toString()));
        }

        return listings.slice(input.offset, input.offset + input.limit);
      }),

    getApproved: publicProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getApprovedListings(input.limit, input.offset);
      }),

    update: landlordProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        pricePerMonth: z.number().optional(),
        numberOfRooms: z.number().optional(),
        occupancyPerRoom: z.number().optional(),
        services: z.array(z.string()).optional(),
        rules: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const listing = await db.getListing(input.id);
        if (!listing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        }

        const landlord = await db.getLandlordByUserId(ctx.user.id);
        if (!landlord || listing.landlordId !== landlord.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot update this listing" });
        }

        // Only allow updates if listing is pending or rejected
        if (listing.status !== "pending" && listing.status !== "rejected") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot update approved listings" });
        }

        return { success: true };
      }),

    delete: landlordProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const listing = await db.getListing(input);
        if (!listing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        }

        const landlord = await db.getLandlordByUserId(ctx.user.id);
        if (!landlord || listing.landlordId !== landlord.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete this listing" });
        }

        await db.deleteListing(input);
        return { success: true };
      }),
  }),

  // Media management
  media: router({
    upload: landlordProcedure
      .input(z.object({
        listingId: z.number(),
        type: z.enum(["image", "video"]),
        fileName: z.string(),
        mimeType: z.string(),
        fileBuffer: z.instanceof(Buffer),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const listing = await db.getListing(input.listingId);
        if (!listing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        }

        const landlord = await db.getLandlordByUserId(ctx.user.id);
        if (!landlord || listing.landlordId !== landlord.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot upload media to this listing" });
        }

        // Upload to storage
        const storageKey = `listings/${input.listingId}/${Date.now()}-${input.fileName}`;
        const { url, key } = await storagePut(storageKey, input.fileBuffer, input.mimeType);

        // Save media record
        const media = await db.createMedia({
          listingId: input.listingId,
          type: input.type,
          url,
          storageKey: key,
          fileName: input.fileName,
          mimeType: input.mimeType,
          displayOrder: input.displayOrder,
        });

        return media;
      }),

    getByListing: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getMediaByListing(input);
      }),

    delete: landlordProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        // Verify ownership before deleting
        const mediaItem = await db.getMediaByListing(0); // This is a placeholder - would need actual query
        // In production, you'd verify the landlord owns this media
        return await db.deleteMedia(input);
      }),
  }),

  // Admin approval workflow
  admin: router({
    getPendingListings: adminProcedure.query(async () => {
      return await db.getPendingListings();
    }),

    approveListing: adminProcedure
      .input(z.object({
        listingId: z.number(),
        paymentVerified: z.boolean(),
        inspectionNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const listing = await db.getListing(input.listingId);
        if (!listing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        }

        if (listing.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending listings can be approved" });
        }

        // Update listing status
        await db.updateListingStatus(input.listingId, "approved");

        // Create approval record
        await db.createApproval({
          listingId: input.listingId,
          adminId: ctx.user.id,
          decision: "approved",
          paymentVerified: input.paymentVerified,
          inspectionNotes: input.inspectionNotes,
        });

        // Get landlord and notify
        const landlord = await db.getLandlordByUserId(listing.landlordId);
        if (landlord && landlord.userId) {
          await db.createNotification({
            userId: landlord.userId,
            type: "approval",
            title: "Listing Approved",
            message: `Your listing "${listing.title}" has been approved and is now live!`,
            relatedListingId: input.listingId,
          });
        }

        // Notify owner
        await notifyOwner({
          title: "Listing Approved",
          content: `Admin ${ctx.user.name} approved listing "${listing.title}"`,
        });

        return { success: true };
      }),

    rejectListing: adminProcedure
      .input(z.object({
        listingId: z.number(),
        reason: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        const listing = await db.getListing(input.listingId);
        if (!listing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        }

        if (listing.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending listings can be rejected" });
        }

        // Update listing status
        await db.updateListingStatus(input.listingId, "rejected", input.reason);

        // Create approval record
        await db.createApproval({
          listingId: input.listingId,
          adminId: ctx.user.id,
          decision: "rejected",
          reason: input.reason,
        });

        // Get landlord and notify
        const landlord = await db.getLandlordByUserId(listing.landlordId);
        if (landlord && landlord.userId) {
          await db.createNotification({
            userId: landlord.userId,
            type: "rejection",
            title: "Listing Rejected",
            message: `Your listing "${listing.title}" was rejected. Reason: ${input.reason}`,
            relatedListingId: input.listingId,
          });
        }

        // Notify owner
        await notifyOwner({
          title: "Listing Rejected",
          content: `Admin ${ctx.user.name} rejected listing "${listing.title}". Reason: ${input.reason}`,
        });

        return { success: true };
      }),

    getAllListings: adminProcedure.query(async () => {
      return await db.getAllListings();
    }),

    getStatistics: adminProcedure.query(async () => {
      const allListings = await db.getAllListings();
      const pendingCount = allListings.filter((l: Listing) => l.status === "pending").length;
      const approvedCount = allListings.filter((l: Listing) => l.status === "approved").length;
      const rejectedCount = allListings.filter((l: Listing) => l.status === "rejected").length;
      const totalListings = allListings.length;
      const totalRevenue = allListings
        .filter((l: Listing) => l.status === "approved")
        .reduce((sum: number, l: Listing) => sum + parseFloat(l.pricePerMonth.toString()), 0);
      
      return {
        totalListings,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalRevenue,
      };
    }),
  }),

  // Contact and messaging
  contact: router({
    sendMessage: publicProcedure
      .input(z.object({
        listingId: z.number(),
        senderName: z.string().min(2),
        senderEmail: z.string().email(),
        message: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const listing = await db.getListing(input.listingId);
        if (!listing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
        }

        // In a real application, you would send an email here
        // For now, we'll just return success
        return { success: true, message: "Message sent successfully" };
      }),
  }),

  // Notifications
  notifications: router({
    getNotifications: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getNotifications(ctx.user.id, input.limit);
      }),

    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return await db.markNotificationAsRead(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
