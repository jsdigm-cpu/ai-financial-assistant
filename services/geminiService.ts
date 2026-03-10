import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, BusinessInfo, AIReport, Category, CategoryRule, DeepDiveAIReport, LocationAnalysisReport } from '../types';
import { DEFAULT_CATEGORY_INCOME, DEFAULT_CATEGORY_EXPENSE, DEFAULT_CATEGORIES, CATEGORY_NON_OPERATING_INCOME, CATEGORY_NON_OPERATING_EXPENSE, normalizeCategoryName } from "../constants";

// API 키를 UI에서 입력받아 모듈 레벨에서 관리
let _apiKey: string | undefined;

export const setGeminiApiKey = (key: string) => {
    _apiKey = key;
};

export const getGeminiApiKey = (): string | undefined => _apiKey;

const getApiKey = () => _apiKey;

// Helper to handle cases where API key is not set
const handleNoApiKey = <T,>(fallback: T) => {
    console.warn("API_KEY is not set. Returning sample/fallback data.");
    return new Promise<T>(resolve => setTimeout(() => resolve(fallback), 1000));
};

const getBusinessDetailsForPrompt = (info: BusinessInfo): string => {
    let details = `- 업종: ${info.type}\n- 주요 취급 품목/서비스: ${info.items}`;
    if (info.address) details += `\n- 사업장 주소: ${info.address}`;
    if (info.rawMaterialSuppliers) details += `\n- 주요 원재료 매입처: ${info.rawMaterialSuppliers}`;
    if (info.subsidiaryMaterialSuppliers) details += `\n- 주요 부재료/기타 매입처: ${info.subsidiaryMaterialSuppliers}`;
    if (info.onlinePlatforms) details += `\n- 온라인/플랫폼 매출처: ${info.onlinePlatforms}`;
    if (info.otherRevenueSources) details += `\n- 기타 주요 매출처: ${info.otherRevenueSources}`;
    if (info.salaryInfo) details += `\n- 급여 지급 정보: ${info.salaryInfo}`;
    return details;
};

const getSampleReport = (): AIReport => ({
    summary: "API 키가 설정되지 않았습니다. 이것은 샘플 분석 보고서입니다. 전반적으로 안정적인 매출 흐름을 보이나, 특정 비용 항목의 변동성이 크게 나타나고 있습니다. 특히 식자재 비용과 광고비 지출 패턴에 대한 심층 분석이 필요합니다.",
    positivePoints: [ "꾸준한 월별 매출 발생", "고정비 지출이 일정 수준으로 관리되고 있음", "높은 재방문 고객 비율로 추정되는 안정적 입금 패턴" ],
    areasForImprovement: [ "월말에 집중되는 높은 변동비 지출", "플랫폼 수수료 비중이 전체 비용의 상당 부분을 차지", "현금 흐름 변동성이 커, 예비 자금 확보 필요" ],
    actionableSuggestions: [ { title: "점심 시간대 타겟 프로모션", description: "거래 데이터 분석 결과, 점심 시간대 매출이 가장 높습니다. 이 시간대에 '오늘의 할인 메뉴' 또는 '세트 메뉴 할인'을 제공하여 객단가를 높이는 전략을 추천합니다." }, { title: "단골 고객 확보를 위한 쿠폰/스탬프 제도", description: "안정적인 매출 유지를 위해 단골 고객 관리가 중요합니다. 10회 방문 시 음료 또는 사이드 메뉴를 무료로 제공하는 스탬프 제도를 도입하여 고객 충성도를 높일 수 있습니다." }, { title: "현금 흐름 개선을 위한 주별 비용 예산 설정", description: "월말에 비용이 집중되는 패턴을 완화하기 위해, 주별로 식자재 및 기타 변동비 예산을 설정하고 지출을 관리하여 월 전체에 걸쳐 안정적인 현금 흐름을 유지하는 것이 중요합니다." } ]
});

const getSampleDeepDiveReport = (): DeepDiveAIReport => ({
    executiveSummary: "API 키가 설정되지 않았습니다. 이것은 샘플 심층 분석 보고서입니다. 본 비즈니스는 안정적인 매출 기반을 갖추고 있으나, 비용 구조 및 현금 흐름 관리에서 개선의 여지가 있습니다. 핵심 강점은 꾸준한 고객 유입이며, 약점은 높은 변동비 비중입니다. 디지털 마케팅을 통한 신규 고객층 확보와 원가 절감을 통한 수익성 개선이 주요 기회 요인으로 작용할 것입니다.",
    financialHealthAnalysis: [
        { title: "수익성 분석", analysis: "매출은 안정적이나, 원자재 가격 상승으로 인해 매출 총이익률이 소폭 하락하는 추세입니다. 판관비, 특히 광고비 지출의 효율성을 검토할 필요가 있습니다.", score: 7 },
        { title: "유동성 분석", analysis: "월말에 현금 흐름이 급격히 악화되는 패턴이 반복됩니다. 단기 부채 상환 능력은 양호하나, 예상치 못한 지출에 대비한 예비 현금 보유량이 부족한 상태입니다.", score: 6 },
        { title: "효율성 분석", analysis: "재고 자산 회전율은 업종 평균 수준을 유지하고 있습니다. 다만, 특정 품목의 재고가 과다하게 쌓이는 경향이 있어, 재고 관리 시스템의 도입을 고려해볼 수 있습니다.", score: 8 }
    ],
    strategicRecommendations: [
        { title: "비용 구조 최적화", description: "상위 3개 지출 항목의 공급업체를 대상으로 분기별 단가 협상을 정례화하고, 대체 공급업체를 발굴하여 원가 경쟁력을 확보해야 합니다.", expectedImpact: "연간 약 5-7%의 원가 절감 효과 기대" },
        { title: "객단가 상승 전략", description: "주요 메뉴와 함께 구매율이 높은 사이드 메뉴를 묶어 '추천 세트'를 구성하고, 계산 시 추가 구매를 유도하는 '업셀링(up-selling)' 전략을 도입합니다.", expectedImpact: "객단가 10% 상승 및 추가 이익 확보" },
        { title: "데이터 기반 마케팅", description: "POS 데이터를 활용하여 요일별, 시간대별 인기 메뉴를 분석하고, 비인기 시간대 방문 고객을 대상으로 한 타겟 할인 프로모션을 진행하여 매출을 극대화합니다.", expectedImpact: "전체 매출의 5% 추가 성장 가능" }
    ],
    riskAssessment: [
        { risk: "주요 식자재 공급업체 의존도", mitigation: "현재 80% 이상을 차지하는 주 공급업체 비중을 60% 이하로 낮추고, 최소 2개 이상의 보조 공급업체를 확보하여 공급망 리스크를 분산시켜야 합니다." },
        { risk: "급격한 최저임금 인상", mitigation: "단순 반복 업무에 대해 자동화 설비(예: 키오스크) 도입을 검토하고, 직원 교육을 통해 다기능 인력으로 양성하여 인력 운영의 효율성을 높여야 합니다." }
    ]
});

const getSampleLocationAnalysisReport = (): LocationAnalysisReport => ({
    swotAnalysis: {
        strengths: ["API 키가 설정되지 않았습니다.", "이것은 샘플 분석입니다: 뛰어난 맛과 품질", "단골 고객층 확보"],
        weaknesses: ["상대적으로 높은 가격대", "배달 서비스 미비"],
        opportunities: ["주변 오피스 상권의 점심 수요", "온라인/SNS를 통한 신규 고객 유치"],
        threats: ["유사 메뉴를 제공하는 신규 경쟁자 등장", "원자재 가격의 지속적인 상승"]
    },
    competitorAnalysis: [
        { competitorName: "샘플치킨 A", description: "저가형 프랜차이즈, 빠른 배달이 특징", strength: "가격 경쟁력, 높은 브랜드 인지도", weakness: "맛의 일관성 부족, 낮은 객단가" },
        { competitorName: "샘플치킨 B", description: "프리미엄 수제 치킨, 다양한 사이드 메뉴", strength: "고품질 재료, 독특한 메뉴 구성", weakness: "높은 가격, 긴 조리 시간" }
    ],
    positioningMap: {
        xAxis: { label: "가격", min: "저가", max: "고가" },
        yAxis: { label: "품질/맛", min: "대중적", max: "프리미엄" },
        points: [
            { name: "내 가게", x: 5, y: 8, isSelf: true },
            { name: "샘플치킨 A", x: -7, y: -5, isSelf: false },
            { name: "샘플치킨 B", x: 8, y: 7, isSelf: false }
        ]
    },
    marketingMix4P: {
        product: [{ title: "점심 특선 세트 개발", description: "주변 직장인을 타겟으로 한 1인용 치킨+덮밥 세트 메뉴를 개발하여 새로운 매출 기회를 창출합니다." }],
        price: [{ title: "세트 메뉴 할인", description: "기존 메뉴를 2~3개 묶어 10% 할인된 가격의 세트 메뉴를 구성하여 객단가를 높입니다." }],
        place: [{ title: "배달 플랫폼 입점", description: "배달의민족, 쿠팡이츠 등 주요 배달 플랫폼에 입점하여 매장 방문이 어려운 원거리 고객을 확보합니다." }],
        promotion: [{ title: "SNS 리뷰 이벤트", description: "인스타그램, 네이버 방문자 리뷰 작성 시 음료수나 사이드 메뉴를 서비스로 제공하여 온라인 바이럴을 유도합니다." }]
    }
});


const calculateFinancialMetrics = (transactions: Transaction[], categories: Category[]) => {
    const categoryTypeMap = new Map(categories.map(c => [c.name, c.type]));

    const metrics = transactions.reduce((acc, t) => {
        const type = categoryTypeMap.get(t.category);
        if (type === 'non_operating_income') {
            acc.nonOperatingIncome += t.credit;
        } else if (type === 'non_operating_expense') {
            acc.nonOperatingExpense += t.debit;
        } else if (type === 'operating_income') {
            acc.operatingRevenue += t.credit;
        } else if (type === 'operating_expense') {
            acc.operatingExpense += t.debit;
        }
        return acc;
    }, {
        operatingRevenue: 0,
        operatingExpense: 0,
        nonOperatingIncome: 0,
        nonOperatingExpense: 0,
    });

    const operatingProfit = metrics.operatingRevenue - metrics.operatingExpense;
    const nonOperatingProfit = metrics.nonOperatingIncome - metrics.nonOperatingExpense;
    const netProfit = operatingProfit + nonOperatingProfit;

    return { ...metrics, operatingProfit, nonOperatingProfit, netProfit };
};


export const generateFinancialReport = async (
    transactions: Transaction[],
    info: BusinessInfo,
    categories: Category[],
): Promise<AIReport> => {
  if (!getApiKey()) return handleNoApiKey(getSampleReport());

  const ai = new GoogleGenAI({ apiKey: getApiKey()! });
  const metrics = calculateFinancialMetrics(transactions, categories);

  const prompt = `당신은 소상공인 전문 재무 분석가입니다. 다음 비즈니스 정보와 회계 기준에 따라 정리된 재무 지표를 바탕으로 분석 보고서를 작성해주세요.
    **비즈니스 정보:** 
    - 상호명: ${info.name}
${getBusinessDetailsForPrompt(info)}
    
    **핵심 재무 지표:**
    - **총 매출 (영업 수익):** ${metrics.operatingRevenue.toLocaleString()}원
    - **영업 비용:** ${metrics.operatingExpense.toLocaleString()}원
    - **영업 이익:** ${metrics.operatingProfit.toLocaleString()}원 (사업 본연의 수익성을 나타내는 가장 중요한 지표)
    - **영업외 손익:** ${metrics.nonOperatingProfit.toLocaleString()}원 (영업외 수익: ${metrics.nonOperatingIncome.toLocaleString()}원, 사업외 지출: ${metrics.nonOperatingExpense.toLocaleString()}원)
    - **당기 순이익:** ${metrics.netProfit.toLocaleString()}원
    
    **요청사항:**
    1.  **재무 요약 (summary):** **영업 이익**을 중심으로 비즈니스의 핵심 성과를 3-4문장으로 요약해주세요. 영업외 손익이 재무 상태에 미친 영향도 간략히 언급해주세요.
    2.  **긍정적 측면 (positivePoints):** 데이터에서 발견된 긍정적인 점 3가지를 **영업 활동**을 중심으로 구체적으로 제시해주세요.
    3.  **개선 필요 영역 (areasForImprovement):** 가장 시급하게 개선이 필요한 문제점 3가지를 **영업 비용 구조 또는 매출 증대** 관점에서 지적해주세요.
    4.  **맞춤형 실행 전략 (actionableSuggestions):** **영업 이익 증대**를 목표로, 당장 실행할 수 있는 데이터 기반의 구체적인 실행 전략을 최소 3가지 이상 제안해주세요. 각 제안은 제목(title)과 상세 설명(description)을 포함해야 합니다.
    
    결과는 반드시 아래 JSON 스키마에 맞춰서 한국어로 생성해주세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "전반적인 재무 상태 요약" },
            positivePoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "긍정적인 점 목록" },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING }, description: "개선이 필요한 점 목록" },
            actionableSuggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } }
          },
          required: ["summary", "positivePoints", "areasForImprovement", "actionableSuggestions"]
        },
      },
    });
    // FIX: The response.text from the Gemini API is already a clean JSON string when responseMimeType and responseSchema are used. No need for further string manipulation like trim() or replace().
    const jsonText = response.text;
    return JSON.parse(jsonText) as AIReport;
  } catch (error) {
    console.error("Error generating financial report:", error);
    return getSampleReport();
  }
};

export const generateDeepDiveReport = async (
    transactions: Transaction[],
    info: BusinessInfo,
    categories: Category[],
): Promise<DeepDiveAIReport> => {
    if (!getApiKey()) return handleNoApiKey(getSampleDeepDiveReport());

    const ai = new GoogleGenAI({ apiKey: getApiKey()! });
    const metrics = calculateFinancialMetrics(transactions, categories);
    
    const categoryTypeMap = new Map(categories.map(c => [c.name, c.type]));

    const expenseByCategory = transactions.reduce((acc, tx) => {
        if (tx.debit > 0 && categoryTypeMap.get(tx.category) === 'operating_expense') {
            acc[tx.category] = (acc[tx.category] || 0) + tx.debit;
        }
        return acc;
    }, {} as Record<string, number>);

    const top5ExpenseCategories = Object.entries(expenseByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .reduce((obj, [key, value]) => {
            obj[key] = value.toLocaleString();
            return obj;
        }, {} as Record<string, string>);

    const prompt = `당신은 MBA 출신의 최고 수준의 경영 컨설턴트입니다. 다음 비즈니스 정보와 상세 재무 지표를 바탕으로, 투자자 또는 은행에 제출할 수준의 전문적이고 심층적인 분석 보고서를 작성해주세요.

**비즈니스 정보:**
- 상호명: ${info.name}
${getBusinessDetailsForPrompt(info)}

**핵심 재무 지표 (회계 기준):**
- **총 매출 (영업 수익):** ${metrics.operatingRevenue.toLocaleString()}원
- **영업 비용:** ${metrics.operatingExpense.toLocaleString()}원
- **영업 이익:** ${metrics.operatingProfit.toLocaleString()}원 (사업의 핵심 수익성 지표)
- **영업외 손익:** ${metrics.nonOperatingProfit.toLocaleString()}원
- **당기 순이익:** ${metrics.netProfit.toLocaleString()}원
- **주요 영업 비용 Top 5:** ${JSON.stringify(top5ExpenseCategories)}

**요청 보고서 구조 (반드시 아래 JSON 스키마를 준수하여 한국어로 작성):**

1.  **Executive Summary (executiveSummary):**
    - 비즈니스의 **영업 성과**와 전반적인 재무 건전성을 2-3 문단으로 요약합니다.
    - **영업 활동**에 초점을 맞춘 SWOT(강점, 약점, 기회, 위협) 요소를 간결하게 언급해주세요.

2.  **재무 건전성 분석 (financialHealthAnalysis):**
    - **수익성(영업이익률 중심), 유동성, 효율성** 측면에서 각각 분석합니다.
    - 각 항목에 대해 구체적인 데이터를 기반으로 상세히 분석하고, 10점 만점의 점수(score)를 매겨주세요.
    - 분석 제목(title)과 상세 분석 내용(analysis)을 포함해야 합니다.

3.  **전략적 제안 (strategicRecommendations):**
    - 분석 결과를 바탕으로, **영업이익 증대**를 위한 구체적인 전략을 3가지 제안합니다.
    - 비용 최적화, 매출 증대, 고객 확보 등 **영업 활동**과 직접적으로 관련된 제안을 해주세요.
    - 각 제안은 제목(title), 상세 설명(description), 그리고 기대 효과(expectedImpact)를 포함해야 합니다.

4.  **리스크 평가 및 관리 방안 (riskAssessment):**
    - 비즈니스가 직면할 수 있는 잠재적 **영업 리스크** 2가지를 식별합니다. (예: 특정 공급업체 의존도, 주력 상품의 수요 감소)
    - 각 리스크(risk)에 대한 구체적인 완화 방안(mitigation)을 제시해주세요.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        executiveSummary: { type: Type.STRING },
                        financialHealthAnalysis: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    analysis: { type: Type.STRING },
                                    score: { type: Type.NUMBER }
                                },
                                required: ["title", "analysis", "score"]
                            }
                        },
                        strategicRecommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    expectedImpact: { type: Type.STRING }
                                },
                                required: ["title", "description", "expectedImpact"]
                            }
                        },
                        riskAssessment: {
                             type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    risk: { type: Type.STRING },
                                    mitigation: { type: Type.STRING }
                                },
                                required: ["risk", "mitigation"]
                            }
                        }
                    },
                    required: ["executiveSummary", "financialHealthAnalysis", "strategicRecommendations", "riskAssessment"]
                }
            }
        });
        // FIX: The response.text from the Gemini API is already a clean JSON string when responseMimeType and responseSchema are used. No need for further string manipulation like trim() or replace().
        const jsonText = response.text;
        return JSON.parse(jsonText) as DeepDiveAIReport;
    } catch (error) {
        console.error("Error generating deep dive report:", error);
        return getSampleDeepDiveReport();
    }
};

export const generateLocationAnalysisReport = async (
    info: BusinessInfo,
    transactions: Transaction[]
): Promise<LocationAnalysisReport> => {
    if (!getApiKey()) return handleNoApiKey(getSampleLocationAnalysisReport());
    if (!info.address) {
        console.error("Address is required for location analysis.");
        const sample = getSampleLocationAnalysisReport();
        sample.swotAnalysis.strengths = ["사업장 주소가 입력되지 않아 상권 분석을 실행할 수 없습니다.", "'새 분석'을 통해 주소를 입력하고 다시 시도해주세요."];
        return sample;
    }
    
    const ai = new GoogleGenAI({ apiKey: getApiKey()! });

    const prompt = `당신은 대한민국 외식업(F&B) 분야의 최고 수준 마케팅 전략 컨설턴트입니다.
    '${info.name}'라는 가게를 위해, 제공된 정보와 당신의 전문 지식을 활용하여 매우 구체적이고 전문적인 상권 분석 및 마케팅 전략 보고서를 작성해주세요.

    **1. 분석 대상:**
    - **가게 이름:** ${info.name}
    - **업종 및 주요 품목:** ${info.type}, ${info.items}
    - **가게 주소:** ${info.address}

    **2. 보고서 작성 지침 (매우 중요):**
    - **주체 명시:** 모든 분석과 제안은 '${info.name}'의 관점에서 서술해야 합니다. (예: "'${info.name}'의 강점은...")
    - **전문성:** SWOT, 4P, 포지셔닝 맵 등 전문적인 마케팅 분석 프레임워크를 활용하여 깊이 있는 분석을 제공해야 합니다.
    - **구체성:** 추상적인 조언을 지양하고, '${info.name}'이 당장 실행할 수 있는 구체적인 액션 플랜을 제시해야 합니다.

    **3. 요청 보고서 구조 (아래 JSON 스키마를 반드시 준수하여 한국어로 작성):**

    A. **'${info.name}' SWOT 분석 (swotAnalysis):**
        - 가게의 내부/외부 환경을 분석하여 강점(Strengths), 약점(Weaknesses), 기회(Opportunities), 위협(Threats) 요인을 각각 2-3가지씩 구체적으로 도출해주세요.

    B. **주요 경쟁사 분석 (competitorAnalysis):**
        - **가상 검색:** '${info.address}' 반경 3km 이내의 동종업체(${info.items} 취급)를 검색했다고 가정합니다.
        - **상위 5곳 선정:** 검색 결과 중, 온라인(네이버 플레이스, 배달앱 등)에서 가장 인지도가 높고 활발하게 영업하는 **경쟁사 5곳**을 선정해주세요.
        - **심층 분석:** 각 경쟁사에 대해 **competitorName, description(영업 특징), strength(핵심 강점), weakness(명확한 약점)**를 구체적으로 기술해주세요.

    C. **시장 포지셔닝 맵 (positioningMap):**
        - **축 설정:** X축은 '가격(저가-고가)', Y축은 '품질/맛(대중적-프리미엄)'으로 설정합니다.
        - **좌표 부여:** '${info.name}'과 위에서 분석한 경쟁사 5곳에 대해, X/Y축을 기준으로 -10 ~ 10 사이의 좌표(x, y)를 각각 부여해주세요. '${info.name}'의 isSelf는 true로 설정합니다. 좌표는 각 가게의 특징을 잘 반영해야 합니다.

    D. **'${info.name}' 마케팅 믹스(4P) 전략 (marketingMix4P):**
        - 위 SWOT, 경쟁사, 포지셔닝 분석 결과를 종합하여, '${info.name}'을 위한 맞춤형 4P 전략을 제안합니다.
        - **Product (제품), Price (가격), Place (유통), Promotion (촉진)** 각 영역별로 실행 가능한 구체적인 전략을 1~2개씩 제안해주세요. 각 제안은 title과 description을 포함해야 합니다.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        swotAnalysis: {
                            type: Type.OBJECT,
                            properties: {
                                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ["strengths", "weaknesses", "opportunities", "threats"]
                        },
                        competitorAnalysis: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    competitorName: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    strength: { type: Type.STRING },
                                    weakness: { type: Type.STRING }
                                },
                                required: ["competitorName", "description", "strength", "weakness"]
                            }
                        },
                        positioningMap: {
                            type: Type.OBJECT,
                            properties: {
                                xAxis: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, min: { type: Type.STRING }, max: { type: Type.STRING } }, required: ["label", "min", "max"] },
                                yAxis: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, min: { type: Type.STRING }, max: { type: Type.STRING } }, required: ["label", "min", "max"] },
                                points: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING },
                                            x: { type: Type.NUMBER },
                                            y: { type: Type.NUMBER },
                                            isSelf: { type: Type.BOOLEAN }
                                        },
                                        required: ["name", "x", "y", "isSelf"]
                                    }
                                }
                            },
                            required: ["xAxis", "yAxis", "points"]
                        },
                        marketingMix4P: {
                            type: Type.OBJECT,
                            properties: {
                                product: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
                                price: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
                                place: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
                                promotion: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
                            },
                             required: ["product", "price", "place", "promotion"]
                        }
                    },
                    required: ["swotAnalysis", "competitorAnalysis", "positioningMap", "marketingMix4P"]
                }
            }
        });
        // FIX: The response.text from the Gemini API is already a clean JSON string when responseMimeType and responseSchema are used. No need for further string manipulation like trim() or replace().
        const jsonText = response.text;
        return JSON.parse(jsonText) as LocationAnalysisReport;
    } catch (error) {
        console.error("Error generating location analysis report:", error);
        return getSampleLocationAnalysisReport();
    }
};


export const generateInitialCategories = async (
    info: BusinessInfo
): Promise<Category[]> => {
    // 3단계 계정과목은 경영분석보고서 기준으로 표준화되어 있으므로,
    // AI 생성 없이 고정 목록을 사용합니다.
    // 이렇게 하면 API 호출 1회를 줄이고, 카테고리 일관성이 보장됩니다.
    return DEFAULT_CATEGORIES;
};


const getBusinessContextForCategorization = (info: BusinessInfo): string => {
    let context = `당신은 ${info.type} 비즈니스(${info.items} 취급)를 위한 자동 회계 시스템입니다.`;
    const details = [];
    if (info.rawMaterialSuppliers) details.push(`주요 원재료 매입처는 '${info.rawMaterialSuppliers}'`);
    if (info.subsidiaryMaterialSuppliers) details.push(`주요 부재료 매입처는 '${info.subsidiaryMaterialSuppliers}'`);
    if (info.onlinePlatforms) details.push(`온라인 매출은 '${info.onlinePlatforms}' 에서 발생`);
    if (info.otherRevenueSources) details.push(`기타 주요 매출처는 '${info.otherRevenueSources}'`);
    if (info.salaryInfo) details.push(`급여는 '${info.salaryInfo}' 규칙으로 지급`);
    
    if (details.length > 0) {
        context += ` 다음 정보를 참고하여 분류 정확도를 높여주세요: ${details.join(', ')}.`;
    }
    return context;
};

export const categorizeTransactions = async (
    transactions: Transaction[],
    categories: Category[],
    info: BusinessInfo
): Promise<Record<string, string>> => {
    if (!getApiKey()) return handleNoApiKey({});
    if (transactions.length === 0) return {};
    
    const ai = new GoogleGenAI({ apiKey: getApiKey()! });

    const incomeCategories = categories.filter(c => c.type === 'operating_income').map(c => c.name);
    const expenseCategories = categories.filter(c => c.type === 'operating_expense').map(c => c.name);
    const nonOpIncomeCategories = categories.filter(c => c.type === 'non_operating_income').map(c => c.name);
    const nonOpExpenseCategories = categories.filter(c => c.type === 'non_operating_expense').map(c => c.name);

    const BATCH_SIZE = 200; // Process up to 200 transactions per API call
    const transactionBatches: Transaction[][] = [];
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
        transactionBatches.push(transactions.slice(i, i + BATCH_SIZE));
    }

    const allCategorizedMap: Record<string, string> = {};

    const processBatch = async (batch: Transaction[]): Promise<void> => {
        const prompt = `
            ${getBusinessContextForCategorization(info)}
            다음 거래 내역들을 보고, 각 거래의 '적요'를 분석하여 가장 적합한 계정과목으로 분류해주세요.

            **[ 사업 매출 — 영업 수익 ]** (입금 거래에 사용)
            ${incomeCategories.join(', ')}

            **[ 사업 비용 — 영업 비용 ]** (출금 거래에 사용)
            ${expenseCategories.join(', ')}
            
            **[ 영업외 수익 ]** (사업과 무관한 입금)
            ${nonOpIncomeCategories.join(', ')}

            **[ 사업외 지출 ]** (사업과 무관한 출금)
            ${nonOpExpenseCategories.join(', ')}

            **분류할 거래 내역:**
            ${batch.map(t => `ID:${t.id} | 적요:${t.description} | 금액:${t.credit > 0 ? `+${t.credit}` : `-${t.debit}`}`).join('\n')}

            **매우 중요한 분류 가이드라인:**
            1.  **사업외 지출 우선 식별:** '적요'가 개인 이름, 병원, 약국, 주유소, 개인 통신비 등이면 해당하는 사업외 지출 계정(개인사비, 의료비(병원·약국), 유류비, 통신·IT비(개인사비) 등)으로 분류하세요.
            2.  **영업외 수익:** 타인이나 다른 계좌에서 이체받은 돈은 '외부입금', 정부/지자체 지원금은 '정부지원금', 1원 인증 등 소액은 '기타수입'으로 분류하세요.
            3.  **영업 수익 분류:**
                - 카드사 정산(신한, 하나, 삼성, KB, NH, 롯데, 현대, 우리, BC 등 숫자 포함) → '카드매출'
                - 배민, 쿠팡이츠, 요기요 정산 → '배달매출'
                - 시흥정산, 지역화폐 → '지역화폐'
                - 간편결제(제로페이 등) → '간편결제'
            4.  **영업 비용 분류:**
                - 식자재/원료 업체 송금 → '원재료(식자재)'
                - 식용유 업체 → '부자재(식용류)', 주류 업체 → '부자재(주류)', 음료 업체 → '부자재(음료)'
                - 임대료/관리비 → '임대료·관리비', 가스 → '도시가스비', 전기 → '전기요금'
                - 급여/알바비 → '인건비(정규)' 또는 '인건비(알바)'
                - 배달대행 수수료 → '배달수수료', 포스/KPN → '포스·시스템비'
                - DB손해보험, 한화생명 등 → '보험료'
                - 마트/편의점 소액 구매 → '마트·편의점구입'
                - 신용카드 결제대금 출금 → '신용카드대금'
            5.  **응답 규칙:** 모든 거래 ID에 대해 위 카테고리 중 정확히 하나를 할당. {"id": "거래 ID", "category": "계정명"} 형식의 JSON 배열로 반환.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            category: { type: Type.STRING }
                        },
                        required: ["id", "category"]
                    }
                },
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const jsonText = response.text;
        const resultArray: { id: string; category: string }[] = JSON.parse(jsonText);
        
        if (!Array.isArray(resultArray)) {
            console.error("AI categorization did not return an array for a batch:", resultArray);
            return;
        }

        resultArray.forEach(item => {
            if (item && typeof item.id === 'string' && typeof item.category === 'string') {
                const originalTx = batch.find(t => t.id === item.id);
                const isIncome = originalTx ? originalTx.credit > 0 : false;
                allCategorizedMap[item.id] = normalizeCategoryName(item.category, isIncome);
            }
        });
    };

    // ============================================================
    // Rate Limit 안전 처리: 순차 실행 + 딜레이 + 자동 재시도
    // ============================================================
    // Gemini 무료 키: 분당 15~30회 제한
    // 기존: Promise.all → 모든 배치 동시 전송 → 429 에러 발생
    // 개선: 2개씩 순차 전송 + 그룹 간 2초 대기 + 실패 시 3회 재시도

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const processBatchWithRetry = async (batch: Transaction[], batchIndex: number): Promise<void> => {
        const MAX_RETRIES = 3;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                await processBatch(batch);
                console.log(`[분류] 배치 ${batchIndex + 1}/${transactionBatches.length} 완료 (${batch.length}건)`);
                return;
            } catch (error: any) {
                const isRateLimit = error?.status === 429 || 
                                    error?.message?.includes('429') || 
                                    error?.message?.includes('RESOURCE_EXHAUSTED') ||
                                    error?.message?.includes('quota');
                
                if (isRateLimit && attempt < MAX_RETRIES - 1) {
                    const waitTime = Math.pow(2, attempt + 1) * 5000; // 10초, 20초, 40초
                    console.warn(`[분류] 배치 ${batchIndex + 1} Rate Limit. ${waitTime / 1000}초 후 재시도 (${attempt + 1}/${MAX_RETRIES})`);
                    await delay(waitTime);
                } else {
                    console.error(`[분류] 배치 ${batchIndex + 1} 최종 실패:`, error);
                    return; // 이 배치 건너뛰고 다음 배치로
                }
            }
        }
    };

    const CONCURRENT_LIMIT = 2;      // 동시 최대 2개 요청
    const DELAY_BETWEEN_GROUPS = 2000; // 그룹 간 2초 대기

    for (let i = 0; i < transactionBatches.length; i += CONCURRENT_LIMIT) {
        const group = transactionBatches
            .slice(i, i + CONCURRENT_LIMIT)
            .map((batch, idx) => processBatchWithRetry(batch, i + idx));
        
        await Promise.all(group);
        
        if (i + CONCURRENT_LIMIT < transactionBatches.length) {
            await delay(DELAY_BETWEEN_GROUPS);
        }
    }

    return allCategorizedMap;
};

export const generateInitialCategorizationRules = async (
    transactions: Transaction[],
    categories: Category[],
    info: BusinessInfo
): Promise<CategoryRule[]> => {
    if (!getApiKey()) return handleNoApiKey([]);

    const ai = new GoogleGenAI({ apiKey: getApiKey()! });
    const sampleTransactions = transactions.slice(0, 100);

    const operatingIncomeCategories = categories.filter(c => c.type === 'operating_income').map(c => c.name);
    const operatingExpenseCategories = categories.filter(c => c.type === 'operating_expense').map(c => c.name);
    const nonOpIncomeCategories = categories.filter(c => c.type === 'non_operating_income').map(c => c.name);
    const nonOpExpenseCategories = categories.filter(c => c.type === 'non_operating_expense').map(c => c.name);

    const prompt = `
        당신은 ${info.type} 비즈니스를 위한 지능형 회계 설정 도우미입니다.
        다음 비즈니스 정보와 거래 내역 샘플을 분석하여, 거래를 자동으로 분류할 수 있는 '키워드 규칙'을 생성해주세요.

        **비즈니스 정보:**
        ${getBusinessDetailsForPrompt(info)}

        **사용 가능한 계정과목:**
        - 영업 수익: ${operatingIncomeCategories.join(', ')}
        - 영업 비용: ${operatingExpenseCategories.join(', ')}
        - 영업외 수익: ${nonOpIncomeCategories.join(', ')}
        - 사업외 지출: ${nonOpExpenseCategories.join(', ')}

        **거래 내역 샘플:**
        ${sampleTransactions.map(t => `적요: ${t.description} | 입금: ${t.credit} | 출금: ${t.debit}`).join('\n')}

        **규칙 생성 가이드라인:**
        1.  **사업외 지출 규칙 우선 생성:** '적요'에 반복적으로 나타나는 개인 이름, 사업과 관련 없는 업체명은 해당하는 사업외 지출 계정(개인사비, 의료비, 유류비 등)으로 연결하세요.
        2.  **영업 수익 규칙:**
            -   카드사명+숫자 패턴(예: '신한13727349', 'KB11610154') → '카드매출'
            -   배민, 쿠팡이츠 → '배달매출'
            -   시흥정산, 지역화폐 → '지역화폐'
        3.  **영업 비용 규칙:**
            -   원재료 매입처 → '원재료(식자재)'
            -   식용유 업체 → '부자재(식용류)', 주류 업체 → '부자재(주류)'
            -   급여/알바 관련 → '인건비(정규)' 또는 '인건비(알바)'
            -   포스, KPN → '포스·시스템비', 보험사 → '보험료'
        4.  **정확성:** 명확하고 반복적인 패턴만 규칙으로 만드세요.
        5.  **형식:** { "keyword": "추출한 키워드", "category": "할당할 계정명" } 형식의 JSON 배열로 반환.

        **출력 예시:**
        [
            { "keyword": "배민바로결제", "category": "배달매출" },
            { "keyword": "신한13727349", "category": "카드매출" },
            { "keyword": "강봉기", "category": "원재료(식자재)" },
            { "keyword": "ＤＢ손", "category": "보험료" },
            { "keyword": "문자수수료", "category": "문자통지수수료" }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            keyword: { type: Type.STRING },
                            category: { type: Type.STRING }
                        },
                        required: ["keyword", "category"]
                    }
                },
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        // FIX: The response.text from the Gemini API is already a clean JSON string when responseMimeType and responseSchema are used. No need for further string manipulation like trim() or replace().
        const jsonText = response.text;
        const rawRules: { keyword: string; category: string }[] = JSON.parse(jsonText);
        
        if (Array.isArray(rawRules)) {
            return rawRules.map(rule => ({
                keyword: rule.keyword,
                category: normalizeCategoryName(rule.category, false), // 규칙의 카테고리명도 정규화
                source: 'ai' as const,
            }));
        }
        console.error("AI rule generation did not return an array:", rawRules);
        return [];
    } catch (error) {
        console.error("Error generating initial categorization rules:", error);
        return [];
    }
};

export const suggestFixedCostCategories = async (
    categories: Category[],
    info: BusinessInfo
): Promise<string[]> => {
    // 고정비 + 인건비(정규)는 고정비로 분류 (경영분석보고서 기준)
    return categories
        .filter(c => c.costGroup === '고정비' || c.name === '인건비(정규)')
        .map(c => c.name);
};