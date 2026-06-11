const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/auth');
const { submitContact, getContacts, markRead, deleteContact } = require('../controllers/contactController');

router.post('/',          submitContact);                  // public
router.get('/',           protect, admin, getContacts);
router.put('/:id',        protect, admin, markRead);
router.delete('/:id',     protect, admin, deleteContact);

module.exports = router;
