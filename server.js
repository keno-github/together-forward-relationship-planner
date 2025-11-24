// Simple Node.js backend to proxy Claude API calls
// This avoids CORS issues and keeps your API key secret

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const fetch = require('node-fetch');
const { validateServerEnv, getServerConfig, logConfig } = require('./src/config/serverEnv');

// Validate environment before starting
try {
  validateServerEnv();
} catch (error) {
  console.error('❌ Server startup failed:', error.message);
  process.exit(1);
}

const config = getServerConfig();
const app = express();
const PORT = config.server.port;

// Enable Gzip compression for all responses
app.use(compression());

// Enable CORS for your frontend with improved security
const allowedOrigins = config.cors.allowedOrigins && config.cors.allowedOrigins.length > 0
  ? config.cors.allowedOrigins
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Disable caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Increase JSON payload limit to handle large conversation histories
// Default is 100kb, we're increasing to 10MB for Luna conversations
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Luna backend is running' });
});

// Proxy Claude API calls with function calling support
app.post('/api/claude', async (req, res) => {
  const { messages, systemPrompt, tools, maxTokens = 2048, temperature = 1.0 } = req.body;

  console.log('🤖 Proxying request to Claude API...', {
    messageCount: messages?.length,
    systemPrompt: systemPrompt?.substring(0, 50),
    toolsCount: tools?.length || 0
  });

  // DEBUG: Log full message structure and tool usage
  console.log('📋 Full message array:');
  messages?.forEach((msg, i) => {
    if (Array.isArray(msg.content)) {
      const types = msg.content.map(c => c.type).join(', ');
      console.log(`  [${i}] role: ${msg.role}, content: [${types}]`);

      // Log tool names if this message contains tool_use
      const toolUses = msg.content.filter(c => c.type === 'tool_use');
      if (toolUses.length > 0) {
        console.log(`     🔧 Tools called: ${toolUses.map(t => t.name).join(', ')}`);
      }
    } else {
      console.log(`  [${i}] role: ${msg.role}, content: "${msg.content?.substring(0, 50)}..."`);
    }
  });

  try {
    const apiBody = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: messages
    };

    // Add tools if provided (for function calling)
    if (tools && tools.length > 0) {
      apiBody.tools = tools;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.claude.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(apiBody)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Claude API error:', error);
      return res.status(response.status).json({ error: error.error?.message || 'API call failed' });
    }

    const data = await response.json();
    console.log('✅ Claude API success!', {
      model: data.model,
      usage: data.usage,
      stop_reason: data.stop_reason
    });

    // Return full response (not just text) to support function calling
    res.json(data);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// New endpoint for intelligent content generation
app.post('/api/claude-generate', async (req, res) => {
  const { prompt, systemPrompt, maxTokens = 2048, temperature = 0.8 } = req.body;

  console.log('🧠 Generating intelligent content with Claude...');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.claude.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.claude.model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Claude API error:', error);
      return res.status(response.status).json({ error: error.error?.message || 'API call failed' });
    }

    const data = await response.json();
    console.log('✅ Claude content generation success!');

    // Extract text content
    const textContent = data.content.find(c => c.type === 'text');
    if (!textContent) {
      return res.status(500).json({ error: 'No text content in response' });
    }

    res.json({ content: textContent.text });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Luna backend running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}\n`);
  logConfig();
  console.log(`\n✅ Server ready to accept requests\n`);
});
