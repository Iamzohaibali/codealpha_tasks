const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.post('/:postId', auth, [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters')
], commentController.createComment);

router.get('/:postId', auth, commentController.getPostComments);
router.put('/:id', auth, [
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters')
], commentController.updateComment);
router.delete('/:id', auth, commentController.deleteComment);
router.post('/:id/like', auth, commentController.likeComment);

module.exports = router;