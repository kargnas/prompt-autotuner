
import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeBracketIcon from './icons/CodeBracketIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import SparklesIcon from './icons/SparklesIcon';
import BookmarkIcon from './icons/BookmarkIcon';

type View = 'setup' | 'process' | 'result' | 'saved';

interface MobileNavProps {
  activeView: View;
  onViewChange: (view: View) => void;
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
            className={`flex-1 flex flex-col items-center justify-center p-1.5 text-[11px] transition-colors ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon}
            <span className="mt-0.5">{label}</span>
        </button>
    );
};

const MobileNav: React.FC<MobileNavProps> = ({ activeView, onViewChange }) => {
  const { t } = useTranslation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 flex bg-white border-t border-gray-200 shadow-lg z-20">
      <NavButton
        isActive={activeView === 'setup'}
        onClick={() => onViewChange('setup')}
        icon={<CodeBracketIcon className="w-4 h-4" />}
        label={t('nav.setup')}
      />
      <NavButton
        isActive={activeView === 'process'}
        onClick={() => onViewChange('process')}
        icon={<ListBulletIcon className="w-4 h-4" />}
        label={t('nav.process')}
      />
      <NavButton
        isActive={activeView === 'result'}
        onClick={() => onViewChange('result')}
        icon={<SparklesIcon className="w-4 h-4" />}
        label={t('nav.result')}
      />
       <NavButton
        isActive={activeView === 'saved'}
        onClick={() => onViewChange('saved')}
        icon={<BookmarkIcon className="w-4 h-4" />}
        label={t('nav.saved')}
      />
    </nav>
  );
};

export default MobileNav;
