const express = require('express');
const path = require('path');
const app = express();

// Serve static files from 'public' directory with correct MIME types
app.use('/public', express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Serve HTML files from 'views' directory
app.use(express.static(path.join(__dirname, 'views')));

// Routes for HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/feed', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'feed.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/create-post', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'create-post.html'));
});

// API proxy to backend
const { createProxyMiddleware } = require('http-proxy-middleware');
app.use('/api', createProxyMiddleware({ 
    target: 'http://localhost:5000',
    changeOrigin: true 
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
    console.log(`Access URLs:`);
    console.log(`- Home: http://localhost:${PORT}/`);
    console.log(`- Login: http://localhost:${PORT}/login`);
    console.log(`- Register: http://localhost:${PORT}/register`);
    console.log(`- Feed: http://localhost:${PORT}/feed`);
    console.log(`- Profile: http://localhost:${PORT}/profile`);
    console.log(`- Create Post: http://localhost:${PORT}/create-post`);
});