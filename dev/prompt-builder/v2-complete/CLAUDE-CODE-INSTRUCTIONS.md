# 🤖 Sub-Agent for Claude Code - Instructions

## ✅ SOLUTION: Use JSON Format

Claude Code expects **JSON format**. I've created the corrected version.

---

## 📁 Files Created

You now have **6 files** for the sub-agent:

### For Claude Code (JSON Format):

1. **`SUB-AGENT-CLAUDE-CODE-SIMPLE.json`** ⭐ **RECOMMENDED**
   - Simple, concise format
   - Easy to copy/paste
   - Perfect for Claude Code

2. **`SUB-AGENT-PROMPT-CLAUDE-CODE.json`** ⭐ **COMPLETE**
   - Full detailed version
   - All features documented
   - Comprehensive examples

### For General Use:

3. **`SUB-AGENT-PROMPT-BUILDER-V2.txt`**
   - Text format (original version)
   - Good for other AI systems

4. **`SUB-AGENT-IMPLEMENTATION-GUIDE.md`**
   - Practical usage guide
   - Examples and best practices

5. **`SUB-AGENT-EXAMPLE-IMPLEMENTATION.ts`**
   - TypeScript code
   - Ready to use

6. **`SUB-AGENT-PACKAGE-README.md`**
   - Complete package overview

---

## 🚀 How to Use in Claude Code

### Method 1: Simple Version (Recommended)

1. Open **`SUB-AGENT-CLAUDE-CODE-SIMPLE.json`**
2. Copy the entire content
3. In Claude Code, paste it when it asks for the prompt

**Example interaction:**
```
You: [Pastes JSON from SUB-AGENT-CLAUDE-CODE-SIMPLE.json]

Claude Code: I'll help you optimize prompts using Prompt Builder v2.
             I understand I should return JSON format with:
             - optimizedPrompt
             - expectedScore
             - activatedSkills
             - contextualTags
             - recommendations

You: Create optimized prompt for: "Build a user authentication system"
```

### Method 2: Complete Version

1. Open **`SUB-AGENT-PROMPT-CLAUDE-CODE.json`**
2. Copy and paste into Claude Code

This gives you all the detailed features.

---

## 💡 Example Usage

### After Activating the Sub-Agent:

**Input:**
```
Build a PostgreSQL database with connection pooling
```

**Expected JSON Output:**
```json
{
  "optimizedPrompt": "C1: CSE_Completo ✅\nSet up PostgreSQL database with connection pooling...\n\n🏷️ TAGs: [K:DATABASE-OPERATIONS]\n🔗 Files: backend/src/db/pool.ts",
  "expectedScore": 0.92,
  "activatedSkills": [
    {"skillId": "database-management", "score": 0.92},
    {"skillId": "backend-dev-guidelines", "score": 0.76}
  ],
  "contextualTags": [
    "[K:DATABASE-CONNECTION]",
    "[C:INFRASTRUCTURE-SETUP]"
  ],
  "recommendations": [
    "Include pg library for connection",
    "Use environment variables for connection strings",
    "Implement connection leak detection"
  ]
}
```

---

## 📋 What the Sub-Agent Does

1. **Receives** your natural language task
2. **Optimizes** it using Prompt Builder v2
3. **Returns** structured JSON with:
   - ✅ Optimized prompt (Template v1.1.0)
   - 📊 Expected activation score
   - 🎯 Activated skills
   - 🏷️ Contextual TAGs
   - 💡 Actionable recommendations

---

## 🔧 How It Works

```
Your Task → Sub-Agent → PBv2 API → Optimized JSON
                     ↓
              [Template v1.1.0]
              [TAGs System]
              [Performance Metrics]
```

---

## ✨ Key Features

### Template v1.1.0 Structure
- C1: CSE_Completo
- C2: TAGs_Cobertura
- C3-C8: Boundary markers, SMART goals, tests, etc.

### TAGs System
- `[K:]` Knowledge tags
- `[C:]` Context tags
- `[U:]` Usage tags
- `[EVIDENCIA:]` Evidence markers
- `[PROPUESTA:]` Proposal markers

### Performance Features
- 99.9% faster optimization
- Cache hits (<10ms)
- Parallel search
- Worker threads for large projects

---

## 🛠️ Customization

### Basic Task
```json
{"task": "Create a REST API"}
```

### Multi-Skill Task
```json
{
  "task": "Build complete authentication system",
  "skills": ["backend", "security", "database"]
}
```

### High Complexity
```json
{
  "task": "Design scalable microservices architecture",
  "complexity": "very-high"
}
```

---

## 📊 Response Example

Full JSON response structure:

```json
{
  "optimizedPrompt": "C1-C8 structured prompt with details...",
  "expectedScore": 0.89,
  "activatedSkills": [
    {
      "skillId": "backend-dev-guidelines",
      "score": 0.89,
      "reasons": ["pattern matched", "keywords found"]
    }
  ],
  "tagsCoverage": 0.75,
  "contextualTags": ["[K:BACKEND-ARCHITECTURE]", "[C:API-DEVELOPMENT]"],
  "recommendations": [
    "Specific actionable recommendation #1",
    "Specific actionable recommendation #2"
  ],
  "performanceInfo": {
    "latency": 45.2,
    "cacheHit": true,
    "memoryMB": 14.2
  }
}
```

---

## ⚠️ Important Notes

### For Claude Code:
1. ✅ **Use JSON files** (not .txt)
2. ✅ **Return JSON only** (no markdown)
3. ✅ **Keep responses structured**
4. ✅ **Include all fields** (optimizedPrompt, score, skills, etc.)

### For Best Results:
1. Provide **clear task descriptions**
2. Use **specific keywords**
3. Open **relevant files** in your editor
4. Check the **expected score** (aim for >0.6)

---

## 🎯 Quick Test

After activating:

**Test 1:**
```
Input: "Create a login form"
Expected: JSON with optimized prompt + metrics
```

**Test 2:**
```
Input: "Optimize database queries"
Expected: Multi-skill activation
```

**Test 3:**
```
Input: "Build React component"
Expected: Frontend guidelines + specific recommendations
```

---

## 📞 Troubleshooting

### "No JSON object found"
**Solution:** Use the `.json` files, not `.txt`

### Empty response
**Solution:** Ensure you're returning the full JSON structure

### Low score (<0.6)
**Solution:**
- Add more context
- Open relevant files
- Use specific keywords

### Want more features?
**Solution:** Use `SUB-AGENT-PROMPT-CLAUDE-CODE.json` (complete version)

---

## ✅ Ready to Use!

**Start here:**
1. Open **`SUB-AGENT-CLAUDE-CODE-SIMPLE.json`**
2. Copy the content
3. Paste into Claude Code
4. Give it a task!

**That's it!** 🚀

---

## 📚 Full Documentation

For complete documentation, see:
- `SUB-AGENT-PACKAGE-README.md` - Overview
- `SUB-AGENT-IMPLEMENTATION-GUIDE.md` - Detailed guide
- `SUB-AGENT-EXAMPLE-IMPLEMENTATION.ts` - Code

---

**Status**: ✅ Ready for Claude Code
**Format**: JSON
**Version**: v2.2.0
**Date**: 2025-11-03
