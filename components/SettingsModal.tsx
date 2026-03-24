
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import XCircleIcon from './icons/XCircleIcon';
import { NO_FEW_SHOT_RULE, POSITIVE_FEW_SHOT_RULE, PERMISSIVE_FEW_SHOT_RULE } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGuide: string;
  currentNegativeRule: string;
  onSave: (guide: string, negativeRule: string) => void;
  onRestoreDefaults: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentGuide,
  currentNegativeRule,
  onSave,
  onRestoreDefaults
}) => {
  const [guide, setGuide] = useState(currentGuide);
  const [negativeRule, setNegativeRule] = useState(currentNegativeRule);
  const { t } = useTranslation();

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
        className="bg-white shadow-xl w-full max-w-xl flex flex-col max-h-[90vh] border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 id="settings-title" className="text-sm font-semibold text-gray-900">
            {t('settings.title')}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100" aria-label={t('common.closeSettings')}>
            <XCircleIcon className="w-5 h-5" />
          </button>
        </header>
        
        <main className="p-3 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="prompt-guide" className="block text-xs font-medium text-gray-700 mb-1.5">
              {t('settings.guideLabel')}
            </label>
            <textarea
              id="prompt-guide"
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              rows={15}
              className="w-full p-1.5 bg-gray-50 border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-xs text-gray-900 placeholder-gray-400 font-mono"
              aria-describedby="prompt-guide-description"
            />
            <p id="prompt-guide-description" className="mt-1.5 text-[11px] text-gray-500">
              {t('settings.guideDesc')}
            </p>
          </div>

          <div>
            <label htmlFor="refinement-rule" className="block text-xs font-medium text-gray-700 mb-1.5">
                {t('settings.strategyLabel')}
            </label>
            <div className="flex space-x-1.5 mb-1.5">
                <button
                    type="button"
                    onClick={() => setNegativeRule(NO_FEW_SHOT_RULE)}
                    className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
                >
                    {t('settings.forbidFewShot')}
                </button>
                <button
                    type="button"
                    onClick={() => setNegativeRule(POSITIVE_FEW_SHOT_RULE)}
                    className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
                >
                    {t('settings.allowPositive')}
                </button>
                 <button
                    type="button"
                    onClick={() => setNegativeRule(PERMISSIVE_FEW_SHOT_RULE)}
                    className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
                >
                    {t('settings.allowPermissive')}
                </button>
            </div>
            <textarea
                id="refinement-rule"
                value={negativeRule}
                onChange={(e) => setNegativeRule(e.target.value)}
                rows={4}
                className="w-full p-1.5 bg-gray-50 border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-xs text-gray-900 placeholder-gray-400 font-mono"
                aria-describedby="refinement-rule-description"
            />
            <p id="refinement-rule-description" className="mt-1.5 text-[11px] text-gray-500">
                {t('settings.strategyDesc')}
            </p>
          </div>
        </main>
        
        <footer className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onRestoreDefaults}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-400"
          >
            {t('settings.restoreDefaults')}
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500"
          >
            {t('settings.saveClose')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;
