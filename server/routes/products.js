const express = require('express');
const router = express.Router();
const { getProducts, getAdminProducts, getProductById, createProduct, updateProduct, deleteProduct, addReview, updateReview, getFeatured, getCategories } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/admin/all', protect, admin, getAdminProducts);
router.get('/featured', getFeatured);
router.get('/categories', getCategories);
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/:id/reviews', protect, addReview);
router.put('/:id/reviews', protect, updateReview);

module.exports = router;
