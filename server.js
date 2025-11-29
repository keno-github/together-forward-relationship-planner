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
  console.log('📝 System prompt length:', systemPrompt?.length || 0);
  console.log('📝 User prompt length:', prompt?.length || 0);
  console.log('📝 User prompt preview:', prompt?.substring(0, 200));

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
      console.error('❌ Claude API error (claude-generate):', JSON.stringify(error, null, 2));
      console.error('❌ Status:', response.status);
      console.error('❌ Error type:', error.error?.type);
      console.error('❌ Error message:', error.error?.message);
      return res.status(response.status).json({ error: error.error?.message || 'API call failed' });
    }

    const data = await response.json();
    console.log('✅ Claude content generation success!');
    console.log('📊 Response content blocks:', data.content?.length || 0);

    // Extract text content
    const textContent = data.content.find(c => c.type === 'text');
    if (!textContent) {
      console.error('❌ No text content found in response');
      console.error('Response structure:', JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'No text content in response' });
    }

    console.log('📤 Returning content, length:', textContent.text?.length || 0);
    console.log('📤 Content preview:', textContent.text?.substring(0, 300));

    res.json({ content: textContent.text });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Luna goal optimization endpoint - helps users plan their custom goals
app.post('/api/luna/optimize-goals', async (req, res) => {
  const { messages, context } = req.body;

  console.log('🎯 Luna optimization request received...', {
    messageCount: messages?.length,
    goalCount: context?.analysis?.totalGoals || 0
  });

  try {
    // Extract system prompt (first message) and conversation messages
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Build the API request
    const apiBody = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      temperature: 0.8,
      system: systemMessage?.content || 'You are Luna, an expert AI planning advisor helping couples optimize their multi-goal roadmap.',
      messages: conversationMessages
    };

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
      console.error('❌ Luna optimization error:', error);
      return res.status(response.status).json({ error: error.error?.message || 'API call failed' });
    }

    const data = await response.json();
    console.log('✅ Luna optimization success!');

    // Extract text content
    const textContent = data.content.find(c => c.type === 'text');
    if (!textContent) {
      return res.status(500).json({ error: 'No text content in response' });
    }

    // Return in format expected by frontend
    res.json({ message: textContent.text });
  } catch (error) {
    console.error('❌ Server error in Luna optimization:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Streaming endpoint for real-time text responses (like ChatGPT/Claude)
// Now supports tool calling for Luna Overview Chat
app.post('/api/claude-stream', async (req, res) => {
  const { messages, systemPrompt, tools, maxTokens = 2048, temperature = 1.0 } = req.body;

  console.log('🌊 Starting streaming response from Claude...');
  if (tools) {
    console.log(`   Tools enabled: ${tools.length} tools available`);
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  try {
    const apiBody = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: messages,
      stream: true  // Enable streaming
    };

    // Add tools if provided
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
      const errorText = await response.text();
      console.error('❌ Claude API streaming error:', response.status, errorText);
      console.error('❌ Request body was:', JSON.stringify(apiBody, null, 2).substring(0, 500));
      res.write(`event: error\ndata: ${JSON.stringify({ error: `API call failed: ${response.status} - ${errorText.substring(0, 200)}` })}\n\n`);
      res.end();
      return;
    }

    // Read and forward the stream
    const reader = response.body;
    let buffer = '';
    let currentToolUse = null; // Track tool use being built
    let currentToolInput = ''; // Accumulate JSON input

    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');

      // Keep last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            continue;
          }

          try {
            const event = JSON.parse(data);

            // Extract text chunk from content_block_delta
            if (event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta') {
              res.write(`event: text\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`);
            }

            // Handle tool use start - Claude is calling a tool
            if (event.type === 'content_block_start' &&
                event.content_block?.type === 'tool_use') {
              currentToolUse = {
                id: event.content_block.id,
                name: event.content_block.name
              };
              currentToolInput = '';
              console.log(`🔧 Tool call started: ${currentToolUse.name}`);
            }

            // Accumulate tool input JSON
            if (event.type === 'content_block_delta' &&
                event.delta?.type === 'input_json_delta') {
              currentToolInput += event.delta.partial_json;
            }

            // Handle content block stop - tool call complete
            if (event.type === 'content_block_stop' && currentToolUse) {
              try {
                const toolInput = JSON.parse(currentToolInput);
                console.log(`✅ Tool call complete: ${currentToolUse.name}`, toolInput);

                // Send tool use event to client
                res.write(`event: tool_use\ndata: ${JSON.stringify({
                  tool: {
                    id: currentToolUse.id,
                    name: currentToolUse.name,
                    input: toolInput
                  }
                })}\n\n`);
              } catch (e) {
                console.error('❌ Failed to parse tool input:', e);
              }
              currentToolUse = null;
              currentToolInput = '';
            }

            // Send stop signal when stream ends
            if (event.type === 'message_stop') {
              res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    });

    reader.on('end', () => {
      console.log('✅ Stream completed');
      res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    reader.on('error', (error) => {
      console.error('❌ Stream error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('❌ Server error during streaming:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Luna backend running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}\n`);
  logConfig();
  console.log(`\n✅ Server ready to accept requests\n`);
});
