
import React from 'react';
import CodeBracketIcon from './icons/CodeBracketIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import SparklesIcon from './icons/SparklesIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import { translations } from '../translations';

type View = 'setup' | 'process' | 'result' | 'saved';

interface MobileNavProps {
  activeView: View;
  onViewChange: (view: View) => void;
  language: 'en' | 'ko';
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, icon, label }) => {
    const activeClasses = 'text-cyan-600';
    const inactiveClasses = 'text-gray-500 hover:text-cyan-600';
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center p-2 text-xs transition-colors ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon}
            <span className="mt-1">{label}</span>
        </button>
    );
};

const MobileNav: React.FC<MobileNavProps> = ({ activeView, onViewChange, language }) => {
  const t = translations[language].nav;
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 flex bg-white border-t border-gray-200 shadow-lg z-20">
      <NavButton
        isActive={activeView === 'setup'}
        onClick={() => onViewChange('setup')}
        icon={<CodeBracketIcon className="w-5 h-5" />}
        label={t.setup}
      />
      <NavButton
        isActive={activeView === 'process'}
        onClick={() => onViewChange('process')}
        icon={<ListBulletIcon className="w-5 h-5" />}
        label={t.process}
      />
      <NavButton
        isActive={activeView === 'result'}
        onClick={() => onViewChange('result')}
        icon={<SparklesIcon className="w-5 h-5" />}
        label={t.result}
      />
       <NavButton
        isActive={activeView === 'saved'}
        onClick={() => onViewChange('saved')}
        icon={<BookmarkIcon className="w-5 h-5" />}
        label={t.saved}
      />
    </nav>
  );
};

export default MobileNav;
