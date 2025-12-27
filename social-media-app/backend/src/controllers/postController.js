const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content && !req.file) {
            return res.status(400).json({ error: 'Post content or image is required' });
        }

        const postData = {
            user: req.user._id,
            content: content || ''
        };

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'social-media/posts',
                width: 1200,
                height: 630,
                crop: 'limit'
            });
            postData.image = result.secure_url;
            
            // Delete temporary file
            fs.unlinkSync(req.file.path);
        }

        const post = new Post(postData);
        await post.save();

        const populatedPost = await Post.findById(post._id)
            .populate('user', 'username fullName profilePicture');

        res.status(201).json({ 
            message: 'Post created successfully',
            post: populatedPost 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate('user', 'username fullName profilePicture')
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'username fullName profilePicture'
                },
                options: { sort: { createdAt: -1 }, limit: 3 }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments();

        res.json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .populate('user', 'username fullName profilePicture')
            .sort({ createdAt: -1 });

        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFollowingPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('following');
        const followingIds = user.following.map(follow => follow._id);
        
        const posts = await Post.find({ 
            user: { $in: followingIds } 
        })
        .populate('user', 'username fullName profilePicture')
        .sort({ createdAt: -1 });

        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this post' });
        }

        const updates = {};
        if (req.body.content !== undefined) {
            updates.content = req.body.content;
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('user', 'username fullName profilePicture');

        res.json({ 
            message: 'Post updated successfully',
            post: updatedPost 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const alreadyLiked = post.likes.includes(req.user._id);
        
        if (alreadyLiked) {
            post.likes = post.likes.filter(
                id => id.toString() !== req.user._id.toString()
            );
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();
        
        res.json({ 
            message: alreadyLiked ? 'Post unliked' : 'Post liked',
            likes: post.likes 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};