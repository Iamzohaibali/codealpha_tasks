const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', auth, upload.single('image'), [
    body('content')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Post cannot exceed 2000 characters')
], postController.createPost);

router.get('/', auth, postController.getPosts);
router.get('/user/:userId', auth, postController.getUserPosts);
router.get('/following', auth, postController.getFollowingPosts);
router.put('/:id', auth, [
    body('content')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Post cannot exceed 2000 characters')
], postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/like', auth, postController.likePost);

module.exports = router;