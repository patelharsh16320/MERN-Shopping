const express = require('express');
const router = express.Router();
const { getAddresses, createAddress, updateAddress, deleteAddress, setDefault } = require('../controllers/addressController');
const { protect, admin } = require('../middleware/auth');

router.get('/user/:userId',  protect, admin, getAddresses);
router.post('/user/:userId', protect, admin, createAddress);
router.put('/:id/default',   protect, admin, setDefault);
router.put('/:id',           protect, admin, updateAddress);
router.delete('/:id',        protect, admin, deleteAddress);

module.exports = router;
