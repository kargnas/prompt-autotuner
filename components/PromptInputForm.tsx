
import React from 'react';
import { useTranslation } from 'react-i18next';
import CodeBracketIcon from './icons/CodeBracketIcon';
import TrashIcon from './icons/TrashIcon';
import WandIcon from './icons/WandIcon';
import PlusIcon from './icons/PlusIcon';
import XCircleIcon from './icons/XCircleIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import BookmarkSolidIcon from './icons/BookmarkSolidIcon';
import type { TestCase, SavedPrompt } from '../types';

interface PromptInputFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  initialPrompt: string;
  onInitialPromptChange: (value: string) => void;
  refinementDirection: string;
  onRefinementDirectionChange: (value: string) => void;
  generationModel: string;
  onGenerationModelChange: (value: string) => void;
  evaluationModel: string;
  onEvaluationModelChange: (value: string) => void;
  maxAttempts: number;
  onMaxAttemptsChange: (value: number) => void;
  availableModels: string[];
  testCases: TestCase[];
  onAddTestCase: () => void;
  onRemoveTestCase: (id: string) => void;
  onTestCaseOutputChange: (id: string, value: string) => void;
  onTestCaseDetailedReasonChange: (id: string, value: string) => void;
  onTestCaseTypeChange: (id: string, type: 'positive' | 'negative') => void;
  onAddVariable: (testCaseId: string) => void;
  onRemoveVariable: (testCaseId: string, variableId: string) => void;
  onVariableChange: (testCaseId: string, variableId: string, part: 'key' | 'value', text: string) => void;
  onDiversify: (type: 'positive' | 'negative') => void;
  isDiversifying: boolean;
  diversificationDirection: string;
  onDiversificationDirectionChange: (value: string) => void;
  diversificationType: 'positive' | 'negative' | null;
  onToggleSavePrompt: (data: Omit<SavedPrompt, 'id' | 'savedAt'>) => void;
  isPromptSaved: (promptText: string) => boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-700 mb-1 flex items-center space-x-1.5">
        {children}
    </label>
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea
        {...props}
        className={`w-full p-1.5 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-xs text-gray-900 placeholder-gray-400 ${className || ''}`}
    />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input
        {...props}
        className={`w-full p-1.5 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-xs text-gray-900 placeholder-gray-400 ${className || ''}`}
    />
);

const PromptInputForm: React.FC<PromptInputFormProps> = ({ 
    onSubmit, 
    onCancel,
    isLoading,
    initialPrompt,
    onInitialPromptChange,
    refinementDirection,
    onRefinementDirectionChange,
    generationModel,
    onGenerationModelChange,
    evaluationModel,
    onEvaluationModelChange,
    maxAttempts,
    onMaxAttemptsChange,
    availableModels,
    testCases,
    onAddTestCase,
    onRemoveTestCase,
    onTestCaseOutputChange,
    onTestCaseDetailedReasonChange,
    onTestCaseTypeChange,
    onAddVariable,
    onRemoveVariable,
    onVariableChange,
    onDiversify,
    isDiversifying,
    diversificationDirection,
    onDiversificationDirectionChange,
    diversificationType,
    onToggleSavePrompt,
    isPromptSaved
}) => {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent submission while loading
    if (testCases.length === 0) {
        alert(t('inputForm.minOneTestCaseAlert'));
        return;
    }
    onSubmit();
  };
  
  const isInitialPromptSaved = isPromptSaved(initialPrompt);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:h-full flex flex-col overflow-hidden">
      <div>
        <Label htmlFor="initial-prompt">
          <span>{t('inputForm.initialPromptLabel')}</span>
            <button 
                type="button"
                onClick={() => onToggleSavePrompt({ prompt: initialPrompt, source: 'initialPrompt', testCases })}
                disabled={isLoading}
                className={`ml-auto p-0.5 transition-colors disabled:opacity-50 ${isInitialPromptSaved ? 'text-cyan-600' : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'}`}
                aria-label={isInitialPromptSaved ? t('inputForm.unsaveInitial') : t('inputForm.saveInitial')}
                aria-pressed={isInitialPromptSaved}
            >
                {isInitialPromptSaved ? <BookmarkSolidIcon className="w-3.5 h-3.5" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
            </button>
        </Label>
        <TextArea
          id="initial-prompt"
          value={initialPrompt}
          onChange={(e) => onInitialPromptChange(e.target.value)}
          placeholder={t('inputForm.initialPromptPlaceholder')}
          required
          rows={4}
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="refinement-direction">{t('inputForm.refinementDirectionLabel')}</Label>
        <p className="text-[11px] text-gray-500 mb-1.5">{t('inputForm.refinementDirectionHelp')}</p>
        <TextArea
            id="refinement-direction"
            value={refinementDirection}
            onChange={(e) => onRefinementDirectionChange(e.target.value)}
            placeholder={t('inputForm.refinementDirectionPlaceholder')}
            rows={2}
            disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="generation-model-selector">{t('inputForm.generationModelLabel')}</Label>
        <p className="text-[11px] text-gray-500 mb-1.5">{t('inputForm.generationModelHelp')}</p>
        <select
            id="generation-model-selector"
            value={generationModel}
            onChange={(e) => onGenerationModelChange(e.target.value)}
            disabled={isLoading}
            className="w-full p-1.5 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-xs text-gray-900"
        >
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
    </div>

    <div>
        <Label htmlFor="evaluation-model-selector">{t('inputForm.evaluationModelLabel')}</Label>
        <p className="text-[11px] text-gray-500 mb-1.5">{t('inputForm.evaluationModelHelp')}</p>
        <select
            id="evaluation-model-selector"
            value={evaluationModel}
            onChange={(e) => onEvaluationModelChange(e.target.value)}
            disabled={isLoading}
            className="w-full p-1.5 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-xs text-gray-900"
        >
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
    </div>

    <div>
        <Label htmlFor="max-attempts">{t('inputForm.maxAttemptsLabel')}</Label>
        <p className="text-[11px] text-gray-500 mb-1.5">{t('inputForm.maxAttemptsHelp')}</p>
        <Input
            type="number"
            id="max-attempts"
            value={maxAttempts}
            onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                    onMaxAttemptsChange(Math.max(1, value));
                }
            }}
            min="1"
            disabled={isLoading}
            className="w-full"
        />
    </div>

      <div className="space-y-2 flex flex-col md:flex-1 md:min-h-0">
        <Label>
            <CodeBracketIcon className="w-4 h-4" />
            <span>{t('inputForm.testCasesLabel')}</span>
        </Label>
        <div className="space-y-2 p-2.5 border border-gray-200 bg-gray-50/50 flex-1 overflow-y-auto">
            {testCases.map((tc, index) => (
                <div key={tc.id} className="p-2.5 bg-white border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="font-semibold text-gray-600 text-xs">{t('inputForm.testCase')} #{index + 1}</p>
                        <div className="flex items-center text-xs border border-gray-300 p-0.5 bg-white">
                           <button 
                                type="button"
                                onClick={() => onTestCaseTypeChange(tc.id, 'positive')}
                                className={`px-1.5 py-0.5 text-[11px] transition-colors ${tc.type === 'positive' ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-pressed={tc.type === 'positive'}
                                disabled={isLoading}
                           >
                                {t('inputForm.positive')}
                           </button>
                           <button 
                                type="button"
                                onClick={() => onTestCaseTypeChange(tc.id, 'negative')}
                                className={`px-1.5 py-0.5 text-[11px] transition-colors ${tc.type === 'negative' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-pressed={tc.type === 'negative'}
                                disabled={isLoading}
                           >
                                {t('inputForm.negative')}
                           </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="space-y-1.5">
                           <label className="block text-[11px] font-medium text-gray-500">{t('inputForm.variables')}</label>
                            {tc.variables.map((variable) => (
                                <div key={variable.id} className="p-1.5 space-y-1.5 bg-gray-50 border border-gray-200">
                                    <div className="flex items-center space-x-1.5">
                                        <Input
                                            type="text"
                                            placeholder={t('common.variableKeyPlaceholder')}
                                            value={variable.key}
                                            onChange={(e) => onVariableChange(tc.id, variable.id, 'key', e.target.value)}
                                            className="font-mono !text-xs"
                                            disabled={isLoading}
                                        />
                                        <button type="button" onClick={() => onRemoveVariable(tc.id, variable.id)} className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 disabled:opacity-50 flex-shrink-0" aria-label={t('common.removeVariable')} disabled={isLoading || tc.variables.length <= 1}>
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <TextArea
                                        placeholder={t('common.variableValuePlaceholder')}
                                        value={variable.value}
                                        onChange={(e) => onVariableChange(tc.id, variable.id, 'value', e.target.value)}
                                        className="!text-xs"
                                        disabled={isLoading}
                                        rows={3}
                                    />
                                </div>
                            ))}
                            <button type="button" onClick={() => onAddVariable(tc.id)} className="flex items-center space-x-1 text-[11px] text-cyan-600 hover:text-cyan-700 pt-0.5 disabled:opacity-50" disabled={isLoading}>
                                <PlusIcon className="w-3 h-3"/>
                                <span>{t('inputForm.addVariable')}</span>
                            </button>
                        </div>
                        <div>
                             <label htmlFor={`expected-${tc.id}`} className="block text-[11px] font-medium text-gray-500 mb-1">
                                {tc.type === 'positive' ? t('inputForm.desiredOutput') : t('inputForm.forbiddenOutput')}
                             </label>
                            <TextArea
                                id={`expected-${tc.id}`}
                                value={tc.expectedOutput}
                                onChange={(e) => onTestCaseOutputChange(tc.id, e.target.value)}
                                placeholder={tc.type === 'positive' ? t('inputForm.desiredOutputPlaceholder') : t('inputForm.forbiddenOutputPlaceholder')}
                                required
                                rows={3}
                                className="!text-xs"
                                disabled={isLoading}
                            />
                        </div>
                         <div>
                             <label htmlFor={`reason-${tc.id}`} className="block text-[11px] font-medium text-gray-500 mb-1">
                                {t('inputForm.requirementLabel')}
                             </label>
                            <TextArea
                                id={`reason-${tc.id}`}
                                value={tc.detailedReason || ''}
                                onChange={(e) => onTestCaseDetailedReasonChange(tc.id, e.target.value)}
                                placeholder={
                                    tc.type === 'positive' 
                                    ? t('inputForm.requirementPlaceholderPos')
                                    : t('inputForm.requirementPlaceholderNeg')
                                }
                                rows={2}
                                className="!text-xs"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                     {testCases.length > 0 && (
                        <button type="button" onClick={() => onRemoveTestCase(tc.id)} className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 disabled:opacity-50" aria-label={t('common.removeTestCase')} disabled={isLoading}>
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            ))}
            <div className="flex flex-col items-center pt-1.5 space-y-1.5">
                <div className="flex items-center justify-center space-x-3">
                    <button type="button" onClick={onAddTestCase} className="text-cyan-600 hover:text-cyan-700 font-medium text-xs disabled:text-gray-400" disabled={isLoading}>
                        {t('inputForm.addTestCase')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDiversify('positive')}
                        disabled={isDiversifying || isLoading || testCases.length === 0}
                        className="flex items-center space-x-1.5 text-cyan-600 hover:text-cyan-700 font-medium text-xs disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <WandIcon className="w-3.5 h-3.5" />
                        <span>{isDiversifying && diversificationType === 'positive' ? t('inputForm.working') : t('inputForm.diversifyPos')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDiversify('negative')}
                        disabled={isDiversifying || isLoading || testCases.length === 0}
                        className="flex items-center space-x-1.5 text-red-500 hover:text-red-600 font-medium text-xs disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <WandIcon className="w-3.5 h-3.5" />
                        <span>{isDiversifying && diversificationType === 'negative' ? t('inputForm.working') : t('inputForm.diversifyNeg')}</span>
                    </button>
                </div>
                 <div className="w-full max-w-xs">
                    <Input
                        type="text"
                        placeholder={t('inputForm.diversifyHint')}
                        value={diversificationDirection}
                        onChange={(e) => onDiversificationDirectionChange(e.target.value)}
                        disabled={isDiversifying || isLoading || testCases.length === 0}
                        aria-label={t('common.diversificationHintAria')}
                        className="!text-xs text-center"
                    />
                </div>
            </div>
        </div>
      </div>

      <button
        key={isLoading ? 'cancel-button' : 'submit-button'}
        type={isLoading ? 'button' : 'submit'}
        onClick={(e) => {
          if (!isLoading) {
            return;
          }

          e.preventDefault();
          onCancel();
        }}
        disabled={!isLoading && isDiversifying}
        className={`w-full flex justify-center items-center py-2 px-3 border border-transparent shadow-sm text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${
          isLoading
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
            : 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500 disabled:bg-gray-300 disabled:cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <XCircleIcon className="w-4 h-4 mr-1.5" />
            {t('inputForm.cancel')}
          </>
        ) : (
          t('inputForm.startRefining')
        )}
      </button>
    </form>
  );
};

export default PromptInputForm;
