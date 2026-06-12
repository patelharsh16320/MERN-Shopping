const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getAll, create, update, remove, bulkCreate } = require('../controllers/changelogController');

router.get('/', getAll);
router.post('/bulk', protect, admin, bulkCreate);
router.post('/', protect, admin, create);
router.put('/:id', protect, admin, update);
router.delete('/:id', protect, admin, remove);

module.exports = router;
