
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import PromptInputForm from './components/PromptInputForm';
import RefinementDisplay from './components/RefinementDisplay';
import SettingsModal from './components/SettingsModal';
import SavedPromptsPanel from './components/SavedPromptsPanel';
import MobileNav from './components/MobileNav';
import { runPrompt, refinePrompt, diversifyTestCases, evaluateOutput } from './services/llmService';
import type { RefinementAttempt, TestCase, TestCaseResult, SavedPrompt, SavedPromptSource, Variable } from './types';
import { DEFAULT_PROMPT_RULE, DEFAULT_PROMPT, getDefaultTestCases, LOCAL_STORAGE_KEY, DEFAULT_GENERATION_MODEL, DEFAULT_EVALUATION_MODEL, AVAILABLE_MODELS } from './constants';
import { getPromptGuide, getXmlPromptingGuide } from './services/contentService';
import { loadSavedPrompts, saveSavedPrompts, migrateLocalStorageToFile } from './services/storageService';
import CodeBlock from './components/CodeBlock';
import BookmarkIcon from './components/icons/BookmarkIcon';
import BookmarkSolidIcon from './components/icons/BookmarkSolidIcon';
import { getSavedPromptSourceLabel } from './i18n';

interface StoredSessionData {
    initialPrompt: string;
    testCases: TestCase[];
}

interface LegacySavedPrompt {
    id: string;
    prompt: string;
    savedAt: string;
    source?: string;
    details?: string;
    testCases: TestCase[];
    sourceAttempt?: number;
    sourceLabel?: string;
}

const normalizeSavedPromptSource = (savedPrompt: LegacySavedPrompt): Pick<SavedPrompt, 'source' | 'sourceAttempt' | 'sourceLabel'> => {
    if (savedPrompt.source === 'initialPrompt' || savedPrompt.source === 'finalResult' || savedPrompt.source === 'attempt' || savedPrompt.source === 'legacy') {
        return {
            source: savedPrompt.source as SavedPromptSource,
            sourceAttempt: savedPrompt.sourceAttempt,
            sourceLabel: savedPrompt.sourceLabel,
        };
    }

    const source = savedPrompt.source ?? '';

    if (source === 'Initial Prompt' || source === '초기 프롬프트' || source === '初始提示词' || source === '初始提示詞') {
        return { source: 'initialPrompt' };
    }

    if (source === 'Final Result' || source === '최종 결과' || source === '最终结果' || source === '最終結果') {
        return { source: 'finalResult' };
    }

    const attemptMatch = source.match(/(?:Attempt|시도|尝试|嘗試)\s*#?\s*(\d+)/i);
    if (attemptMatch) {
        return {
            source: 'attempt',
            sourceAttempt: Number(attemptMatch[1]),
        };
    }

    return {
        source: 'legacy',
        sourceLabel: source || undefined,
    };
};

const normalizeSavedPrompt = (savedPrompt: LegacySavedPrompt): SavedPrompt => ({
    id: savedPrompt.id,
    prompt: savedPrompt.prompt,
    savedAt: savedPrompt.savedAt,
    details: savedPrompt.details,
    testCases: savedPrompt.testCases,
    ...normalizeSavedPromptSource(savedPrompt),
});

const App: React.FC = () => {
    const { t } = useTranslation();
    const [initialPrompt, setInitialPrompt] = useState<string>(DEFAULT_PROMPT);
    const [refinementDirection, setRefinementDirection] = useState<string>('');
    const [generationModel, setGenerationModel] = useState<string>(DEFAULT_GENERATION_MODEL);
    const [evaluationModel, setEvaluationModel] = useState<string>(DEFAULT_EVALUATION_MODEL);
    const [maxAttempts, setMaxAttempts] = useState<number>(5);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('');
    const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
    const [history, setHistory] = useState<RefinementAttempt[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [testCases, setTestCases] = useState<TestCase[]>(getDefaultTestCases());
    const [isDiversifying, setIsDiversifying] = useState<boolean>(false);
    const [diversificationDirection, setDiversificationDirection] = useState<string>('');
    const [diversificationType, setDiversificationType] = useState<'positive' | 'negative' | null>(null);
    const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
    const [activeView, setActiveView] = useState<'setup' | 'process' | 'result' | 'saved'>('setup');
    
    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [promptGuide, setPromptGuide] = useState<string>('Loading guide...');
    const [negativePromptRule, setNegativePromptRule] = useState<string>(DEFAULT_PROMPT_RULE);
    
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!isLoading && !status) {
             setStatus(t('process.ready'));
        }
    }, [t, isLoading, status]);

    useEffect(() => {
        const initializeSettings = () => {
            const mainGuide = getPromptGuide();
            const xmlGuide = getXmlPromptingGuide();
            const defaultGuide = `${mainGuide}\n\n---\n\n${xmlGuide}`;

            try {
                const savedGuide = localStorage.getItem('gemini-tuner-prompt-guide');
                setPromptGuide(savedGuide ?? defaultGuide);

                const savedNegativeRule = localStorage.getItem('gemini-tuner-negative-prompt-rule');
                if (savedNegativeRule) {
                    setNegativePromptRule(savedNegativeRule);
                }
            } catch (e) {
                console.error("Failed to load settings from localStorage", e);
                setPromptGuide(defaultGuide); // Fallback to default if localStorage fails
            }
        };
        initializeSettings();
    }, []);
    
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
                const parsedData: StoredSessionData = JSON.parse(savedData);
                if (parsedData.initialPrompt) {
                    setInitialPrompt(parsedData.initialPrompt);
                }
                if (Array.isArray(parsedData.testCases) && parsedData.testCases.length > 0) {
                     setTestCases(parsedData.testCases.map(tc => ({...tc, id: tc.id || crypto.randomUUID() })));
                }
            }
        } catch (e) {
            console.error("Failed to load session data from localStorage", e);
        }

        migrateLocalStorageToFile().then(() => {
            loadSavedPrompts().then(prompts => {
                const normalizedPrompts = (prompts as unknown as LegacySavedPrompt[]).map(normalizeSavedPrompt);
                setSavedPrompts(normalizedPrompts);
            });
        });
    }, []);

    // Save session data to localStorage whenever it changes
    useEffect(() => {
        try {
            const dataToSave: StoredSessionData = {
                initialPrompt,
                testCases,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        } catch (e) {
            console.error("Failed to save session data to localStorage", e);
        }
    }, [initialPrompt, testCases]);

    const updateSavedPrompts = (newPrompts: SavedPrompt[]) => {
        setSavedPrompts(newPrompts);
        saveSavedPrompts(newPrompts).catch(e => {
            console.error("Failed to persist saved prompts", e);
        });
    };

    const isPromptSaved = (promptText: string): boolean => {
        return savedPrompts.some(p => p.prompt === promptText);
    };

    const handleToggleSavePrompt = (data: Omit<SavedPrompt, 'id' | 'savedAt'>) => {
        const { prompt: promptText } = data;
        const isAlreadySaved = isPromptSaved(promptText);

        if (isAlreadySaved) {
            // It exists, so remove it based on content
            updateSavedPrompts(savedPrompts.filter(p => p.prompt !== promptText));
            setStatus(t('process.unsaved'));
        } else {
            // It doesn't exist, so save it.
            const newPrompt: SavedPrompt = {
                ...data,
                id: crypto.randomUUID(),
                savedAt: new Date().toISOString(),
            };
            updateSavedPrompts([newPrompt, ...savedPrompts]);
            setStatus(t('process.saved', { source: getSavedPromptSourceLabel(newPrompt, t) }));
        }
    };

    const handleDeletePrompt = (id: string) => {
        if (window.confirm(t('saved.confirmDelete'))) {
            updateSavedPrompts(savedPrompts.filter(p => p.id !== id));
        }
    };

    const handleLoadPrompt = (promptToLoad: SavedPrompt) => {
        if (window.confirm(t('saved.confirmLoad'))) {
            setInitialPrompt(promptToLoad.prompt);
            setTestCases(promptToLoad.testCases);
            setHistory([]);
            setFinalPrompt(null);
            setError(null);
            // Reuse the existing status logic, but maybe just say "Loaded"
            setStatus(t('process.ready'));
            setActiveView('setup'); // Switch to setup view on mobile after loading
        }
    };

    const handleSaveSettings = (guide: string, negativeRule: string) => {
        setPromptGuide(guide);
        setNegativePromptRule(negativeRule);
        localStorage.setItem('gemini-tuner-prompt-guide', guide);
        localStorage.setItem('gemini-tuner-negative-prompt-rule', negativeRule);
        setIsSettingsOpen(false);
    };

    const handleRestoreDefaults = () => {
        const mainGuide = getPromptGuide();
        const xmlGuide = getXmlPromptingGuide();
        const defaultGuide = `${mainGuide}\n\n---\n\n${xmlGuide}`;
        setPromptGuide(defaultGuide);
        setNegativePromptRule(DEFAULT_PROMPT_RULE);
        localStorage.removeItem('gemini-tuner-prompt-guide');
        localStorage.removeItem('gemini-tuner-negative-prompt-rule');
        setIsSettingsOpen(false);
    };

    const handleReset = () => {
        if (window.confirm(t('saved.confirmReset'))) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setInitialPrompt(DEFAULT_PROMPT);
            setTestCases(getDefaultTestCases());
            setHistory([]);
            setFinalPrompt(null);
            setError(null);
            setStatus(t('process.ready'));
        }
    };

    const variablesArrayToObject = (variables: Variable[]): Record<string, string> => {
        return variables.reduce((acc, v) => {
            if (v.key) { // Ensure empty keys are not added
                acc[v.key] = v.value;
            }
            return acc;
        }, {} as Record<string, string>);
    };

    const fillTemplate = (template: string, variables: Record<string, string>): string => {
        return template.replace(/{{(\w+)}}/g, (_, key) => variables[key] || `{{${key}}}`);
    };

    const handleAddTestCase = () => {
        const firstCaseVars = testCases.length > 0 ? testCases[0].variables.map(v => v.key) : ['text'];
        const newVars: Variable[] = firstCaseVars.map(key => ({
            id: crypto.randomUUID(),
            key: key,
            value: ""
        }));
        setTestCases(prev => [...prev, { id: crypto.randomUUID(), type: 'positive', variables: newVars, expectedOutput: '', detailedReason: '' }]);
    };

    const handleRemoveTestCase = (id: string) => {
        setTestCases(prev => prev.filter(tc => tc.id !== id));
    };

    const handleTestCaseOutputChange = (id: string, value: string) => {
        setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, expectedOutput: value } : tc));
    };
    
    const handleTestCaseDetailedReasonChange = (id: string, value: string) => {
        setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, detailedReason: value } : tc));
    };

    const handleTestCaseTypeChange = (id: string, type: 'positive' | 'negative') => {
        setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, type } : tc));
    };

    const handleAddVariable = (testCaseId: string) => {
        setTestCases(prev => prev.map(tc => {
            if (tc.id === testCaseId) {
                const newVar: Variable = {
                    id: crypto.randomUUID(),
                    key: `newVar${tc.variables.length + 1}`,
                    value: ''
                };
                return { ...tc, variables: [...tc.variables, newVar] };
            }
            return tc;
        }));
    };

    const handleRemoveVariable = (testCaseId: string, variableId: string) => {
        setTestCases(prev => prev.map(tc => {
            if (tc.id === testCaseId) {
                return { ...tc, variables: tc.variables.filter(v => v.id !== variableId) };
            }
            return tc;
        }));
    };
    
    const handleVariableChange = (testCaseId: string, variableId: string, part: 'key' | 'value', text: string) => {
        setTestCases(prev => prev.map(tc => {
            if (tc.id === testCaseId) {
                return {
                    ...tc,
                    variables: tc.variables.map(v => 
                        v.id === variableId ? { ...v, [part]: text } : v
                    )
                };
            }
            return tc;
        }));
    };

    const handleDiversify = useCallback(async (type: 'positive' | 'negative') => {
        if (testCases.length === 0) {
            setError(t('process.diversifyNeedBaseError'));
            return;
        }

        const firstCase = testCases[0];
        const firstCaseVars = variablesArrayToObject(firstCase.variables);
        if (Object.values(firstCaseVars).some(v => !v.trim()) || !firstCase.expectedOutput.trim()) {
            setError(t('process.diversifyIncompleteBaseError'));
            return;
        }

        setIsDiversifying(true);
        setDiversificationType(type);
        setError(null);
        try {
            const apiPayload = {
                variables: firstCaseVars,
                expectedOutput: firstCase.expectedOutput,
                detailedReason: firstCase.detailedReason
            };
            const newCasesData = await diversifyTestCases(apiPayload, diversificationDirection, evaluationModel, type);
            
            const newTestCases: TestCase[] = newCasesData.map(data => ({
                id: crypto.randomUUID(),
                type: type,
                expectedOutput: data.expectedOutput,
                detailedReason: data.detailedReason,
                variables: Object.entries(data.variables).map(([key, value]) => ({
                    id: crypto.randomUUID(),
                    key: key,
                    value: value as string
                }))
            }));
            setTestCases(prev => [...prev, ...newTestCases]);
        } catch (err: any) {
            setError(t('process.diversifyFailedError', { error: err.message }));
        } finally {
            setIsDiversifying(false);
            setDiversificationType(null);
        }
    }, [testCases, diversificationDirection, evaluationModel, t]);

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setStatus(t('process.cancelled'));
        }
    };

    const handleRefine = useCallback(async () => {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsLoading(true);
        setStatus(t('process.starting'));
        setHistory([]);
        setFinalPrompt(null);
        setError(null);
        setActiveView('process'); // Switch to process view on mobile

        if (testCases.length === 0 || testCases.some(tc => tc.variables.some(v => !v.key.trim() || !v.value.trim()) || !tc.expectedOutput.trim())) {
            setError(t('process.startValidationError'));
            setIsLoading(false);
            return;
        }

        let currentPrompt = initialPrompt;
        let cumulativeHistory: RefinementAttempt[] = [];
        let lastReasoning: string | undefined = undefined;

        for (let i = 0; i < maxAttempts; i++) {
            if (signal.aborted) return;
            
            const attempt = i + 1;
            setStatus(t('process.testing', { attempt, max: maxAttempts, count: testCases.length }));
            
            const previousAttempt = cumulativeHistory.length > 0 ? cumulativeHistory[cumulativeHistory.length - 1] : null;

            const initialAttemptLog: RefinementAttempt = {
                attempt,
                prompt: currentPrompt,
                previousPrompt: previousAttempt?.prompt,
                refinementReasoning: lastReasoning,
                isSuccess: false,
                details: t('process.runningTests'),
                testCaseResults: [],
            };
            cumulativeHistory = [...cumulativeHistory, initialAttemptLog];
            setHistory(cumulativeHistory);

            try {
                if (signal.aborted) return;
                
                setStatus(t('process.running', { attempt, max: maxAttempts, count: testCases.length }));

                const testPromises = testCases.map(async (testCase): Promise<TestCaseResult> => {
                    const variables = variablesArrayToObject(testCase.variables);
                    const filledPrompt = fillTemplate(currentPrompt, variables);
                    const generatedOutput = await runPrompt(filledPrompt, generationModel, signal);
                    const evaluation = await evaluateOutput(generatedOutput, testCase.expectedOutput, testCase.type, evaluationModel, signal);
                    const previousResult = previousAttempt?.testCaseResults.find(r => r.testCase.id === testCase.id);

                    return {
                        testCase,
                        actualOutput: generatedOutput,
                        previousActualOutput: previousResult?.actualOutput,
                        status: evaluation.pass ? 'passed' : 'failed',
                        evaluationReasoning: evaluation.reasoning,
                    };
                });
                
                const results = await Promise.all(testPromises);

                if (signal.aborted) return;

                const passedCount = results.filter(r => r.status === 'passed').length;
                const allPassed = passedCount === testCases.length;
                const details = t('process.details', { passed: passedCount, total: testCases.length });

                const finalAttemptLog: RefinementAttempt = {
                    ...cumulativeHistory[cumulativeHistory.length - 1],
                    isSuccess: allPassed,
                    details,
                    testCaseResults: results,
                };
                
                cumulativeHistory[cumulativeHistory.length - 1] = finalAttemptLog;
                setHistory([...cumulativeHistory]);

                if (allPassed) {
                    setStatus(t('process.success', { count: testCases.length }));
                    setFinalPrompt(currentPrompt);
                    setIsLoading(false);
                    setActiveView('result'); // Switch to result view on mobile
                    return;
                }

                setStatus(t('process.attemptSummary', { attempt, max: maxAttempts, details }));
                
                if (i < maxAttempts - 1) {
                    setStatus(t('process.refining', { attempt, max: maxAttempts }));
                    const previousAttemptsSummary = cumulativeHistory.map(h => `Attempt #${h.attempt}: ${h.details}`).join('\n');
                    const firstFailure = results.find(r => r.status === 'failed');
                    const firstFailureIndex = testCases.findIndex(tc => tc.id === firstFailure?.testCase.id);

                    if (firstFailure) {
                        const testCasesForApi = testCases.map(tc => ({
                            ...tc,
                            variables: variablesArrayToObject(tc.variables)
                        }));

                        const refinedResult = await refinePrompt(
                            promptGuide,
                            currentPrompt,
                            initialPrompt,
                            testCasesForApi,
                            firstFailureIndex,
                            firstFailure.actualOutput,
                            previousAttemptsSummary,
                            negativePromptRule,
                            refinementDirection,
                            evaluationModel,
                            signal
                        );
                        currentPrompt = refinedResult.newPrompt;
                        lastReasoning = refinedResult.reasoning;
                    } else {
                         throw new Error("Could not find a failed test case to refine upon, but not all passed.");
                    }
                }

            } catch (err: any) {
                if (err.name === 'AbortError') {
                    setError(t('process.cancelled'));
                    setStatus(t('process.cancelled'));
                    setIsLoading(false);
                    return;
                }
                const errorMessage = t('process.error', { attempt, error: err.message });
                setError(errorMessage);
                setStatus(errorMessage);
                setIsLoading(false);
                setActiveView('result'); // Switch to result view on error
                return;
            }
        }

        setError(t('process.fail', { max: maxAttempts }));
        setStatus(t('process.finished'));
        setIsLoading(false);
        setActiveView('result');

    }, [testCases, promptGuide, negativePromptRule, initialPrompt, generationModel, evaluationModel, refinementDirection, maxAttempts, t]);

    const renderFinalResult = () => (
        <>
            {isLoading && !finalPrompt && !error && (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p>{t('process.waiting')}</p>
                </div>
            )}
            {error && <div className="p-4 bg-red-50 border border-red-300 text-red-700">{error}</div>}
            {finalPrompt && (() => {
                const isSaved = isPromptSaved(finalPrompt);
                return (
                    <div className="p-4 bg-green-50 border border-green-300">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold text-green-700">{t('result.successTitle')}</h3>
                            <button
                                onClick={() => handleToggleSavePrompt({
                                    prompt: finalPrompt,
                                    source: 'finalResult',
                                    details: t('process.details', { passed: testCases.length, total: testCases.length }),
                                    testCases: testCases,
                                })}
                                className={`p-1.5 transition-colors ${isSaved ? 'text-cyan-600' : 'text-gray-500 hover:bg-green-100 hover:text-cyan-600'}`}
                                aria-label={isSaved ? t('result.unsaveFinal') : t('result.saveFinal')}
                                aria-pressed={isSaved}
                            >
                                {isSaved ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <CodeBlock content={finalPrompt} />
                    </div>
                );
            })()}
            {!isLoading && !finalPrompt && !error && (
                 <div className="flex items-center justify-center h-full text-gray-400">
                    <p>{t('inputForm.finalPrompt')}</p>
                </div>
            )}
        </>
    );

    return (
        <div className="flex flex-col h-screen font-sans">
            <Header 
                onOpenSettings={() => setIsSettingsOpen(true)} 
                onReset={handleReset}
            />
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentGuide={promptGuide}
                currentNegativeRule={negativePromptRule}
                onSave={handleSaveSettings}
                onRestoreDefaults={handleRestoreDefaults}
            />
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* --- Desktop View --- */}
                <div className="hidden md:flex w-full overflow-hidden">
                    {/* Left Panel: Configuration */}
                    <div className="w-1/3 flex flex-col p-4 border-r border-gray-200 overflow-hidden">
                        <PromptInputForm 
                            onSubmit={handleRefine}
                            onCancel={handleCancel}
                            isLoading={isLoading}
                            initialPrompt={initialPrompt}
                            onInitialPromptChange={setInitialPrompt}
                            refinementDirection={refinementDirection}
                            onRefinementDirectionChange={setRefinementDirection}
                            generationModel={generationModel}
                            onGenerationModelChange={setGenerationModel}
                            evaluationModel={evaluationModel}
                            onEvaluationModelChange={setEvaluationModel}
                            maxAttempts={maxAttempts}
                            onMaxAttemptsChange={setMaxAttempts}
                            availableModels={AVAILABLE_MODELS}
                            testCases={testCases}
                            onAddTestCase={handleAddTestCase}
                            onRemoveTestCase={handleRemoveTestCase}
                            onTestCaseOutputChange={handleTestCaseOutputChange}
                            onTestCaseDetailedReasonChange={handleTestCaseDetailedReasonChange}
                            onTestCaseTypeChange={handleTestCaseTypeChange}
                            onAddVariable={handleAddVariable}
                            onRemoveVariable={handleRemoveVariable}
                            onVariableChange={handleVariableChange}
                            onDiversify={handleDiversify}
                            isDiversifying={isDiversifying}
                            diversificationDirection={diversificationDirection}
                            onDiversificationDirectionChange={setDiversificationDirection}
                            diversificationType={diversificationType}
                            onToggleSavePrompt={handleToggleSavePrompt}
                            isPromptSaved={isPromptSaved}
                        />
                    </div>
                    
                    <div className="w-2/3 flex overflow-hidden">
                        {/* Center Panel: Process Log */}
                        <div className="flex-1 flex flex-col border-r border-gray-200">
                           <div className="p-3 border-b border-gray-200 bg-gray-100">
                             <h2 className="text-lg font-semibold text-gray-800">{t('process.title')}</h2>
                             <p className={`text-sm mt-1 ${isLoading ? 'text-cyan-600 animate-pulse' : 'text-gray-500'}`}>{status}</p>
                           </div>
                           <div className="flex-1 overflow-y-auto p-4">
                             <RefinementDisplay 
                                history={history}
                                testCases={testCases}
                                onToggleSavePrompt={handleToggleSavePrompt}
                                isPromptSaved={isPromptSaved}
                             />
                           </div>
                        </div>

                        {/* Right Panel: Final Result */}
                        <div className="flex-1 flex flex-col border-r border-gray-200">
                             <div className="p-3 border-b border-gray-200 bg-gray-100">
                                <h2 className="text-lg font-semibold text-gray-800">{t('result.title')}</h2>
                             </div>
                             <div className="flex-1 overflow-y-auto p-4">
                                {renderFinalResult()}
                             </div>
                        </div>

                        {/* Saved Prompts Panel */}
                        <div className="flex-1 flex flex-col">
                            <SavedPromptsPanel
                                prompts={savedPrompts}
                                onLoad={handleLoadPrompt}
                                onDelete={handleDeletePrompt}
                            />
                        </div>
                    </div>
                </div>

                {/* --- Mobile View --- */}
                <div className="md:hidden flex-1 overflow-y-auto pb-16">
                    {activeView === 'setup' && (
                        <div className="p-4">
                             <PromptInputForm 
                                onSubmit={handleRefine}
                                onCancel={handleCancel}
                                isLoading={isLoading}
                                initialPrompt={initialPrompt}
                                onInitialPromptChange={setInitialPrompt}
                                refinementDirection={refinementDirection}
                                onRefinementDirectionChange={setRefinementDirection}
                                generationModel={generationModel}
                                onGenerationModelChange={setGenerationModel}
                                evaluationModel={evaluationModel}
                                onEvaluationModelChange={setEvaluationModel}
                                maxAttempts={maxAttempts}
                                onMaxAttemptsChange={setMaxAttempts}
                                availableModels={AVAILABLE_MODELS}
                                testCases={testCases}
                                onAddTestCase={handleAddTestCase}
                                onRemoveTestCase={handleRemoveTestCase}
                                onTestCaseOutputChange={handleTestCaseOutputChange}
                                onTestCaseDetailedReasonChange={handleTestCaseDetailedReasonChange}
                                onTestCaseTypeChange={handleTestCaseTypeChange}
                                onAddVariable={handleAddVariable}
                                onRemoveVariable={handleRemoveVariable}
                                onVariableChange={handleVariableChange}
                                onDiversify={handleDiversify}
                                isDiversifying={isDiversifying}
                                diversificationDirection={diversificationDirection}
                                onDiversificationDirectionChange={setDiversificationDirection}
                                diversificationType={diversificationType}
                                onToggleSavePrompt={handleToggleSavePrompt}
                                isPromptSaved={isPromptSaved}
                            />
                        </div>
                    )}
                     {activeView === 'process' && (
                        <div className="flex flex-col h-full">
                            <div className="p-3 border-b border-gray-200 bg-gray-100 sticky top-0 z-10">
                                <h2 className="text-lg font-semibold text-gray-800">{t('process.title')}</h2>
                                <p className={`text-sm mt-1 ${isLoading ? 'text-cyan-600 animate-pulse' : 'text-gray-500'}`}>{status}</p>
                            </div>
                            <div className="p-4">
                                <RefinementDisplay 
                                    history={history}
                                    testCases={testCases}
                                    onToggleSavePrompt={handleToggleSavePrompt}
                                    isPromptSaved={isPromptSaved}
                                />
                            </div>
                        </div>
                    )}
                    {activeView === 'result' && (
                        <div className="flex flex-col h-full">
                            <div className="p-3 border-b border-gray-200 bg-gray-100 sticky top-0 z-10">
                                <h2 className="text-lg font-semibold text-gray-800">{t('result.title')}</h2>
                            </div>
                            <div className="p-4">
                                {renderFinalResult()}
                            </div>
                        </div>
                    )}
                    {activeView === 'saved' && (
                        <div className="flex flex-col h-full">
                             <SavedPromptsPanel
                                prompts={savedPrompts}
                                onLoad={handleLoadPrompt}
                                onDelete={handleDeletePrompt}
                            />
                        </div>
                    )}
                </div>
            </main>
            <MobileNav activeView={activeView} onViewChange={setActiveView} />
        </div>
    );
};

export default App;
