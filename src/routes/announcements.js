const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate } = require('../middleware/auth');
const { requireTeacherOrAdmin } = require('../middleware/roleCheck');
const { validateMongoId, validateCreateAnnouncement } = require('../middleware/validate');

router.use(authenticate);

router.get('/', announcementController.getAnnouncements);
router.get('/unread-count', announcementController.getUnreadCount);
router.get('/:id', validateMongoId('id'), announcementController.getAnnouncement);
router.post('/:id/read', validateMongoId('id'), announcementController.markAsRead);

router.post('/', requireTeacherOrAdmin, validateCreateAnnouncement, announcementController.createAnnouncement);
router.put('/:id', requireTeacherOrAdmin, validateMongoId('id'), announcementController.updateAnnouncement);
router.delete('/:id', requireTeacherOrAdmin, validateMongoId('id'), announcementController.deleteAnnouncement);

module.exports = router;
