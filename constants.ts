import { Category, BusinessType, CostGroup } from './types';

// ============================================================
// 헬퍼 함수: 카테고리 생성
// ============================================================
const inc = (name: string): Category => ({
  name, level1: '수입', level2: '영업 수익', costGroup: null, type: 'operating_income'
});
const incNon = (name: string): Category => ({
  name, level1: '수입', level2: '영업외 수익', costGroup: null, type: 'non_operating_income'
});
const exp = (name: string, costGroup: CostGroup): Category => ({
  name, level1: '지출', level2: '영업 비용', costGroup, type: 'operating_expense'
});
const expNon = (name: string): Category => ({
  name, level1: '지출', level2: '사업외 지출', costGroup: null, type: 'non_operating_expense'
});

// ============================================================
// 3단계 계정과목 목록 (경영분석보고서 기준)
// ============================================================

// ▶ 영업 수익 (사업 매출)
export const OPERATING_INCOME_CATEGORIES: Category[] = [
  inc('카드매출'),
  inc('배달매출'),
  inc('지역화폐'),
  inc('간편결제'),
  inc('기타매출'),
];

// ▶ 영업외 수익
export const NON_OPERATING_INCOME_CATEGORIES: Category[] = [
  incNon('영업외수익'),
  incNon('정부지원금'),
  incNon('외부입금'),
  incNon('기타수입'),
];

// ▶ 영업 비용 - 인건비
export const COST_LABOR_CATEGORIES: Category[] = [
  exp('인건비(정규)', '인건비'),
  exp('인건비(알바)', '인건비'),
];

// ▶ 영업 비용 - 재료비
export const COST_MATERIAL_CATEGORIES: Category[] = [
  exp('원재료(식자재)', '재료비'),
  exp('부자재(식용류)', '재료비'),
  exp('부자재(주류)', '재료비'),
  exp('부자재(음료)', '재료비'),
  exp('부자재(기타)', '재료비'),
];

// ▶ 영업 비용 - 고정비
export const COST_FIXED_CATEGORIES: Category[] = [
  exp('임대료·관리비', '고정비'),
  exp('도시가스비', '고정비'),
  exp('전기요금', '고정비'),
  exp('통신·IT비', '고정비'),
  exp('포스·시스템비', '고정비'),
  exp('렌탈비', '고정비'),
  exp('보험료', '고정비'),
];

// ▶ 영업 비용 - 변동비
export const COST_VARIABLE_CATEGORIES: Category[] = [
  exp('마트·편의점구입', '변동비'),
  exp('배달수수료', '변동비'),
  exp('광고비', '변동비'),
  exp('수선유지비', '변동비'),
  exp('세금·공과금', '변동비'),
  exp('기타사업비', '변동비'),
];

// ▶ 사업외 지출
export const NON_OPERATING_EXPENSE_CATEGORIES: Category[] = [
  expNon('신용카드대금'),
  expNon('개인사비'),
  expNon('개인출금·차입금반환'),
  expNon('의료비(병원·약국)'),
  expNon('유류비'),
  expNon('통신·IT비(개인사비)'),
  expNon('문자통지수수료'),
  expNon('기타출금'),
];

// 전체 영업 비용
export const OPERATING_EXPENSE_CATEGORIES: Category[] = [
  ...COST_LABOR_CATEGORIES,
  ...COST_MATERIAL_CATEGORIES,
  ...COST_FIXED_CATEGORIES,
  ...COST_VARIABLE_CATEGORIES,
];

// 전체 카테고리 (모든 계정)
export const DEFAULT_CATEGORIES: Category[] = [
  ...OPERATING_INCOME_CATEGORIES,
  ...NON_OPERATING_INCOME_CATEGORIES,
  ...OPERATING_EXPENSE_CATEGORIES,
  ...NON_OPERATING_EXPENSE_CATEGORIES,
];

// 하위 호환: 기존 코드에서 참조하는 상수들
export const CATEGORY_NON_OPERATING_INCOME: Category = incNon('영업외수익');
export const CATEGORY_NON_OPERATING_EXPENSE: Category = expNon('기타출금');

export const DEFAULT_CATEGORY_INCOME = '기타매출';
export const DEFAULT_CATEGORY_EXPENSE = '기타사업비';

export const NON_MODIFIABLE_CATEGORIES = [
  DEFAULT_CATEGORY_INCOME,
  DEFAULT_CATEGORY_EXPENSE,
  '기타수입',
  '기타출금',
];

// ============================================================
// 통장 구분별 기본 카테고리 프리셋
// ============================================================

// ▶ 개인통장용 카테고리
const pInc = (name: string): Category => ({
  name, level1: '수입', level2: '영업 수익', costGroup: null, type: 'operating_income'
});
const pIncNon = (name: string): Category => ({
  name, level1: '수입', level2: '영업외 수익', costGroup: null, type: 'non_operating_income'
});
const pExp = (name: string): Category => ({
  name, level1: '지출', level2: '영업 비용', costGroup: null, type: 'operating_expense'
});
const pExpNon = (name: string): Category => ({
  name, level1: '지출', level2: '사업외 지출', costGroup: null, type: 'non_operating_expense'
});

export const PERSONAL_CATEGORIES: Category[] = [
  pInc('급여·용돈'),
  pInc('부업·알바수입'),
  pInc('기타매출'),
  pIncNon('이자수익'),
  pIncNon('환급금'),
  pIncNon('기타수입'),
  pExp('식비'),
  pExp('교통비'),
  pExp('통신비'),
  pExp('생활용품'),
  pExp('의류·미용'),
  pExp('문화·여가'),
  pExp('교육비'),
  pExp('의료비'),
  pExp('보험료'),
  pExp('공과금'),
  pExp('기타사업비'),
  pExpNon('주거비(월세·관리비)'),
  pExpNon('대출상환'),
  pExpNon('저축·투자'),
  pExpNon('경조사비'),
  pExpNon('기타출금'),
];

// ▶ 법인사업자용 카테고리
const cInc = (name: string): Category => ({
  name, level1: '수입', level2: '영업 수익', costGroup: null, type: 'operating_income'
});
const cIncNon = (name: string): Category => ({
  name, level1: '수입', level2: '영업외 수익', costGroup: null, type: 'non_operating_income'
});
const cExp = (name: string, costGroup: CostGroup): Category => ({
  name, level1: '지출', level2: '영업 비용', costGroup, type: 'operating_expense'
});
const cExpNon = (name: string): Category => ({
  name, level1: '지출', level2: '사업외 지출', costGroup: null, type: 'non_operating_expense'
});

export const CORPORATION_CATEGORIES: Category[] = [
  cInc('매출'),
  cInc('용역매출'),
  cInc('기타매출'),
  cIncNon('이자수익'),
  cIncNon('배당금수익'),
  cIncNon('유형자산처분이익'),
  cIncNon('기타수입'),
  cExp('매출원가', '재료비'),
  cExp('급여', '인건비'),
  cExp('퇴직급여', '인건비'),
  cExp('복리후생비', '인건비'),
  cExp('임차료', '고정비'),
  cExp('접대비', '변동비'),
  cExp('감가상각비', '고정비'),
  cExp('통신비', '고정비'),
  cExp('수도광열비', '고정비'),
  cExp('세금과공과', '변동비'),
  cExp('보험료', '고정비'),
  cExp('광고선전비', '변동비'),
  cExp('운반비', '변동비'),
  cExp('소모품비', '변동비'),
  cExp('수선비', '변동비'),
  cExp('차량유지비', '변동비'),
  cExp('여비교통비', '변동비'),
  cExp('기타사업비', '변동비'),
  cExpNon('이자비용'),
  cExpNon('유형자산처분손실'),
  cExpNon('법인세비용'),
  cExpNon('기타출금'),
];

// 통장 구분에 따른 기본 카테고리 반환
export function getDefaultCategoriesByAccountType(accountType?: string): Category[] {
  switch (accountType) {
    case '개인통장': return PERSONAL_CATEGORIES;
    case '법인사업자': return CORPORATION_CATEGORIES;
    case '개인사업자':
    default: return DEFAULT_CATEGORIES;
  }
}

// 카테고리 이름으로 Category 객체를 찾는 맵
export const CATEGORY_MAP: Record<string, Category> = {};
DEFAULT_CATEGORIES.forEach(c => { CATEGORY_MAP[c.name] = c; });

// ============================================================
// AI 분류 결과 정규화: AI가 반환한 이름을 표준 계정명으로 매칭
// ============================================================
const ALL_CATEGORY_NAMES = DEFAULT_CATEGORIES.map(c => c.name);

// 정규화 키 생성: 공백, 특수문자 제거 후 소문자
const normalizeKey = (s: string): string => {
  return s
    .replace(/[\s·\-\/\\·・・]/g, '')  // 공백, 가운데점, 대시, 슬래시 제거
    .replace(/[（）\(\)]/g, '')         // 전각/반각 괄호 제거
    .toLowerCase();
};

// 표준 계정명별 정규화 키 맵 (미리 계산)
const NORMALIZED_CATEGORY_INDEX: Map<string, string> = new Map();
ALL_CATEGORY_NAMES.forEach(name => {
  NORMALIZED_CATEGORY_INDEX.set(normalizeKey(name), name);
});

// 별칭 매핑 (AI가 자주 틀리는 패턴)
const CATEGORY_ALIASES: Record<string, string> = {
  '카드 매출': '카드매출',
  '배달 매출': '배달매출',
  '지역 화폐': '지역화폐',
  '간편 결제': '간편결제',
  '기타 매출': '기타매출',
  '영업외 수익': '영업외수익',
  '기타 수입': '기타수입',
  '외부 입금': '외부입금',
  '정부 지원금': '정부지원금',
  '인건비 정규': '인건비(정규)',
  '인건비 알바': '인건비(알바)',
  '정규 인건비': '인건비(정규)',
  '알바 인건비': '인건비(알바)',
  '원재료': '원재료(식자재)',
  '식자재': '원재료(식자재)',
  '원재료 식자재': '원재료(식자재)',
  '식용류': '부자재(식용류)',
  '식용유': '부자재(식용류)',
  '부자재 식용류': '부자재(식용류)',
  '부자재 식용유': '부자재(식용류)',
  '주류': '부자재(주류)',
  '부자재 주류': '부자재(주류)',
  '음료': '부자재(음료)',
  '부자재 음료': '부자재(음료)',
  '부자재 기타': '부자재(기타)',
  '임대료': '임대료·관리비',
  '관리비': '임대료·관리비',
  '임대료 관리비': '임대료·관리비',
  '임대료/관리비': '임대료·관리비',
  '가스비': '도시가스비',
  '가스': '도시가스비',
  '도시가스': '도시가스비',
  '전기': '전기요금',
  '전기세': '전기요금',
  '통신비': '통신·IT비',
  '통신 IT비': '통신·IT비',
  '포스': '포스·시스템비',
  '시스템비': '포스·시스템비',
  '포스 시스템비': '포스·시스템비',
  '렌탈': '렌탈비',
  '보험': '보험료',
  '마트': '마트·편의점구입',
  '편의점': '마트·편의점구입',
  '마트 편의점': '마트·편의점구입',
  '마트 편의점구입': '마트·편의점구입',
  '배달 수수료': '배달수수료',
  '수선 유지비': '수선유지비',
  '세금': '세금·공과금',
  '공과금': '세금·공과금',
  '세금 공과금': '세금·공과금',
  '기타 사업비': '기타사업비',
  '신용카드': '신용카드대금',
  '신용카드 대금': '신용카드대금',
  '카드대금': '신용카드대금',
  '개인 사비': '개인사비',
  '개인출금': '개인출금·차입금반환',
  '차입금': '개인출금·차입금반환',
  '차입금반환': '개인출금·차입금반환',
  '개인출금 차입금반환': '개인출금·차입금반환',
  '의료비': '의료비(병원·약국)',
  '병원': '의료비(병원·약국)',
  '약국': '의료비(병원·약국)',
  '의료비 병원 약국': '의료비(병원·약국)',
  '유류': '유류비',
  '주유비': '유류비',
  '통신 IT비 개인': '통신·IT비(개인사비)',
  '개인 통신비': '통신·IT비(개인사비)',
  '문자 수수료': '문자통지수수료',
  '문자수수료': '문자통지수수료',
  '기타 출금': '기타출금',
  '영업외수입': '영업외수익',
};

// 별칭 맵도 정규화 키로 인덱싱
const NORMALIZED_ALIAS_INDEX: Map<string, string> = new Map();
Object.entries(CATEGORY_ALIASES).forEach(([alias, standard]) => {
  NORMALIZED_ALIAS_INDEX.set(normalizeKey(alias), standard);
});

/**
 * AI가 반환한 카테고리 이름을 표준 계정명으로 매칭합니다.
 * 1단계: 정확한 이름 매칭
 * 2단계: 정규화 키로 매칭 (공백/특수문자 제거 후)
 * 3단계: 별칭 매칭
 * 4단계: 부분 문자열 매칭
 * 실패 시: 수입/지출 기본 카테고리 반환
 */
export function normalizeCategoryName(aiName: string, isIncome: boolean, availableCategories?: Category[]): string {
  const trimmed = aiName.trim();
  const nKey = normalizeKey(trimmed);
  let resolvedName = '';
  
  // 1단계: 정확한 매칭
  if (CATEGORY_MAP[trimmed]) resolvedName = trimmed;
  // 2단계: 정규화 키 매칭
  else if (NORMALIZED_CATEGORY_INDEX.get(nKey)) resolvedName = NORMALIZED_CATEGORY_INDEX.get(nKey)!;
  // 3단계: 별칭 매칭
  else if (NORMALIZED_ALIAS_INDEX.get(nKey)) resolvedName = NORMALIZED_ALIAS_INDEX.get(nKey)!;
  // 4단계: 부분 문자열 매칭
  else {
    for (const standardName of ALL_CATEGORY_NAMES) {
      if (trimmed.includes(standardName) || standardName.includes(trimmed)) {
        resolvedName = standardName;
        break;
      }
    }
    // 5단계: 정규화 키 부분 매칭
    if (!resolvedName) {
      for (const [stdKey, stdName] of NORMALIZED_CATEGORY_INDEX.entries()) {
        if (nKey.includes(stdKey) || stdKey.includes(nKey)) {
          resolvedName = stdName;
          break;
        }
      }
    }
  }
  
  if (resolvedName) {
      let isValid = true;
      if (availableCategories) {
          const cat = availableCategories.find(c => c.name === resolvedName);
          if (cat) isValid = cat.type.includes('income') === isIncome;
      } else {
          const cat = CATEGORY_MAP[resolvedName];
          if (cat) isValid = cat.type.includes('income') === isIncome;
      }

      if (isValid) return resolvedName;
      console.warn(`[카테고리 속성 불일치] AI 반환값: "${resolvedName}" (수입/지출 속성 다름) → 기본 카테고리 사용`);
  } else {
      console.warn(`[카테고리 매칭 실패] AI 반환값: "${aiName}" 미상 → 기본 카테고리 사용`);
  }
  
  // 실패 시 기본값
  return isIncome ? DEFAULT_CATEGORY_INCOME : DEFAULT_CATEGORY_EXPENSE;
}

// 카테고리 이름으로 level2를 반환하는 헬퍼
export function getCategoryLevel2(categoryName: string): string {
  return CATEGORY_MAP[categoryName]?.level2 || '사업외 지출';
}

// 카테고리 이름으로 costGroup을 반환하는 헬퍼
export function getCostGroup(categoryName: string): CostGroup {
  return CATEGORY_MAP[categoryName]?.costGroup || null;
}

// ============================================================
// 컬럼 매핑 (엑셀 파싱용)
// ============================================================
export const COLUMN_MAPPINGS: { [key: string]: string[] } = {
  date: ['거래일시', '거래일', '일시', 'date', 'transaction date'],
  description: ['적요', '내용', '거래내역', 'description', 'details'],
  debit: ['출금액', '출금', 'debit', 'withdraw'],
  credit: ['입금액', '입금', 'credit', 'deposit'],
  balance: ['잔액', 'balance'],
};

// ============================================================
// 업종별 프리셋
// ============================================================
export interface BusinessPreset {
  items: string;
  rawMaterialSuppliers: string;
  subsidiaryMaterialSuppliers: string;
  onlinePlatforms: string;
  otherRevenueSources: string;
  salaryInfo: string;
}

export const BUSINESS_PRESETS: Partial<Record<BusinessType, BusinessPreset>> = {
  [BusinessType.RESTAURANT_GENERAL]: {
    items: '한식, 백반, 찌개, 반찬',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '배달의민족, 쿠팡이츠, 요기요',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RESTAURANT_CAFE]: {
    items: '커피, 음료, 디저트, 케이크',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '배달의민족, 쿠팡이츠',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RESTAURANT_BAR]: {
    items: '주류, 안주, 맥주, 소주',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '배달의민족',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_FASHION]: {
    items: '의류, 잡화, 액세서리',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '스마트스토어, 쿠팡, 카카오톡스토어',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_GROCERY]: {
    items: '신선식품, 가공식품, 생활용품',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_GENERAL]: {
    items: '생활용품, 잡화',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '스마트스토어, 쿠팡',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_ECOMMERCE]: {
    items: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '스마트스토어, 쿠팡, 11번가, G마켓',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_BEAUTY]: {
    items: '헤어커트, 염색, 파마, 네일아트',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '네이버 예약, 카카오 예약',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_EDUCATION]: {
    items: '수업료, 교재, 교육 프로그램',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_FITNESS]: {
    items: '회원권, PT, 운동 프로그램',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_PROFESSIONAL]: {
    items: '컨설팅, 디자인, 전문 서비스',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_ACCOMMODATION]: {
    items: '숙박, 객실, 부대시설',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '야놀자, 여기어때, 에어비앤비',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_Hospital]: {
    items: '진료비, 처방, 시술',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '건강보험공단 청구',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.MANUFACTURING]: {
    items: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.ETC]: {
    items: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '',
  },
};
