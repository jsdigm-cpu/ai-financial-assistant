export interface Transaction {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  bank: string;
  category: string; // 3단계 계정명 (예: '카드매출', '원재료(식자재)')
}

export interface BusinessInfo {
  name: string;
  owner: string;
  type: string;
  items: string;
  accountType?: string;
  address?: string;
  rawMaterialSuppliers?: string;
  subsidiaryMaterialSuppliers?: string;
  onlinePlatforms?: string;
  otherRevenueSources?: string;
  salaryInfo?: string;
}

export enum BusinessType {
  RESTAURANT_GENERAL = "일반음식점 (한식, 중식, 양식 등)",
  RESTAURANT_CAFE = "카페/디저트",
  RESTAURANT_BAR = "주점/바",
  RETAIL_FASHION = "소매업 - 의류/잡화",
  RETAIL_GROCERY = "소매업 - 식료품/마트",
  RETAIL_GENERAL = "소매업 - 생활용품/잡화점",
  RETAIL_ECOMMERCE = "온라인 쇼핑몰",
  SERVICE_BEAUTY = "서비스업 - 미용/뷰티 (헤어, 네일)",
  SERVICE_EDUCATION = "서비스업 - 교육/학원",
  SERVICE_FITNESS = "서비스업 - 운동/헬스시설",
  SERVICE_PROFESSIONAL = "서비스업 - 전문직 (디자인, 컨설팅)",
  SERVICE_ACCOMMODATION = "서비스업 - 숙박",
  SERVICE_Hospital = "서비스업 - 병원/의원",
  MANUFACTURING = "제조업",
  ETC = "기타",
}

export enum AccountType {
  PERSONAL = "개인통장",
  SOLE_PROPRIETOR = "개인사업자",
  CORPORATION = "법인사업자",
}

export interface ProcessedData {
    transactions: Transaction[];
    errors: string[];
}

export interface UploadedFileInfo {
  name: string;
  size: number;
  title: string;
}

// ============================================================
// 3단계 계정과목 체계 (경영분석보고서 기준)
// ============================================================
// 1단계: 수입 / 지출
// 2단계: 영업 수익 / 영업외 수익 / 영업 비용 / 사업외 지출
// 3단계: 세부 계정명 (카드매출, 원재료(식자재), 개인사비 등)

export type CategoryLevel1 = '수입' | '지출';
export type CategoryLevel2 = '영업 수익' | '영업외 수익' | '영업 비용' | '사업외 지출';
export type CostGroup = '인건비' | '재료비' | '고정비' | '변동비' | null; // 영업 비용의 소분류 그룹

export interface Category {
    name: string;           // 3단계 계정명 (예: '카드매출')
    level1: CategoryLevel1; // 1단계: 수입/지출
    level2: CategoryLevel2; // 2단계: 영업 수익/영업외 수익/영업 비용/사업외 지출
    costGroup: CostGroup;   // 영업 비용일 때만 사용: 인건비/재료비/고정비/변동비
    // 하위 호환용 (기존 코드에서 type 참조하는 부분)
    type: 'operating_income' | 'non_operating_income' | 'operating_expense' | 'non_operating_expense';
}

export interface CategoryRule {
    keyword: string;
    category: string;
    source: 'ai' | 'manual';
}

export interface AIReport {
    summary: string;
    positivePoints: string[];
    areasForImprovement: string[];
    actionableSuggestions: {
        title: string;
        description: string;
    }[];
}

export interface DeepDiveAIReport {
    executiveSummary: string;
    financialHealthAnalysis: {
        title: string;
        analysis: string;
        score: number;
    }[];
    strategicRecommendations: {
        title: string;
        description: string;
        expectedImpact: string;
    }[];
    riskAssessment: {
        risk: string;
        mitigation: string;
    }[];
}

export interface LocationAnalysisReport {
    swotAnalysis: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    competitorAnalysis: {
        competitorName: string;
        description: string;
        strength: string;
        weakness: string;
    }[];
    positioningMap: {
        xAxis: { label: string; min: string; max: string; };
        yAxis: { label: string; min: string; max: string; };
        points: {
            name: string;
            x: number;
            y: number;
            isSelf: boolean;
        }[];
    };
    marketingMix4P: {
        product: { title: string; description: string; }[];
        price: { title: string; description: string; }[];
        place: { title: string; description: string; }[];
        promotion: { title: string; description: string; }[];
    };
}
