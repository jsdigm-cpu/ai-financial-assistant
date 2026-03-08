import React from 'react';

interface Props {
  title: string;
  value: number;
  formatAsCurrency?: boolean;
  trend?: number;
}

const KPICard: React.FC<Props> = ({ title, value, formatAsCurrency = false, trend }) => {
  const formatCurrencyCompact = (num: number): string => {
    if (Math.abs(num) >= 10000) {
      return `${(num / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`;
    }
    return `${num.toLocaleString('ko-KR')}원`;
  };

  const formattedValue = formatAsCurrency
    ? formatCurrencyCompact(value)
    : new Intl.NumberFormat('ko-KR').format(value);

  const trendColor = trend !== undefined ? (trend >= 0 ? 'text-green-500' : 'text-red-500') : '';
  const TrendIcon = trend !== undefined ? (trend >= 0 ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
  ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
  )) : null;

  return (
    <div className="bg-surface-card p-5 rounded-lg shadow-md border border-border-color">
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <div className="mt-1 flex items-baseline justify-between">
        <p className="text-3xl font-bold text-text-primary">{formattedValue}</p>
        {trend !== undefined && (
          <div className={`flex items-center text-sm font-semibold ${trendColor}`}>
            {TrendIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;