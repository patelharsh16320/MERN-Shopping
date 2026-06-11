# Women HubClub

A full-stack MERN e-commerce platform for women's lifestyle products — skincare, beauty, fashion, wellness, and more. Built with React on the frontend and Node.js/Express + MongoDB on the backend.

---

## Screenshots

### Customer Pages

| Page | Screenshot |
|------|-----------|
| Home | ![Home](screenshots/01-home.png) |
| Products | ![Products](screenshots/02-products.png) |
| Product Detail | ![Product Detail](screenshots/11-product-detail.png) |
| Cart | ![Cart](screenshots/12-cart.png) |
| Orders | ![Orders](screenshots/13-orders.png) |
| Wishlist | ![Wishlist](screenshots/14-wishlist.png) |
| Profile | ![Profile](screenshots/15-profile.png) |
| Invoices | ![Invoices](screenshots/16-invoices.png) |

### Content Pages

| Page | Screenshot |
|------|-----------|
| About Us | ![About](screenshots/05-about.png) |
| Contact Us | ![Contact](screenshots/06-contact.png) |
| Blog | ![Blog](screenshots/07-blog.png) |
| Blog Post | ![Blog Post](screenshots/08-blog-post.png) |
| Privacy Policy | ![Privacy](screenshots/09-privacy-policy.png) |
| Refund & Returns | ![Refund](screenshots/10-refund-policy.png) |
| Login | ![Login](screenshots/03-login.png) |
| Register | ![Register](screenshots/04-register.png) |

### Admin Panel

| Page | Screenshot |
|------|-----------|
| Dashboard | ![Dashboard](screenshots/17-admin-dashboard.png) |
| Manage Products | ![Products](screenshots/18-admin-products.png) |
| Manage Categories | ![Categories](screenshots/19-admin-categories.png) |
| Manage Users | ![Users](screenshots/20-admin-users.png) |
| Manage Orders | ![Orders](screenshots/21-admin-orders.png) |
| Manage Invoices | ![Invoices](screenshots/22-admin-invoices.png) |
| Analytics | ![Analytics](screenshots/23-admin-analytics.png) |

---

## Features

### Customer

- **Browse & Search** — filter products by category, price range, rating; sort by newest, price, or rating
- **Dynamic Categories** — category list is managed by admin and shows live product counts; empty categories appear greyed out and non-clickable
- **Product Detail** — image gallery, stock info, discount badge, tags, delivery info, related products, "Why Buy With Us" trust badges
- **Reviews** — write a review; edit your own review at any time; reviews show real-time count
- **Cart** — client-side cart persisted in localStorage; quantity controls; promo code support (WELCOME10 = 10% off); trust badge strip
- **Wishlist** — server-side wishlist per user; "Add All to Cart" button; toggle from any product card
- **Checkout**
  - Saved addresses shown as selectable cards; default address auto-selected
  - Easily add a new address inline
  - Payment methods: Cash on Delivery, Credit/Debit Card, UPI, Bank Transfer
  - Option to save payment method to your account for future checkouts
- **Order Confirmation** — post-purchase page with status tracker, tracking number block, and full payment details
- **Order History** — summary stats strip (Total / Pending / In Transit / Delivered) + full order list
- **Invoices** — Women HubClub branded invoice per order; printable via browser print
- **Profile** — update name, phone, password; manage multiple saved addresses (email is locked)
- **Hero Slider** — auto-advances every 4 seconds; supports mouse drag and touch swipe

### Home Page Sections

1. **Hero Carousel** — 3 slides, auto-rotating, draggable/swipeable
2. **Trust Strip** — free delivery, authentic, rating, returns
3. **Flash Deals Countdown** — live ticking countdown timer, scroll-triggered animations
4. **Shop by Category** — grid of 10 categories with hover lift effect
5. **Featured Picks** — curated product grid from the backend
6. **How It Works** — 4-step animated cards with numbered badges
7. **New Arrivals** — fetches newest products from API
8. **Beauty & Wellness Tips** — 6 auto-cycling tips with spotlight + card grid
9. **Animated Stats Banner** — 6 stats that scale in on scroll
10. **Member Promo Banner** — join/browse CTAs
11. **Testimonials** — 6 member review cards with hover lift
12. **Newsletter Signup** — pill-form email subscription with scroll-triggered entrance

### New Pages

- **Blog** (`/blog`) — category filter, search, featured post highlight, article grid, newsletter CTA
- **Blog Post** (`/blog/:slug`) — full article, author card, related posts, tip callout blocks
- **Privacy Policy** (`/privacy`) — sticky navigation sidebar, animated accordion sections
- **Refund & Returns** (`/refund`) — 4-step process, eligibility grid (eligible vs not), refund timeline by payment method, FAQ accordion

### Admin (`/admin`)

- **Dashboard** — revenue totals, order counts by status, user stats, product stats
- **Manage Products**
  - Create, edit, delete products; toggle featured/active
  - Category dropdown populated from the live Category collection
  - Column visibility toggles; sort asc/desc on all columns
  - Stock highlighted red when below 10
- **Manage Categories** — add, edit, delete categories; each has name, emoji icon, description; toggle active/inactive
- **Manage Orders** — update order status; add tracking number
- **Manage Users** — view, edit, delete; change role; deactivate/reactivate (auto-logs out user immediately)
- **Manage Invoices** — view all invoices; update invoice status; sort on all columns
- **Analytics** — visit tracking: total/today/monthly/yearly bar chart; logged-in vs anonymous; per-user visit table

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Axios, React Toastify, custom CSS |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB |
| Auth | JWT (30-day tokens), bcryptjs |

---

## Folder Structure

```
plant_shop/
├── server/
│   ├── config/db.js
│   ├── controllers/          # auth, product, order, invoice, user, category, visit
│   ├── middleware/auth.js    # JWT protect + admin guard + isActive check
│   ├── models/               # User, Product, Order, Invoice, Category, Visit
│   ├── routes/               # auth, products, orders, invoices, users, categories, visits
│   ├── seed/seeder.js        # Seeds users, categories, products, orders, invoices
│   └── server.js
│
└── client/src/
    ├── components/           # Navbar, Footer, ProductCard, Loader, BubbleBackground
    ├── context/              # AuthContext, CartContext
    ├── pages/
    │   ├── admin/            # Dashboard, ManageProducts, ManageCategories,
    │   │                     # ManageUsers, ManageOrders, ManageInvoices, Analytics
    │   ├── Home.js           # 12 sections with scroll-triggered animations
    │   ├── Blog.js           # BlogList + BlogPost (static content, no backend)
    │   ├── PrivacyPolicy.js
    │   ├── RefundPolicy.js
    │   └── ...               # Products, ProductDetail, Cart, Checkout, Orders,
    │                         # Invoices, Profile, Wishlist, AboutUs, ContactUs
    └── utils/api.js          # Axios instance + all API objects
```
---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally

### Setup

```bash
# Backend
cd server
npm install
# Create server/.env (see below)
npm run seed     # populates DB with users, categories, products, orders
npm run dev      # starts on port 5000

# Frontend (separate terminal)
cd client
npm install
npm start        # starts on port 3000
```

**`server/.env`**:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/women_hubclub
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

Seed credentials — **admin**: `admin@gmail.com / admin@gmail.com` · **users**: `priya@gmail.com / priya@gmail.com` (password = email for all seeded users)

---

## API Reference

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register, returns JWT |
| POST | `/login` | Public | Login — blocked if `isActive` is false |
| GET | `/profile` | User | Get full profile |
| PUT | `/profile` | User | Update name/phone/password/addresses (not email) |
| POST | `/wishlist/:productId` | User | Toggle wishlist |
| GET | `/cards` | User | Get saved payment methods |
| POST | `/cards` | User | Save payment method |
| DELETE | `/cards/:cardId` | User | Remove payment method |

### Products — `/api/products`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List active products — query: `category`, `search`, `minPrice`, `maxPrice`, `rating`, `sort`, `page`, `limit` |
| GET | `/admin/all` | Admin | List ALL products including inactive |
| GET | `/featured` | Public | Up to 8 featured products |
| GET | `/categories` | Public | Distinct category values from products |
| GET | `/:id` | Public | Get by MongoDB ID or slug |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/:id/reviews` | User | Add review |
| PUT | `/:id/reviews` | User | Edit your review |

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | User | Place order — auto-creates invoice, deducts stock |
| GET | `/myorders` | User | Current user's orders |
| GET | `/:id` | User/Admin | Single order |
| GET | `/` | Admin | All orders |
| GET | `/stats` | Admin | Revenue and count stats |
| PUT | `/:id` | Admin | Update status/tracking/payment |
| DELETE | `/:id` | Admin | Delete order and linked invoice |

### Invoices — `/api/invoices`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/myinvoices` | User | Current user's invoices |
| GET | `/:id` | User | Get invoice |
| GET | `/order/:orderId` | User | Invoice linked to an order |
| GET | `/` | Admin | All invoices |
| PUT | `/:id` | Admin | Update status |
| DELETE | `/:id` | Admin | Delete invoice |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin | All users — query: `page`, `limit`, `search` |
| GET | `/stats` | Admin | User count stats |
| GET | `/:id` | Admin | Get user |
| PUT | `/:id` | Admin | Update name/phone/role/isActive (not email) |
| DELETE | `/:id` | Admin | Delete user |

### Categories — `/api/categories`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | All categories with `productCount` per category |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |

### Visits — `/api/visits`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Public | Record a page visit |
| GET | `/stats` | Admin | Daily/monthly/yearly visit stats + per-user breakdown |

---

## Key Design Notes

- **Email locked**: Email cannot be changed after registration. Both `updateProfile` (user) and `updateUser` (admin) intentionally exclude email from updates.

- **Account deactivation**: Admin sets `user.isActive = false` → next API call with that JWT returns `401 { deactivated: true }` → Axios interceptor fires `auth:deactivated` event → `AuthContext` clears session, toasts, redirects to `/login`. Login also blocked for inactive users.

- **Dynamic categories**: Categories live in a MongoDB `Category` collection (not a Product enum). `GET /api/categories` returns each category with a `productCount` via aggregation. The product filter page shows categories with `productCount > 0` as clickable; zero-count categories are greyed out at the bottom.

- **Stock management**: `stock` is decremented on order creation. `totalStock` tracks original stock for admin reference and is not auto-decremented.

- **Invoice auto-generation**: Created automatically on order placement. Set to `Paid` when order status reaches `Delivered`.

- **Responsive design**: Full mobile/tablet/laptop/desktop support via CSS utility layout classes with breakpoints at 1024px, 768px, 480px. Hamburger menu on mobile. Admin sidebar slides in with overlay on mobile.

- **Scroll animations**: `useInView` hook (IntersectionObserver) used across Home, Blog, Privacy Policy, Refund Policy, and other pages — animations only trigger when elements scroll into view.

- **Blog**: Entirely static — no backend needed. Posts are defined as a data array in `src/pages/Blog.js`. Full-text search + category filter client-side.

- **Sorting**: All four admin tables sort client-side via `useMemo` — no backend round-trip needed.

- **Visit tracking**: `VisitTracker` component (in `App.js`) records every customer route change to the `Visit` collection. Admin routes are excluded.





<!-- Reaming:  -->
-- sub categories display
Contact Page & Admin Dashboard
- All messages submitted via the Contact Page must be saved into the database.
- A new panel should be created on the Admin Dashboard to display all Contact Page submissions.
- Admin must be able to view these messages with filtering options (ascending/descending order).
- If a user is logged in, their name and email should auto‑populate in the Contact Page form.
- Users should still be able to edit/update these details before submitting.
Site Analytics
- Store Site Analytics data in the database.
- Admin should be able to view both the latest analytics and previously stored data upon login.
Pagination & Filtering
- When using pagination, filters (ascending/descending) must apply to the entire dataset, not just the current page.
- Example: If there are 100+ pages, filtering should reorder the full dataset before displaying results.
- This functionality must work consistently across:
  - Products
  - Orders
  - Users
  - Invoices
  - Analytics
Import/Export Functionality
- Provide import/export options for products and categories.
- If the same products or categories already exist:
  - Admin should have the option to remove duplicates before import.
  - Admin should also have the option to ignore duplicates during import.
Product Management
- Products can be set to Published, Draft, or Trash (items in Trash are automatically deleted after 30 days).
- Products can be added to a single category or multiple categories.
- On the product page, multiple filters can be selected.
- On the admin product page, multiple dropdowns can be selected.
Review Management
- Admin can manage all product reviews.
- Reviews can be set to Approved or Deleted.
Comment Management
- Admin can manage all blog comments.
- Comments can be set to Approved or Deleted.
Product Page & URLs
- Product page URLs should be automatically created by default.
- Admin should have the option to update product URLs.
- Admin product page should include a direct link to view the single product page.
Customer Data
- Customers can be exported to Excel.
Order Management Features
- Add private notes to the order
- Receive email when order is placed
- Export orders to Excel
Discount & Promotion Management
- Create and manage discount codes
- Set codes as “active” or “inactive”
