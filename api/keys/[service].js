/**
 * Simple API Key Proxy
 * Returns API keys for same-domain requests with dynamic validation
 */

const { validateRequest } = require('../../lib/security');

// Supported services and their environment variable keys
const SERVICE_MAP = {
  'assemblyai': 'ASSEMBLYAI_API_KEY',
  'deepl': 'DEEPL_API_KEY',
  'gemini': 'GEMINI_API_KEY'
};

module.exports = (req, res) => {
  // CORS headers - allow same domain requests
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Security validation
    validateRequest(req);

    // Get service name from URL parameter
    const { service } = req.query;
    
    if (!service || !SERVICE_MAP[service]) {
      return res.status(400).json({ 
        error: 'Invalid service', 
        supported: Object.keys(SERVICE_MAP) 
      });
    }

    // Get API key from environment
    const envKey = SERVICE_MAP[service];
    const apiKey = process.env[envKey];

    if (!apiKey) {
      console.error(`API Key not configured: ${envKey}`);
      return res.status(500).json({ error: 'Service not configured' });
    }

    // Log successful request
    console.log(`✅ API Key provided: ${service} to ${req.headers.origin || req.headers.referer}`);

    // Return API key
    res.status(200).json({
      apiKey: apiKey,
      service: service,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API proxy error:', error.message);
    
    // Return appropriate error status
    if (error.message.includes('Rate limit')) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    if (error.message.includes('Invalid origin') || error.message.includes('Invalid user agent')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
};