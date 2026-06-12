const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/auth');
const { submitContact, getContacts, getMyContacts, markRead, deleteContact, replyContact, getContactStats } = require('../controllers/contactController');

router.post('/',              submitContact);                       // public
router.get('/stats',          protect, admin, getContactStats);
router.get('/mine',           protect, getMyContacts);
router.get('/',               protect, admin, getContacts);
router.put('/:id',            protect, admin, markRead);
router.post('/:id/reply',     protect, admin, replyContact);
router.delete('/:id',         protect, admin, deleteContact);

module.exports = router;
