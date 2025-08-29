# API Proxy

Simple, secure proxy for safe API key management with dynamic domain validation.

## Purpose
- Secure API key distribution to same-domain applications
- Dynamic origin validation without hardcoded domains
- Rate limiting and bot protection
- Support for multiple API services (AssemblyAI, DeepL, Gemini)

## Architecture
```
Client (app.domain.com) → API Proxy (api-proxy.domain.com) → API Key Return
Client → External API (direct call with received key)
```

## Endpoints
- `GET /api/keys/assemblyai` - Get AssemblyAI API key
- `GET /api/keys/deepl` - Get DeepL API key
- `GET /api/keys/gemini` - Get Gemini API key

## Security Features
- **Dynamic Domain Validation**: Same root domain check (e.g., `*.ygna.blog`)
- **Rate Limiting**: 10 requests per minute per IP
- **Browser Detection**: User-agent validation
- **No Hardcoded Domains**: Automatically validates against proxy's domain
- **HTTPS Only**: Secure connections required

## Environment Variables
```bash
ASSEMBLYAI_API_KEY="your-assemblyai-api-key"
DEEPL_API_KEY="your-deepl-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```

## Usage Example
```javascript
// From https://app.ygna.blog
const response = await fetch('https://api-proxy.ygna.blog/api/keys/assemblyai');
const { apiKey } = await response.json();

// Use API key directly
const ws = new WebSocket(`wss://api.assemblyai.com/ws?token=${apiKey}`);
```