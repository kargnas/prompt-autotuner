
import React from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';
import GearIcon from './icons/GearIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import { LANGUAGE_LABELS, resolveLanguage } from '../i18n';
import { SUPPORTED_LANGUAGES } from '../translations';

interface HeaderProps {
  onOpenSettings: () => void;
  onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onReset }) => {
  const { t, i18n } = useTranslation();
  const language = resolveLanguage(i18n.resolvedLanguage);

  return (
    <header className="py-3 px-4 border-b border-gray-200 bg-white z-10 flex items-center justify-between">
      {/* On desktop, this div acts as a spacer to center the title. On mobile, it's effectively gone. */}
      <div className="hidden md:flex md:flex-1"></div>
      
      {/* Title container: centered on desktop, left-aligned on mobile */}
      <div className="flex items-center space-x-2 md:flex-1 md:justify-center">
        <SparklesIcon className="w-6 h-6 text-cyan-500" />
        <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-cyan-500 whitespace-nowrap">
          {t('header.title')}
        </h1>
      </div>

      {/* Buttons container: right-aligned */}
      <div className="flex items-center justify-end md:flex-1 space-x-2">
        <div className="flex bg-gray-100 rounded-md p-0.5 border border-gray-200">
          {SUPPORTED_LANGUAGES.map((code) => (
            <button
              key={code}
              onClick={() => {
                void i18n.changeLanguage(code);
              }}
              className={`px-2 py-1 text-xs font-medium rounded ${language === code ? 'bg-white shadow-sm text-cyan-700' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {LANGUAGE_LABELS[code]}
            </button>
          ))}
        </div>

        <button 
          onClick={onReset} 
          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={t('header.reset')}
          title={t('header.reset')}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenSettings} 
          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={t('header.settings')}
          title={t('header.settings')}
        >
          <GearIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
