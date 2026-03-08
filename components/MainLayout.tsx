import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ProcessedData, Transaction, BusinessInfo, Category, CategoryRule, UploadedFileInfo, AIReport, DeepDiveAIReport, LocationAnalysisReport } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_INCOME, DEFAULT_CATEGORY_EXPENSE, normalizeCategoryName, CATEGORY_MAP } from '../constants';
import { categorizeTransactions, generateInitialCategorizationRules, generateInitialCategories, generateFinancialReport, generateDeepDiveReport, generateLocationAnalysisReport } from '../services/geminiService';
import { parseFile } from '../services/parser';
import DashboardView from './views/DashboardView';
import TransactionsView from './views/TransactionsView';
import AIReportView from './views/AIReportView';
import CategoryManagementView from './views/CategoryManagementView';
import DeepDiveView from './views/DeepDiveView';
import DataSourcesView from './views/DataSourcesView';
import LoadingModal from './LoadingModal';
import CategoryReviewModal from './CategoryReviewModal';

type Page = 'dashboard' | 'transactions' | 'data-sources' | 'deep-dive' | 'ai-report' | 'settings';

const NavItem: React.FC<{ id: Page, label: string, activePage: Page, setActivePage: (page: Page) => void }> = ({ id, label, activePage, setActivePage }) => (
    <button
        onClick={() => setActivePage(id)}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
            activePage === id 
            ? 'bg-brand-primary text-text-on-light shadow-md' 
            : 'text-text-muted hover:bg-surface-subtle hover:text-brand-primary'
        }`}
    >
        {label}
    </button>
);

interface Props {
  initialData: ProcessedData;
  businessInfo: BusinessInfo;
  uploadedFiles: UploadedFileInfo[];
  onReset: () => void;
}

const getUserKey = (info: BusinessInfo) => `financial_dashboard_user_${info.name}_${info.owner}`;

const MainLayout: React.FC<Props> = ({ initialData, businessInfo, uploadedFiles, onReset }) => {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [errors, setErrors] = useState<string[]>(initialData.errors);
  const [showErrors, setShowErrors] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgressMessages, setLoadingProgressMessages] = useState<string[]>([]);
  const [isCategorizing, setIsCategorizing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [initialAiCategories, setInitialAiCategories] = useState<Category[]>([]);
  const [isReviewingCategories, setIsReviewingCategories] = useState(false);

  // --- AI Report State ---
  const [reports, setReports] = useState<{
    summary: AIReport | null;
    deepDive: DeepDiveAIReport | null;
    location: LocationAnalysisReport | null;
  }>({ summary: null, deepDive: null, location: null });

  const [reportStatus, setReportStatus] = useState({
    summary: { isLoading: false, error: null as string | null },
    deepDive: { isLoading: false, error: null as string | null },
    location: { isLoading: false, error: null as string | null },
  });

  const reportsGenerated = useRef(false);

  // Effect to save categories and rules to localStorage whenever they change
  useEffect(() => {
    // Only save if there are categories. This prevents overwriting existing data with empty arrays during initial render.
    if (categories.length > 0) {
        const userKey = getUserKey(businessInfo);
        const dataToSave = JSON.stringify({ categories, categoryRules });
        localStorage.setItem(userKey, dataToSave);
    }
  }, [categories, categoryRules, businessInfo]);

  const applyRules = useCallback((txList: Transaction[], ruleList: CategoryRule[]): Transaction[] => {
      return txList.map(tx => {
          const matchingRule = ruleList
              .filter(rule => tx.description.toLowerCase().includes(rule.keyword.toLowerCase()))
              .sort((a, b) => b.keyword.length - a.keyword.length)[0];
          
          if (matchingRule) {
              // 규칙의 카테고리명을 표준 계정명으로 정규화
              const isIncome = tx.credit > 0;
              const normalizedCategory = normalizeCategoryName(matchingRule.category, isIncome);
              return { ...tx, category: normalizedCategory };
          }
          
          return tx;
      });
  }, []);

  const runClassification = useCallback(async (txsToClassify: Transaction[], currentRules: CategoryRule[], allCategories: Category[], info: BusinessInfo) => {
      let classifiedTxs = applyRules(txsToClassify, currentRules);
      const uncategorizedAfterRules = classifiedTxs.filter(t => t.category === DEFAULT_CATEGORY_INCOME || t.category === DEFAULT_CATEGORY_EXPENSE);

      if (uncategorizedAfterRules.length > 0 && allCategories.length > 0) {
          try {
              const categorizedMap = await categorizeTransactions(uncategorizedAfterRules, allCategories, info);
              classifiedTxs = classifiedTxs.map(tx => {
                  const aiCategory = categorizedMap[tx.id];
                  if (aiCategory) {
                      return { ...tx, category: normalizeCategoryName(aiCategory, tx.credit > 0) };
                  }
                  return tx;
              });
          } catch (e) {
              console.error("AI categorization failed, using rule-based results.", e);
          }
      }
      
      setTransactions(classifiedTxs);
  }, [applyRules]);


  // Initial setup effect: Check for saved data. If none, generate categories for review.
  useEffect(() => {
    const userKey = getUserKey(businessInfo);
    const savedDataString = localStorage.getItem(userKey);

    const performInitialSetup = async () => {
        setIsInitialLoading(true);
        setLoadingProgressMessages([
            "AI가 맞춤형 카테고리를 추천하고 있습니다...",
            "비즈니스 유형에 맞는 비용 항목을 분석 중입니다...",
            "반복적인 거래 패턴을 찾고 있습니다...",
            "자동 분류 규칙을 생성하고 있습니다...",
        ]);
        const generatedCategories = await generateInitialCategories(businessInfo);
        setInitialAiCategories(generatedCategories);
        setIsReviewingCategories(true);
        setIsInitialLoading(false);
    };

    const loadSavedDataAndClassify = async (savedData: { categories: Category[], categoryRules: CategoryRule[] }) => {
        setCategories(savedData.categories);
        setCategoryRules(savedData.categoryRules);
        setIsInitialLoading(true);
        setLoadingProgressMessages([
            "저장된 설정을 불러옵니다...",
            "거래 내역을 자동으로 분류하고 있습니다...",
            "현금 흐름을 계산하는 중입니다...",
            "분석 대시보드를 준비하고 있습니다...",
        ]);
        await runClassification(initialData.transactions, savedData.categoryRules, savedData.categories, businessInfo);
        setIsInitialLoading(false);
    };

    if (savedDataString) {
        try {
            const savedData = JSON.parse(savedDataString);
            // 구 버전 카테고리 감지: level2 필드가 없으면 이전 버전 데이터
            const isOldFormat = savedData.categories?.length > 0 && !savedData.categories[0].level2;
            if (savedData.categories && savedData.categories.length > 0 && !isOldFormat) {
                loadSavedDataAndClassify(savedData);
                return;
            } else if (isOldFormat) {
                console.log("구 버전 카테고리 감지. 새 계정과목 체계로 재설정합니다.");
                localStorage.removeItem(userKey);
            }
        } catch (e) {
            console.error("Failed to parse saved data, running initial setup.", e);
        }
    }
    
    // If no valid saved data, run initial setup for new user
    if (initialData.transactions.length > 0) {
        performInitialSetup();
    } else {
        setIsInitialLoading(false); // No transactions, do nothing
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // --- AI Report Generation Handlers ---
  const handleGenerateFinancialReport = useCallback(async (type: 'summary' | 'deepDive') => {
      const statusKey = type;
      setReportStatus(prev => ({ ...prev, [statusKey]: { isLoading: true, error: null } }));

      try {
          if (type === 'summary') {
              const result = await generateFinancialReport(transactions, businessInfo, categories);
              setReports(prev => ({ ...prev, summary: result }));
          } else {
              const result = await generateDeepDiveReport(transactions, businessInfo, categories);
              setReports(prev => ({ ...prev, deepDive: result }));
          }
      } catch (err) {
          console.error(`Error generating ${type} report:`, err);
          setReportStatus(prev => ({ ...prev, [statusKey]: { isLoading: false, error: 'AI 리포트 생성 중 오류가 발생했습니다.' } }));
      } finally {
          setReportStatus(prev => ({ ...prev, [statusKey]: { ...prev[statusKey], isLoading: false } }));
      }
  }, [transactions, businessInfo, categories]);

  const handleGenerateLocationReport = useCallback(async () => {
      setReportStatus(prev => ({ ...prev, location: { isLoading: true, error: null } }));
      try {
          const result = await generateLocationAnalysisReport(businessInfo, transactions);
          setReports(prev => ({ ...prev, location: result }));
      } catch (err) {
          console.error(`Error generating location report:`, err);
          setReportStatus(prev => ({ ...prev, location: { isLoading: false, error: 'AI 상권 분석 리포트 생성 중 오류가 발생했습니다.' } }));
      } finally {
          // FIX: Correctly update the nested state by spreading the previous state and then updating the 'location' property. The previous implementation returned an object with the wrong shape.
          setReportStatus(prev => ({ ...prev, location: { ...prev.location, isLoading: false } }));
      }
  }, [transactions, businessInfo]);


  // After user confirms categories for the first time, run classification and generate reports.
  const handleCategoryReviewConfirm = useCallback(async (finalCategories: Category[]) => {
      setIsReviewingCategories(false);
      setIsInitialLoading(true);
       setLoadingProgressMessages([
            "수정된 카테고리를 저장하고 있습니다...",
            "AI가 자동 분류 규칙을 생성합니다...",
            "전체 거래 내역을 다시 분류하고 있습니다...",
            "거의 다 됐습니다! 최종 분석을 준비합니다...",
        ]);

      setCategories(finalCategories);

      // For a new user, `categoryRules` state is empty. Generate initial AI rules.
      const aiRules = await generateInitialCategorizationRules(initialData.transactions, finalCategories, businessInfo);
      setCategoryRules(aiRules);

      // Run the full classification with new categories and rules.
      await runClassification(initialData.transactions, aiRules, finalCategories, businessInfo);

      setIsInitialLoading(false);

  }, [businessInfo, initialData.transactions, runClassification]);
  
  // Auto-generate reports in the background after initial classification
  useEffect(() => {
    // This should run only once after the initial data processing is done.
    if (!isInitialLoading && !reportsGenerated.current && transactions.length > 0) {
      reportsGenerated.current = true; // Mark as run
      
      // Don't await, let them run in the background
      handleGenerateFinancialReport('summary');
      if (businessInfo.address) {
          handleGenerateLocationReport();
      }
    }
  }, [isInitialLoading, transactions, businessInfo.address, handleGenerateFinancialReport, handleGenerateLocationReport]);


  const handleAddRule = (rule: CategoryRule, shouldReclassify: boolean = true) => {
    setCategoryRules(prevRules => {
        let updatedRules;
        const ruleExists = prevRules.some(r => r.keyword.toLowerCase() === rule.keyword.toLowerCase());
        if (ruleExists) {
            updatedRules = prevRules.map(r => r.keyword.toLowerCase() === rule.keyword.toLowerCase() ? rule : r);
        } else {
            updatedRules = [...prevRules, rule];
        }
        
        if (shouldReclassify) {
            setTransactions(prevTxs => applyRules(prevTxs, updatedRules));
        }
        return updatedRules;
    });
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(currentTxs => {
        const originalTx = currentTxs.find(t => t.id === updatedTx.id);
        const updatedTransactions = currentTxs.map(tx => (tx.id === updatedTx.id ? updatedTx : tx));
        
        if (originalTx && originalTx.category !== updatedTx.category) {
            // Learn from manual change: create a rule for this description
            const newRule: CategoryRule = { keyword: updatedTx.description, category: updatedTx.category, source: 'manual' };
            setCategoryRules(prevRules => {
                const ruleExists = prevRules.some(r => r.keyword.toLowerCase() === newRule.keyword.toLowerCase());
                if (ruleExists) {
                    return prevRules.map(r => r.keyword.toLowerCase() === newRule.keyword.toLowerCase() ? newRule : r);
                }
                return [...prevRules, newRule];
            });
             // Also apply this change to other similar transactions
            return updatedTransactions.map(t =>
                t.description === updatedTx.description
                    ? { ...t, category: updatedTx.category }
                    : t
            );
        }
        return updatedTransactions;
    });
  };
  
  const handleAddFilesClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      setIsCategorizing(true);
      const newFiles = Array.from(event.target.files);
      
      // FIX: Explicitly type `file` as `File` to resolve TypeScript inference issue.
      const promises = newFiles.map((file: File) => parseFile(file, file.name));
      const results = await Promise.all(promises);

      let newTransactions: Transaction[] = [];
      const newErrors: string[] = [];
      results.forEach(result => {
          newTransactions.push(...result.transactions);
          newErrors.push(...result.errors);
      });
      
      const allTxs = [...transactions, ...newTransactions].sort((a,b) => a.date.getTime() - b.date.getTime());

      if (newTransactions.length > 0) {
        await runClassification(allTxs, categoryRules, categories, businessInfo);
        setErrors(prev => [...prev, ...newErrors]);
        setShowErrors(true);
      } else if (newErrors.length > 0) {
        setErrors(prev => [...prev, ...newErrors]);
        setShowErrors(true);
      }
      setIsCategorizing(false);
  };
  
  const handleDeleteRule = (ruleToRemove: CategoryRule) => {
      setCategoryRules(prevRules => {
        const newRules = prevRules.filter(r => !(r.keyword === ruleToRemove.keyword && r.category === ruleToRemove.category));
        
        const categoryOfRemovedRule = categories.find(c => c.name === ruleToRemove.category);
        const resetCategory = categoryOfRemovedRule?.type.includes('income') ? DEFAULT_CATEGORY_INCOME : DEFAULT_CATEGORY_EXPENSE;

        setTransactions(prevTxs => {
            return prevTxs.map(t => {
                if (t.description.toLowerCase().includes(ruleToRemove.keyword.toLowerCase()) && t.category === ruleToRemove.category) {
                    const anotherRuleApplies = newRules.find(rule => t.description.toLowerCase().includes(rule.keyword.toLowerCase()));
                    return { ...t, category: anotherRuleApplies ? anotherRuleApplies.category : resetCategory };
                }
                return t;
            });
        });
        
        return newRules;
      });
  };
  
  const handleAddCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const handleDeleteCategory = (categoryToDelete: Category) => {
    const resetCategory = categoryToDelete.type.includes('income') ? DEFAULT_CATEGORY_INCOME : DEFAULT_CATEGORY_EXPENSE;
    const categoryName = categoryToDelete.name;

    // React 18+ automatically batches these state updates
    setCategories(prev => prev.filter(c => c.name !== categoryName));
    setCategoryRules(prev => prev.filter(rule => rule.category !== categoryName));
    setTransactions(prev => prev.map(tx => 
        tx.category === categoryName ? { ...tx, category: resetCategory } : tx
    ));
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
      setTransactions(prev => prev.map(tx => 
          tx.category === oldName ? { ...tx, category: newName } : tx
      ));
      setCategoryRules(prev => prev.map(rule => 
          rule.category === oldName ? { ...rule, category: newName } : rule
      ));
      setCategories(prev => prev.map(c => 
          c.name === oldName ? { ...c, name: newName } : c
      ));
  };

  const handleMoveCategory = (draggedName: string, targetName: string) => {
    setCategories(prev => {
        const items = [...prev];
        const fromIndex = items.findIndex(c => c.name === draggedName);
        const toIndex = items.findIndex(c => c.name === targetName);

        // Ensure both items are found and are of the same type before moving
        if (fromIndex === -1 || toIndex === -1 || items[fromIndex].type !== items[toIndex].type) {
            return prev;
        }
        
        const [reorderedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, reorderedItem);

        return items;
    });
  };


  const navItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'transactions', label: '거래 내역' },
    { id: 'data-sources', label: '분석 데이터' },
    { id: 'deep-dive', label: '심층 분석' },
    { id: 'ai-report', label: 'AI 분석 및 제안' },
    { id: 'settings', label: '카테고리 관리' },
  ];

  const renderContent = () => {
    const commonProps = {
      transactions,
      businessInfo,
      categories,
    };

    switch (activePage) {
      case 'dashboard':
        return <DashboardView {...commonProps} />;
      case 'transactions':
        return <TransactionsView {...commonProps} onUpdateTransaction={handleUpdateTransaction}/>;
      case 'data-sources':
        return <DataSourcesView businessInfo={businessInfo} uploadedFiles={uploadedFiles} />;
      case 'deep-dive':
        return <DeepDiveView {...commonProps} />;
      case 'ai-report':
        return <AIReportView 
                  transactions={transactions}
                  businessInfo={businessInfo}
                  reports={reports}
                  reportStatus={reportStatus}
                  onGenerateFinancialReport={handleGenerateFinancialReport}
                  onGenerateLocationReport={handleGenerateLocationReport}
                />;
      case 'settings':
        return <CategoryManagementView 
                  transactions={transactions}
                  categories={categories} 
                  rules={categoryRules}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onRenameCategory={handleRenameCategory}
                  onMoveCategory={handleMoveCategory}
                  onAddRule={handleAddRule}
                  onDeleteRule={handleDeleteRule}
                />;
      default:
        return <DashboardView {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-main">
      <LoadingModal 
        isOpen={isInitialLoading} 
        mainText="AI 재무 분석을 실행하고 있습니다."
        progressMessages={loadingProgressMessages}
        estimatedDuration={Math.max(45, Math.round(initialData.transactions.length / 100))}
       />
      <CategoryReviewModal 
        isOpen={isReviewingCategories}
        initialCategories={initialAiCategories}
        onConfirm={handleCategoryReviewConfirm}
      />
      <header className="bg-surface-card shadow-md border-b border-border-color p-4 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                   <div className="p-2 bg-brand-primary rounded-lg shadow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-on-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8l3 5m0 0l3-5m-3 5v4m0-4h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  </div>
                  <span className="text-xl font-bold text-text-primary">{businessInfo.name}</span>
              </div>
              <nav className="hidden md:flex items-center space-x-1 bg-surface-subtle p-1 rounded-xl">
                   {navItems.map(item => (
                      <NavItem 
                          key={item.id}
                          id={item.id as Page}
                          label={item.label}
                          activePage={activePage}
                          setActivePage={setActivePage}
                      />
                   ))}
              </nav>
          </div>
          <div className="flex items-center gap-2">
               <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".xlsx, .xls, .csv" />
              <button
                  onClick={handleAddFilesClick}
                  className="px-4 py-2 bg-brand-accent hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200"
              >
                  파일 추가
              </button>
              <button
                  onClick={onReset}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200"
              >
                  새 분석
              </button>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background-main">
        {errors.length > 0 && showErrors && (
          <div className="bg-yellow-500/10 border-l-4 border-yellow-400 text-yellow-300 p-4 rounded-lg relative mb-6 shadow" role="alert">
              <div className="flex">
                  <div className="py-1"><svg className="fill-current h-6 w-6 text-yellow-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg></div>
                  <div>
                      <p className="font-bold">데이터 처리 경고</p>
                      <ul className="mt-1 list-disc list-inside text-sm">
                          {errors.slice(0,5).map((e,i) => <li key={i}>{e}</li>)}
                          {errors.length > 5 && <li>... and {errors.length - 5} more issues.</li>}
                      </ul>
                  </div>
              </div>
              <button onClick={() => setShowErrors(false)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
                  <svg className="fill-current h-6 w-6 text-yellow-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </button>
          </div>
        )}
        {isCategorizing && (
            <div className="flex items-center justify-center p-2 mb-4 bg-blue-500/10 text-blue-300 rounded-lg text-sm">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                데이터를 추가하고 AI로 재분류하고 있습니다...
            </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default MainLayout;