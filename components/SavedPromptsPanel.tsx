
import React from 'react';
import type { SavedPrompt } from '../types';
import CodeBlock from './CodeBlock';
import TrashIcon from './icons/TrashIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import { translations } from '../translations';

interface SavedPromptCardProps {
    promptData: SavedPrompt;
    onLoad: (prompt: SavedPrompt) => void;
    onDelete: (id: string) => void;
    language: 'en' | 'ko';
}

const SavedPromptCard: React.FC<SavedPromptCardProps> = ({ promptData, onLoad, onDelete, language }) => {
    const t = translations[language].saved;

    return (
        <div className="p-3 bg-white border border-gray-200 space-y-2">
            <div className="space-y-1">
                <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-600">{t.source}</span> {promptData.source}
                </p>
                {promptData.details && (
                    <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600">{t.result}</span> {promptData.details}
                    </p>
                )}
                <p className="text-xs text-gray-400">
                    {t.savedOn} {new Date(promptData.savedAt).toLocaleString()}
                </p>
            </div>
            <CodeBlock content={promptData.prompt} />
            <div className="flex items-center justify-end space-x-2 pt-1">
                 <button 
                    onClick={() => onDelete(promptData.id)}
                    className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    aria-label={`${t.delete} prompt saved on ${new Date(promptData.savedAt).toLocaleString()}`}
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>{t.delete}</span>
                </button>
                <button 
                    onClick={() => onLoad(promptData)}
                    className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 transition-colors"
                    aria-label={`${t.load} prompt saved on ${new Date(promptData.savedAt).toLocaleString()}`}
                >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    <span>{t.load}</span>
                </button>
            </div>
        </div>
    );
};


interface SavedPromptsPanelProps {
    prompts: SavedPrompt[];
    onLoad: (prompt: SavedPrompt) => void;
    onDelete: (id: string) => void;
    language: 'en' | 'ko';
}

const SavedPromptsPanel: React.FC<SavedPromptsPanelProps> = ({ prompts, onLoad, onDelete, language }) => {
    const t = translations[language].saved;
    return (
        <>
            <div className="p-3 border-b border-gray-200 bg-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">{t.title}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {prompts.length > 0 ? (
                    prompts.map(p => (
                        <SavedPromptCard 
                            key={p.id}
                            promptData={p}
                            onLoad={onLoad}
                            onDelete={onDelete}
                            language={language}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>{t.empty}</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default SavedPromptsPanel;
