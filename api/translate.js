/**
 * DeepL Translation Proxy
 * Proxies translation requests to DeepL API to avoid CORS issues
 */

const { validateRequest } = require('../lib/security');

module.exports = async (req, res) => {
  // CORS headers - allow same domain requests
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Security validation
    validateRequest(req);

    // Get DeepL API key from environment
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      console.error('DEEPL_API_KEY not configured');
      return res.status(500).json({ error: 'Translation service not configured' });
    }

    // Parse request body
    const { text, target_lang, source_lang } = req.body;
    
    if (!text || !Array.isArray(text) || text.length === 0) {
      return res.status(400).json({ 
        error: 'Text is required and must be an array' 
      });
    }

    if (!target_lang) {
      return res.status(400).json({ 
        error: 'Target language is required' 
      });
    }

    // Prepare DeepL API request
    const deeplUrl = 'https://api-free.deepl.com/v2/translate';
    const body = {
      text: text,
      target_lang: target_lang
    };

    if (source_lang) {
      body.source_lang = source_lang;
    }

    // Call DeepL API
    const deeplResponse = await fetch(deeplUrl, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!deeplResponse.ok) {
      const errorText = await deeplResponse.text();
      console.error('DeepL API error:', deeplResponse.status, errorText);
      return res.status(deeplResponse.status).json({ 
        error: `Translation failed: ${deeplResponse.status}` 
      });
    }

    const translationData = await deeplResponse.json();

    // Log successful request
    console.log(`✅ Translation completed for ${req.headers.origin || req.headers.referer}`);

    // Return translation result
    res.status(200).json(translationData);

  } catch (error) {
    console.error('Translation proxy error:', error.message);
    
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