const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, exportCategories, importCategories } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getCategories);
router.get('/export', protect, admin, exportCategories);
router.post('/import', protect, admin, importCategories);
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
