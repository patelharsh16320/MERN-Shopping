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
Pagination & Filtering


<!-- !------ Done -----!  -->
Default Category – “General”
- A new category named “General” must be created in the system.
- This category should be updatable (its details can be modified if needed).
- The “General” category must not be deletable by any admin.
Categories & Subcategories
- Both parent categories and subcategories must be displayed and stored in the database.
- On the product page, after selecting a parent category, the corresponding child categories should be shown.
- If the admin does not select a parent category, the system should automatically assign the default category “General.”
- Selecting a child category is optional (not mandatory).

Import/Export Functionality
- Provide import/export options for products and categories.
- If the same products or categories already exist:
  - Admin should have the option to remove duplicates before import.
  - Admin should also have the option to ignore duplicates during import.
  - Import/Export Functionality - need option json or csv file

Default “General” Category Rules
- The “General” category must be set as the default category in the system.
- If the admin does not select any category, the product should automatically be assigned to the “General” category.
- The “General” category itself must always be treated as a parent category.
- The “General” category should not allow child categories to be created under it.
- No other category should be allowed to set “General” as its parent.
- The “General” category must remain as a standalone parent category only.

Category Paination - per page 10 show
- When using pagination, filters (ascending/descending) must apply to the entire dataset, not just the current page.
- Example: If there are 100+ pages, filtering should reorder the full dataset before displaying results.
- This functionality must work consistently across:
  - Products
  - Orders
  - Users
  - Invoices
  - Analytics

Admin Product: Multiple images show option, also need upload from local brower option

Columns Feature for Product, Categories, and Users Pages
- On the Products, Categories, and Users pages, the Columns feature at the top needs to be updated.
- By default, all columns should be selected and visible.
- If the admin hides any column, that preference should remain saved.When the admin navigates to another page and then returns to the same page, the previously hidden column(s) should still remain hidden (the feature should stay disabled for those columns).
- When the admin navigates to another page and then returns to the same page, the previously hidden column(s) should still remain hidden (the feature should stay disabled for those columns).

- Products can be set to Published, Draft, or Trash (items in Trash are automatically deleted after 30 days).
- Logout - auutomatic cookie & cache delate - redirect to login page 

Review Management
- Admin can manage all product reviews.
- Reviews can be set to Approved or Deleted.

Contact Page & Admin Dashboard
- All messages submitted via the Contact Page must be saved into the database.
- A new panel should be created on the Admin Dashboard to display all Contact Page submissions.
- Admin must be able to view these messages with filtering options (ascending/descending order).
- If a user is logged in, their name and email should auto‑populate in the Contact Page form.
- Users should still be able to edit/update these details before submitting.

Admin – Contact Messages
- On the Admin Contact Messages page, the following columns should be displayed: 'Message, Status, Actions'
- The Columns feature should work the same way as it does on the Products and Users pages.
- Admin should be able to show or hide columns, and those preferences must remain saved when navigating away and returning to the page.

Admin
- admin can replay back on message send by user, also if user send order,message need +1 or +2... on admin panel, to show user, there is new order/ message

User Contact
- Need to show contact replay as a user on profile panel

Import/Export – Centralized Page
- A new Import/Export page must be created in the admin panel.
- From this page, the admin should be able to download the entire site data in either JSON or CSV format.
- The data should include:
  - Products
  - Categories
  - Users
  - Orders
  - Invoices
  - Analytics
  - Messages
  - Reviews
- Admin should have the option to download everything in one file or download each dataset separately.
- When uploading a file, the system should automatically import and restore all data according to its correct path and structure.
- All other existing Import/Export or JSON/CSV download buttons on individual admin pages must be removed.

Admin coupen code page - for create coupen code

Admin Messaging System
- The admin should be able to reply to user messages.
- When the admin replies, the message should be delivered to the user’s inbox.
- A dedicated Messages page should be shown inside the user’s Profile panel.
- The profile panel should display a notification count (e.g., “You have X messages”) to indicate unread messages.

Product Page & URLs
- Product page URLs should be automatically created by default.
- Admin should have the option to update product URLs.
- Admin product page should include a direct link to view the single product page.

Make a new page for admin, where admin can see all new features, before and after., also admin need to update URL/slug option for product too

Discount & Promotion Management
- Create and manage discount codes
- Set codes as “active” or “inactive”

<!-- !------ Checking-----!  -->

- contact support button show where admin and user can contaact with each other, like support system    


<!-- !------ Working-----!  -->

Order Management Features
- Add private notes to the order
- Receive email when order is placed
- Export orders to Excel

Site Analytics
- Store Site Analytics data in the database.
- Admin should be able to view both the latest analytics and previously stored data upon login.

init 

Comment Management
- Admin can manage all blog comments.
- Comments can be set to Approved or Deleted.


<!-- !------ Reaming-----!  -->



<!-- !------ ignore-----!  -->

Product Management
- Products can be added to a single category or multiple categories.
- On the product page, multiple filters can be selected.
- On the admin product page, multiple dropdowns can be selected.