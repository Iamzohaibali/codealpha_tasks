const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    fullName: {
        type: String,
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profilePicture: {
        type: String,
        default: 'https://res.cloudinary.com/dwheos4rl/image/upload/v1692956242/default-profile_pic_jlqkxy.png'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.virtual('followers', {
    ref: 'Follow',
    localField: '_id',
    foreignField: 'following',
    count: true
});

userSchema.virtual('following', {
    ref: 'Follow',
    localField: '_id',
    foreignField: 'follower',
    count: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);