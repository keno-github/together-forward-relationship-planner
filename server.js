// Simple Node.js backend to proxy Claude API calls
// This avoids CORS issues and keeps your API key secret

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: 'http://localhost:3000' // Your React app
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Luna backend is running' });
});

// Proxy Claude API calls
app.post('/api/claude', async (req, res) => {
  const { messages, systemPrompt, maxTokens = 1024, temperature = 1.0 } = req.body;

  console.log('🤖 Proxying request to Claude API...', {
    messageCount: messages?.length,
    systemPrompt: systemPrompt?.substring(0, 50)
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Claude API error:', error);
      return res.status(response.status).json({ error: error.error?.message || 'API call failed' });
    }

    const data = await response.json();
    console.log('✅ Claude API success!', {
      model: data.model,
      usage: data.usage
    });

    res.json({ text: data.content[0].text });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Luna backend running on http://localhost:${PORT}`);
  console.log(`📝 Make sure CLAUDE_API_KEY is set in .env`);
});
