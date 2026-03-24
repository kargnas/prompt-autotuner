import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClipboardIcon from './icons/ClipboardIcon';
const CodeBlock: React.FC<{ content: string }> = ({ content }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <pre className="bg-gray-100 p-2 text-[11px] text-gray-800 relative overflow-x-auto whitespace-pre-wrap">
            <code>{content}</code>
            <button
                onClick={handleCopy}
                className="absolute top-1 right-1 p-0.5 bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
                aria-label={t('common.copyToClipboard')}
            >
                {copied ? <span className="text-[11px] px-1">{t('common.copied')}</span> : <ClipboardIcon className="w-3 h-3" />}
            </button>
        </pre>
    );
};

export default CodeBlock;
