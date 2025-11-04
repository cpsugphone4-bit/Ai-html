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

  if (!model) {
    return res.status(400).json({ error: 'Model not specified' });
  }

  try {
    // ============================================
    // GEMINI MODELS
    // ============================================
    if (model === 'gemini-flash' || model === 'gemini-flash-exp' || model === 'gemini-pro') {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }
      
      // Tentukan model ID
      let modelId;
      if (model === 'gemini-flash') {
        modelId = 'gemini-2.0-flash-latest';
      } else if (model === 'gemini-flash-exp') {
        modelId = 'gemini-2.0-flash-exp';
      } else if (model === 'gemini-pro') {
        modelId = 'gemini-2.0-flash-exp';
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(geminiUrl, {
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
            maxOutputTokens: 2048
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Gemini API Error:', data);
        return res.status(response.status).json({ 
          error: `Gemini error: ${data.error?.message || 'Unknown error'}` 
        });
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response:', data);
        return res.status(500).json({ 
          error: 'Invalid response from Gemini API' 
        });
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
      
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OpenRouter API key not configured' });
      }

      // Mapping model ke ID OpenRouter
      const modelMapping = {
        'deepseek': 'deepseek/deepseek-chat-v3.1:free',
        'dolphin': 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
        'deepcoder': 'agentica-org/deepcoder-14b-preview:free',
        'mai-ds': 'microsoft/mai-ds-r1:free',
        'hermes': 'nousresearch/hermes-3-llama-3.1-405b:free'
      };

      const modelId = modelMapping[model];
      
      if (!modelId) {
        return res.status(400).json({ error: `Unknown model: ${model}` });
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.referer || 'https://ai-chat-app.vercel.app',
          'X-Title': 'AI Chat Assistant'
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('OpenRouter API Error:', {
          status: response.status,
          model: modelId,
          error: data
        });
        
        return res.status(response.status).json({ 
          error: `OpenRouter error: ${data.error?.message || data.message || 'Unknown error'}` 
        });
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid OpenRouter response:', data);
        return res.status(500).json({ 
          error: 'Invalid response from OpenRouter API' 
        });
      }

      return res.status(200).json({
        message: data.choices[0].message.content
      });
    }

  } catch (error) {
    console.error('API Handler Error:', {
      message: error.message,
      stack: error.stack,
      model: model
    });
    
    return res.status(500).json({ 
      error: `Server error: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
