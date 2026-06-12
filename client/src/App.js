import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { visitAPI } from './utils/api';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BubbleBackground from './components/BubbleBackground';

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
import { BlogList, BlogPost } from './pages/Blog';
import { InvoiceList, InvoiceDetail, InvoiceByOrder } from './pages/Invoices';

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
import ManageBlogComments from './pages/admin/ManageBlogComments';

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
      <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
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
            <Route path="/admin/blog-comments" element={<ManageBlogComments />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Main app routes */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/products/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
            <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
            <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
            <Route path="/orders" element={<MainLayout><Orders /></MainLayout>} />
            <Route path="/orders/:id" element={<MainLayout><OrderDetail /></MainLayout>} />
            <Route path="/invoices" element={<MainLayout><InvoiceList /></MainLayout>} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/order/:orderId" element={<InvoiceByOrder />} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/wishlist" element={<MainLayout><Wishlist /></MainLayout>} />
            <Route path="/about" element={<MainLayout><AboutUs /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><ContactUs /></MainLayout>} />
            <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
            <Route path="/refund" element={<MainLayout><RefundPolicy /></MainLayout>} />
            <Route path="/blog" element={<MainLayout><BlogList /></MainLayout>} />
            <Route path="/blog/:slug" element={<MainLayout><BlogPost /></MainLayout>} />
          </Routes>

          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
          />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
