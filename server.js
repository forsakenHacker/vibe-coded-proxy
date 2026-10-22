const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for performance
app.use(compression());
app.use(cors());

// Serve static files with caching for better performance
app.use(express.static(__dirname, {
    maxAge: '1d',
    etag: true
}));

// Proxy endpoint with enhanced error handling
app.use('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            secure: false, // Allow self-signed certs for proxying
            followRedirects: true,
            pathRewrite: {
                '^/proxy': '',
            },
            onProxyReq: (proxyReq, req, res) => {
                // Set standard user agent to avoid being blocked by some sites
                proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
            },
            onProxyRes: (proxyRes, req, res) => {
                // Strip security headers that prevent embedding
                const deleteHeaders = [
                    'x-frame-options',
                    'content-security-policy',
                    'x-content-security-policy',
                    'x-webkit-csp',
                    'content-security-policy-report-only'
                ];
                
                deleteHeaders.forEach(header => {
                    delete proxyRes.headers[header];
                });

                // Force allow-origin for proxied assets
                proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            },
            onError: (err, req, res) => {
                console.error(`Proxy Error for ${targetUrl}:`, err.message);
                res.status(500).json({ 
                    error: 'Proxy Error', 
                    message: 'The target website could not be reached or is blocking the connection.',
                    details: err.message
                });
            },
            logLevel: 'error', // Reduce noise in logs
        })(req, res, next);
    } catch (error) {
        console.error('Fatal Proxy Setup Error:', error);
        res.status(500).send('Internal Server Error during proxy setup');
    }
});

// Global Error Handler to prevent crashes
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).send('Something went wrong on the server.');
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
    🚀 Nexus Proxy Engine Active
    ----------------------------
    Local Access: http://localhost:${PORT}
    Network:      http://0.0.0.0:${PORT}
    Status:       Running 24/7 (with PM2)
    `);
});

// Graceful shutdown support
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
