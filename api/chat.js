// api/chat.js
// FILE BARU! Ini berjalan di SERVER Vercel, bukan di browser user

export default async function handler(req, res) {
  // CORS headers - biar bisa dipanggil dari frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;

  // Validasi input
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  try {
    // ============================================
    // GEMINI MODELS
    // ============================================
    if (model === 'gemini-flash' || model === 'gemini-flash-exp' || model === 'gemini-pro') {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      
      // Tentukan model ID
      let modelId;
      if (model === 'gemini-flash') {
        modelId = 'gemini-2.0-flash';
      } else if (model === 'gemini-flash-exp') {
        modelId = 'gemini-2.0-flash-exp';
      } else if (model === 'gemini-pro') {
        modelId = 'gemini-2.0-flash-exp'; // Fallback ke flash-exp karena 2.5 pro belum ada
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: messages.map(m => `${m.role}: ${m.content}`).join('\n')
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Gemini API Error:', data);
        throw new Error(data.error?.message || 'Gemini API error');
      }

      return res.status(200).json({
        message: data.candidates[0].content.parts[0].text
      });
    } 
    
    // ============================================
    // OPENROUTER MODELS
    // ============================================
    else {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

      // Mapping model ke ID OpenRouter
      const modelMapping = {
        'deepseek': 'deepseek/deepseek-chat-v3.1:free',
        'dolphin': 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
        'deepcoder': 'agentica-org/deepcoder-14b-preview:free',
        'mai-ds': 'microsoft/mai-ds-r1:free',
        'hermes': 'nousresearch/hermes-3-llama-3.1-405b:free'
      };

      const modelId = modelMapping[model] || 'deepseek/deepseek-chat-v3.1:free';

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://your-app.vercel.app',
          'X-Title': 'AI Chat Assistant'
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('OpenRouter API Error:', data);
        throw new Error(data.error?.message || 'OpenRouter API error');
      }

      return res.status(200).json({
        message: data.choices[0].message.content
      });
    }

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

/*
CATATAN PENTING:
- File ini berjalan di SERVER Vercel, bukan di browser user
- API keys diambil dari process.env (environment variables)
- User TIDAK BISA lihat API keys karena code ini tidak dikirim ke browser
- Ketika user panggil /api/chat, Vercel jalankan function ini di server
*/
