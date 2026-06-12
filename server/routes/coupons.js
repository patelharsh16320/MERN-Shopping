const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getAll, create, update, remove, validate, applyUsage } = require('../controllers/couponController');

router.post('/validate', validate);
router.get('/', protect, admin, getAll);
router.post('/', protect, admin, create);
router.put('/:id', protect, admin, update);
router.delete('/:id', protect, admin, remove);
router.post('/:id/use', protect, applyUsage);

module.exports = router;
