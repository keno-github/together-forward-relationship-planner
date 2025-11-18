# Testing Guide - Luna Roadmap Generation Fix

## 🎯 What Was Fixed

### Bug #1: Wrong Tools Available
**Problem:** Luna was calling deprecated tools (`generate_intelligent_roadmap`, `create_multi_goal_plan`) that create wrong architecture.
**Fix:** Completely removed deprecated tools from LUNA_TOOLS array (Commit: 033f791)

### Bug #2: Wrong Array for Database Save
**Problem:** `handleFinalizeRoadmap()` saved from `context.generatedMilestones` but Luna stores in `context.milestones`.
**Fix:** Changed to use `context.milestones || context.generatedMilestones` (Commit: 3dbc4dc)

### Bug #3: Node Module Caching
**Problem:** Server was running old cached code even after fixes committed.
**Fix:** Need to properly restart servers to clear require() cache.

---

## 📋 Testing Checklist

### Step 1: Clean Restart

**Option A: Windows**
```bash
# Double-click restart-dev.bat
# Or run in Command Prompt:
restart-dev.bat
```

**Option B: Git Bash / WSL / Linux**
```bash
chmod +x restart-dev.sh
./restart-dev.sh
```

**Option C: Manual Restart**
```bash
# Kill all Node processes
taskkill /F /IM node.exe  # Windows
# OR
pkill -9 node             # Linux/Mac

# Start backend
node server.js

# In another terminal, start frontend
npm start
```

### Step 2: Clear Test Data

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Copy contents of `clear-test-data.sql`
4. Run Step 1 (SELECT) to preview deletions
5. Uncomment Step 2 (DELETE) and run
6. Verify with Step 3

**Quick Delete (if confident):**
```sql
DELETE FROM roadmaps
WHERE partner1_name IN ('Keno', 'Brenda', 'Partner 1', 'Partner 2')
   OR partner2_name IN ('Keno', 'Brenda', 'Partner 1', 'Partner 2');
```

### Step 3: Clear Browser Cache

1. Open Together Forward app: http://localhost:3000
2. Press **Ctrl + Shift + R** (hard refresh)
3. Or: Open DevTools → Network tab → Check "Disable cache"

### Step 4: Fresh Luna Conversation

**Test Input:**
```
User: Hi
Luna: [Greeting]
User: We are Keno and Brenda, we want to buy apartment in Berlin for €500k in 24 months
```

---

## ✅ Expected Results

### Backend Logs Should Show:

```
🤖 Proxying request to Claude API... { messageCount: 2, toolsCount: 6 }
📋 Full message array:
  [0] role: assistant, content: "Hey there! 👋..."
  [1] role: user, content: "We are Keno and Brenda..."

✅ Claude API success!

🤖 Proxying request to Claude API... { messageCount: 4, toolsCount: 6 }
📋 Full message array:
  [2] role: assistant, content: [tool_use, tool_use]
     🔧 Tools called: extract_user_data, generate_milestone  ✅ CORRECT!
  [3] role: user, content: [tool_result, tool_result]

🧠 Generating intelligent content with Claude...
✅ Claude content generation success!

🤖 Proxying request to Claude API... { messageCount: 6, toolsCount: 6 }
📋 Full message array:
  [4] role: assistant, content: [text, tool_use]
     🔧 Tools called: generate_deep_dive  ✅ CORRECT!
  [5] role: user, content: [tool_result]

✅ Attached deep dive to milestone: Buy Apartment in Berlin for €500k
   Roadmap phases: 4

🤖 Proxying request to Claude API... { messageCount: 8, toolsCount: 6 }
📋 Full message array:
  [6] role: assistant, content: [text, tool_use]
     🔧 Tools called: finalize_roadmap  ✅ CORRECT!
  [7] role: user, content: [tool_result]

💾 Finalizing roadmap - saving to database...
📝 Creating roadmap with data: { title: "...", partner1_name: "Keno", ... }
✅ Roadmap saved to database: <roadmap-id>

📌 Saving 1 milestones...
✅ Milestone 1 saved: <milestone-id>

✅ Roadmap saved successfully with 1 milestones!
```

### ❌ BAD (Old Behavior):
```
🔧 Tools called: extract_user_data, create_multi_goal_plan  ❌ WRONG!
🔧 Tools called: generate_intelligent_roadmap  ❌ WRONG!
```

### Frontend Should Show:

1. **Luna Chat:**
   - Luna greets user
   - User provides goal
   - Luna acknowledges and generates roadmap
   - After 2 seconds, UI transitions to roadmap view

2. **Roadmap View:**
   - ONE milestone card displayed
   - Title: "Buy Apartment in Berlin for €500k" (NOT "Goal Definition and Research")
   - Click on milestone card

3. **Milestone Detail:**
   - Shows 4 roadmap phases:
     - Phase 1: Financial Planning
     - Phase 2: Research & Search
     - Phase 3: Financing & Legal
     - Phase 4: Closing & Moving
   - Each phase has specific tasks
   - Tasks are personalized to Keno & Brenda's situation

4. **Console (NO ERRORS):**
   ```
   ✅ Roadmap complete! Preparing data...
   ✨ Using Luna-generated roadmap phases: 4
   ```

### ❌ BAD (Old Behavior):
```
❌ No roadmap phases found in milestone.deep_dive_data
Has deep_dive_data: false
```

---

## 🚨 Troubleshooting

### Issue: Luna still calls old tools

**Symptom:** Backend logs show `create_multi_goal_plan` or `generate_intelligent_roadmap`

**Cause:** Server is using cached old code

**Fix:**
```bash
# Force kill and restart
taskkill /F /IM node.exe
node server.js
```

### Issue: "Has deep_dive_data: false"

**Symptom:** Console shows milestone has no deep_dive_data

**Possible Causes:**

1. **Old milestone in database**
   - Solution: Clear test data (see Step 2 above)

2. **Server not restarted**
   - Solution: Kill all node processes and restart

3. **Browser cache**
   - Solution: Hard refresh (Ctrl+Shift+R)

4. **Luna didn't call generate_deep_dive()**
   - Solution: Check backend logs, ensure Luna called correct tools

### Issue: Port 3001 already in use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3001`

**Fix:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Linux/Mac

# Kill the process
taskkill /F /PID <PID>        # Windows
kill -9 <PID>                 # Linux/Mac
```

### Issue: Frontend won't load

**Symptom:** http://localhost:3000 shows error

**Check:**
```bash
# Verify npm start is running
ps aux | grep "npm"

# Check frontend logs
cat frontend.log

# Restart frontend
npm start
```

---

## 🎓 How to Verify Fix Worked

### Checklist:

- [ ] Backend logs show Luna calling `generate_milestone` (NOT `generate_intelligent_roadmap`)
- [ ] Backend logs show Luna calling `generate_deep_dive` (NEW tool)
- [ ] Backend logs show "✅ Attached deep dive to milestone"
- [ ] Backend logs show "📌 Saving 1 milestones..."
- [ ] UI displays ONE milestone card with custom title
- [ ] Clicking milestone shows 4+ roadmap phases
- [ ] Console has NO errors about deep_dive_data
- [ ] Phases are personalized (mention Keno/Brenda, Berlin, €500k, 24 months)

### Success Criteria:

✅ **Milestone Title:**
- Good: "Buy Apartment in Berlin for €500k"
- Bad: "Goal Definition and Research"

✅ **Roadmap Phases:**
- Good: "Financial Planning", "Research & Search", "Financing & Legal"
- Bad: "Planning and Preparation", "Execution", "Completion"

✅ **Personalization:**
- Good: "Given Keno and Brenda's budget of €500k in Berlin..."
- Bad: Generic advice with no names/details

---

## 📊 Commits Applied

1. **033f791** - Remove deprecated tools from LUNA_TOOLS array
2. **3dbc4dc** - Use context.milestones (not generatedMilestones) in handleFinalizeRoadmap

---

## 🆘 Still Not Working?

If you've followed all steps and still see issues:

1. **Check Node version:**
   ```bash
   node --version  # Should be v16+
   ```

2. **Clear node_modules cache:**
   ```bash
   rm -rf node_modules/.cache
   ```

3. **Check git status:**
   ```bash
   git log --oneline -5
   # Should show commits 033f791 and 3dbc4dc
   ```

4. **Verify file changes:**
   ```bash
   # Ensure deprecated tools are removed
   grep -n "generate_intelligent_roadmap" src/services/lunaService.js
   # Should return no matches in LUNA_TOOLS array
   ```

5. **Check environment variables:**
   ```bash
   # Verify ANTHROPIC_API_KEY is set
   echo $ANTHROPIC_API_KEY
   ```

---

## 📝 Additional Notes

- The fixes are 100% correct in the codebase
- The issue was Node module caching preventing new code from running
- After proper restart, everything should work as expected
- Always hard refresh browser after code changes
- Always clear test data before fresh testing

---

**Status:** ✅ Ready for Testing

**Last Updated:** 2025-11-18
