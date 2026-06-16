const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/auth');
const ctrl = require('../controllers/dbAdminController');

router.get('/overview',                protect, admin, ctrl.getOverview);
router.get('/:key/records',             protect, admin, ctrl.getRecords);
router.get('/:key/duplicates',          protect, admin, ctrl.scanDuplicates);
router.post('/:key/duplicates/remove',  protect, admin, ctrl.removeDuplicates);
router.post('/:key/draft',              protect, admin, ctrl.moveToDraft);
router.post('/:key/trash',              protect, admin, ctrl.moveToTrash);
router.post('/:key/restore',            protect, admin, ctrl.restore);
router.post('/:key/permanent-delete',   protect, admin, ctrl.permanentDelete);
router.post('/:key/empty-trash',        protect, admin, ctrl.emptyTrash);
router.post('/:key/delete-all',         protect, admin, ctrl.deleteAll);

module.exports = router;
