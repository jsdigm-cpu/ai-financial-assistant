import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedData, UploadedFileInfo } from './types';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import { BusinessInfo } from './types';

// ============================================================
// 세션 저장/복원 키 및 유틸리티
// ============================================================
const SESSION_KEY = 'ai_tongjang_last_session';

interface SavedSession {
  businessInfo: BusinessInfo;
  uploadedFiles: UploadedFileInfo[];
  transactions: any[]; // Date가 string으로 직렬화됨
  savedAt: string;
}

// localStorage에서 저장된 세션 확인
function getSavedSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SavedSession;
    if (!session.businessInfo || !session.transactions || session.transactions.length === 0) return null;
    return session;
  } catch {
    return null;
  }
}

// 거래 데이터의 date 필드를 Date 객체로 복원
function restoreTransactionDates(transactions: any[]): any[] {
  return transactions.map(t => ({
    ...t,
    date: new Date(t.date),
  }));
}

const App: React.FC = () => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[] | null>(null);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  const [previousState, setPreviousState] = useState<{
    processedData: ProcessedData | null;
    businessInfo: BusinessInfo | null;
    uploadedFiles: UploadedFileInfo[] | null;
  } | null>(null);

  // 앱 시작 시 저장된 세션 확인
  useEffect(() => {
    const session = getSavedSession();
    if (session) {
      setSavedSession(session);
    }
  }, []);

  const handleDataProcessed = useCallback((data: ProcessedData, info: BusinessInfo, files: UploadedFileInfo[]) => {
    setProcessedData(data);
    setBusinessInfo(info);
    setUploadedFiles(files);
    setPreviousState(null);
    setSavedSession(null);
  }, []);

  // 이전 분석 불러오기
  const handleRestoreSession = useCallback(() => {
    if (!savedSession) return;
    const restoredTransactions = restoreTransactionDates(savedSession.transactions);
    
    // 카테고리/규칙도 localStorage에 저장 (MainLayout이 이를 읽어옴)
    if ((savedSession as any).categories) {
      const userKey = `financial_dashboard_user_${savedSession.businessInfo.name}_${savedSession.businessInfo.owner}`;
      localStorage.setItem(userKey, JSON.stringify({
        categories: (savedSession as any).categories,
        categoryRules: (savedSession as any).categoryRules || [],
      }));
    }
    
    setProcessedData({
      transactions: restoredTransactions,
      errors: [],
    });
    setBusinessInfo(savedSession.businessInfo);
    setUploadedFiles(savedSession.uploadedFiles);
    setSavedSession(null);
  }, [savedSession]);

  // JSON 파일에서 분석 데이터 불러오기
  const handleImportSession = useCallback((data: SavedSession) => {
    const restoredTransactions = restoreTransactionDates(data.transactions);
    
    // 카테고리/규칙도 localStorage에 저장
    if ((data as any).categories) {
      const userKey = `financial_dashboard_user_${data.businessInfo.name}_${data.businessInfo.owner}`;
      localStorage.setItem(userKey, JSON.stringify({
        categories: (data as any).categories,
        categoryRules: (data as any).categoryRules || [],
      }));
    }
    
    setProcessedData({
      transactions: restoredTransactions,
      errors: [],
    });
    setBusinessInfo(data.businessInfo);
    setUploadedFiles(data.uploadedFiles);
    setSavedSession(null);
  }, []);
  
  const handleReset = useCallback(() => {
    setPreviousState({ processedData, businessInfo, uploadedFiles });
    setProcessedData(null);
    setBusinessInfo(null);
    setUploadedFiles(null);
    // 저장된 세션 다시 확인
    const session = getSavedSession();
    if (session) setSavedSession(session);
  }, [processedData, businessInfo, uploadedFiles]);

  const handleGoBack = useCallback(() => {
    if (previousState) {
      setProcessedData(previousState.processedData);
      setBusinessInfo(previousState.businessInfo);
      setUploadedFiles(previousState.uploadedFiles);
      setPreviousState(null);
    }
  }, [previousState]);

  return (
    <div className="min-h-screen bg-background-main font-sans">
      {!processedData || !businessInfo || !uploadedFiles ? (
        <SetupScreen 
            onDataProcessed={handleDataProcessed} 
            onGoBack={previousState ? handleGoBack : undefined}
            savedSession={savedSession}
            onRestoreSession={handleRestoreSession}
            onImportSession={handleImportSession}
        />
      ) : (
        <MainLayout 
          initialData={processedData} 
          businessInfo={businessInfo} 
          uploadedFiles={uploadedFiles}
          onReset={handleReset} 
        />
      )}
    </div>
  );
};

export default App;
