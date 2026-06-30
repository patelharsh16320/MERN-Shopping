const express = require('express');
const router = express.Router();
const { getProducts, getAdminProducts, getProductById, createProduct, updateProduct, deleteProduct, addReview, updateReview, getFeatured, getCategories, exportProducts, importProducts, getAllReviews, updateReviewAdmin, deleteReviewAdmin, getLowStockProducts, joinWaitlist, leaveWaitlist, getWaitlist } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/admin/all', protect, admin, getAdminProducts);
router.get('/admin/low-stock', protect, admin, getLowStockProducts);
router.get('/admin/export', protect, admin, exportProducts);
router.post('/admin/import', protect, admin, importProducts);
router.get('/admin/reviews', protect, admin, getAllReviews);
router.put('/admin/reviews', protect, admin, updateReviewAdmin);
router.delete('/admin/reviews/:productId/:reviewId', protect, admin, deleteReviewAdmin);
router.get('/featured', getFeatured);
router.get('/categories', getCategories);
router.post('/:id/waitlist/join', protect, joinWaitlist);
router.post('/:id/waitlist/leave', protect, leaveWaitlist);
router.get('/:id/waitlist', protect, admin, getWaitlist);
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/:id/reviews', protect, addReview);
router.put('/:id/reviews', protect, updateReview);

module.exports = router;
