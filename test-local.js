/**
 * Local testing script for API proxy
 * Run with: node test-local.js
 */

const http = require('http');
const url = require('url');

// Mock environment for testing
process.env.ASSEMBLYAI_API_KEY = 'test-assemblyai-key-12345';
process.env.DEEPL_API_KEY = 'test-deepl-key-67890';
process.env.GEMINI_API_KEY = 'test-gemini-key-67890';

const handler = require('./api/keys/[service].js');

// Create simple HTTP server for testing
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Extract service from URL path
  const pathMatch = parsedUrl.pathname.match(/\/api\/keys\/(.+)/);
  if (pathMatch) {
    req.query = { service: pathMatch[1] };
  }
  
  handler(req, res);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Test endpoints:');
  console.log('  GET http://localhost:3001/api/keys/assemblyai');
  console.log('  GET http://localhost:3001/api/keys/deepl');
  console.log('  GET http://localhost:3001/api/keys/gemini');
  console.log('  GET http://localhost:3001/api/keys/invalid');
  console.log('');
  console.log('Test with same domain origin:');
  console.log('  curl -H "Host: api-proxy.ygna.blog" -H "Origin: https://realtime-translator.ygna.blog" http://localhost:3001/api/keys/assemblyai');
  console.log('');
  console.log('Test with different domain origin:');
  console.log('  curl -H "Host: api-proxy.ygna.blog" -H "Origin: https://evil.com" http://localhost:3001/api/keys/assemblyai');
});