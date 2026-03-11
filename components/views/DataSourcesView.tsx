import React from 'react';
import { BusinessInfo, UploadedFileInfo } from '../../types';

interface Props {
  businessInfo: BusinessInfo;
  uploadedFiles: UploadedFileInfo[];
}

const InfoRow: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border-color last:border-b-0">
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd className="col-span-2 text-sm text-text-primary">{value}</dd>
    </div>
  );
};

const DataSourcesView: React.FC<Props> = ({ businessInfo, uploadedFiles }) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-text-inverted">분석 데이터 정보</h2>
        <p className="mt-1 text-text-inverted-muted">처음에 입력한 사업 정보와 업로드한 통장 파일 목록을 확인하는 화면입니다. 잘못된 정보가 있으면 '새 분석' 버튼을 눌러 다시 시작할 수 있습니다.</p>
      </div>

      <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
        <h3 className="text-xl font-semibold text-text-primary mb-4 border-b border-border-color pb-3">
          사업 정보
        </h3>
        <dl>
          <InfoRow label="상호명" value={businessInfo.name} />
          <InfoRow label="대표자명" value={businessInfo.owner} />
          <InfoRow label="업종" value={businessInfo.type} />
          <InfoRow label="주요 취급 품목" value={businessInfo.items} />
          <InfoRow label="사업장 주소" value={businessInfo.address} />
          <InfoRow label="주요 원재료 매입처" value={businessInfo.rawMaterialSuppliers} />
          <InfoRow label="주요 부재료/기타 매입처" value={businessInfo.subsidiaryMaterialSuppliers} />
          <InfoRow label="온라인 판매 플랫폼" value={businessInfo.onlinePlatforms} />
          <InfoRow label="기타 주요 매출처" value={businessInfo.otherRevenueSources} />
          <InfoRow label="급여 지급 정보" value={businessInfo.salaryInfo} />
        </dl>
      </div>
      
      <div className="bg-surface-card p-6 rounded-xl shadow-lg border border-border-color">
        <h3 className="text-xl font-semibold text-text-primary mb-4 border-b border-border-color pb-3">
          업로드된 파일 목록 ({uploadedFiles.length}개)
        </h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
                <thead className="bg-slate-100">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">분석용 제목</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">원본 파일명</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">파일 크기</th>
                    </tr>
                </thead>
                <tbody className="bg-surface-card divide-y divide-border-color">
                    {uploadedFiles.map((file, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-primary">{file.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{file.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text-primary">{formatBytes(file.size)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesView;