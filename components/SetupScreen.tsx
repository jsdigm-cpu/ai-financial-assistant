import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedData, BusinessInfo, BusinessType, AccountType, UploadedFileInfo } from '../types';
import { parseFile } from '../services/parser';
import { Transaction } from '../types';
import { BUSINESS_PRESETS } from '../constants';
import { setGeminiApiKey } from '../services/geminiService';

interface UploadedFile {
  file: File;
  title: string;
}

interface Props {
  onDataProcessed: (data: ProcessedData, info: BusinessInfo, files: UploadedFileInfo[]) => void;
  onGoBack?: () => void;
  savedSession?: { businessInfo: BusinessInfo; savedAt: string; transactions: any[] } | null;
  onRestoreSession?: () => void;
  onImportSession?: (data: any) => void;
}

const STORAGE_KEY_API = 'ai_finance_gemini_api_key';
const STORAGE_KEY_BIZ = 'ai_finance_last_business_info';

const SetupScreen: React.FC<Props> = ({ onDataProcessed, onGoBack, savedSession, onRestoreSession, onImportSession }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyGuide, setShowApiKeyGuide] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [accountType, setAccountType] = useState<string>(AccountType.SOLE_PROPRIETOR);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    owner: '',
    type: BusinessType.RESTAURANT_GENERAL,
    items: '',
    address: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 저장된 API 키와 사업자 정보 복원
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY_API);
    if (savedKey) {
      setApiKey(savedKey);
      setGeminiApiKey(savedKey);
    }
    const savedBiz = localStorage.getItem(STORAGE_KEY_BIZ);
    if (savedBiz) {
      try {
        const parsed = JSON.parse(savedBiz);
        if (parsed.accountType) setAccountType(parsed.accountType);
        setBusinessInfo(prev => ({ ...prev, ...parsed }));
      } catch (e) { /* 무시 */ }
    }
  }, []);

  // 업종 변경 시 프리셋 자동 채움
  const handleTypeChange = (newType: string) => {
    const preset = BUSINESS_PRESETS[newType as BusinessType];
    setBusinessInfo(prev => ({
      ...prev,
      type: newType,
      // 프리셋이 있고, 사용자가 아직 입력하지 않은 필드만 자동 채움
      items: prev.items || preset?.items || '',
      rawMaterialSuppliers: prev.rawMaterialSuppliers || preset?.rawMaterialSuppliers || '',
      subsidiaryMaterialSuppliers: prev.subsidiaryMaterialSuppliers || preset?.subsidiaryMaterialSuppliers || '',
      onlinePlatforms: prev.onlinePlatforms || preset?.onlinePlatforms || '',
      otherRevenueSources: prev.otherRevenueSources || preset?.otherRevenueSources || '',
      salaryInfo: prev.salaryInfo || preset?.salaryInfo || '',
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file: File) => ({
        file,
        title: file.name
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    if(event.target) {
        event.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileTitleChange = (index: number, newTitle: string) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], title: newTitle };
      return updatedFiles;
    });
  };
  
  const handleInfoChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === 'type') {
      handleTypeChange(value);
    } else {
      setBusinessInfo(prev => ({...prev, [name]: value }));
    }
  }

  const processData = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("Gemini API 키를 입력해주세요.");
      return;
    }
    const isPersonal = accountType === AccountType.PERSONAL;
    if (files.length === 0 || !businessInfo.name || !businessInfo.owner || (!isPersonal && !businessInfo.items)) {
      setError(isPersonal
        ? "이름을 입력하고, 하나 이상의 파일을 업로드해주세요."
        : "상호명, 대표자명, 주요 취급 품목을 입력하고, 하나 이상의 파일을 업로드해주세요.");
      return;
    }

    const finalBusinessInfo = { ...businessInfo, accountType };

    // API 키 설정 및 저장
    setGeminiApiKey(apiKey.trim());
    localStorage.setItem(STORAGE_KEY_API, apiKey.trim());
    localStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(finalBusinessInfo));

    setIsLoading(true);
    setError(null);

    const promises = files.map(f => parseFile(f.file, f.title));
    const results = await Promise.all(promises);

    let allTransactions: Transaction[] = [];
    const allErrors: string[] = [];

    results.forEach(result => {
      allTransactions.push(...result.transactions);
      allErrors.push(...result.errors);
    });
    
    allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    setIsLoading(false);
    
    const fileInfos: UploadedFileInfo[] = files.map(f => ({
      name: f.file.name,
      size: f.file.size,
      title: f.title
    }));
    
    onDataProcessed({ transactions: allTransactions, errors: allErrors }, finalBusinessInfo, fileInfos);

  }, [files, businessInfo, accountType, apiKey, onDataProcessed]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl mx-auto p-8 bg-surface-card rounded-2xl shadow-2xl border border-border-color relative">
            {onGoBack && (
              <button
                onClick={onGoBack}
                title="이전 분석으로 돌아가기"
                aria-label="이전 분석으로 돌아가기"
                className="absolute top-6 left-6 text-text-muted hover:text-text-primary transition-colors z-10 p-2 rounded-full hover:bg-surface-subtle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
              </button>
            )}
            <div className="text-center mb-8">
                <div className="inline-block p-3 bg-brand-primary rounded-xl shadow-lg mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-text-on-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8l3 5m0 0l3-5m-3 5v4m0-4h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-text-primary">AI 통장정리</h1>
                <p className="mt-3 text-md text-text-muted">통장 내역만 올리면, AI가 알아서 수입·지출을 분류하고<br/>한눈에 정리해드립니다.</p>
            </div>

            <div className="space-y-6">
                {/* 이전 분석 불러오기 */}
                {(savedSession || onImportSession) && (
                  <div className="p-5 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-600 mb-3">📂 이전 분석 불러오기</h3>
                    <div className="space-y-3">
                      {savedSession && onRestoreSession && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-text-primary font-medium">{savedSession.businessInfo.name}</p>
                            <p className="text-xs text-text-muted">
                              {new Date(savedSession.savedAt).toLocaleDateString('ko-KR')} 저장 · {savedSession.transactions.length.toLocaleString()}건
                            </p>
                          </div>
                          <button
                            onClick={onRestoreSession}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors"
                          >
                            불러오기
                          </button>
                        </div>
                      )}
                      {onImportSession && (
                        <div className="flex items-center justify-between pt-2 border-t border-border-color">
                          <p className="text-sm text-text-muted">백업 파일(.json)에서 불러오기</p>
                          <label className="px-4 py-2 bg-surface-card hover:bg-surface-subtle text-brand-accent font-semibold rounded-lg text-sm cursor-pointer border border-border-color transition-colors">
                            파일 선택
                            <input
                              type="file"
                              accept=".json"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  try {
                                    const data = JSON.parse(ev.target?.result as string);
                                    if (data.businessInfo && data.transactions) {
                                      onImportSession(data);
                                    } else {
                                      alert('올바른 백업 파일이 아닙니다.');
                                    }
                                  } catch {
                                    alert('파일을 읽을 수 없습니다.');
                                  }
                                };
                                reader.readAsText(file);
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 0: API 키 */}
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-color">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-brand-primary">🔑 Google Gemini API 키</h3>
                        <button 
                            onClick={() => setShowApiKeyGuide(!showApiKeyGuide)}
                            className="text-xs text-brand-accent hover:underline"
                        >
                            {showApiKeyGuide ? '닫기' : 'API 키 발급 방법'}
                        </button>
                    </div>
                    {showApiKeyGuide && (
                        <div className="mb-3 p-3 bg-background-main rounded-md text-sm text-text-muted space-y-1">
                            <p>1. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Google AI Studio</a>에 접속합니다.</p>
                            <p>2. Google 계정으로 로그인합니다.</p>
                            <p>3. "API 키 만들기" 버튼을 클릭합니다.</p>
                            <p>4. 생성된 키를 복사하여 아래에 붙여넣기 합니다.</p>
                            <p className="text-yellow-600 mt-2">⚠️ API 키는 본인만 사용하세요. 타인에게 공유하지 마세요.</p>
                        </div>
                    )}
                    <input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary"
                        placeholder="Gemini API 키를 입력하세요 (AIza...)"
                        autoComplete="off"
                    />
                    {apiKey && <p className="text-xs text-green-600 mt-1">✓ API 키가 입력되었습니다. (브라우저에 안전하게 저장됩니다)</p>}
                </div>

                {/* Step 0.5: 통장 구분 선택 */}
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-color">
                    <h3 className="text-lg font-semibold text-brand-primary mb-3">🏦 통장 구분 선택</h3>
                    <p className="text-sm text-text-muted mb-4">사용하시는 통장 종류를 선택해 주세요. 선택에 따라 최적의 분류 항목이 자동으로 설정됩니다.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { value: AccountType.PERSONAL, label: '개인통장', desc: '개인 생활비, 용돈 관리' },
                            { value: AccountType.SOLE_PROPRIETOR, label: '개인사업자', desc: '자영업, 소상공인 사업용' },
                            { value: AccountType.CORPORATION, label: '법인사업자', desc: '법인 회사 사업용' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setAccountType(opt.value)}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${
                                    accountType === opt.value
                                        ? 'border-brand-primary bg-blue-50 shadow-md'
                                        : 'border-border-color bg-surface-card hover:border-brand-accent'
                                }`}
                            >
                                <div className={`font-bold text-base ${accountType === opt.value ? 'text-brand-primary' : 'text-text-primary'}`}>{opt.label}</div>
                                <div className="text-xs text-text-muted mt-1">{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 1: 기본 정보 */}
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-color space-y-4">
                    <h3 className="text-lg font-semibold text-brand-primary">
                        📋 {accountType === AccountType.PERSONAL ? '기본 정보 입력 (필수)' : '사업 정보 입력 (필수)'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-muted mb-1">
                                {accountType === AccountType.PERSONAL ? '이름 (별칭)' : '상호명'}
                            </label>
                            <input type="text" name="name" id="name" value={businessInfo.name} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" autoComplete="off" placeholder={accountType === AccountType.PERSONAL ? '예: 홍길동' : '예: 토담옛날통닭'}/>
                        </div>
                        <div>
                            <label htmlFor="owner" className="block text-sm font-medium text-text-muted mb-1">
                                {accountType === AccountType.PERSONAL ? '메모 (선택)' : '대표자명'}
                            </label>
                            <input type="text" name="owner" id="owner" value={businessInfo.owner} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" autoComplete="off" placeholder={accountType === AccountType.PERSONAL ? '예: 생활비 통장' : '예: 홍길동'}/>
                        </div>
                        {accountType !== AccountType.PERSONAL && (
                          <>
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-text-muted mb-1">업종 선택 (선택하면 자동 채움)</label>
                                <select name="type" id="type" value={businessInfo.type} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary">
                                    {Object.values(BusinessType).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="items" className="block text-sm font-medium text-text-muted mb-1">주요 취급 품목 (쉼표로 구분)</label>
                                <input type="text" name="items" id="items" value={businessInfo.items} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" autoComplete="off" placeholder="예: 후라이드 치킨, 양념 치킨"/>
                            </div>
                          </>
                        )}
                    </div>
                </div>

                {/* Step 2: 추가 정보 (접이식) - 사업자만 표시 */}
                {accountType !== AccountType.PERSONAL && (
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-color">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between text-left"
                    >
                        <div>
                            <h3 className="text-lg font-semibold text-brand-primary">⚙️ 추가 정보 (선택사항)</h3>
                            <p className="text-xs text-text-muted mt-1">입력하면 AI 분석 정확도가 올라갑니다. 나중에 수정할 수도 있습니다.</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-text-muted transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showAdvanced && (
                        <div className="mt-4 space-y-3">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-text-muted mb-1">사업장 주소 (상권 분석에 활용)</label>
                                <input type="text" name="address" id="address" value={businessInfo.address} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" placeholder="예: 서울특별시 강남구 테헤란로 123" autoComplete="off" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="rawMaterialSuppliers" className="block text-sm font-medium text-text-muted mb-1">주요 원재료 매입처</label>
                                    <input type="text" name="rawMaterialSuppliers" id="rawMaterialSuppliers" value={businessInfo.rawMaterialSuppliers} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" placeholder="예: OO유통, 가나다 식자재" autoComplete="off" />
                                </div>
                                <div>
                                    <label htmlFor="subsidiaryMaterialSuppliers" className="block text-sm font-medium text-text-muted mb-1">부재료/기타 매입처</label>
                                    <input type="text" name="subsidiaryMaterialSuppliers" id="subsidiaryMaterialSuppliers" value={businessInfo.subsidiaryMaterialSuppliers} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" placeholder="예: 포장용기 업체" autoComplete="off" />
                                </div>
                                <div>
                                    <label htmlFor="onlinePlatforms" className="block text-sm font-medium text-text-muted mb-1">온라인/플랫폼 매출처</label>
                                    <input type="text" name="onlinePlatforms" id="onlinePlatforms" value={businessInfo.onlinePlatforms} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" placeholder="예: 배달의민족, 쿠팡이츠" autoComplete="off" />
                                </div>
                                <div>
                                    <label htmlFor="otherRevenueSources" className="block text-sm font-medium text-text-muted mb-1">기타 매출처</label>
                                    <input type="text" name="otherRevenueSources" id="otherRevenueSources" value={businessInfo.otherRevenueSources} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" placeholder="예: 단체 주문 업체" autoComplete="off" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="salaryInfo" className="block text-sm font-medium text-text-muted mb-1">급여 지급 정보</label>
                                <input type="text" name="salaryInfo" id="salaryInfo" value={businessInfo.salaryInfo} onChange={handleInfoChange} className="w-full bg-background-main border border-border-color rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary" placeholder="예: 매월 25일, '급여' 또는 직원 이름 포함" autoComplete="off" />
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* Step 3: 파일 업로드 */}
                <div className="p-5 bg-surface-subtle rounded-lg border border-border-color space-y-4">
                    <h3 className="text-lg font-semibold text-brand-primary">📄 거래내역 파일 업로드 (필수)</h3>
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border-color rounded-lg hover:border-brand-primary transition-colors">
                        <input type="file" id="file-upload" multiple onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv"/>
                        <label htmlFor="file-upload" className="cursor-pointer text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="mt-2 text-sm text-brand-primary font-semibold">클릭하여 파일 선택</p>
                            <p className="text-xs text-text-muted">은행 입출금 내역 Excel/CSV 파일 (여러 개 가능)</p>
                        </label>
                    </div>
                    {files.length > 0 && (
                        <div className="text-sm text-text-primary space-y-2">
                            <p className="font-semibold">선택된 파일 ({files.length}개):</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {files.map((f, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 bg-background-main rounded-md border border-border-color">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-text-muted truncate">{f.file.name}</p>
                                            <input
                                                type="text"
                                                value={f.title}
                                                onChange={(e) => handleFileTitleChange(index, e.target.value)}
                                                className="w-full bg-surface-subtle border border-border-color rounded px-2 py-1 text-sm focus:ring-brand-primary focus:border-brand-primary text-text-primary mt-1"
                                                placeholder="분석용 제목 (예: 신한은행 1분기)"
                                            />
                                        </div>
                                        <button onClick={() => handleRemoveFile(index)} className="text-red-600 hover:text-red-700 p-1" title="삭제">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="text-center mt-6">
                <button
                    onClick={processData}
                    disabled={isLoading}
                    className="w-full md:w-auto inline-flex items-center justify-center px-12 py-4 bg-brand-primary hover:bg-brand-secondary text-text-on-light font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-on-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            파일 분석 중...
                        </>
                    ) : (
                        '🚀 AI 분석 시작'
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

export default SetupScreen;
