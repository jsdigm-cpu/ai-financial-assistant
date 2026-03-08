import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  mainText?: string;
  progressMessages?: string[];
  estimatedDuration?: number; // in seconds
}

const LoadingModal: React.FC<Props> = ({ 
  isOpen, 
  mainText = "AI가 데이터를 분석하고 있습니다...", 
  progressMessages = ["잠시만 기다려주세요..."],
  estimatedDuration = 45
}) => {
  const [currentMessage, setCurrentMessage] = useState(progressMessages[0] || '');
  const [timeLeft, setTimeLeft] = useState(estimatedDuration);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state when modal opens
    setTimeLeft(estimatedDuration);
    setCurrentMessage(progressMessages[0] || '');

    // Message cycling interval
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % progressMessages.length;
      setCurrentMessage(progressMessages[messageIndex]);
    }, 4000); // Change message every 4 seconds

    // Countdown timer interval
    const timerInterval = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(timerInterval);
    };
  }, [isOpen, progressMessages, estimatedDuration]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center transition-opacity duration-300 animate-fade-in">
      <div className="bg-surface-card rounded-xl shadow-2xl p-8 text-center max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-slide-up border border-border-color">
        <div className="mb-4">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">{mainText}</h3>
        <div className="h-10 flex items-center justify-center">
            <p className="text-text-muted transition-opacity duration-500">{currentMessage}</p>
        </div>
        <div className="mt-4 text-sm text-text-muted">
            예상 완료 시간: <span className="font-semibold text-brand-primary">{timeLeft}</span>초
        </div>
      </div>
       <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LoadingModal;