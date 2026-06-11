const express = require('express');
const router = express.Router();
const { getMyInvoices, getInvoiceById, getInvoiceByOrder, getAllInvoices, updateInvoice, deleteInvoice, exportInvoices, importInvoices } = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/auth');

router.get('/myinvoices', protect, getMyInvoices);
router.get('/order/:orderId', protect, getInvoiceByOrder);
router.get('/export', protect, admin, exportInvoices);
router.post('/import', protect, admin, importInvoices);
router.get('/', protect, admin, getAllInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id', protect, admin, updateInvoice);
router.delete('/:id', protect, admin, deleteInvoice);

module.exports = router;
