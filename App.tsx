import React, { useState, useCallback } from 'react';
import { ProcessedData, UploadedFileInfo } from './types';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import { BusinessInfo } from './types';

const App: React.FC = () => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[] | null>(null);

  const [previousState, setPreviousState] = useState<{
    processedData: ProcessedData | null;
    businessInfo: BusinessInfo | null;
    uploadedFiles: UploadedFileInfo[] | null;
  } | null>(null);

  const handleDataProcessed = useCallback((data: ProcessedData, info: BusinessInfo, files: UploadedFileInfo[]) => {
    setProcessedData(data);
    setBusinessInfo(info);
    setUploadedFiles(files);
    setPreviousState(null); // A new analysis has started, clear any previous state
  }, []);
  
  const handleReset = useCallback(() => {
    // Save the current state before resetting
    setPreviousState({ processedData, businessInfo, uploadedFiles });
    
    // Reset the current state
    setProcessedData(null);
    setBusinessInfo(null);
    setUploadedFiles(null);
  }, [processedData, businessInfo, uploadedFiles]);

  const handleGoBack = useCallback(() => {
    if (previousState) {
      setProcessedData(previousState.processedData);
      setBusinessInfo(previousState.businessInfo);
      setUploadedFiles(previousState.uploadedFiles);
      setPreviousState(null); // Clear the previous state after restoring
    }
  }, [previousState]);

  return (
    <div className="min-h-screen bg-background-main font-sans">
      {!processedData || !businessInfo || !uploadedFiles ? (
        <SetupScreen 
            onDataProcessed={handleDataProcessed} 
            onGoBack={previousState ? handleGoBack : undefined}
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