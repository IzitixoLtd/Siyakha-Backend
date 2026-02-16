const express = require('express');
const router = express.Router();
const multer = require('multer');
const resourceController = require('../controllers/resourceController');
const { authenticate } = require('../middleware/auth');
const { requireTeacherOrAdmin } = require('../middleware/roleCheck');
const { validateMongoId } = require('../middleware/validate');

const upload = multer({ dest: 'uploads/', limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', resourceController.getResources);
router.get('/:id', validateMongoId('id'), resourceController.getResource);
router.get('/:id/download', validateMongoId('id'), resourceController.downloadResource);
router.post('/', requireTeacherOrAdmin, upload.single('file'), resourceController.createResource);
router.delete('/:id', requireTeacherOrAdmin, validateMongoId('id'), resourceController.deleteResource);

module.exports = router;
