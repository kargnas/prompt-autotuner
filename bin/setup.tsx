/**
 * Interactive API key setup using Ink CLI
 */
import React, { useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { execSync } from 'child_process';

type Mode = 'detect' | 'select' | 'manual' | 'done';

interface ApiKeySetupProps {
  onComplete: (key: string) => void;
}

function detectEnvKeys(): Array<{ label: string; value: string; key: string }> {
  try {
    const output = execSync('export | grep -i openrouter || env | grep -i openrouter', {
      shell: '/bin/bash',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const results: Array<{ label: string; value: string; key: string }> = [];
    for (const line of output.split('\n')) {
      // match: export KEY="VALUE" or KEY=VALUE
      const m = line.match(/(?:export\s+)?([A-Z_]+OPENROUTER[A-Z_]*)=["']?([^"'\s]+)["']?/i)
               || line.match(/(?:export\s+)?([A-Z_]*OPENROUTER[A-Z_]*)=["']?([^"'\s]+)["']?/i);
      if (m) {
        const [, name, val] = m;
        if (val && val.length > 4) {
          results.push({
            label: `${name}  (${val.slice(0, 6)}...${val.slice(-4)})`,
            value: val,
            key: name,
          });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const { exit } = useApp();
  const detected = detectEnvKeys();
  const hasDetected = detected.length > 0;

  const initialMode: Mode = hasDetected ? 'select' : 'manual';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [manualInput, setManualInput] = useState('');

  const selectItems = [
    ...detected,
    { label: '✏️  Enter manually', value: '__manual__', key: '' },
  ];

  const handleSelect = (item: { value: string }) => {
    if (item.value === '__manual__') {
      setMode('manual');
    } else {
      onComplete(item.value);
      exit();
    }
  };

  const handleManualSubmit = (val: string) => {
    if (!val.trim()) return;
    onComplete(val.trim());
    exit();
  };

  useInput((input, key) => {
    if (key.escape) {
      process.exit(1);
    }
  });

  if (mode === 'select') {
    return (
      <Box flexDirection="column" marginY={1}>
        <Text bold color="yellow">
          🔑  OPENROUTER_API_KEY not set.
        </Text>
        <Text dimColor>Found matching environment variables — select one to use:</Text>
        <Box marginTop={1}>
          <SelectInput items={selectItems} onSelect={handleSelect} />
        </Box>
        <Text dimColor>↑↓ navigate  ↵ select  ESC quit</Text>
      </Box>
    );
  }

  if (mode === 'manual') {
    return (
      <Box flexDirection="column" marginY={1}>
        <Text bold color="yellow">
          🔑  Enter your OpenRouter API key:
        </Text>
        <Text dimColor>
          Get one at <Text color="cyan">https://openrouter.ai</Text>
        </Text>
        <Box marginTop={1}>
          <Text>› </Text>
          <TextInput
            value={manualInput}
            onChange={setManualInput}
            onSubmit={handleManualSubmit}
            mask="*"
          />
        </Box>
        <Text dimColor>↵ confirm  ESC quit</Text>
      </Box>
    );
  }

  return null;
}

export async function promptApiKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    const { unmount } = render(
      <ApiKeySetup
        onComplete={(key) => {
          unmount();
          resolve(key);
        }}
      />,
    );
  });
}
