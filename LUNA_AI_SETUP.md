# 🤖 Making Luna Truly Intelligent - Setup Guide

## The Problem

**You can't call Claude API directly from the browser!**

Browsers block direct calls to `api.anthropic.com` due to CORS (Cross-Origin Resource Sharing) security restrictions. This is why Luna might be using "mock responses" (dumb pattern matching) instead of real AI.

## The Solution

We've created a **simple backend proxy** that:
- Runs on your local machine (Node.js server)
- Receives requests from your React frontend
- Forwards them to Claude API (server-side, no CORS issues!)
- Returns Claude's intelligent responses to Luna

```
Architecture:
Browser (React) → Backend (Node.js) → Claude API ✅
                                    ↓
                            Real AI Intelligence!
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Handles cross-origin requests
- `node-fetch` - Makes API calls from Node.js
- `dotenv` - Loads environment variables
- `concurrently` - Runs frontend + backend together

### Step 2: Verify Your .env File

Your `.env` should have:

```env
# Backend uses this to call Claude API
CLAUDE_API_KEY=sk-ant-api03-...your-key...

# Frontend calls this backend
REACT_APP_BACKEND_URL=http://localhost:3001
```

### Step 3: Run Both Frontend + Backend

```bash
npm run dev
```

This runs:
- Frontend on http://localhost:3000 (React app)
- Backend on http://localhost:3001 (API proxy)

---

## ✅ Verify It's Working

1. **Open your app:** http://localhost:3000
2. **Open browser console:** Press F12 → Console tab
3. **Start chatting with Luna**
4. **Look for these logs:**

```
🤖 Luna: Calling Claude API via backend...
✅ Luna: Real AI response received! { responseLength: 234 }
```

**If you see:**
```
⚠️  Using MOCK response - Luna has limited intelligence in this mode
```

→ Backend isn't running or Claude API key is invalid!

---

## 🛠 Troubleshooting

### "Failed to fetch" or Network Error

**Problem:** Backend isn't running

**Solution:**
```bash
# Terminal 1: Run backend
npm run backend

# Terminal 2: Run frontend
npm start
```

Or run both together:
```bash
npm run dev
```

---

### "Claude API error: Invalid API key"

**Problem:** API key is expired or invalid

**Solution:**
1. Go to https://console.anthropic.com/
2. Generate a new API key
3. Update `.env` file:
   ```env
   CLAUDE_API_KEY=sk-ant-api03-...NEW_KEY...
   ```
4. Restart backend: `npm run backend`

---

### "Still getting mock responses"

**Check the console logs:**

1. If you see: `❌ Error calling backend`
   → Backend isn't reachable, check it's running on port 3001

2. If you see: `❌ Backend error: 401 Unauthorized`
   → API key is invalid

3. If you see: `❌ Backend error: 429 Too Many Requests`
   → You've hit rate limits, wait a bit or upgrade your plan

---

## 📊 Understanding Luna's Intelligence Levels

### Level 1: Mock Responses (Fallback)
```
Intelligence: ⭐☆☆☆☆
How: Pattern matching (if user says "wedding" → canned response)
When: Backend unavailable or API fails
```

### Level 2: Real Claude API  ✅
```
Intelligence: ⭐⭐⭐⭐⭐
How: Full Claude 3.5 Sonnet AI
When: Backend + API key working properly
Features:
  - Contextual understanding
  - Natural conversation flow
  - Remembers full conversation history
  - Asks intelligent follow-up questions
  - Adapts tone and style
```

---

## 💰 Cost Considerations

**Claude API Pricing (as of 2024):**
- Model: Claude 3.5 Sonnet
- Input: $3 per million tokens (~750k words)
- Output: $15 per million tokens (~750k words)

**Typical conversation costs:**
- Short chat (10 messages): ~$0.01
- Full onboarding (50+ messages): ~$0.05-0.10
- Per user session: ~$0.02-0.15

**For a web app:**
- 100 users/day × $0.10 = $10/day = $300/month
- Add caching/optimization to reduce costs by 50-70%

**Free tier:** Anthropic offers free credits for testing

---

## 🎯 Making Luna Even Smarter

### Improve System Prompts

Edit `src/services/claudeAPI.js`:

```javascript
export const getLunaOnboardingResponse = async (conversationHistory, userContext = {}) => {
  const systemPrompt = `You are Luna, an empathetic AI relationship advisor...

ENHANCED CAPABILITIES:
- Use the couple's names frequently (${userContext.partner1} & ${userContext.partner2})
- Reference their location for local insights (${userContext.location})
- Build on previous answers - show you remember what they said
- Ask ONE follow-up question at a time (not 4 bullet points)
- Be conversational, warm, and human-like
- Use light humor when appropriate
- Celebrate their progress and excitement

CONVERSATION STYLE:
Instead of: "Tell me: • When? • Where? • Budget? • Priorities?"
Say: "I'm so excited for you both! Let's start with the fun part - have you thought about when you'd like to get married?"

Make each response feel like a real conversation with a friend who cares.`;

  return await callClaude(conversationHistory, {
    systemPrompt,
    maxTokens: 800, // Increased for more detailed responses
    temperature: 0.9  // Slightly lower for more consistent tone
  });
};
```

### Add Memory/Context

```javascript
// Store user info for Luna to reference
const userMemory = {
  partner1: "Sarah",
  partner2: "Mike",
  goals: ["Get Married", "Buy a Home"],
  keyInfo: "Want intimate wedding in 2 years, venue & photography priority"
};

// Include in every Luna call
systemPrompt += `\n\nREMEMBER: ${JSON.stringify(userMemory)}`;
```

### Optimize for Cost

```javascript
// Reduce token usage
maxTokens: 512,  // Shorter responses
temperature: 0.8, // More focused

// Add caching for repeated questions
const responseCache = {};
```

---

## 🚢 Deploying to Production

### Option 1: Vercel + Serverless Function
```
Frontend: Deploy to Vercel
Backend: Use Vercel API routes (no separate server needed)
```

### Option 2: Heroku
```
Frontend: Deploy React build
Backend: Deploy Node.js server
```

### Option 3: AWS
```
Frontend: S3 + CloudFront
Backend: Lambda function
```

---

## 📝 Next Steps

1. **Test Luna** - Chat and verify ✅ logs appear
2. **Monitor costs** - Check https://console.anthropic.com/usage
3. **Improve prompts** - Make Luna sound more natural
4. **Add features:**
   - Save conversation history
   - Resume conversations later
   - Luna remembers user preferences
   - Multi-language support

---

## 🆘 Still Having Issues?

Check the console logs carefully - they'll tell you exactly what's happening:

```
🤖 Luna: Calling Claude API via backend...
   → Attempting to reach backend

✅ Luna: Real AI response received!
   → SUCCESS! You're using real AI

❌ Error calling backend: Failed to fetch
   → Backend isn't running (npm run backend)

⚠️ Falling back to mock responses
   → You're getting dumb responses, fix the error above
```

**Happy coding!** 🚀
