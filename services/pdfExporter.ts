import { Transaction, BusinessInfo } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to format currency
const formatCurrency = (num: number) => num.toLocaleString('ko-KR') + '원';

// Common function to generate and download PDF from a prepared HTML element
const generatePdf = async (element: HTMLElement, filename: string) => {
    // Temporarily append to body to ensure styles are applied, but keep it off-screen
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = 'auto';
    element.style.width = '210mm'; // A4 width
    document.body.appendChild(element);

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const pageMargin = 15;
        const contentWidth = pdfWidth - 2 * pageMargin;
        const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
        const pageHeight = pdfHeight - 2 * pageMargin;

        let heightLeft = contentHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', pageMargin, pageMargin, contentWidth, contentHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position -= pageHeight + pageMargin;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', pageMargin, position + pageMargin, contentWidth, contentHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error("PDF 생성 중 오류 발생:", error);
    } finally {
        // Clean up the temporary element
        document.body.removeChild(element);
    }
};

const getPrintableStyles = () => `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        body { font-family: 'Noto Sans KR', sans-serif; color: #1E293B; line-height: 1.6; }
        .printable-container { width: 210mm; padding: 15mm; box-sizing: border-box; background-color: white; }
        .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin: 0; color: #0F172A; font-weight: 700; }
        .header p { font-size: 14px; margin: 5px 0; color: #475569; }
        .section { margin-bottom: 25px; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: 700; color: #2563EB; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 15px; }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .kpi-card { border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; text-align: center; background-color: #F8FAFC; }
        .kpi-card-title { font-size: 14px; color: #475569; margin-bottom: 5px; font-weight: 500;}
        .kpi-card-value { font-size: 22px; font-weight: 700; color: #0F172A; }
        .table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .table th, .table td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; }
        .table th { background-color: #F1F5F9; font-weight: 500; }
        .table td.right, .table th.right { text-align: right; }
        .text-green { color: #16A34A; }
        .text-red { color: #DC2626; }
        .text-blue { color: #2563EB; }
        .font-bold { font-weight: 700; }
        .ai-summary { background-color: #F1F5F9; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; border-left: 4px solid #4F46E5;}
        .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ai-section { border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; }
        .ai-section-title { font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;}
        .ai-list { list-style-position: inside; padding-left: 0; margin: 0; font-size: 13px; }
        .ai-list li { margin-bottom: 8px; }
        .ai-suggestion { border-left: 3px solid #4F46E5; padding-left: 15px; margin-bottom: 15px; }
    </style>
`;


export const exportDashboardToPdf = (transactions: Transaction[], businessInfo: BusinessInfo, filename: string) => {
    const kpis = transactions.reduce((acc, t) => {
        acc.totalIncome += t.credit;
        acc.totalExpense += t.debit;
        return acc;
    }, { totalIncome: 0, totalExpense: 0, netProfit: 0 });
    kpis.netProfit = kpis.totalIncome - kpis.totalExpense;

    const monthlyData = Object.values(transactions.reduce((acc, tx) => {
        const month = tx.date.toISOString().slice(0, 7);
        if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0, profit: 0 };
        acc[month].income += tx.credit;
        acc[month].expense += tx.debit;
        acc[month].profit += tx.credit - tx.debit;
        return acc;
    }, {} as Record<string, { name: string, income: number, expense: number, profit: number }>)).sort((a, b) => a.name.localeCompare(b.name));

    const getCategoryData = (type: 'income' | 'expense') => {
        let total = 0;
        const categoryMap: Record<string, number> = {};
        
        transactions.forEach(tx => {
            const amount = type === 'income' ? tx.credit : tx.debit;
             if (amount > 0) {
                 total += type === 'income' ? tx.credit : tx.debit;
                 if (!['기타 매출', '기타 비용'].includes(tx.category)) {
                     categoryMap[tx.category] = (categoryMap[tx.category] || 0) + amount;
                 }
             }
        });
        
        const relevantTotal = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

        return Object.entries(categoryMap)
            .sort(([,a], [,b]) => b-a)
            .slice(0, 10)
            .map(([name, value]) => ({
                name, value, percentage: relevantTotal > 0 ? ((value / relevantTotal) * 100).toFixed(1) : '0.0'
            }));
    };

    const printableElement = document.createElement('div');
    printableElement.className = 'printable-container';
    printableElement.innerHTML = `
        ${getPrintableStyles()}
        <div class="header">
            <h1>${businessInfo.name} - 종합 대시보드</h1>
            <p>보고서 생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>
        <div class="section">
            <div class="section-title">핵심 지표(KPI)</div>
            <div class="kpi-grid">
                <div class="kpi-card"><div class="kpi-card-title">총 수입</div><div class="kpi-card-value text-green">${formatCurrency(kpis.totalIncome)}</div></div>
                <div class="kpi-card"><div class="kpi-card-title">총 지출</div><div class="kpi-card-value text-red">${formatCurrency(kpis.totalExpense)}</div></div>
                <div class="kpi-card"><div class="kpi-card-title">순이익</div><div class="kpi-card-value ${kpis.netProfit >= 0 ? 'text-blue' : 'text-red'}">${formatCurrency(kpis.netProfit)}</div></div>
            </div>
        </div>
        <div class="section">
            <div class="section-title">월별 재무 현황</div>
            <table class="table">
                <thead><tr><th>월</th><th class="right">총 수입</th><th class="right">총 지출</th><th class="right">순이익</th></tr></thead>
                <tbody>
                    ${monthlyData.map(d => `
                        <tr>
                            <td>${d.name}</td>
                            <td class="right text-green">${formatCurrency(d.income)}</td>
                            <td class="right text-red">${formatCurrency(d.expense)}</td>
                            <td class="right font-bold ${d.profit >= 0 ? 'text-blue' : 'text-red'}">${formatCurrency(d.profit)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div class="section">
            <div class="section-title">수입 카테고리 비중 (Top 10)</div>
            <table class="table">
                <thead><tr><th>카테고리</th><th class="right">금액</th><th class="right">비중</th></tr></thead>
                <tbody>${getCategoryData('income').map(d => `<tr><td>${d.name}</td><td class="right">${formatCurrency(d.value)}</td><td class="right font-bold">${d.percentage}%</td></tr>`).join('') || `<tr><td colspan="3" style="text-align:center; padding: 20px;">데이터가 없습니다.</td></tr>`}</tbody>
            </table>
        </div>
        <div class="section">
            <div class="section-title">지출 카테고리 비중 (Top 10)</div>
            <table class="table">
                <thead><tr><th>카테고리</th><th class="right">금액</th><th class="right">비중</th></tr></thead>
                <tbody>${getCategoryData('expense').map(d => `<tr><td>${d.name}</td><td class="right">${formatCurrency(d.value)}</td><td class="right font-bold">${d.percentage}%</td></tr>`).join('') || `<tr><td colspan="3" style="text-align:center; padding: 20px;">데이터가 없습니다.</td></tr>`}</tbody>
            </table>
        </div>
    `;

    generatePdf(printableElement, filename);
};


export const exportAIReportToPdf = (reportElement: HTMLElement, businessInfo: BusinessInfo, filename: string) => {
    
    // Scrape data from the rendered report element
    const summaryEl = Array.from(reportElement.querySelectorAll('h4')).find(el => el.textContent?.includes('종합 재무 요약'));
    const isSummaryReport = !!summaryEl;
    let contentHtml = '';

    if (isSummaryReport) {
        const summary = summaryEl?.nextElementSibling?.textContent || '요약 정보를 불러올 수 없습니다.';
        const positivePoints = Array.from(reportElement.querySelectorAll('h5')).find(el => el.textContent?.includes('긍정적'))?.nextElementSibling?.querySelectorAll('li') || [];
        const areasForImprovement = Array.from(reportElement.querySelectorAll('h5')).find(el => el.textContent?.includes('개선'))?.nextElementSibling?.querySelectorAll('li') || [];
        const marketingSuggestions = Array.from(reportElement.querySelectorAll('h4')).find(el => el.textContent?.includes('맞춤형'))?.nextElementSibling?.children || [];

        contentHtml = `
            <div class="section">
                <div class="section-title">종합 재무 요약</div>
                <div class="ai-summary">${summary}</div>
            </div>
            <div class="section ai-grid">
                ${positivePoints.length > 0 ? `
                <div class="ai-section">
                    <div class="ai-section-title text-green">✅ 긍정적 측면</div>
                    <ul class="ai-list">${Array.from(positivePoints).map(p => `<li>${p.textContent}</li>`).join('')}</ul>
                </div>` : ''}
                ${areasForImprovement.length > 0 ? `
                <div class="ai-section">
                    <div class="ai-section-title" style="color: #F59E0B;">⚠️ 개선 필요 영역</div>
                    <ul class="ai-list">${Array.from(areasForImprovement).map(p => `<li>${p.textContent}</li>`).join('')}</ul>
                </div>` : ''}
            </div>
            ${marketingSuggestions.length > 0 ? `
            <div class="section">
                <div class="section-title">📈 맞춤형 경영/마케팅 제안</div>
                ${Array.from(marketingSuggestions).map(s => `
                    <div class="ai-suggestion">
                        <h5 style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${s.querySelector('h5')?.textContent}</h5>
                        <p style="font-size: 13px; color: #475569;">${s.querySelector('p')?.textContent}</p>
                    </div>
                `).join('')}
            </div>` : ''}
        `;
    } else { // Deep Dive Report
        const executiveSummary = Array.from(reportElement.querySelectorAll('h4')).find(el => el.textContent?.includes('Executive Summary'))?.nextElementSibling?.textContent || '';
        const financialHealth = Array.from(reportElement.querySelectorAll('h4')).find(el => el.textContent?.includes('재무 건전성 분석'))?.nextElementSibling?.children || [];
        const strategicRecs = Array.from(reportElement.querySelectorAll('h4')).find(el => el.textContent?.includes('전략적 제안'))?.nextElementSibling?.children || [];
        const riskAssessment = Array.from(reportElement.querySelectorAll('h4')).find(el => el.textContent?.includes('리스크 평가'))?.nextElementSibling?.children || [];

         contentHtml = `
            ${executiveSummary ? `<div class="section"><div class="section-title">Executive Summary</div><p style="font-size:13px;">${executiveSummary}</p></div>` : ''}
            ${financialHealth.length > 0 ? `
            <div class="section">
                <div class="section-title">재무 건전성 분석</div>
                <div class="ai-grid">
                    ${Array.from(financialHealth).map(item => `
                        <div class="ai-section">
                            <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                <h5 class="ai-section-title">${item.querySelector('h5')?.textContent}</h5>
                                <span class="font-bold">${item.querySelector('span')?.textContent}</span>
                            </div>
                            <p style="font-size:12px;">${item.querySelector('p')?.textContent}</p>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
            ${strategicRecs.length > 0 ? `
            <div class="section">
                <div class="section-title">전략적 제안</div>
                ${Array.from(strategicRecs).map(item => `
                    <div class="ai-suggestion">
                        <h5 style="font-weight:bold;">${item.querySelector('h5')?.textContent}</h5>
                        <p style="font-size:13px;">${item.querySelector('p')?.textContent}</p>
                        <p style="font-size:12px; color:#475569;">${item.querySelectorAll('p')[1]?.textContent}</p>
                    </div>
                `).join('')}
            </div>` : ''}
             ${riskAssessment.length > 0 ? `
            <div class="section">
                <div class="section-title">리스크 평가 및 관리 방안</div>
                ${Array.from(riskAssessment).map(item => `
                    <div class="ai-suggestion" style="border-left-color: #EF4444;">
                         <h5 style="font-weight:bold;">${item.querySelector('h5')?.textContent}</h5>
                         <p style="font-size:13px;">${item.querySelector('p')?.textContent}</p>
                    </div>
                `).join('')}
            </div>` : ''}
         `;
    }

    const printableElement = document.createElement('div');
    printableElement.className = 'printable-container';
    printableElement.innerHTML = `
        ${getPrintableStyles()}
        <div class="header">
            <h1>${businessInfo.name} - AI 재무 분석 리포트</h1>
            <p>보고서 생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>
        ${contentHtml}
    `;

    generatePdf(printableElement, filename);
};