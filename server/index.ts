import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY environment variable not set');
  process.exit(1);
}

app.post('/api/chat', async (req, res) => {
  const { model, messages, temperature, response_format } = req.body;

  try {
    const body: Record<string, unknown> = { model, messages };
    if (temperature !== undefined) body.temperature = temperature;
    if (response_format) body.response_format = response_format;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Auto Tuner',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OpenRouter error ${response.status}:`, errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('LLM call failed:', error);
    res.status(500).json({ error: 'LLM call failed' });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
app.listen(PORT, () => console.log(`API server running on :${PORT}`));
