
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RefinementAttempt, TestCaseResult, SavedPrompt, TestCase } from '../types';
import CodeBlock from './CodeBlock';
import BookmarkIcon from './icons/BookmarkIcon';
import BookmarkSolidIcon from './icons/BookmarkSolidIcon';

const DiffViewer: React.FC<{ leftTitle: string; rightTitle: string; leftContent: string; rightContent: string; leftColor?: string; rightColor?: string; }> = ({ 
    leftTitle, 
    rightTitle, 
    leftContent, 
    rightContent,
    leftColor = 'gray',
    rightColor = 'gray'
}) => {
    const colorClasses = {
        gray: { text: 'text-gray-500', bg: 'bg-gray-100' },
        green: { text: 'text-green-600', bg: 'bg-green-50' },
        red: { text: 'text-red-600', bg: 'bg-red-50' },
        blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
    };

    return (
        <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
                <p className={`text-xs font-semibold ${colorClasses[leftColor]?.text || colorClasses.gray.text}`}>{leftTitle}</p>
                <pre className={`${colorClasses[leftColor]?.bg || colorClasses.gray.bg} p-2 text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap`}>
                    {leftContent}
                </pre>
            </div>
            <div>
                <p className={`text-xs font-semibold ${colorClasses[rightColor]?.text || colorClasses.gray.text}`}>{rightTitle}</p>
                <pre className={`${colorClasses[rightColor]?.bg || colorClasses.gray.bg} p-2 text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap`}>
                    {rightContent}
                </pre>
            </div>
        </div>
    );
}


const TestCaseResultDisplay: React.FC<{ result: TestCaseResult; index: number }> = ({ result, index }) => {
    const { t } = useTranslation();
    const isPassed = result.status === 'passed';
    const isNegative = result.testCase.type === 'negative';

    const leftTitle = isNegative ? t('inputForm.forbiddenOutput') : t('inputForm.desiredOutput');
    const leftColor = isNegative ? 'red' : 'green';
    const rightColor = isPassed ? 'green' : 'red';
    
    return (
        <div className="text-xs border-t border-gray-200 py-2">
            <div className="flex items-center justify-between">
                <span className="font-mono text-gray-500">{t('inputForm.testCase')} #{index + 1}</span>
                 <span className={`px-2 py-0.5 text-xs font-bold ${isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isPassed ? t('common.pass') : t('common.fail')}
                </span>
            </div>
            {result.evaluationReasoning && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-1">{t('process.evalReason')}</p>
                    <p className="text-xs text-gray-700 italic">"{result.evaluationReasoning}"</p>
                </div>
            )}
            
            <DiffViewer 
                leftTitle={leftTitle}
                rightTitle={t('common.actual')}
                leftContent={result.testCase.expectedOutput}
                rightContent={result.actualOutput}
                leftColor={leftColor}
                rightColor={rightColor}
            />

            {result.previousActualOutput && (
                <DiffViewer 
                    leftTitle={t('common.previousOutput')}
                    rightTitle={t('common.currentOutput')}
                    leftContent={result.previousActualOutput}
                    rightContent={result.actualOutput}
                    leftColor="gray"
                    rightColor={rightColor}
                />
            )}
        </div>
    );
};

interface AttemptDetailsProps {
    attempt: RefinementAttempt;
    testCases: TestCase[];
    onToggleSavePrompt: (data: Omit<SavedPrompt, 'id' | 'savedAt'>) => void;
    isPromptSaved: (promptText: string) => boolean;
}

const AttemptDetails: React.FC<AttemptDetailsProps> = ({ attempt, testCases, onToggleSavePrompt, isPromptSaved }) => {
    const [isExpanded, setIsExpanded] = useState(attempt.attempt === 1); // Expand first attempt by default
    const isSaved = isPromptSaved(attempt.prompt);
    const { t } = useTranslation();

    return (
        <div key={attempt.attempt} className={`p-3 border ${attempt.isSuccess ? 'border-green-400/50 bg-green-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-base">{t('process.attempt')} #{attempt.attempt}</h4>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => onToggleSavePrompt({
                            prompt: attempt.prompt,
                            source: 'attempt',
                            sourceAttempt: attempt.attempt,
                            details: attempt.details,
                            testCases: testCases
                        })}
                        className={`p-1.5 transition-colors ${isSaved ? 'text-cyan-600' : 'text-gray-400 hover:text-cyan-600 hover:bg-gray-100'}`}
                        aria-label={isSaved ? t('process.unsaveAttemptAria', { attempt: attempt.attempt }) : t('process.saveAttemptAria', { attempt: attempt.attempt })}
                        aria-pressed={isSaved}
                    >
                        {isSaved ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                    </button>
                    <span className="text-xs font-mono px-2 py-1 bg-gray-100 text-gray-600">{attempt.details}</span>
                </div>
            </div>
            
            <div className="mt-3 space-y-4">
                {attempt.refinementReasoning && (
                     <div>
                        <h5 className="text-sm font-semibold text-cyan-600 mb-1.5">{t('process.reason')}</h5>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 border border-gray-200 italic">
                            {attempt.refinementReasoning}
                        </p>
                    </div>
                )}

                {attempt.previousPrompt && (
                    <div className="opacity-70">
                        <p className="text-xs font-semibold text-gray-500 mb-1">{t('process.prevPrompt')} ({t('process.attempt')} #{attempt.attempt - 1})</p>
                        <CodeBlock content={attempt.previousPrompt} />
                    </div>
                )}
                
                <div>
                     <p className="text-xs font-semibold text-gray-800 mb-1">{attempt.previousPrompt ? `${t('process.refinedPrompt')} (${t('process.attempt')} #${attempt.attempt})` : t('process.initialPrompt')}</p>
                     <div className="border border-cyan-500/50 shadow-lg shadow-cyan-500/10">
                         <CodeBlock content={attempt.prompt} />
                     </div>
                </div>

                {attempt.testCaseResults.length > 0 && (
                    <div className="pt-2">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-cyan-600 hover:underline">
                            {isExpanded ? t('process.hideTests') : t('process.showTests')}
                        </button>
                         {isExpanded && (
                            <div className="mt-2 space-y-2">
                                {attempt.testCaseResults.map((result, index) => (
                                    <TestCaseResultDisplay key={result.testCase.id} result={result} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface RefinementDisplayProps {
    history: RefinementAttempt[];
    testCases: TestCase[];
    onToggleSavePrompt: (data: Omit<SavedPrompt, 'id' | 'savedAt'>) => void;
    isPromptSaved: (promptText: string) => boolean;
}

const RefinementDisplay: React.FC<RefinementDisplayProps> = ({ history, testCases, onToggleSavePrompt, isPromptSaved }) => {
    const { t } = useTranslation();

    if (history.length === 0) {
        return <div className="text-center text-gray-400 text-sm">{t('process.logEmpty')}</div>;
    }

    return (
        <div className="space-y-4">
            {history.map((item) => (
                <AttemptDetails 
                    key={item.attempt} 
                    attempt={item} 
                    testCases={testCases}
                    onToggleSavePrompt={onToggleSavePrompt}
                    isPromptSaved={isPromptSaved}
                />
            ))}
        </div>
    );
};

export default RefinementDisplay;
