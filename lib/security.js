/**
 * Security validation utilities for API proxy
 * Simple and focused security checks
 */

// Rate limiting storage (memory-based for simplicity)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

/**
 * Extract root domain from URL or host
 * Example: api-proxy.ygna.blog → ygna.blog
 */
function extractRootDomain(urlOrHost) {
  let hostname = urlOrHost;
  
  // Remove protocol if present
  if (hostname.includes('://')) {
    hostname = hostname.split('://')[1];
  }
  
  // Remove path if present
  hostname = hostname.split('/')[0];
  
  // Split by dots and take last 2 parts (domain.tld)
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  
  return hostname;
}

/**
 * Validate request origin by checking if same root domain as proxy
 */
function validateOrigin(req) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const proxyHost = req.headers.host;
  
  if (!proxyHost) {
    return false;
  }
  
  const proxyDomain = extractRootDomain(proxyHost);
  
  // Check origin first
  if (origin) {
    const clientDomain = extractRootDomain(origin);
    if (clientDomain === proxyDomain) {
      return true;
    }
  }
  
  // Check referer as fallback
  if (referer) {
    const refererDomain = extractRootDomain(referer);
    if (refererDomain === proxyDomain) {
      return true;
    }
  }
  
  return false;
}

/**
 * Basic user agent validation (must contain Mozilla for browser detection)
 */
function validateUserAgent(req) {
  const userAgent = req.headers['user-agent'];
  
  if (!userAgent || !userAgent.includes('Mozilla')) {
    return false;
  }
  
  return true;
}

/**
 * Simple rate limiting based on client IP
 */
function checkRateLimit(req) {
  // Get client IP from headers or connection
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.connection?.remoteAddress || 
                   'unknown';
  
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW);
  const key = `${clientIP}-${windowStart}`;
  
  // Get current request count for this IP in current window
  const count = rateLimits.get(key) || 0;
  
  if (count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }
  
  // Increment request count
  rateLimits.set(key, count + 1);
  
  // Cleanup old entries (simple cleanup every 10th request)
  if (Math.random() < 0.1) {
    cleanupRateLimits(windowStart);
  }
  
  return true;
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimits(currentWindow) {
  const cutoff = currentWindow - 2; // Keep last 2 windows
  
  for (const [key] of rateLimits) {
    const keyWindow = parseInt(key.split('-')[1]);
    if (keyWindow < cutoff) {
      rateLimits.delete(key);
    }
  }
}

/**
 * Complete request validation
 */
function validateRequest(req) {
  // 1. Origin validation
  if (!validateOrigin(req)) {
    throw new Error('Invalid origin');
  }
  
  // 2. User-Agent validation
  if (!validateUserAgent(req)) {
    throw new Error('Invalid user agent');
  }
  
  // 3. Rate limiting
  if (!checkRateLimit(req)) {
    throw new Error('Rate limit exceeded');
  }
  
  return true;
}

module.exports = {
  validateOrigin,
  validateUserAgent,
  checkRateLimit,
  validateRequest
};