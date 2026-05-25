# House-by-us: Complete Monetization & Deployment Guide

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Revenue Models](#revenue-models)
3. [Technical Architecture](#technical-architecture)
4. [Setup & Deployment Instructions](#setup--deployment-instructions)
5. [Database Schema](#database-schema)
6. [API Procedures (tRPC)](#api-procedures-trpc)
7. [Frontend Implementation](#frontend-implementation)
8. [Admin Dashboard](#admin-dashboard)
9. [Landlord Features](#landlord-features)
10. [Student Features](#student-features)
11. [Monetization Strategies](#monetization-strategies)
12. [Marketing & Growth](#marketing--growth)
13. [Compliance & Legal](#compliance--legal)

---

## Platform Overview

**House-by-us** is a student-focused boarding house marketplace connecting students in Harare with quality accommodation near universities and colleges. The platform operates on a three-sided marketplace model:

- **Students**: Browse, search, and contact landlords about available boarding houses
- **Landlords**: List their properties with images/videos, manage inquiries, and track approvals
- **Admins** (Makhosi Mathe & Vimbai Tipedze): Verify listings through physical inspection, manage approvals, and ensure quality standards

### Key Features

- Modern, responsive UI designed for mobile-first student users
- Cloud-based image and video storage for landlord uploads
- Admin approval workflow with payment verification
- Notification system for admins and landlords
- Interactive maps showing property locations and nearby universities
- Search and filtering by location, price, and services

---

## Revenue Models

### 1. **Listing Fees** (Primary Revenue)

Charge landlords a one-time or recurring fee to list their boarding houses:

- **One-time listing fee**: $50-100 USD per property
- **Monthly listing fee**: $10-20 USD per property per month
- **Premium listing fee**: $150-300 USD for featured/highlighted listings

**Implementation**: Add a `listingFee` field to the listings table and create a payment checkout flow using Stripe.

### 2. **Featured/Premium Listings**

Landlords can pay extra to have their listings:

- Featured on the homepage
- Highlighted in search results
- Appear first in location-based searches
- Get priority support

**Implementation**: Add a `isPremium` boolean field and `premiumExpiresAt` timestamp to listings table.

### 3. **Commission on Bookings** (Optional)

Take a small percentage (5-10%) of monthly rent when students book through the platform:

- Requires payment integration between students and landlords
- Automates rent collection and payment processing
- Builds trust through escrow services

**Implementation**: Requires Stripe Connect integration and booking management system.

### 4. **Landlord Verification/Background Checks**

Offer optional verification services:

- Identity verification: $25-50
- Property inspection certification: $100-150
- Background check service: $50-75

**Implementation**: Partner with verification services or integrate with third-party APIs.

### 5. **Advertising & Sponsored Listings**

Allow educational service providers to advertise:

- Furniture rental companies
- Internet service providers
- Moving/relocation services
- Student loan providers

**Implementation**: Create an advertising dashboard and integrate with ad networks.

### 6. **Premium Student Features** (Optional)

- Saved listings/favorites: Free
- Advanced search filters: Free
- Priority landlord messaging: $2-5/month
- Verified student badge: Free (after verification)

---

## Technical Architecture

### Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, TypeScript
- **Backend**: Express.js, tRPC 11, Node.js
- **Database**: MySQL/TiDB
- **Storage**: AWS S3 (via Manus platform)
- **Authentication**: Manus OAuth
- **Payments**: Stripe (optional, for monetization)
- **Maps**: Google Maps API (via Manus proxy)
- **Notifications**: Email (via Manus platform)

### Database Schema

```typescript
// Users table (extended with role field)
users {
  id: int (PK)
  openId: varchar (unique) - Manus OAuth ID
  name: text
  email: varchar
  role: enum('user', 'admin', 'landlord')
  createdAt: timestamp
  updatedAt: timestamp
  lastSignedIn: timestamp
}

// Landlords profile
landlords {
  id: int (PK)
  userId: int (FK, unique)
  companyName: text
  phoneNumber: varchar (required)
  alternatePhone: varchar
  bankAccountName: text
  bankAccountNumber: text
  bankName: text
  verificationStatus: enum('unverified', 'verified', 'rejected')
  createdAt: timestamp
  updatedAt: timestamp
}

// Listings
listings {
  id: int (PK)
  landlordId: int (FK)
  title: varchar (required)
  description: text
  address: text (required)
  latitude: decimal
  longitude: decimal
  pricePerMonth: decimal (required)
  numberOfRooms: int
  occupancyPerRoom: int
  status: enum('pending', 'approved', 'rejected')
  rejectionReason: text
  services: json (array of strings)
  rules: text
  contactPhone: varchar (required)
  contactEmail: varchar
  createdAt: timestamp
  updatedAt: timestamp
  approvedAt: timestamp
}

// Media files (images and videos)
media {
  id: int (PK)
  listingId: int (FK)
  type: enum('image', 'video')
  url: text (S3 URL)
  storageKey: text
  fileName: varchar
  mimeType: varchar
  displayOrder: int
  createdAt: timestamp
}

// Admin approvals
approvals {
  id: int (PK)
  listingId: int (FK, unique)
  adminId: int (FK)
  decision: enum('approved', 'rejected')
  reason: text
  paymentVerified: boolean
  inspectionNotes: text
  decidedAt: timestamp
}

// Notifications
notifications {
  id: int (PK)
  userId: int (FK)
  type: enum('new_submission', 'approval', 'rejection', 'system')
  title: varchar
  message: text
  relatedListingId: int
  isRead: boolean
  createdAt: timestamp
}
```

---

## Setup & Deployment Instructions

### Prerequisites

- Node.js 22+
- pnpm package manager
- MySQL 8.0+ or TiDB
- Manus account with project created
- Google Maps API key (optional, for maps)
- Stripe account (optional, for payments)

### Step 1: Initialize Project

```bash
# The project is already initialized as "house-by-us"
# Navigate to project directory
cd /home/ubuntu/house-by-us

# Install dependencies
pnpm install

# Generate database migrations
pnpm drizzle-kit generate

# Apply migrations to database
# (Use the Manus UI or execute the SQL file)
```

### Step 2: Configure Environment Variables

Set these in the Manus project settings:

```env
# Database (auto-configured by Manus)
DATABASE_URL=mysql://user:password@host/database

# Authentication (auto-configured)
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Admin accounts (set these for Makhosi and Vimbai)
OWNER_OPEN_ID=makhosi_open_id
OWNER_NAME=Makhosi Mathe

# Optional: Stripe integration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Email notifications
SENDGRID_API_KEY=SG.xxx
ADMIN_EMAIL=admins@housebyus.com
```

### Step 3: Promote Admin Users

To make Makhosi Mathe and Vimbai Tipedze admins:

1. Have them sign up through the Manus OAuth portal
2. In the database, update their role to 'admin':

```sql
UPDATE users SET role = 'admin' WHERE name IN ('Makhosi Mathe', 'Vimbai Tipedze');
```

Alternatively, set their `openId` in environment variables and they'll auto-promote on first login.

### Step 4: Deploy to Manus

1. Click "Publish" button in Manus Management UI
2. Configure custom domain (optional)
3. Enable SSL/HTTPS (auto-configured)
4. Set up monitoring and analytics

---

## API Procedures (tRPC)

### Landlord Procedures

```typescript
// Register as landlord
trpc.landlord.registerAsLandlord.mutate({
  companyName: "My Boarding Houses",
  phoneNumber: "+263781234567",
  alternatePhone: "+263774567890",
  bankAccountName: "John Doe",
  bankAccountNumber: "1234567890",
  bankName: "ZB Bank",
})

// Get landlord profile
trpc.landlord.getProfile.useQuery()

// Update landlord profile
trpc.landlord.updateProfile.mutate({
  phoneNumber: "+263781234567",
  // ... other fields
})
```

### Listing Procedures

```typescript
// Create listing
trpc.listings.create.mutate({
  title: "Modern 3-Bedroom House Near UZ",
  description: "Spacious house with WiFi, water tank...",
  address: "123 Main Street, Harare",
  latitude: -17.8252,
  longitude: 31.0335,
  pricePerMonth: 350,
  numberOfRooms: 3,
  occupancyPerRoom: 2,
  services: ["WiFi", "Water Tank", "Security", "Parking"],
  rules: "No smoking, quiet hours 10pm-7am",
  contactPhone: "+263781234567",
  contactEmail: "landlord@example.com",
})

// Get listing by ID
trpc.listings.getById.useQuery(listingId)

// Get landlord's listings
trpc.listings.getByLandlord.useQuery()

// Search listings
trpc.listings.search.useQuery({
  location: "Harare",
  minPrice: 200,
  maxPrice: 500,
  services: ["WiFi", "Water Tank"],
})

// Get approved listings (for homepage)
trpc.listings.getApproved.useQuery({ limit: 50, offset: 0 })

// Update listing
trpc.listings.update.mutate({
  id: listingId,
  title: "Updated Title",
  // ... other fields
})
```

### Media Procedures

```typescript
// Upload image/video
trpc.media.upload.mutate({
  listingId: 1,
  type: "image",
  fileName: "bedroom.jpg",
  mimeType: "image/jpeg",
  fileBuffer: fileBuffer, // From file input
  displayOrder: 0,
})

// Get media for listing
trpc.media.getByListing.useQuery(listingId)

// Delete media
trpc.media.delete.mutate(mediaId)
```

### Admin Procedures

```typescript
// Get pending listings for review
trpc.admin.getPendingListings.useQuery()

// Approve listing
trpc.admin.approveListing.mutate({
  listingId: 1,
  paymentVerified: true,
  inspectionNotes: "Property verified, meets standards",
})

// Reject listing
trpc.admin.rejectListing.mutate({
  listingId: 1,
  reason: "Property does not meet safety standards",
})

// Get all listings (for admin dashboard)
trpc.admin.getAllListings.useQuery()
```

### Notification Procedures

```typescript
// Get notifications
trpc.notifications.getNotifications.useQuery({ limit: 20 })

// Mark notification as read
trpc.notifications.markAsRead.mutate(notificationId)
```

---

## Frontend Implementation

### Landing Page (`/`)

The landing page includes:
- Hero section with search bar
- Features section highlighting platform benefits
- Featured listings carousel
- Call-to-action for landlords
- Footer with admin contact information

**Admin Contact Numbers** (as specified):
- Makhosi Mathe: 0781482977
- Vimbai Tipedze: 0774497837
- General: 0711462031

### Search Page (`/search`)

Features:
- Location-based search
- Price range filter (min/max)
- Services filter
- Responsive grid layout
- Loading states and empty states

### Listing Detail Page (`/listing/:id`)

Features:
- Image gallery with navigation
- Video player for property tours
- Services and amenities list
- House rules
- Pricing and room information
- Landlord contact details
- Location map (when integrated)
- "Send Inquiry" button

### Landlord Registration (`/landlord/register`)

Form fields:
- Company name
- Phone number
- Alternate phone
- Bank account details (for payments)
- Terms acceptance

### Landlord Dashboard (`/landlord/dashboard`)

Features:
- List of all landlord's listings
- Status badges (pending, approved, rejected)
- Edit/delete options for pending listings
- Analytics (views, inquiries)
- Profile management
- Payment history

### Admin Dashboard (`/admin`)

Features:
- Pending listings review queue
- Approve/reject interface
- Payment verification checkbox
- Inspection notes field
- All listings management
- Admin analytics
- User management

---

## Landlord Features

### Listing Submission Workflow

1. **Register as Landlord**: Provide contact and bank details
2. **Create Listing**: Fill in property details, upload images/videos
3. **Submit for Review**: Listing enters "pending" status
4. **Wait for Approval**: Admins review and inspect property
5. **Payment Verification**: Admins confirm payment received
6. **Go Live**: Listing becomes "approved" and visible to students

### Landlord Dashboard

Track all listings with status indicators:

```typescript
// Example listing statuses
{
  id: 1,
  title: "3-Bedroom House",
  status: "pending", // pending | approved | rejected
  createdAt: "2026-04-19",
  approvedAt: null,
  rejectionReason: null,
  views: 245,
  inquiries: 12,
}
```

### Notifications

Landlords receive notifications for:
- Listing submitted successfully
- Listing approved (with approval date)
- Listing rejected (with reason)
- New student inquiries (when implemented)

---

## Admin Dashboard

### Admin Access Control

Only users with `role: 'admin'` can access:
- `/admin` - Admin dashboard
- All admin procedures (approveListing, rejectListing, etc.)

### Approval Workflow

1. **View Pending Listings**: Queue of new submissions
2. **Physical Inspection**: Admins visit property to verify
3. **Verification Checklist**:
   - Property exists and matches description
   - Images/videos are accurate
   - Safety standards met
   - Landlord contact verified
4. **Payment Confirmation**: Verify listing fee payment received
5. **Approve or Reject**:
   - **Approve**: Listing goes live, landlord notified
   - **Reject**: Landlord notified with reason, can resubmit

### Admin Contact Information

Display on `/about` and `/contact` pages:

```
Makhosi Mathe
Phone: 0781482977

Vimbai Tipedze
Phone: 0774497837

General Inquiries
Phone: 0711462031
```

---

## Student Features

### Search & Browse

- Search by location (near universities/colleges)
- Filter by price range
- Filter by services (WiFi, water tank, security, etc.)
- Sort by newest, price (low to high), price (high to low)
- View featured listings on homepage

### Listing Details

- Full property description
- Image gallery with thumbnails
- Video tours
- Services and amenities list
- House rules
- Landlord contact information
- Location on map (when integrated)

### Favorites (Optional Enhancement)

- Save listings for later
- Manage saved listings
- Get notifications for price changes

---

## Monetization Strategies

### Strategy 1: Listing Fees (Recommended for Launch)

**Implementation**:

1. Add `listingFee` field to listings table
2. Create Stripe checkout for listing submission
3. Only create listing after payment confirmation

```typescript
// Example: Charge $50 per listing
const listingFee = 5000; // $50 in cents

// After payment confirmation
await db.createListing({
  ...listingData,
  listingFee: 50,
  paymentStatus: "paid",
});
```

**Pricing Tiers**:
- Basic: $50 (1 property, 30 days)
- Standard: $100 (2 properties, 90 days)
- Premium: $200 (unlimited, featured, 180 days)

### Strategy 2: Featured Listings

```typescript
// Add to listings table
featured: boolean
premiumExpiresAt: timestamp

// Charge $100 for 30 days of featured status
// Featured listings appear first in search results
```

### Strategy 3: Commission on Bookings

Requires integration with payment processing:

```typescript
// Add to bookings table (when implemented)
bookingFee: decimal (5-10% of monthly rent)
platformCommission: decimal
landlordReceives: decimal
```

### Strategy 4: Advertising

Create advertiser accounts for:
- Furniture rental companies
- Internet service providers
- Moving services
- Student loan providers

Charge $500-2000/month for featured ads.

### Strategy 5: Verification Services

Offer optional services:

```typescript
// Add to landlords table
isVerified: boolean
verificationFee: decimal
verificationDate: timestamp
```

Charge $100-150 for identity and property verification.

---

## Marketing & Growth

### Phase 1: Launch (Months 1-3)

1. **Soft Launch**: Invite 50-100 landlords to list properties
2. **University Partnerships**: Partner with UZ, NUST, Harare Poly
3. **Social Media**: Instagram, TikTok, WhatsApp groups
4. **Student Ambassadors**: Recruit 10-20 student influencers
5. **Free Listings**: Offer first 10 landlords free listings to build inventory

### Phase 2: Growth (Months 4-9)

1. **Paid Advertising**: Google Ads, Facebook Ads targeting students
2. **Referral Program**: $5-10 credit for each referral
3. **Content Marketing**: Blog posts about student housing
4. **Email Marketing**: Newsletter with new listings
5. **Partnerships**: Real estate agencies, student housing forums

### Phase 3: Scale (Months 10-12)

1. **Expand to Other Cities**: Bulawayo, Mutare, Gweru
2. **Mobile App**: iOS/Android native apps
3. **Premium Features**: Advanced search, saved listings
4. **Analytics**: Provide landlords with listing performance data
5. **Community**: Student reviews and ratings system

### Key Metrics to Track

- Monthly Active Users (Students)
- Total Listings
- Approved Listings
- Average Listing Price
- Search Volume
- Conversion Rate (Browse → Inquiry)
- Landlord Satisfaction
- Revenue per Listing

---

## Compliance & Legal

### Terms of Service

Include sections on:
- User responsibilities
- Landlord verification requirements
- Payment terms and refunds
- Liability limitations
- Dispute resolution
- Privacy policy

### Data Protection

- GDPR compliance (if serving EU users)
- Zimbabwe data protection laws
- Secure storage of payment information
- Regular security audits

### Landlord Verification

- Require valid ID
- Verify property ownership/lease
- Background checks (optional)
- Insurance requirements

### Student Safety

- Verify student email addresses (@uz.ac.zw, etc.)
- Encourage property inspections before booking
- Provide dispute resolution mechanism
- Collect feedback and reviews

### Payment Security

- Use Stripe for all payments
- Never store credit card details
- PCI DSS compliance
- Fraud detection

---

## Additional Features to Implement

### Phase 2 Enhancements

1. **Booking System**: Allow students to book directly through platform
2. **Payment Processing**: Collect rent through platform (with commission)
3. **Reviews & Ratings**: Students review properties and landlords
4. **Messaging**: In-app chat between students and landlords
5. **Notifications**: Email and SMS alerts for new listings
6. **Analytics Dashboard**: Landlords see listing performance

### Phase 3 Enhancements

1. **Mobile App**: Native iOS/Android applications
2. **Virtual Tours**: 360° property tours
3. **AI Recommendations**: Personalized listing suggestions
4. **Community Forum**: Discussion board for students
5. **Roommate Finder**: Connect students looking for roommates
6. **Lease Management**: Digital lease signing and management

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Admin accounts created (Makhosi & Vimbai)
- [ ] Environment variables configured
- [ ] Stripe account set up (if using payments)
- [ ] Google Maps API key configured (if using maps)
- [ ] Email notifications configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Legal documents (ToS, Privacy Policy) created
- [ ] Marketing materials prepared
- [ ] Landlord onboarding guide created
- [ ] Student user guide created

---

## Revenue Projections

### Conservative Scenario (Year 1)

- 200 approved listings
- Average listing fee: $75
- Total revenue: $15,000
- Operating costs: $5,000/month = $60,000/year
- **Net loss**: -$45,000

### Moderate Scenario (Year 1)

- 500 approved listings
- Average listing fee: $75
- Featured listing upgrades: 20% at $100 = +$7,500
- Total revenue: $45,000
- Operating costs: $5,000/month = $60,000/year
- **Net loss**: -$15,000

### Optimistic Scenario (Year 1)

- 1,000 approved listings
- Average listing fee: $75
- Featured listing upgrades: 30% at $100 = +$22,500
- Commission on bookings: 5% of $350 × 1,000 × 12 = $21,000
- Total revenue: $118,500
- Operating costs: $8,000/month = $96,000/year
- **Net profit**: +$22,500

### Year 2-3 Projections

With proper marketing and expansion:
- 3,000+ listings across multiple cities
- 50,000+ active student users
- $300,000+ annual revenue
- Profitability achieved

---

## Support & Maintenance

### Ongoing Tasks

- Monitor system performance
- Fix bugs and issues
- Update security patches
- Respond to landlord/student inquiries
- Review and approve new listings
- Manage payment disputes
- Analyze metrics and optimize

### Support Channels

- Email: support@housebyus.com
- Phone: 0711462031 (general inquiries)
- WhatsApp: Create business account
- Telegram: Create support bot
- In-app chat: For urgent issues

---

## Conclusion

House-by-us is positioned to become the leading student housing marketplace in Zimbabwe. By focusing on quality listings, strong admin verification, and excellent user experience, the platform can build trust and scale rapidly. The multiple revenue streams provide flexibility to optimize for growth or profitability based on market conditions.

**Key Success Factors**:
1. Maintain high listing quality through rigorous admin review
2. Build strong university partnerships
3. Provide excellent customer support
4. Continuously improve user experience
5. Expand to other cities and regions
6. Implement booking and payment features
7. Build community through reviews and ratings

**Timeline to Profitability**: 18-24 months with proper execution and marketing.

