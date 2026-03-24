
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SavedPrompt } from '../types';
import CodeBlock from './CodeBlock';
import TrashIcon from './icons/TrashIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import { getSavedPromptSourceLabel, resolveLanguage } from '../i18n';

interface SavedPromptCardProps {
    promptData: SavedPrompt;
    onLoad: (prompt: SavedPrompt) => void;
    onDelete: (id: string) => void;
}

const SavedPromptCard: React.FC<SavedPromptCardProps> = ({ promptData, onLoad, onDelete }) => {
    const { t, i18n } = useTranslation();
    const language = resolveLanguage(i18n.resolvedLanguage);
    const savedAt = new Date(promptData.savedAt).toLocaleString(language);
    const sourceLabel = getSavedPromptSourceLabel(promptData, t);

    return (
        <div className="p-2.5 bg-white border border-gray-200 space-y-1.5">
            <div className="space-y-1">
                <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-600">{t('saved.source')}</span> {sourceLabel}
                </p>
                {promptData.details && (
                    <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600">{t('saved.result')}</span> {promptData.details}
                    </p>
                )}
                <p className="text-xs text-gray-400">
                    {t('saved.savedOn')} {savedAt}
                </p>
            </div>
            <CodeBlock content={promptData.prompt} />
            <div className="flex items-center justify-end space-x-1.5 pt-1">
                 <button 
                    onClick={() => onDelete(promptData.id)}
                    className="flex items-center space-x-1 px-1.5 py-0.5 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    aria-label={t('saved.deleteAria', { savedAt })}
                >
                    <TrashIcon className="w-3 h-3" />
                    <span>{t('saved.delete')}</span>
                </button>
                <button 
                    onClick={() => onLoad(promptData)}
                    className="flex items-center space-x-1 px-1.5 py-0.5 text-[11px] font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 transition-colors"
                    aria-label={t('saved.loadAria', { savedAt })}
                >
                    <ArrowPathIcon className="w-3 h-3" />
                    <span>{t('saved.load')}</span>
                </button>
            </div>
        </div>
    );
};


interface SavedPromptsPanelProps {
    prompts: SavedPrompt[];
    onLoad: (prompt: SavedPrompt) => void;
    onDelete: (id: string) => void;
}

const SavedPromptsPanel: React.FC<SavedPromptsPanelProps> = ({ prompts, onLoad, onDelete }) => {
    const { t } = useTranslation();
    return (
        <>
            <div className="p-2.5 border-b border-gray-200 bg-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">{t('saved.title')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {prompts.length > 0 ? (
                    prompts.map(p => (
                        <SavedPromptCard 
                            key={p.id}
                            promptData={p}
                            onLoad={onLoad}
                            onDelete={onDelete}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>{t('saved.empty')}</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default SavedPromptsPanel;
