import React, { useState } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import { translations, type Language } from '../translations';

interface CodeBlockProps {
    content: string;
    language: Language;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content, language }) => {
    const [copied, setCopied] = useState(false);
    const t = translations[language].common;

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <pre className="bg-gray-100 p-2.5 text-xs text-gray-800 relative overflow-x-auto whitespace-pre-wrap">
            <code>{content}</code>
            <button
                onClick={handleCopy}
                className="absolute top-1.5 right-1.5 p-1 bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
                aria-label={t.copyToClipboard}
            >
                {copied ? <span className="text-xs px-1">{t.copied}</span> : <ClipboardIcon className="w-3.5 h-3.5" />}
            </button>
        </pre>
    );
};

export default CodeBlock;
