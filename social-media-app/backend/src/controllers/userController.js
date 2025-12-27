const User = require('../models/User');
const Follow = require('../models/Follow');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.updateProfile = async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['fullName', 'bio'];
        
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                updates[update] = req.body[update];
            }
        });

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'social-media/profiles',
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face'
            });
            updates.profilePicture = result.secure_url;
            
            // Delete temporary file
            fs.unlinkSync(req.file.path);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ 
            message: 'Profile updated successfully',
            user 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        // Delete user's follows
        await Follow.deleteMany({
            $or: [
                { follower: req.user._id },
                { following: req.user._id }
            ]
        });
        
        await User.findByIdAndDelete(req.user._id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate({
                path: 'followers',
                populate: { path: 'follower', select: 'username fullName profilePicture' }
            })
            .populate({
                path: 'following',
                populate: { path: 'following', select: 'username fullName profilePicture' }
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if current user is following this user
        const isFollowing = await Follow.findOne({
            follower: req.user._id,
            following: req.params.id
        });

        res.json({ 
            user,
            isFollowing: !!isFollowing
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.followUser = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        
        if (!userToFollow) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userToFollow._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            follower: req.user._id,
            following: req.params.id
        });

        if (existingFollow) {
            return res.status(400).json({ error: 'Already following this user' });
        }

        // Create follow relationship
        const follow = new Follow({
            follower: req.user._id,
            following: req.params.id
        });

        await follow.save();

        res.json({ 
            message: 'Followed successfully',
            follow 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Already following this user' });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.unfollowUser = async (req, res) => {
    try {
        const result = await Follow.findOneAndDelete({
            follower: req.user._id,
            following: req.params.id
        });

        if (!result) {
            return res.status(400).json({ error: 'Not following this user' });
        }

        res.json({ 
            message: 'Unfollowed successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const followers = await Follow.find({ following: req.params.id })
            .populate('follower', 'username fullName profilePicture')
            .sort({ createdAt: -1 });

        res.json({ followers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const following = await Follow.find({ follower: req.params.id })
            .populate('following', 'username fullName profilePicture')
            .sort({ createdAt: -1 });

        res.json({ following });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } }
            ]
        })
        .select('username fullName profilePicture')
        .limit(10);

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};