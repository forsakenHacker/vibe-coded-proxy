const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Create the proxy middleware
    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: {
            '^/api/proxy': '',
        },
        onProxyRes: (proxyRes) => {
            // Remove security headers that prevent iframe embedding
            const headersToRemove = [
                'x-frame-options',
                'content-security-policy',
                'x-content-security-policy',
                'x-webkit-csp',
                'content-security-policy-report-only'
            ];
            
            headersToRemove.forEach(header => {
                delete proxyRes.headers[header];
            });

            // Allow all origins
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        },
        onError: (err) => {
            res.status(500).json({ error: 'Proxy Error', message: err.message });
        },
    });

    // Manually handle the request through the middleware
    return proxy(req, res);
};
