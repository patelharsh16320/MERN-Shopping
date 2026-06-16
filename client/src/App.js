import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PageSettingProvider, usePageSettings } from './context/PageSettingContext';
import { useAuth } from './context/AuthContext';
import { visitAPI } from './utils/api';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BubbleBackground from './components/BubbleBackground';
import ScrollButtons from './components/ScrollButtons';
import LiveChat from './components/LiveChat';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import { InvoiceList, InvoiceDetail, InvoiceByOrder } from './pages/Invoices';
import BeautyQuiz from './pages/BeautyQuiz';
import TermsConditions from './pages/TermsConditions';

import Dashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageUsers from './pages/admin/ManageUsers';
import ManageOrders from './pages/admin/ManageOrders';
import ManageInvoices from './pages/admin/ManageInvoices';
import Analytics from './pages/admin/Analytics';
import ManageCategories from './pages/admin/ManageCategories';
import ManageContacts from './pages/admin/ManageContacts';
import ManageReviews from './pages/admin/ManageReviews';
import ManageCoupons from './pages/admin/ManageCoupons';
import SecureUserData from './pages/admin/SecureUserData';
import ImportExport from './pages/admin/ImportExport';
import WhatsNew from './pages/admin/WhatsNew';
import StreakLeaderboard from './pages/admin/StreakLeaderboard';
import ManageSupport from './pages/admin/ManageSupport';
import ManagePages from './pages/admin/ManagePages';
import DashboardSettings from './pages/admin/DashboardSettings';
import PageSpeed from './pages/admin/PageSpeed';
import Support from './pages/Support';
import SpecialOffers from './pages/SpecialOffers';

function VisitTracker() {
  const location = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    visitAPI.record({ page: location.pathname, userId: user?._id || null }).catch(() => {});
  }, [location.pathname]);
  return null;
}

function MainLayout({ children }) {
  return (
    <>
      <BubbleBackground />
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </>
  );
}

// Wraps a page with MainLayout + guards it by pageKey
function GuardedPage({ pageKey, children }) {
  const { settings, loaded } = usePageSettings();

  if (!loaded) return null; // wait silently — settings load fast

  if (loaded && settings[pageKey] === false) {
    return (
      <MainLayout>
        <div className="coming-soon-wrap">
          <div className="coming-soon-icon">🚧</div>
          <h2 className="coming-soon-title">
            <span className="gradient-text">Coming Soon</span>
          </h2>
          <p className="coming-soon-text">
            This page is currently unavailable. Check back soon!
          </p>
          <button
            onClick={() => window.history.back()}
            className="coming-soon-btn"
          >
            ← Go Back
          </button>
        </div>
      </MainLayout>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <PageSettingProvider>
            <VisitTracker />
            <Routes>
              {/* Admin routes — no navbar/footer */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<ManageProducts />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/orders" element={<ManageOrders />} />
              <Route path="/admin/invoices" element={<ManageInvoices />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/categories" element={<ManageCategories />} />
              <Route path="/admin/contacts" element={<ManageContacts />} />
              <Route path="/admin/reviews" element={<ManageReviews />} />
              <Route path="/admin/coupons" element={<ManageCoupons />} />
              <Route path="/admin/secure-users" element={<SecureUserData />} />
              <Route path="/admin/import-export" element={<ImportExport />} />
              <Route path="/admin/whats-new" element={<WhatsNew />} />
              <Route path="/admin/streaks" element={<StreakLeaderboard />} />
              <Route path="/admin/support" element={<ManageSupport />} />
              <Route path="/admin/pages" element={<ManagePages />} />
              <Route path="/admin/dashboard-settings" element={<DashboardSettings />} />
              <Route path="/admin/page-speed" element={<PageSpeed />} />

              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Guarded customer routes */}
              <Route path="/" element={<GuardedPage pageKey="home"><Home /></GuardedPage>} />
              <Route path="/products" element={<GuardedPage pageKey="products"><Products /></GuardedPage>} />
              <Route path="/products/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
              <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
              <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
              <Route path="/orders" element={<MainLayout><Orders /></MainLayout>} />
              <Route path="/orders/:id" element={<MainLayout><OrderDetail /></MainLayout>} />
              <Route path="/invoices" element={<MainLayout><InvoiceList /></MainLayout>} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/invoices/order/:orderId" element={<InvoiceByOrder />} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              <Route path="/wishlist" element={<GuardedPage pageKey="wishlist"><Wishlist /></GuardedPage>} />
              <Route path="/about" element={<GuardedPage pageKey="about"><AboutUs /></GuardedPage>} />
              <Route path="/contact" element={<GuardedPage pageKey="contact"><ContactUs /></GuardedPage>} />
              <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
              <Route path="/refund" element={<MainLayout><RefundPolicy /></MainLayout>} />
              <Route path="/quiz" element={<GuardedPage pageKey="quiz"><BeautyQuiz /></GuardedPage>} />
              <Route path="/terms" element={<MainLayout><TermsConditions /></MainLayout>} />
              <Route path="/support" element={<GuardedPage pageKey="support"><Support /></GuardedPage>} />
              <Route path="/offers" element={<GuardedPage pageKey="offers"><SpecialOffers /></GuardedPage>} />
            </Routes>

            <ScrollButtons />
            <LiveChat />
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme="light"
            />
          </PageSettingProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
