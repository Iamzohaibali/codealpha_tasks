const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.put('/profile', auth, upload.single('profilePicture'), userController.updateProfile);
router.delete('/profile', auth, userController.deleteAccount);
router.get('/:id', auth, userController.getUserProfile);
router.post('/:id/follow', auth, userController.followUser);
router.post('/:id/unfollow', auth, userController.unfollowUser);
router.get('/:id/followers', auth, userController.getFollowers);
router.get('/:id/following', auth, userController.getFollowing);
router.get('/search/users', auth, userController.searchUsers);

module.exports = router;