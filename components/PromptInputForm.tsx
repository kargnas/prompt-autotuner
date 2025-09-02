
import React from 'react';
import CodeBracketIcon from './icons/CodeBracketIcon';
import TrashIcon from './icons/TrashIcon';
import WandIcon from './icons/WandIcon';
import PlusIcon from './icons/PlusIcon';
import XCircleIcon from './icons/XCircleIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import BookmarkSolidIcon from './icons/BookmarkSolidIcon';
import type { TestCase, SavedPrompt } from '../types';
import { translations } from '../translations';

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
  language: 'en' | 'ko';
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center space-x-2">
        {children}
    </label>
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea
        {...props}
        className={`w-full p-2 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm text-gray-900 placeholder-gray-400 ${className || ''}`}
    />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input
        {...props}
        className={`w-full p-1.5 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm text-gray-900 placeholder-gray-400 ${className || ''}`}
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
    isPromptSaved,
    language
}) => {
  const t = translations[language].inputForm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent submission while loading
    if (testCases.length === 0) {
        alert("Please add at least one test case.");
        return;
    }
    onSubmit();
  };
  
  const isInitialPromptSaved = isPromptSaved(initialPrompt);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:h-full flex flex-col overflow-hidden">
      <div>
        <Label htmlFor="initial-prompt">
          <span>{t.initialPromptLabel}</span>
            <button 
                type="button" 
                onClick={() => onToggleSavePrompt({ prompt: initialPrompt, source: 'Initial Prompt', testCases })}
                disabled={isLoading}
                className={`ml-auto p-1 transition-colors disabled:opacity-50 ${isInitialPromptSaved ? 'text-cyan-600' : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'}`}
                aria-label={isInitialPromptSaved ? t.unsaveInitial : t.saveInitial}
                aria-pressed={isInitialPromptSaved}
            >
                {isInitialPromptSaved ? <BookmarkSolidIcon className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
            </button>
        </Label>
        <TextArea
          id="initial-prompt"
          value={initialPrompt}
          onChange={(e) => onInitialPromptChange(e.target.value)}
          placeholder={t.initialPromptPlaceholder}
          required
          rows={4}
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Label htmlFor="refinement-direction">{t.refinementDirectionLabel}</Label>
        <p className="text-xs text-gray-500 mb-2">{t.refinementDirectionHelp}</p>
        <TextArea
            id="refinement-direction"
            value={refinementDirection}
            onChange={(e) => onRefinementDirectionChange(e.target.value)}
            placeholder={t.refinementDirectionPlaceholder}
            rows={2}
            disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="generation-model-selector">{t.generationModelLabel}</Label>
        <p className="text-xs text-gray-500 mb-2">{t.generationModelHelp}</p>
        <select
            id="generation-model-selector"
            value={generationModel}
            onChange={(e) => onGenerationModelChange(e.target.value)}
            disabled={isLoading}
            className="w-full p-2 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm text-gray-900"
        >
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
    </div>

    <div>
        <Label htmlFor="evaluation-model-selector">{t.evaluationModelLabel}</Label>
        <p className="text-xs text-gray-500 mb-2">{t.evaluationModelHelp}</p>
        <select
            id="evaluation-model-selector"
            value={evaluationModel}
            onChange={(e) => onEvaluationModelChange(e.target.value)}
            disabled={isLoading}
            className="w-full p-2 bg-white border border-gray-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm text-gray-900"
        >
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
    </div>

    <div>
        <Label htmlFor="max-attempts">{t.maxAttemptsLabel}</Label>
        <p className="text-xs text-gray-500 mb-2">{t.maxAttemptsHelp}</p>
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

      <div className="space-y-3 flex flex-col md:flex-1 md:min-h-0">
        <Label>
            <CodeBracketIcon className="w-5 h-5" />
            <span>{t.testCasesLabel}</span>
        </Label>
        <div className="space-y-3 p-3 border border-gray-200 bg-gray-50/50 flex-1 overflow-y-auto">
            {testCases.map((tc, index) => (
                <div key={tc.id} className="p-3 bg-white border border-gray-200 relative">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-gray-600 text-sm">{t.testCase} #{index + 1}</p>
                        <div className="flex items-center text-xs border border-gray-300 p-0.5 bg-white">
                           <button 
                                type="button"
                                onClick={() => onTestCaseTypeChange(tc.id, 'positive')}
                                className={`px-2 py-0.5 transition-colors ${tc.type === 'positive' ? 'bg-cyan-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-pressed={tc.type === 'positive'}
                                disabled={isLoading}
                           >
                                {t.positive}
                           </button>
                           <button 
                                type="button"
                                onClick={() => onTestCaseTypeChange(tc.id, 'negative')}
                                className={`px-2 py-0.5 transition-colors ${tc.type === 'negative' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                aria-pressed={tc.type === 'negative'}
                                disabled={isLoading}
                           >
                                {t.negative}
                           </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                           <label className="block text-xs font-medium text-gray-500">{t.variables}</label>
                            {tc.variables.map((variable) => (
                                <div key={variable.id} className="p-2 space-y-1.5 bg-gray-50 border border-gray-200">
                                    <div className="flex items-center space-x-1.5">
                                        <Input
                                            type="text"
                                            placeholder="key"
                                            value={variable.key}
                                            onChange={(e) => onVariableChange(tc.id, variable.id, 'key', e.target.value)}
                                            className="font-mono !text-xs"
                                            disabled={isLoading}
                                        />
                                        <button type="button" onClick={() => onRemoveVariable(tc.id, variable.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 disabled:opacity-50 flex-shrink-0" aria-label="Remove variable" disabled={isLoading || tc.variables.length <= 1}>
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <TextArea
                                        placeholder="value"
                                        value={variable.value}
                                        onChange={(e) => onVariableChange(tc.id, variable.id, 'value', e.target.value)}
                                        className="!text-xs"
                                        disabled={isLoading}
                                        rows={3}
                                    />
                                </div>
                            ))}
                            <button type="button" onClick={() => onAddVariable(tc.id)} className="flex items-center space-x-1 text-xs text-cyan-600 hover:text-cyan-700 pt-0.5 disabled:opacity-50" disabled={isLoading}>
                                <PlusIcon className="w-3.5 h-3.5"/>
                                <span>{t.addVariable}</span>
                            </button>
                        </div>
                        <div>
                             <label htmlFor={`expected-${tc.id}`} className="block text-xs font-medium text-gray-500 mb-1">
                                {tc.type === 'positive' ? t.desiredOutput : t.forbiddenOutput}
                             </label>
                            <TextArea
                                id={`expected-${tc.id}`}
                                value={tc.expectedOutput}
                                onChange={(e) => onTestCaseOutputChange(tc.id, e.target.value)}
                                placeholder={tc.type === 'positive' ? t.desiredOutputPlaceholder : t.forbiddenOutputPlaceholder}
                                required
                                rows={3}
                                className="!text-xs"
                                disabled={isLoading}
                            />
                        </div>
                         <div>
                             <label htmlFor={`reason-${tc.id}`} className="block text-xs font-medium text-gray-500 mb-1">
                                {t.requirementLabel}
                             </label>
                            <TextArea
                                id={`reason-${tc.id}`}
                                value={tc.detailedReason || ''}
                                onChange={(e) => onTestCaseDetailedReasonChange(tc.id, e.target.value)}
                                placeholder={
                                    tc.type === 'positive' 
                                    ? t.requirementPlaceholderPos
                                    : t.requirementPlaceholderNeg
                                }
                                rows={2}
                                className="!text-xs"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                     {testCases.length > 0 && (
                        <button type="button" onClick={() => onRemoveTestCase(tc.id)} className="absolute top-1.5 right-1.5 p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 disabled:opacity-50" aria-label="Remove test case" disabled={isLoading}>
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
            <div className="flex flex-col items-center pt-2 space-y-2">
                <div className="flex items-center justify-center space-x-4">
                    <button type="button" onClick={onAddTestCase} className="text-cyan-600 hover:text-cyan-700 font-medium text-sm disabled:text-gray-400" disabled={isLoading}>
                        {t.addTestCase}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDiversify('positive')}
                        disabled={isDiversifying || isLoading || testCases.length === 0}
                        className="flex items-center space-x-2 text-cyan-600 hover:text-cyan-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <WandIcon className="w-4 h-4" />
                        <span>{isDiversifying && diversificationType === 'positive' ? t.working : t.diversifyPos}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDiversify('negative')}
                        disabled={isDiversifying || isLoading || testCases.length === 0}
                        className="flex items-center space-x-2 text-red-500 hover:text-red-600 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <WandIcon className="w-4 h-4" />
                        <span>{isDiversifying && diversificationType === 'negative' ? t.working : t.diversifyNeg}</span>
                    </button>
                </div>
                 <div className="w-full max-w-sm">
                    <Input
                        type="text"
                        placeholder={t.diversifyHint}
                        value={diversificationDirection}
                        onChange={(e) => onDiversificationDirectionChange(e.target.value)}
                        disabled={isDiversifying || isLoading || testCases.length === 0}
                        aria-label="Diversification hint"
                        className="!text-xs text-center"
                    />
                </div>
            </div>
        </div>
      </div>

      {isLoading ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-red-500"
        >
          <XCircleIcon className="w-5 h-5 mr-2"/>
          {t.cancel}
        </button>
      ) : (
        <button
          type="submit"
          disabled={isDiversifying}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {t.startRefining}
        </button>
      )}
    </form>
  );
};

export default PromptInputForm;
