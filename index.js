const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PASSWORD = process.env.DASHBOARD_PASSWORD || 'amazon123';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const KB_FILE = path.join(__dirname, 'knowledge-base.txt');

app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  res.json({ success: password === PASSWORD });
});

app.post('/api/kb/get', (req, res) => {
  const { password } = req.body;
  if (password !== PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const content = fs.existsSync(KB_FILE) ? fs.readFileSync(KB_FILE, 'utf8') : '';
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Could not read knowledge base' });
  }
});

app.post('/api/kb/save', (req, res) => {
  const { password, content } = req.body;
  if (password !== PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  try {
    fs.writeFileSync(KB_FILE, content, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not save knowledge base' });
  }
});

app.post('/api/generate', async (req, res) => {
  const { password, topic, emailType, voiceLibrary } = req.body;
  if (password !== PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  let knowledgeBase = '';
  try {
    if (fs.existsSync(KB_FILE)) {
      knowledgeBase = fs.readFileSync(KB_FILE, 'utf8').trim();
    }
  } catch (err) {
    console.error('Could not load knowledge base:', err);
  }

  const typeInstructions = {
    story: `Write a STORYTELLING email. Lead with a vivid personal story from Eric's daily life (family, kids, real moments). Hyper-specific details. Pivot naturally to a business lesson about the Amazon Influencer Program. Soft sell at the end. Story = 70% of the email.`,
    howto: `Write a HOW-TO / INSTRUCTIONAL email. Clear, practical, direct. Break down a concept about the Amazon Influencer Program. Short punchy lines. Clear next step or CTA at the end.`,
    promotional: `Write a PROMOTIONAL email. Bold hook about money or opportunity. Everyday relatable examples. Build excitement without pressure. End with [CTA LINK] placeholder.`
  };

  const systemPrompt = `You are Eric's personal email copywriter. Write emails that sound EXACTLY like Eric — not AI, not a marketer. Eric.

ERIC'S VOICE:
- Short punchy lines. One idea per line. White space everywhere.
- Hyper-specific real details (real numbers, times, places)
- Parenthetical asides for humor: (he gets angry easily), (to be fair...)
- Natural pivot from personal story to business lesson — never forced
- Rhythmic repetition in threes: "think and think and think"
- Self-aware humor. Never preachy. Makes the point and gets out.
- Always ends: Cheers,\nEric
- NEVER uses: leverage, utilize, dive into, game-changing, transform, unlock
- CRITICAL FORMATTING: Every sentence or short thought is its own paragraph separated by a blank line. No walls of text.

ERIC'S PAST EMAILS (voice reference):
${voiceLibrary}
${knowledgeBase ? `\n\nERIC'S BUSINESS KNOWLEDGE BASE:\nUse specific facts, results, numbers, and details from here when relevant to make emails more credible and specific:\n${knowledgeBase}` : ''}

Return ONLY valid JSON, no markdown:
{"subject":"subject line","body":"email body with \\n\\n between every paragraph"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `${typeInstructions[emailType] || typeInstructions.story}\n\nTopic/angle: ${topic}` }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const parsed = JSON.parse(text.substring(start, end + 1));
    res.json(parsed);
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Failed to generate.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Email Dashboard running on port ${PORT}`));
