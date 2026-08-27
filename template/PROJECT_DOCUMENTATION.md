# IPDAV - Complete Project Documentation

> **Last Updated:** 2026-07-21  
> **Project Version:** 0.1.0  
> **Type:** Full-Stack Next.js 14 Application

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Core Features](#core-features)
7. [Public Files & Assets](#public-files--assets)
8. [Full Directory Tree](#full-directory-tree)
9. [Setup & Installation](#setup--installation)

---

## 🎯 Project Overview

**IPDAV** is a comprehensive Next.js-based SaaS platform with the following capabilities:

- **Multi-Tenant CMS** - Content management with pages, posts, categories, tags, and media
- **E-Learning Platform** - Course management, enrollment, content delivery (videos, materials)
- **E-Commerce** - Product catalog, orders, payments, coupons, shipping, tax management
- **Subscription Management** - Monthly/Yearly/Lifetime billing cycles with payment processing
- **Analytics & Tracking** - 404 logs, analytics events, AI crawling
- **Email Management** - Template system, automated triggers, email logs
- **File Sharing** - Secure file storage and sharing between users
- **Admin Dashboard** - Comprehensive management interface for all features
- **User Roles & Permissions** - Multi-level access control (Super Admin, Admin, Editor, Author, Viewer, Subscriber)

---

## 🛠️ Tech Stack

### Backend

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** NextAuth.js / Custom JWT
- **Payment Processing:** Stripe & Razorpay
- **Email Service:** Custom email templates with provider support
- **File Storage:** Cloudinary (cloud upload)
- **AI Services:** Google Generative AI
- **Validation:** Zod, React Hook Form

### Frontend

- **UI Framework:** React 18+
- **Component Library:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS + PostCSS
- **State Management:** React Query (SWR for some routes)
- **Drag & Drop:** @dnd-kit (for reordering)
- **Rich Text:** Babel, Monaco Editor, HTML-to-React parser
- **Notifications:** React Toastify / Toast system

### DevOps & Tools

- **Deployment:** Vercel
- **Package Manager:** npm
- **Build System:** Next.js built-in
- **Linting:** ESLint
- **Email Development:** React Email

---

## 🗄️ Database Schema

### Core Models

#### **Tenant (Multi-Tenancy)**

```
tenant {
  id (PK)
  name, slug
  users, pages, posts, courses, orders, etc.
}
```

#### **User Management**

```
user {
  id, email, password, name, role
  tenantId (FK)
  Relations: comments, posts, payments, subscriptions, orders, etc.
}

user_role enum: SUPER_ADMIN | ADMIN | EDITOR | AUTHOR | VIEWER | SUBSCRIBER
```

#### **Content Management**

```
page { id, title, slug, content, status, tenantId, ... }
post { id, title, slug, content, status, categoryId, tenantId, ... }
category { id, name, slug, tenantId, ... }
tag { id, name, slug, tenantId, ... }
comment { id, content, status, postId, pageId, userId, ... }
media { id, url, type, tenantId, ... }
```

#### **Learning Management System**

```
Course {
  id, title, slug, price, billingCycle (MONTHLY|YEARLY|LIFETIME)
  billingPeriodDays, level, isFeatured, isPublished
  Relations: courseContent, modules, payments, subscriptions, enrollments
}

CourseContent {
  id, title, slug, description, instructor, level, isPublished
  Relations: modules, pricingCard (Course)
}

CourseModule {
  id, title, videoType (URL|FILE), videoUrl, durationMinutes
  Relations: materials, courseContent
}

CourseMaterial {
  id, title, type (PDF|DOC|LINK|VIDEO|OTHER), url, size
}

CourseEnrollment {
  id, userId, courseId, enrolledAt, completedAt
}

PricingFeature {
  id, title, sortOrder, courseId
  (Bullet points shown on pricing cards)
}
```

#### **Payment & Subscriptions**

```
Payment {
  id, userId, courseId, amount, currency, status (PENDING|SUCCESS|FAILED)
  stripePaymentIntentId, billingCycle
}

Subscription {
  id, userId, courseId, billingCycle (MONTHLY|YEARLY)
  status (TRIALING|ACTIVE|EXPIRED|CANCELED)
  startsAt, currentPeriodEnd, canceledAt
}

Order {
  id, userId, items (JSON array), totalAmount, status, paymentMethod
  shippingAddress, trackingNumber, tenantId
}
```

#### **E-Commerce**

```
Product { id, name, price, description, images, stock, categoryId, tenantId }
ProductCategory { id, name, slug, tenantId }
Coupon { id, code, discountType, discountValue, expiresAt, tenantId }
ShippingZone { id, name, countries, baseCost, tenantId }
TaxClass { id, name, rate, tenantId }
```

#### **File Management**

```
SharedFile {
  id, fileName, fileUrl, fileType, expiresAt, accessLevel
  sharedBy (userId), createdAt, updatedAt
}

FileShare {
  id, sharedFileId, sharedWithUserId, accessLevel
  sharedAt, expiresAt
}
```

#### **Email System**

```
EmailTemplate {
  id, triggerEvent, recipientType, subject, bodyHtml
  variables (JSON), isActive
}

EmailSettings {
  senderName, fromEmail, replyToEmail, lastTestStatus, lastTestAt
}

EmailLog {
  id, templateId, triggerEvent, emailTo, status, provider, error, sentAt
}
```

#### **Settings & Configuration**

```
SiteSettings { siteName, logo, description, socialLinks, etc. }
FooterSettings { label, content, sort order }
NavbarConfig { logo, menus, style }
TrackingSettings { GA, GTM, Facebook Pixel, Google Ads configs }
AnalyticsSettings { gtmId, gaMeasurementId, facebookPixelId, etc. }
AICrawlSettings { enableMarkdownGeneration, includePages, includePosts, etc. }
AICrawlContent { contentType, contentId, slug, markdown, wordCount }
Redirect { from, to, statusCode }
NotFoundLog { url, referrer, userAgent, timestamp }
```

---

## 🔧 Backend Architecture

### API Routes Structure

#### **Authentication** (`/api/auth`)

```
├── POST /api/auth/login
│   └── Login with email/password, returns auth token
├── POST /api/auth/register
│   └── Register new user with email/password
├── POST /api/auth/logout
│   └── Clear session/token
└── GET /api/auth/me
    └── Get current authenticated user info
```

#### **Users Management** (`/api/users`)

```
├── GET /api/users
│   └── List all users (admin only)
├── POST /api/users
│   └── Create new user
├── GET /api/users/[id]
│   └── Get user by ID
├── PATCH /api/users/[id]
│   └── Update user profile
├── DELETE /api/users/[id]
│   └── Delete user
└── PATCH /api/users/[id]/role
    └── Update user role
```

#### **Content Management** (`/api/pages`, `/api/posts`, `/api/categories`, `/api/tags`)

```
Pages:
├── GET /api/pages
│   └── Get all pages (with search, filter, pagination)
├── POST /api/pages
│   └── Create page
├── GET /api/pages/[id]
│   └── Get page details
├── PATCH /api/pages/[id]
│   └── Update page
├── DELETE /api/pages/[id]
│   └── Delete page
└── PATCH /api/pages/[id]/publish
    └── Publish/unpublish page

Posts:
├── GET /api/posts (with categoryId, tagId filters)
├── POST /api/posts
├── GET /api/posts/[id]
├── PATCH /api/posts/[id]
├── DELETE /api/posts/[id]
└── PATCH /api/posts/[id]/publish

Categories:
├── GET /api/categories
├── POST /api/categories
├── GET /api/categories/[id]
├── PATCH /api/categories/[id]
├── DELETE /api/categories/[id]

Tags:
├── GET /api/tags
├── POST /api/tags
├── GET /api/tags/[id]
├── PATCH /api/tags/[id]
└── DELETE /api/tags/[id]
```

#### **Comments** (`/api/comments`)

```
├── GET /api/comments (with filters for page/post)
│   └── Fetch comments with pagination
├── POST /api/comments
│   └── Create comment (auto-approve or moderation)
├── GET /api/comments/[id]
│   └── Get comment details
├── PATCH /api/comments/[id]
│   └── Update comment status (APPROVED|SPAM|TRASH)
├── DELETE /api/comments/[id]
│   └── Delete comment
├── POST /api/comments/[id]/reply
│   └── Reply to comment (nested comments)
├── POST /api/comments/bulk-delete
│   └── Bulk delete comments
├── GET /api/comments/counts
│   └── Get comment counts by page/post
└── GET /api/comments/bulk-delte (typo in codebase)
    └── Bulk delete endpoint
```

#### **Learning Management** (`/api/courses`, `/api/course-content`, `/api/course-material`, `/api/enrollments`)

```
Courses:
├── GET /api/courses
│   └── List courses with filters (featured, published, sortOrder)
├── POST /api/courses
│   └── Create course with pricing info
├── GET /api/courses/[id]
│   └── Get course details (with content modules)
├── PATCH /api/courses/[id]
│   └── Update course (title, price, billingCycle, etc.)
├── DELETE /api/courses/[id]
│   └── Delete course
├── PUT /api/courses/reorder
│   └── Reorder courses (drag & drop)
├── GET /api/courses/public
│   └── Get published courses for public display
├── GET /api/courses/[id]/detail
│   └── Get detailed course view
└── GET /api/courses/[id]/toggle-status/page.js
    └── Toggle publish status

Course Content:
├── GET /api/course-content
│   └── Get all course contents
├── POST /api/course-content
│   └── Create course content
├── GET /api/course-content/[id]
│   └── Get course content details
├── PATCH /api/course-content/[id]
│   └── Update course content
├── DELETE /api/course-content/[id]
│   └── Delete course content
├── PATCH /api/course-content/[id]/publish
│   └── Publish course content
└── PATCH /api/course-content/[id]/modules
    └── Reorder or manage modules

Course Materials:
├── GET /api/course-material/[moduleId]
│   └── Get materials for module
├── POST /api/course-material/[moduleId]
│   └── Add material to module
├── PUT /api/course-material/[moduleId]/reorder
│   └── Reorder materials
├── PUT /api/course-material/material/[materialId]
│   └── Update material
└── DELETE /api/course-material/material/[materialId]
    └── Delete material

Enrollments:
├── GET /api/enrollments/my
│   └── Get user's course enrollments
├── POST /api/enrollments
│   └── Enroll user in course
├── GET /api/enrollments/check/[courseId]
│   └── Check if user is enrolled in course
└── DELETE /api/enrollments/[id]
    └── Unenroll from course
```

#### **Payments & Subscriptions** (`/api/payment`, `/api/subscription`)

```
Payment:
├── POST /api/payment/create-order
│   └── Create payment order (Stripe/Razorpay)
├── POST /api/payment/verify
│   └── Verify payment and create Payment record
├── GET /api/payment/history
│   └── Get user's payment history
└── GET /api/payment/[id]
    └── Get payment details

Subscription:
├── GET /api/subscription
│   └── Get user's current subscription
├── POST /api/subscription
│   └── Create/upgrade subscription
├── PATCH /api/subscription/[id]
│   └── Update subscription (change plan, billing cycle)
├── DELETE /api/subscription/[id]
│   └── Cancel subscription
├── GET /api/subscription/plans
│   └── Get all available plans
└── GET /api/cron/expire-subscriptions
    └── Cron job to expire subscriptions (runs periodically)
```

#### **E-Commerce** (`/api/ecommerce`)

```
Coupons:
├── GET /api/ecommerce/coupons
│   └── List coupons
├── POST /api/ecommerce/coupons
│   └── Create coupon
├── GET /api/ecommerce/coupons/[id]
│   └── Get coupon details
├── PATCH /api/ecommerce/coupons/[id]
│   └── Update coupon
└── DELETE /api/ecommerce/coupons/[id]
    └── Delete coupon

Shipping Zones:
├── GET /api/ecommerce/shipping-zones
│   └── List shipping zones
├── POST /api/ecommerce/shipping-zones
│   └── Create zone
├── GET /api/ecommerce/shipping-zones/[id]
│   └── Get zone details
├── PATCH /api/ecommerce/shipping-zones/[id]
│   └── Update zone
└── DELETE /api/ecommerce/shipping-zones/[id]
    └── Delete zone

Tax Classes:
├── GET /api/ecommerce/tax-classes
│   └── List tax classes
├── POST /api/ecommerce/tax-classes
│   └── Create tax class
├── GET /api/ecommerce/tax-classes/[id]
│   └── Get tax details
├── PATCH /api/ecommerce/tax-classes/[id]
│   └── Update tax
└── DELETE /api/ecommerce/tax-classes/[id]
    └── Delete tax
```

#### **File Management** (`/api/files`)

```
├── GET /api/files
│   └── List user's files
├── POST /api/files
│   └── Upload file (with Cloudinary integration)
├── GET /api/files/[id]
│   └── Get file details
├── DELETE /api/files/[id]
│   └── Delete file
├── POST /api/files/[id]/share
│   └── Share file with other users
├── GET /api/files/[id]/shares
│   └── Get file shares list
├── GET /api/files/admin
│   └── List all files (admin only)
└── DELETE /api/files/admin/[id]
    └── Delete file (admin only)
```

#### **Email Management** (`/api/emails`)

```
Templates:
├── GET /api/emails/templates
│   └── Get email templates (by triggerEvent, recipientType)
├── POST /api/emails/templates
│   └── Create email template
├── GET /api/emails/templates/[id]
│   └── Get template details
├── PATCH /api/emails/templates/[id]
│   └── Update template
└── DELETE /api/emails/templates/[id]
    └── Delete template

Settings:
├── GET /api/emails/settings
│   └── Get email settings (sender, from, reply-to)
├── PATCH /api/emails/settings
│   └── Update email settings
└── POST /api/emails/settings/tests
    └── Send test email
```

#### **AI & Content** (`/api/ai-crawl-content`, `/api/ai-crawl-settings`)

```
AI Crawl Settings:
├── GET /api/ai-crawl-settings
│   └── Get AI settings (enableMarkdownGeneration, includePages, etc.)
└── PATCH /api/ai-crawl-settings
    └── Update AI settings

AI Crawl Content:
├── GET /api/ai-crawl-content
│   └── List generated markdown content
├── POST /api/ai-crawl-content
│   └── Generate markdown for pages/posts
├── GET /api/ai-crawl-content/[id]
│   └── Get specific generated content
└── DELETE /api/ai-crawl-content/[id]
    └── Delete generated content
```

#### **Media & Assets** (`/api/media`, `/api/upload`)

```
Media:
├── GET /api/media
│   └── List media files
├── POST /api/media
│   └── Upload media
├── GET /api/media/[id]
│   └── Get media details
├── PATCH /api/media/[id]
│   └── Update media
└── DELETE /api/media/[id]
    └── Delete media

Upload:
└── POST /api/upload
    └── Generic upload endpoint (for images, docs, etc.)
```

#### **Navigation & Layout** (`/api/navbar-config`, `/api/footer-config`, `/api/menus`, `/api/breadcramps`)

```
Navbar Config:
├── GET /api/navbar-config
│   └── Get navbar configuration
└── PATCH /api/navbar-config
    └── Update navbar

Footer Config:
├── GET /api/footer-config
│   └── Get footer configuration
└── PATCH /api/footer-config
    └── Update footer

Menus:
├── GET /api/menus
│   └── List menus
├── POST /api/menus
│   └── Create menu
├── GET /api/menus/[id]
│   └── Get menu details
├── PATCH /api/menus/[id]
│   └── Update menu
└── DELETE /api/menus/[id]
    └── Delete menu

Breadcrumbs:
├── GET /api/breadcramps
│   └── Get breadcrumb settings
└── PATCH /api/breadcramps
    └── Update breadcrumbs
```

#### **Settings & Configuration** (`/api/setting`, `/api/seo`)

```
Site Settings:
├── GET /api/setting
│   └── Get all site settings
├── PATCH /api/setting
│   └── Update site settings
└── GET /api/setting/[key]
    └── Get specific setting

SEO:
├── GET /api/seo
│   └── Get SEO settings
├── PATCH /api/seo
│   └── Update SEO settings
└── POST /api/seo/generate
    └── Generate SEO metadata
```

#### **Redirects & Internal Links** (`/api/redirects`, `/api/internal-link-rules`)

```
Redirects:
├── GET /api/redirects
│   └── List redirects (301, 302)
├── POST /api/redirects
│   └── Create redirect
├── GET /api/redirects/[id]
│   └── Get redirect details
├── PATCH /api/redirects/[id]
│   └── Update redirect
└── DELETE /api/redirects/[id]
    └── Delete redirect

Internal Link Rules:
├── GET /api/internal-link-rules
│   └── List internal linking rules
├── POST /api/internal-link-rules
│   └── Create rule
├── GET /api/internal-link-rules/[id]
│   └── Get rule details
├── PATCH /api/internal-link-rules/[id]
│   └── Update rule
├── DELETE /api/internal-link-rules/[id]
│   └── Delete rule
└── PATCH /api/internal-link-rules/[id]/toggle
    └── Enable/disable rule
```

#### **Analytics & Logging** (`/api/logs`, `/api/analytics`, `/api/dashboard`)

```
404 Logs:
├── POST /api/logs/404
│   └── Log 404 errors (client-side)
└── GET /api/logs/404/analytics
    └── Get 404 analytics data

Analytics:
├── GET /api/analytics
│   └── Get overall analytics
└── GET /api/analytics/[type]
    └── Get specific analytics type

Dashboard:
└── GET /api/dashboard
    └── Get admin dashboard metrics
```

#### **Forms & Submissions** (`/api/form`)

```
├── GET /api/form
│   └── List forms
├── POST /api/form
│   └── Create form
├── GET /api/form/[id]
│   └── Get form details
├── PATCH /api/form/[id]
│   └── Update form
├── DELETE /api/form/[id]
│   └── Delete form
├── GET /api/form/[id]/submissions
│   └── Get form submissions
├── POST /api/form/[id]/submissions
│   └── Submit form
└── DELETE /api/form/[id]/submissions/[submissionId]
    └── Delete submission
```

#### **System** (`/api/env-check`, `/api/export`, `/api/permissions`)

```
Environment Check:
└── GET /api/env-check
    └── Check environment configuration

Export:
└── GET /api/export
    └── Export data (all records)

Permissions:
├── GET /api/permissions
│   └── Get permission list
├── POST /api/permissions
│   └── Create permission
└── PATCH /api/permissions/[id]
    └── Update permission
```

#### **Admin & Special** (`/api/admin`, `/api/customers`, `/api/permissions`)

```
Customers:
├── GET /api/customers
│   └── List customers
├── GET /api/customers/[id]
│   └── Get customer details
└── DELETE /api/customers/[id]
    └── Delete customer

Admin:
├── GET /api/admin/dashboard
│   └── Admin dashboard data
├── GET /api/admin/reports
│   └── Business reports
└── POST /api/admin/export
    └── Export reports
```

### Backend Services

#### Located in `src/services/`

**1. CommentServices.ts**

- `getComments(filters)` - Get comments with pagination, filtering
- `createComment(data)` - Create new comment
- `updateCommentStatus(id, status)` - Approve/spam/trash
- `deleteComment(id)` - Delete comment
- `replyToComment(id, replyData)` - Add nested reply
- `bulkDeleteComments(ids)` - Delete multiple comments

**2. PostServices.ts**

- `getPosts(filters)` - Get posts with category, tag filters
- `createPost(postData)` - Create post
- `updatePost(id, updates)` - Update post
- `deletePost(id)` - Delete post
- `publishPost(id, status)` - Publish/unpublish
- `getPostBySlug(slug)` - Get post by URL slug
- `getRelatedPosts(postId)` - Get similar posts

**3. PageServices.ts**

- `getPages(filters)` - Get pages
- `createPage(pageData)` - Create page
- `updatePage(id, updates)` - Update page
- `deletePage(id)` - Delete page
- `getPageBySlug(slug)` - Get page by slug
- `publishPage(id, status)` - Publish/unpublish

**4. OrderServices.ts**

- `createOrder(orderData)` - Create order
- `updateOrderStatus(id, status)` - Update order status
- `getOrders(filters)` - Get orders
- `getOrderDetails(id)` - Get order details
- `calculateOrderTotal(items, coupon)` - Calculate totals with tax/shipping

**5. InternalLinking.ts**

- `createInternalLinkRule(rule)` - Create linking rule
- `updateRule(id, rule)` - Update rule
- `deleteRule(id)` - Delete rule
- `applyInternalLinks(content)` - Apply links to content
- `validateRule(rule)` - Validate linking rule

---

## 🎨 Frontend Architecture

### Pages Structure (`src/app/`)

```
src/app/
├── page.tsx (Home page)
├── layout.tsx (Root layout)
├── globals.css (Global styles)
├── not-found.tsx (404 page)

├── login/ (Authentication)
│   └── page.tsx - Login form with email/password
├── register/ (Registration)
│   └── page.tsx - Registration form, select plan

├── admin/ (Admin Dashboard)
│   ├── layout.tsx
│   ├── page.tsx (Dashboard overview)
│   ├── courses/ (Course management)
│   │   └── page.tsx - Create/edit/delete courses
│   ├── emails/ (Email templates)
│   │   └── templates/page.tsx - Email template editor
│   ├── users/ (User management)
│   │   └── page.tsx - User list and roles
│   ├── settings/ (Site settings)
│   │   └── page.tsx - General settings, branding
│   ├── media/ (Media library)
│   │   └── page.tsx - Image/file manager
│   ├── pages/ (Page editor)
│   │   └── page.tsx - Create/edit pages
│   ├── posts/ (Blog editor)
│   │   └── page.tsx - Create/edit posts
│   ├── comments/ (Comment moderation)
│   │   └── page.tsx - Approve/spam comments
│   ├── seo/ (SEO settings)
│   │   └── page.tsx - Meta tags, sitemap
│   └── [slug]/ (Dynamic admin pages)

├── pricing/ (Pricing page)
│   └── page.tsx - Display all plans/courses
├── checkout/ (Payment checkout)
│   └── page.tsx - Razorpay/Stripe payment form
├── courses/ (Course listing)
│   ├── page.tsx - Course grid/list
│   └── [id]/ (Course details)
│       ├── page.tsx - Course overview
│       └── watch/page.tsx - Course video player (gated)

├── posts/ (Blog listing)
│   ├── page.tsx - Blog grid/list
│   └── [slug]/ (Blog post detail)
│       └── page.tsx - Full post with comments

├── subscription/ (User subscription area)
│   ├── layout.tsx
│   ├── page.tsx (Subscription dashboard)
│   ├── courses/page.tsx - Enrolled courses
│   ├── billing/page.tsx - Billing history
│   └── my-files/page.tsx - Shared files

├── dashboard/ (Subscriber dashboard)
│   └── page.tsx - User's personal dashboard

├── llms/ (LLM/AI content)
│   └── page.tsx - AI content view

├── shared/ (Shared resources)
│   └── [token]/page.tsx - Access shared files

├── robots.txt/ (SEO)
│   └── route.ts - Generate robots.txt
├── sitemap.xml/ (SEO)
│   └── route.ts - Generate sitemap
└── [slug]/ (Dynamic pages)
    ├── page.tsx - Page detail
    └── [slug].md/
        └── route.ts - Markdown export
```

### Components Structure (`src/components/`)

#### **Admin Components** (`src/components/admin/`)

```
admin/
├── AppSidebar.tsx
│   └── Sidebar with navigation menu for admin panel
├── plan/ (Plan management page)
│   └── page.tsx - Create, edit, delete plans
├── courses/
│   ├── AdminCoursePage.tsx - Course management (CRUD)
│   ├── CourseForm.tsx - Form to create/edit course
│   └── CourseTable.tsx - Display courses in table
├── users/
│   ├── UserManagement.tsx - User list and filtering
│   ├── Permission.tsx - Role and permission settings
│   └── UserForm.tsx - Create/edit user
├── posts/
│   ├── PostEditor.tsx - Rich text editor for posts
│   ├── PostTable.tsx - List posts
│   └── CategoryManager.tsx - Manage categories/tags
├── pages/
│   ├── PageEditor.tsx - Page builder
│   └── PageTable.tsx - List pages
├── emails/
│   ├── EmailTemplateEditor.tsx - Template builder
│   ├── EmailSettings.tsx - Email configuration
│   └── TemplateList.tsx - List templates
├── media/
│   ├── MediaLibrary.tsx - File browser
│   └── MediaUpload.tsx - File upload
├── comments/
│   └── CommentModeration.tsx - Approve/reject comments
├── settings/
│   ├── SiteSettingsForm.tsx - General settings
│   ├── SeoSettings.tsx - SEO configuration
│   └── AnalyticsSettings.tsx - GA, GTM setup
└── seo/
    └── SeoEditorPage.tsx - SEO meta editor
```

#### **Site Components** (`src/components/site/`)

```
site/
├── siteNavbar.tsx - Main navigation bar
├── Header.tsx - Page header
├── Footer.tsx - Footer component
├── HeroSection.tsx - Hero banner
├── FeatureSection.tsx - Feature showcase
├── CallToAction.tsx - CTA buttons
└── SocialLinks.tsx - Social media links
```

#### **Subscription Components** (`src/components/subscription/`)

```
subscription/
├── SubscriptionPage.tsx
│   └── My Subscription tab - shows current subscription + available plans
├── SubscriptionCard.tsx
│   └── Display subscription status and details
├── TrialExpiryPopup.tsx
│   └── Warning popup when subscription expiring
├── billing-details.tsx
│   └── Billing history and invoices
├── courses.tsx
│   └── Display enrolled courses
├── dashboard.tsx
│   └── Subscription dashboard overview
├── dashboard-navbar.tsx
│   └── Navigation for subscription area
├── sidebar.tsx
│   └── Sidebar menu for subscription pages
├── file-sharing.tsx
│   └── Shared files list
└── file-sharing/
    └── FileShareCard.tsx - Individual file share card
```

#### **Subscriber Components** (`src/components/subscriber/`)

```
subscriber/
├── SubscriberDashboard.tsx
│   └── Main dashboard for subscribers
└── (imports Subscription components)
```

#### **UI Components** (`src/components/ui/`)

```
ui/ (shadcn/ui components)
├── button.tsx
├── card.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── form.tsx
├── input.tsx
├── label.tsx
├── select.tsx
├── table.tsx
├── tabs.tsx
├── toast.tsx
├── alert.tsx
├── badge.tsx
├── checkbox.tsx
├── radio-group.tsx
├── sidebar.tsx
└── (40+ more UI components)
```

#### **Global Components** (`src/components/`)

```
components/
├── global-css-editor.tsx
│   └── Custom CSS editor
├── media-manager/
│   ├── MediaBrowser.tsx - Browse and select media
│   ├── MediaUpload.tsx - Upload interface
│   └── MediaGrid.tsx - Display media in grid
├── navbar.tsx
│   └── Main navigation component
├── SeoEditorPage.tsx
│   └── SEO metadata editor
├── TailwindRuntime.tsx
│   └── Tailwind CSS runtime compiler
├── theme-provider.tsx
│   └── Dark/light theme provider
└── theme-toggle.tsx
    └── Theme toggle button
```

### Hooks (`src/hooks/`)

```
use-adminsave.ts
└── Hook for auto-saving admin form changes

use-breadcramp.ts
└── Hook for managing breadcrumb navigation

use-bulkdelete.ts
└── Hook for bulk delete operations with confirmation

use-current-user.ts
└── Hook to get current authenticated user

use-mobile.ts
└── Hook to detect mobile device

use-toast.ts
└── Hook for toast notifications (success, error, info)

useFooter.ts
└── Hook to fetch and manage footer content

useInternalLinkRules.ts
└── Hook for internal linking rule management

useMenus.ts
└── Hook for managing navigation menus

useMenusPreview.ts
└── Hook for previewing menus before publishing

usePages.ts
└── Hook for fetching and managing pages

useAdminSave.ts (duplicate of use-adminsave.ts)
```

### Utilities & Libraries (`src/lib/`)

```
lib/
├── admin-toolbar.ts
│   └── Admin toolbar utilities and helpers

├── apimutation.ts
│   └── React Query mutation helpers for API calls

├── axios.ts
│   └── Configured Axios instance with interceptors
│   └── Includes auth token handling, error handling

├── cloudinary.ts
│   └── Cloudinary upload configuration and helpers

├── fetchers.ts
│   └── SWR/fetch helper functions
│   └── Re-usable data fetching functions

├── form-renderer.ts
│   └── Dynamic form rendering from schema
│   └── Converts JSON schema to React form

├── html-to-react.ts
│   └── Convert HTML strings to React components
│   └── Used for rendering rich text content

├── query-key.ts
│   └── React Query key factory
│   └── Centralized cache key management

├── redirectMiddleware.ts
│   └── Middleware for handling redirects
│   └── 301, 302 redirect logic

├── stripepay.ts
│   └── Stripe payment integration
│   └── Create payment intent, handle confirmations

├── utils.ts
│   └── Common utility functions
│   └── Format dates, prices, slugs, etc.

├── subscription/
│   ├── subscriptionApi.ts - Subscription API calls
│   ├── subscriptionUtils.ts - Billing cycle utilities
│   └── renewalScheduler.ts - Subscription renewal logic

├── ecom/
│   ├── cartUtils.ts - Shopping cart helpers
│   ├── orderCalculations.ts - Tax, shipping calculations
│   └── couponValidator.ts - Validate coupon codes

└── shortcode/
    ├── shortcodeParser.ts - Parse shortcodes in content
    └── shortcodes.ts - Shortcode definitions ([gallery], [button], etc.)
```

### Services (`src/services/`)

Located in the same directory as components and hooks:

```
services/
├── CommentServices.ts
│   └── Comment CRUD, filtering, moderation

├── InternalLinking.ts
│   └── Internal linking rule management

├── OrderServices.ts
│   └── Order creation, management, calculations

├── PageServices.ts
│   └── Page CRUD, publishing, slug management

└── PostServices.ts
    └── Post CRUD, publishing, category/tag filtering
```

### Other Frontend Directories

```
src/
├── app/ (Next.js app router - covered above)
├── components/ (React components - covered above)
├── hooks/ (Custom React hooks - covered above)
├── lib/ (Utilities and libraries - covered above)
├── services/ (Business logic services)
├── provider/ (React context providers)
│   └── AuthProvider.tsx - Authentication context
│   └── ThemeProvider.tsx - Theme context
│   └── QueryClientProvider.tsx - React Query setup
├── scripts/ (Utility scripts)
│   └── Various script utilities
└── proxy.ts (API proxy configuration)
```

---

## 🌟 Core Features

### 1. **Multi-Tenant Content Management**

- Create unlimited pages, posts with rich text editing
- Organize content with categories and tags
- Publish/draft workflow
- Automatic slug generation
- SEO metadata per page/post
- Internal linking rules
- Breadcrumb navigation
- 404 error tracking

### 2. **E-Learning Platform**

- Course creation with pricing and billing cycles
  - Lifetime (one-time purchase)
  - Monthly subscription
  - Yearly subscription
- Organize courses into modules and lessons
- Video hosting (URL or file upload)
- Course materials (PDFs, documents, links)
- Student enrollment and progress tracking
- Course access control

### 3. **Subscription & Billing**

- Support for monthly, yearly, and lifetime billing
- Stripe and Razorpay payment integration
- Subscription lifecycle management (trial, active, expired, canceled)
- Automatic subscription expiration (cron jobs)
- Payment history and invoices
- Coupon and discount management

### 4. **E-Commerce**

- Product catalog with images and inventory
- Shopping cart functionality
- Order management with multiple statuses
- Tax calculation and application
- Shipping zones with region-based pricing
- Coupon and promotional codes
- Payment processing (Stripe/Razorpay)

### 5. **Email Management**

- Email template system with variables
- Trigger-based email sending
  - Order placed
  - Course enrolled
  - Subscription renewed
  - File shared
- Email settings (sender name, from email, reply-to)
- Email logging and delivery tracking
- Test email functionality

### 6. **File Sharing**

- Secure file upload (Cloudinary)
- Share files with specific users
- Expiring file links
- Access-level control
- File organization

### 7. **Analytics & Tracking**

- Google Analytics integration
- Google Tag Manager
- Facebook Pixel tracking
- Google Ads tracking
- Custom event tracking
- 404 error logs with analytics

### 8. **Admin Dashboard**

- Comprehensive admin panel with sidebar navigation
- Dashboard metrics and KPIs
- User management with role-based access
- Permission and role configuration
- Settings management
- Media library

### 9. **User Management**

- User registration and login
- Email verification
- Password reset
- Role-based access control (6 roles)
- User profile management
- Permission system

### 10. **SEO Features**

- Meta tags management (title, description, keywords)
- XML sitemap generation
- Robots.txt generation
- Open Graph tags
- Schema markup support
- Canonical URLs
- Redirect management (301, 302)
- Internal linking rules

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+ / npm
- PostgreSQL 12+
- Git

### Installation Steps

```bash
# 1. Clone repository
git clone <repo-url>
cd ipdav

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your database, API keys, etc.

# 4. Setup database
npx prisma migrate reset

# 5. Seed initial data
npx prisma db seed

# 6. Generate Prisma Client
npx prisma generate

# 7. Run development server
npm run dev

# 8. Open in browser
# http://localhost:3000
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ipdav

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Payment
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=key_id
RAZORPAY_KEY_SECRET=key_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password

# Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI/ML
GOOGLE_API_KEY=your-google-api-key

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXX

# Site
NEXT_PUBLIC_SITE_NAME=IPDAV
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Development Commands

```bash
npm run dev        # Run dev server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run email:dev  # Email template development
npx prisma studio # Prisma Studio (visual DB editor)
```

---

## � Public Files & Assets (`public/`)

### Static Assets Directory Structure

```
public/
├── apple-icon.png
│   └── Apple device icon (iPhone, iPad homescreen)
│   └── Used for: Safari bookmarks, web app installation
│   └── Format: 180x180px PNG recommended

├── icon.svg
│   └── SVG favicon/app icon
│   └── Used for: Browser tab, bookmarks, responsive icon
│   └── Format: Vector SVG, scalable

├── icon-light-32x32.png
│   └── Light theme icon variant
│   └── Used for: Dark mode systems, theme switching
│   └── Format: 32x32px PNG

├── icon-dark-32x32.png
│   └── Dark theme icon variant
│   └── Used for: Light mode systems, high contrast
│   └── Format: 32x32px PNG

├── placeholder-logo.png
│   └── Default logo image (raster)
│   └── Used for: Site branding when no custom logo set
│   └── Used in: Navbar, headers, emails
│   └── Format: PNG with transparency

├── placeholder-logo.svg
│   └── Default logo (vector)
│   └── Used for: Responsive logo display
│   └── Used in: Admin panel, public pages
│   └── Format: Scalable SVG

├── placeholder.jpg
│   └── Generic placeholder image
│   └── Used for: Course thumbnails, product images
│   └── Used when: Real image not available yet
│   └── Format: JPG, compressed

├── placeholder.svg
│   └── Vector placeholder
│   └── Used for: Fallback graphics
│   └── Format: SVG, scalable

├── placeholder-user.jpg
│   └── Default user avatar
│   └── Used for: User profiles without uploaded avatar
│   └── Used in: Comments, author info, user cards
│   └── Format: JPG

├── llms.txt
│   └── LLM-friendly content file
│   └── Contains: Structured site content for AI models
│   └── Purpose: Used by: LLM indexing, AI crawlers, SEO bots
│   └── Format: Plain text, human-readable

└── uploads/
    └── Directory for user-uploaded files
    ├── 2026/
    │   ├── Images/ (course thumbnails, product images)
    │   ├── Documents/ (PDFs, course materials)
    │   ├── Videos/ (if self-hosted)
    │   └── Other media
    └── Structure follows date-based organization (YYYY/MM/)
```

### File Purposes & Usage

| File                   | Purpose                | Used In                    | Format  |
| ---------------------- | ---------------------- | -------------------------- | ------- |
| `apple-icon.png`       | iOS/MacOS home screen  | Web manifest, PWA          | PNG     |
| `icon.svg`             | Universal favicon      | `<link>` tag, bookmarks    | SVG     |
| `icon-light-32x32.png` | Light theme icon       | Dark mode systems          | PNG     |
| `icon-dark-32x32.png`  | Dark theme icon        | Light mode systems         | PNG     |
| `placeholder-logo.png` | Default site logo      | Navbar, emails, headers    | PNG     |
| `placeholder-logo.svg` | Scalable logo          | Admin panel, responsive    | SVG     |
| `placeholder.jpg`      | Generic image fallback | Course, product listings   | JPG     |
| `placeholder.svg`      | Vector placeholder     | Diagrams, illustrations    | SVG     |
| `placeholder-user.jpg` | Default avatar         | User profiles, comments    | JPG     |
| `llms.txt`             | AI-readable content    | LLM crawlers, search bots  | TXT     |
| `uploads/`             | User-uploaded media    | Gallery, courses, products | Various |

### Uploads Directory Structure

```
uploads/
└── 2026/
    ├── 01/ (January uploads)
    ├── 02/ (February uploads)
    └── ...
    └── 12/ (December uploads)

Structure: public/uploads/YYYY/MM/[filename]
```

**Upload Categories:**

- **Images:** `.jpg`, `.png`, `.webp`, `.gif`
- **Documents:** `.pdf`, `.doc`, `.docx`, `.xlsx`
- **Videos:** `.mp4`, `.webm` (if self-hosted)
- **Archives:** `.zip`, `.rar`

### Image Optimization

**Used in Cloudinary Integration:**

- Most images are uploaded to **Cloudinary** (cloud storage)
- Local `public/uploads/` is fallback/backup
- Cloudinary provides: CDN delivery, image optimization, transformations

**File Naming Convention:**

- Format: `[resource-type]-[id]-[timestamp].[ext]`
- Example: `course-thumbnail-123-1705862400.png`

### Favicon & Icons Setup

**Multi-Device Support:**

```html
<!-- Referenced in layout.tsx -->
<link rel="icon" href="/icon.svg" />
<link rel="apple-touch-icon" href="/apple-icon.png" />
<meta name="theme-color" content="#ffffff" />
```

**Light/Dark Mode Icons:**

- Automatically served based on system preference
- CSS Media Query: `prefers-color-scheme: light | dark`

### SEO & LLM Integration

**llms.txt Purpose:**

- Structured content for LLM crawlers
- Includes: Site description, page titles, keywords
- Used by: ChatGPT plugins, Claude, Perplexity
- Format: Plain text with markdown-style sections

**Generated from:**

- Site settings (NEXT_PUBLIC_SITE_NAME, description)
- Page metadata (title, description)
- Product/course information
- Content structure

### Static File Serving

**Next.js Optimization:**

- Files served from `/public` at root path
- Automatically cached with immutable headers
- Accessed as: `https://domain.com/icon.svg`
- No trailing `/public/` in URL

**Cache Control:**

- Versioned files: Long-term cache
- Dynamic files: Short-term or no-cache
- CDN integration via Cloudinary

---

## �📁 Full Directory Tree

```
ipdav/
├── src/
│   ├── app/                    # Next.js app router
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and libraries
│   ├── services/               # Business logic services
│   └── proxy.ts
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   ├── seed.js                # Initial data seeding
│   └── seed2.js, seed3.js
├── emails/                     # Email templates (React Email)
├── public/                     # Static assets
│   ├── uploads/               # User uploads
│   └── llms.txt
├── scripts/                    # Utility scripts
├── styles/                     # Global styles
├── tests/                      # Test files
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .env                        # Environment variables
└── readme.md
```

---

## 🔒 Security Features

- JWT/NextAuth authentication
- Role-based access control (RBAC)
- SQL injection prevention (Prisma ORM)
- CSRF protection
- XSS prevention
- Rate limiting on API routes
- Secure password hashing (bcryptjs)
- Environment variable protection
- File upload validation

---

## 📊 Database Models Count

- **Total Models:** 40+
- **Total Enums:** 7
- **Relations:** 100+
- **Indexes:** 50+

---

**Documentation Generated:** 2026-07-21  
**Next Update Required:** When adding new features or API endpoints
