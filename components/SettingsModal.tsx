
import React, { useState, useEffect } from 'react';
import XCircleIcon from './icons/XCircleIcon';
import { NO_FEW_SHOT_RULE, POSITIVE_FEW_SHOT_RULE, PERMISSIVE_FEW_SHOT_RULE } from '../constants';
import { translations, type Language } from '../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGuide: string;
  currentNegativeRule: string;
  onSave: (guide: string, negativeRule: string) => void;
  onRestoreDefaults: () => void;
  language: Language;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentGuide,
  currentNegativeRule,
  onSave,
  onRestoreDefaults,
  language
}) => {
  const [guide, setGuide] = useState(currentGuide);
  const [negativeRule, setNegativeRule] = useState(currentNegativeRule);
  const t = translations[language].settings;

  useEffect(() => {
    setGuide(currentGuide);
    setNegativeRule(currentNegativeRule);
  }, [isOpen, currentGuide, currentNegativeRule]);

  if (!isOpen) {
    return null;
  }
  
  const handleSave = () => {
    onSave(guide, negativeRule);
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-white shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="settings-title" className="text-lg font-semibold text-gray-900">
            {t.title}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100" aria-label={translations[language].common.closeSettings}>
            <XCircleIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label htmlFor="prompt-guide" className="block text-sm font-medium text-gray-700 mb-2">
              {t.guideLabel}
            </label>
            <textarea
              id="prompt-guide"
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              rows={15}
              className="w-full p-2 bg-gray-50 border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm text-gray-900 placeholder-gray-400 font-mono"
              aria-describedby="prompt-guide-description"
            />
            <p id="prompt-guide-description" className="mt-2 text-xs text-gray-500">
              {t.guideDesc}
            </p>
          </div>

          <div>
            <label htmlFor="refinement-rule" className="block text-sm font-medium text-gray-700 mb-2">
                {t.strategyLabel}
            </label>
            <div className="flex space-x-2 mb-2">
                <button
                    type="button"
                    onClick={() => setNegativeRule(NO_FEW_SHOT_RULE)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
                >
                    {t.forbidFewShot}
                </button>
                <button
                    type="button"
                    onClick={() => setNegativeRule(POSITIVE_FEW_SHOT_RULE)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
                >
                    {t.allowPositive}
                </button>
                 <button
                    type="button"
                    onClick={() => setNegativeRule(PERMISSIVE_FEW_SHOT_RULE)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
                >
                    {t.allowPermissive}
                </button>
            </div>
            <textarea
                id="refinement-rule"
                value={negativeRule}
                onChange={(e) => setNegativeRule(e.target.value)}
                rows={4}
                className="w-full p-2 bg-gray-50 border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm text-gray-900 placeholder-gray-400 font-mono"
                aria-describedby="refinement-rule-description"
            />
            <p id="refinement-rule-description" className="mt-2 text-xs text-gray-500">
                {t.strategyDesc}
            </p>
          </div>
        </main>
        
        <footer className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onRestoreDefaults}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
          >
            {t.restoreDefaults}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500"
          >
            {t.saveClose}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
