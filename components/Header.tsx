
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import GearIcon from './icons/GearIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import { translations } from '../translations';

interface HeaderProps {
  onOpenSettings: () => void;
  onReset: () => void;
  language: 'en' | 'ko';
  onLanguageChange: (lang: 'en' | 'ko') => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onReset, language, onLanguageChange }) => {
  const t = translations[language].header;

  return (
    <header className="py-3 px-4 border-b border-gray-200 bg-white z-10 flex items-center justify-between">
      {/* On desktop, this div acts as a spacer to center the title. On mobile, it's effectively gone. */}
      <div className="hidden md:flex md:flex-1"></div>
      
      {/* Title container: centered on desktop, left-aligned on mobile */}
      <div className="flex items-center space-x-2 md:flex-1 md:justify-center">
        <SparklesIcon className="w-6 h-6 text-cyan-500" />
        <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-cyan-500 whitespace-nowrap">
          {t.title}
        </h1>
      </div>

      {/* Buttons container: right-aligned */}
      <div className="flex items-center justify-end md:flex-1 space-x-2">
        <div className="flex bg-gray-100 rounded-md p-0.5 border border-gray-200">
            <button 
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs font-medium rounded ${language === 'en' ? 'bg-white shadow-sm text-cyan-700' : 'text-gray-500 hover:text-gray-900'}`}
            >
                EN
            </button>
            <button 
                 onClick={() => onLanguageChange('ko')}
                 className={`px-2 py-1 text-xs font-medium rounded ${language === 'ko' ? 'bg-white shadow-sm text-cyan-700' : 'text-gray-500 hover:text-gray-900'}`}
            >
                KO
            </button>
        </div>

        <button 
          onClick={onReset} 
          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={t.reset}
          title={t.reset}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenSettings} 
          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={t.settings}
          title={t.settings}
        >
          <GearIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
