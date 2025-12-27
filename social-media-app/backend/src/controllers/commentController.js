const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = new Comment({
            user: req.user._id,
            post: req.params.postId,
            content
        });

        await comment.save();

        post.comments.push(comment._id);
        await post.save();

        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'username fullName profilePicture');

        res.status(201).json({
            message: 'Comment added successfully',
            comment: populatedComment
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPostComments = async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .populate('user', 'username fullName profilePicture')
            .sort({ createdAt: -1 });

        res.json({ comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this comment' });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            { $set: { content: req.body.content } },
            { new: true, runValidators: true }
        ).populate('user', 'username fullName profilePicture');

        res.json({
            message: 'Comment updated successfully',
            comment: updatedComment
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        await Comment.findByIdAndDelete(req.params.id);

        // Remove comment reference from post
        await Post.findByIdAndUpdate(
            comment.post,
            { $pull: { comments: comment._id } }
        );

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.likeComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const alreadyLiked = comment.likes.includes(req.user._id);
        
        if (alreadyLiked) {
            comment.likes = comment.likes.filter(
                id => id.toString() !== req.user._id.toString()
            );
        } else {
            comment.likes.push(req.user._id);
        }

        await comment.save();
        
        res.json({ 
            message: alreadyLiked ? 'Comment unliked' : 'Comment liked',
            likes: comment.likes 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};