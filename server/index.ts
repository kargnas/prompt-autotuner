import express from 'express';
import cors from 'cors';
import { resolveConfig } from './config';
import { loadSavedPrompts, writeSavedPrompts } from './storage';

const config = resolveConfig();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (!config.openrouterApiKey) {
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
        Authorization: `Bearer ${config.openrouterApiKey}`,
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

app.get('/api/storage/config', (_req, res) => {
  res.json({ backend: config.storageBackend });
});

app.get('/api/storage/prompts', (_req, res) => {
  if (config.storageBackend !== 'file') {
    return res.json({ backend: 'localstorage', prompts: null });
  }

  try {
    const prompts = loadSavedPrompts();
    res.json({ backend: 'file', prompts });
  } catch (err) {
    console.error('Failed to read saved prompts:', err);
    res.status(500).json({ error: 'Failed to read saved prompts' });
  }
});

app.put('/api/storage/prompts', (req, res) => {
  if (config.storageBackend !== 'file') {
    return res.status(400).json({ error: 'File storage not enabled' });
  }

  try {
    const { prompts } = req.body;
    if (!Array.isArray(prompts) || prompts.length > 1000) {
      return res.status(400).json({ error: 'Invalid prompts array' });
    }
    for (const p of prompts) {
      if (typeof p.id !== 'string' || !p.id || !/^[\w-]+$/.test(p.id)) {
        return res.status(400).json({ error: `Invalid prompt id: ${p.id}` });
      }
    }
    writeSavedPrompts(prompts);
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to write saved prompts:', err);
    res.status(500).json({ error: 'Failed to write saved prompts' });
  }
});

const MAX_PORT_RETRIES = 10;

function listen(port: number, attempt = 0): void {
  const server = app.listen(port, () => {
    console.log(`API server running on :${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      if (config.apiPortExplicit) {
        const reason = process.env._PORT_PRERESOLVED === '1'
          ? `Port ${port} became unavailable after pre-resolution (race condition).`
          : `Port ${port} is in use and API_PORT is explicitly configured.`;
        console.error(reason);
        process.exit(1);
      }
      if (attempt < MAX_PORT_RETRIES) {
        console.warn(`Port ${port} is in use, trying ${port + 1}...`);
        listen(port + 1, attempt + 1);
        return;
      }
    }
    console.error('Failed to start API server:', err.message);
    process.exit(1);
  });
}

listen(config.apiPort);
