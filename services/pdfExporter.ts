import { Transaction, BusinessInfo } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to format currency
const formatCurrency = (num: number) => num.toLocaleString('ko-KR') + '원';

/**
 * 섹션별 렌더링 방식의 PDF 생성기
 * - 각 .section을 개별적으로 canvas 캡처
 * - 섹션이 페이지에 들어갈 수 있으면 현재 페이지에 배치
 * - 들어갈 수 없으면 다음 페이지로 넘겨서 표/그래프가 중간에 잘리지 않도록 처리
 */
const generatePdf = async (element: HTMLElement, filename: string) => {
    // Temporarily append to body off-screen
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = 'auto';
    element.style.width = '210mm';
    document.body.appendChild(element);

    try {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const pageMargin = 15;
        const contentWidth = pdfWidth - 2 * pageMargin;
        const usablePageHeight = pdfHeight - 2 * pageMargin;

        // 헤더와 섹션들을 분리
        const header = element.querySelector('.header') as HTMLElement;
        const sections = Array.from(element.querySelectorAll('.section')) as HTMLElement[];

        let currentY = pageMargin; // 현재 Y 위치 (mm)

        // 개별 요소를 캔버스로 캡처하는 헬퍼
        const captureElement = async (el: HTMLElement) => {
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
            });
            return canvas;
        };

        // 캔버스를 PDF에 배치하는 헬퍼 (mm 단위 높이 반환)
        const getCanvasHeightMm = (canvas: HTMLCanvasElement): number => {
            const imgProps = pdf.getImageProperties(canvas.toDataURL('image/png'));
            return (imgProps.height * contentWidth) / imgProps.width;
        };

        // 헤더 렌더링
        if (header) {
            const headerCanvas = await captureElement(header);
            const headerHeightMm = getCanvasHeightMm(headerCanvas);
            pdf.addImage(headerCanvas.toDataURL('image/png'), 'PNG', pageMargin, currentY, contentWidth, headerHeightMm);
            currentY += headerHeightMm + 5; // 헤더 아래 5mm 여백
        }

        // 각 섹션을 순서대로 처리
        for (const section of sections) {
            const sectionCanvas = await captureElement(section);
            const sectionHeightMm = getCanvasHeightMm(sectionCanvas);

            // 남은 공간에 섹션이 들어가는지 확인
            const remainingSpace = usablePageHeight - (currentY - pageMargin);

            if (sectionHeightMm > remainingSpace) {
                // 섹션이 현재 페이지에 안 들어감 → 새 페이지로 이동
                pdf.addPage();
                currentY = pageMargin;
            }

            // 섹션이 한 페이지 전체보다 클 경우 (아주 긴 표): 이미지 슬라이싱으로 처리
            if (sectionHeightMm > usablePageHeight) {
                // 큰 섹션은 기존 슬라이싱 방식으로 처리
                const imgData = sectionCanvas.toDataURL('image/png');
                let heightLeft = sectionHeightMm;
                let position = currentY;

                pdf.addImage(imgData, 'PNG', pageMargin, position, contentWidth, sectionHeightMm);
                heightLeft -= (usablePageHeight - (position - pageMargin));

                while (heightLeft > 0) {
                    pdf.addPage();
                    position = pageMargin - (sectionHeightMm - heightLeft);
                    pdf.addImage(imgData, 'PNG', pageMargin, position, contentWidth, sectionHeightMm);
                    heightLeft -= usablePageHeight;
                }
                currentY = pageMargin + (sectionHeightMm % usablePageHeight || usablePageHeight);
            } else {
                // 정상 배치
                pdf.addImage(sectionCanvas.toDataURL('image/png'), 'PNG', pageMargin, currentY, contentWidth, sectionHeightMm);
                currentY += sectionHeightMm + 4; // 섹션 간 4mm 여백
            }
        }

        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error("PDF 생성 중 오류 발생:", error);
    } finally {
        document.body.removeChild(element);
    }
};

const getPrintableStyles = () => `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Noto Sans KR', sans-serif; color: #000000; line-height: 1.6; }
        .printable-container { width: 210mm; padding: 15mm; background-color: #ffffff; color: #000000; }
        .header { text-align: center; border-bottom: 2px solid #CBD5E1; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin: 0; color: #000000; font-weight: 700; }
        .header p { font-size: 14px; margin: 5px 0; color: #333333; }
        .section { margin-bottom: 25px; background-color: #ffffff; }
        .section-title { font-size: 18px; font-weight: 700; color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 5px; margin-bottom: 15px; }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .kpi-card { border: 1px solid #CBD5E1; border-radius: 8px; padding: 15px; text-align: center; background-color: #F8FAFC; }
        .kpi-card-title { font-size: 14px; color: #333333; margin-bottom: 5px; font-weight: 500; }
        .kpi-card-value { font-size: 22px; font-weight: 700; color: #000000; }
        .table { width: 100%; border-collapse: collapse; font-size: 12px; color: #000000; }
        .table th, .table td { border: 1px solid #CBD5E1; padding: 10px; text-align: left; color: #000000; }
        .table th { background-color: #EEF2FF; font-weight: 600; color: #1e293b; }
        .table td.right, .table th.right { text-align: right; }
        .text-green { color: #15803d !important; }
        .text-red { color: #dc2626 !important; }
        .text-blue { color: #1a56db !important; }
        .font-bold { font-weight: 700; }
        .ai-summary { background-color: #F0F4FF; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; border-left: 4px solid #4338ca; color: #000000; }
        .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ai-section { border: 1px solid #CBD5E1; border-radius: 8px; padding: 15px; }
        .ai-section-title { font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; color: #000000; }
        .ai-list { list-style-position: inside; padding-left: 0; margin: 0; font-size: 13px; color: #000000; }
        .ai-list li { margin-bottom: 8px; color: #000000; }
        .ai-suggestion { border-left: 3px solid #4338ca; padding-left: 15px; margin-bottom: 15px; }
        .ai-suggestion h5 { color: #000000; }
        .ai-suggestion p { color: #1e293b; }
        p { color: #000000; }
        h5 { color: #000000; }
        li { color: #000000; }
        span { color: #000000; }
    </style>
`;


/**
 * 화면에 렌더링된 실제 DOM 요소를 캡처하여 PDF로 변환
 * - Landscape A4 사용 → 11pt 상당 글씨 크기 보장
 * - 한글 헤더를 HTML 캡처로 처리 (jsPDF 한글 미지원 우회)
 * - 차트, 그래프, 표를 포함한 전체 컨텐츠를 그대로 캡처
 * - 섹션별로 나누어 페이지 넘김 처리
 */
export const exportViewToPdf = async (
    contentElement: HTMLElement,
    title: string,
    businessName: string,
    filename: string
) => {
    // Landscape A4: 297mm × 210mm → 넓은 폭으로 글씨 크기 확보 (~11pt)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();   // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight();  // 210mm
    const margin = 10;
    const contentWidth = pdfWidth - 2 * margin;  // 277mm
    const usableHeight = pdfHeight - 2 * margin; // 190mm

    // ── 한글 헤더를 HTML로 만들어 캡처 (jsPDF 한글 깨짐 방지) ──
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'position:absolute;left:-9999px;top:0;width:1200px;background:#fff;padding:20px 30px;font-family:system-ui,-apple-system,sans-serif;';
    headerDiv.innerHTML = `
        <div style="text-align:center;border-bottom:3px solid #1e40af;padding-bottom:12px;">
            <h1 style="font-size:28px;margin:0 0 6px 0;color:#111827;font-weight:800;letter-spacing:-0.5px;">${businessName} — ${title}</h1>
            <p style="font-size:15px;color:#4b5563;margin:0;">보고서 생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>
    `;
    document.body.appendChild(headerDiv);

    try {
        const headerCanvas = await html2canvas(headerDiv, {
            scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
        });
        const headerImgData = headerCanvas.toDataURL('image/png');
        const headerProps = pdf.getImageProperties(headerImgData);
        const headerHeight = (headerProps.height * contentWidth) / headerProps.width;
        pdf.addImage(headerImgData, 'PNG', margin, margin, contentWidth, headerHeight);

        let currentY = margin + headerHeight + 4;

        // ── 컨텐츠 섹션별 캡처 ──
        const sections = Array.from(contentElement.children).filter(
            child => child instanceof HTMLElement
        ) as HTMLElement[];

        for (const section of sections) {
            try {
                const canvas = await html2canvas(section, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: contentElement.scrollWidth || 1200,
                });

                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const sectionHeight = (imgProps.height * contentWidth) / imgProps.width;

                const remaining = usableHeight - (currentY - margin);

                // 섹션이 남은 공간에 안 들어가면 새 페이지
                if (sectionHeight > remaining && currentY > margin + headerHeight + 10) {
                    pdf.addPage();
                    currentY = margin;
                }

                if (sectionHeight > usableHeight) {
                    // 매우 긴 섹션 → 이미지 슬라이싱
                    let heightLeft = sectionHeight;
                    let position = currentY;

                    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, sectionHeight);
                    heightLeft -= (usableHeight - (position - margin));

                    while (heightLeft > 0) {
                        pdf.addPage();
                        position = margin - (sectionHeight - heightLeft);
                        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, sectionHeight);
                        heightLeft -= usableHeight;
                    }
                    currentY = margin + (sectionHeight % usableHeight || usableHeight);
                } else {
                    // 정상 배치
                    pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, sectionHeight);
                    currentY += sectionHeight + 4;
                }
            } catch (err) {
                console.error('섹션 캡처 오류:', err);
            }
        }

        pdf.save(`${filename}.pdf`);
    } finally {
        document.body.removeChild(headerDiv);
    }
};


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
                <tbody>${getCategoryData('income').map(d => `<tr><td>${d.name}</td><td class="right">${formatCurrency(d.value)}</td><td class="right font-bold">${d.percentage}%</td></tr>`).join('') || `<tr><td colspan="3" style="text-align:center; padding: 20px; color: #000000;">데이터가 없습니다.</td></tr>`}</tbody>
            </table>
        </div>
        <div class="section">
            <div class="section-title">지출 카테고리 비중 (Top 10)</div>
            <table class="table">
                <thead><tr><th>카테고리</th><th class="right">금액</th><th class="right">비중</th></tr></thead>
                <tbody>${getCategoryData('expense').map(d => `<tr><td>${d.name}</td><td class="right">${formatCurrency(d.value)}</td><td class="right font-bold">${d.percentage}%</td></tr>`).join('') || `<tr><td colspan="3" style="text-align:center; padding: 20px; color: #000000;">데이터가 없습니다.</td></tr>`}</tbody>
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
                    <div class="ai-section-title" style="color: #d97706;">⚠️ 개선 필요 영역</div>
                    <ul class="ai-list">${Array.from(areasForImprovement).map(p => `<li>${p.textContent}</li>`).join('')}</ul>
                </div>` : ''}
            </div>
            ${marketingSuggestions.length > 0 ? `
            <div class="section">
                <div class="section-title">📈 맞춤형 경영/마케팅 제안</div>
                ${Array.from(marketingSuggestions).map(s => `
                    <div class="ai-suggestion">
                        <h5 style="font-size: 14px; font-weight: bold; margin-bottom: 5px; color: #000000;">${s.querySelector('h5')?.textContent}</h5>
                        <p style="font-size: 13px; color: #1e293b;">${s.querySelector('p')?.textContent}</p>
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
            ${executiveSummary ? `<div class="section"><div class="section-title">Executive Summary</div><p style="font-size:13px; color: #000000;">${executiveSummary}</p></div>` : ''}
            ${financialHealth.length > 0 ? `
            <div class="section">
                <div class="section-title">재무 건전성 분석</div>
                <div class="ai-grid">
                    ${Array.from(financialHealth).map(item => `
                        <div class="ai-section">
                            <div style="display:flex; justify-content: space-between; align-items: baseline;">
                                <h5 class="ai-section-title">${item.querySelector('h5')?.textContent}</h5>
                                <span class="font-bold" style="color: #000000;">${item.querySelector('span')?.textContent}</span>
                            </div>
                            <p style="font-size:12px; color: #1e293b;">${item.querySelector('p')?.textContent}</p>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
            ${strategicRecs.length > 0 ? `
            <div class="section">
                <div class="section-title">전략적 제안</div>
                ${Array.from(strategicRecs).map(item => `
                    <div class="ai-suggestion">
                        <h5 style="font-weight:bold; color: #000000;">${item.querySelector('h5')?.textContent}</h5>
                        <p style="font-size:13px; color: #1e293b;">${item.querySelector('p')?.textContent}</p>
                        <p style="font-size:12px; color: #1e293b;">${item.querySelectorAll('p')[1]?.textContent}</p>
                    </div>
                `).join('')}
            </div>` : ''}
             ${riskAssessment.length > 0 ? `
            <div class="section">
                <div class="section-title">리스크 평가 및 관리 방안</div>
                ${Array.from(riskAssessment).map(item => `
                    <div class="ai-suggestion" style="border-left-color: #dc2626;">
                         <h5 style="font-weight:bold; color: #000000;">${item.querySelector('h5')?.textContent}</h5>
                         <p style="font-size:13px; color: #1e293b;">${item.querySelector('p')?.textContent}</p>
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
