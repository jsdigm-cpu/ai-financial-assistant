import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { NON_MODIFIABLE_CATEGORIES, CATEGORY_NON_OPERATING_INCOME, CATEGORY_NON_OPERATING_EXPENSE } from '../constants';

interface CategoryItemProps {
  category: Category;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  isDefault: boolean;
  isDraggedOver: boolean;
  onDragStart: () => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onRename, onDelete, isDefault, isDraggedOver, onDragStart, onDrop, onDragOver, onDragEnter, onDragLeave }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(category.name);

  useEffect(() => {
    if (!isRenaming) {
      setName(category.name);
    }
  }, [category.name, isRenaming]);

  const handleRename = () => {
    if (name.trim() && name.trim() !== category.name) {
      onRename(category.name, name.trim());
    } else {
        setName(category.name);
    }
    setIsRenaming(false);
  };

  return (
    <div
      draggable={!isDefault}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`flex items-center justify-between p-2 bg-surface-subtle rounded-md border border-border-color transition-all duration-150 ease-in-out ${isDefault ? 'cursor-not-allowed' : 'cursor-grab'} ${isDraggedOver ? 'ring-2 ring-brand-primary border-transparent' : ''}`}
    >
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-text-muted ${isDefault ? 'opacity-30' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
        {isRenaming ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename}
            className="flex-grow bg-background-main border border-brand-primary rounded-md px-2 py-1 text-sm ring-2 ring-brand-primary w-full text-text-primary"
            autoFocus
          />
        ) : (
          <span className="text-sm text-text-primary">{name}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!isDefault && (
          <>
            <button onClick={() => setIsRenaming(true)} title="이름 수정" className="p-1 text-text-muted hover:text-brand-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => onDelete(category.name)} title="삭제" className="p-1 text-text-muted hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};


interface Props {
  isOpen: boolean;
  initialCategories: Category[];
  onConfirm: (finalCategories: Category[]) => void;
}


const CategoryReviewModal: React.FC<Props> = ({ isOpen, initialCategories, onConfirm }) => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [dropTargetName, setDropTargetName] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategories) {
      setAllCategories(initialCategories);
    }
  }, [initialCategories]);
  
  const categoryLists = React.useMemo(() => ({
      operating_income: allCategories.filter(c => c.type === 'operating_income'),
      non_operating_income: allCategories.filter(c => c.type === 'non_operating_income'),
      operating_expense: allCategories.filter(c => c.type === 'operating_expense'),
      non_operating_expense: allCategories.filter(c => c.type === 'non_operating_expense'),
  }), [allCategories]);

  if (!isOpen) return null;

  const handleAddCategory = (type: Category['type']) => {
    const isIncome = type.includes('income');
    const name = (isIncome ? newIncomeCategory.trim() : newExpenseCategory.trim());
    
    if (name && !allCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        // 새 Category 객체를 완전한 형태로 생성
        const newCategory: Category = type === 'operating_income'
          ? { name, type, level1: '수입', level2: '영업 수익', costGroup: null }
          : type === 'non_operating_income'
          ? { name, type, level1: '수입', level2: '영업외 수익', costGroup: null }
          : type === 'operating_expense'
          ? { name, type, level1: '지출', level2: '영업 비용', costGroup: '변동비' }
          : { name, type, level1: '지출', level2: '사업외 지출', costGroup: null };
        setAllCategories(prev => [...prev, newCategory]);
      
      if (isIncome) {
        setNewIncomeCategory('');
      } else {
        setNewExpenseCategory('');
      }
    }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const existing = allCategories.filter(c => c.name !== oldName);
    if (existing.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
        alert("이미 존재하는 카테고리 이름입니다.");
        return;
    }
    setAllCategories(prev => prev.map(c => c.name === oldName ? { ...c, name: newName } : c));
  };
  
  const handleDeleteCategory = (name: string) => {
    setAllCategories(prev => prev.filter(c => c.name !== name));
  };

  const handleDragStart = (category: Category) => {
    setDraggedCategory(category);
  };

  const handleDrop = (targetCategory: Category) => {
      if (!draggedCategory || draggedCategory.name === targetCategory.name || draggedCategory.type !== targetCategory.type) {
          setDraggedCategory(null);
          setDropTargetName(null);
          return;
      }
      
      setAllCategories(prev => {
          const items = [...prev];
          const fromIndex = items.findIndex(c => c.name === draggedCategory.name);
          const toIndex = items.findIndex(c => c.name === targetCategory.name);

          if (fromIndex === -1 || toIndex === -1) return items;

          const [reorderedItem] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, reorderedItem);
          
          return items;
      });
      setDraggedCategory(null);
      setDropTargetName(null);
  };

  const handleSubmit = () => {
    onConfirm(allCategories);
  };
  
  const renderCategoryList = (categories: Category[]) => {
      return categories.map((cat) => (
            <CategoryItem 
                key={cat.name} 
                category={cat}
                onRename={handleRenameCategory}
                onDelete={handleDeleteCategory}
                isDefault={NON_MODIFIABLE_CATEGORIES.includes(cat.name)}
                isDraggedOver={dropTargetName === cat.name && draggedCategory?.name !== cat.name}
                onDragStart={() => handleDragStart(cat)}
                onDrop={() => handleDrop(cat)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => {
                    if (draggedCategory && draggedCategory.type === cat.type) {
                        setDropTargetName(cat.name);
                    }
                }}
                onDragLeave={() => setDropTargetName(null)}
            />
        ));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in">
      <div className="bg-surface-card rounded-xl shadow-2xl p-6 md:p-8 text-left max-w-4xl w-full mx-4 transform transition-all duration-300 animate-slide-up space-y-6 border border-border-color">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">AI 추천 카테고리 검토 및 수정</h2>
            <p className="text-text-muted mt-2">
                AI가 귀하의 비즈니스에 맞춰 추천한 카테고리입니다. 수정이 필요없으면 아래 <strong className="text-brand-accent">"건너뛰기"</strong>를 누르세요.<br/>
                수정/추가/삭제 후 "확인"을 누르면 AI가 수정된 카테고리 기준으로 거래를 분류합니다.
            </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-3">
          {/* Income Categories */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-primary">수입 카테고리</h3>
             <div>
                <h4 className="text-sm font-bold text-brand-primary mb-2">영업 수익</h4>
                <div className="space-y-2">{renderCategoryList(categoryLists.operating_income)}</div>
             </div>
             <div>
                <h4 className="text-sm font-bold text-text-muted mb-2">영업외 수익</h4>
                <div className="space-y-2">{renderCategoryList(categoryLists.non_operating_income)}</div>
             </div>
            <div className="flex items-center gap-2 pt-2 border-t border-dashed border-border-color">
                <input
                    type="text"
                    placeholder="새 영업수익 카테고리 추가"
                    value={newIncomeCategory}
                    onChange={(e) => setNewIncomeCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('operating_income')}
                    className="flex-grow bg-background-main border border-border-color rounded-md px-3 py-2 text-sm text-text-primary"
                />
                <button onClick={() => handleAddCategory('operating_income')} className="px-4 py-2 text-sm text-white font-semibold bg-brand-accent rounded-lg shadow-sm">추가</button>
            </div>
          </div>
          
          {/* Expense Categories */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-primary">지출 카테고리</h3>
            <div>
                <h4 className="text-sm font-bold text-brand-primary mb-2">영업 비용</h4>
                <div className="space-y-2">{renderCategoryList(categoryLists.operating_expense)}</div>
             </div>
             <div>
                <h4 className="text-sm font-bold text-text-muted mb-2">사업외 지출</h4>
                <div className="space-y-2">{renderCategoryList(categoryLists.non_operating_expense)}</div>
             </div>
            <div className="flex items-center gap-2 pt-2 border-t border-dashed border-border-color">
                <input
                    type="text"
                    placeholder="새 영업비용 카테고리 추가"
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('operating_expense')}
                    className="flex-grow bg-background-main border border-border-color rounded-md px-3 py-2 text-sm text-text-primary"
                />
                <button onClick={() => handleAddCategory('operating_expense')} className="px-4 py-2 text-sm text-white font-semibold bg-brand-accent rounded-lg shadow-sm">추가</button>
            </div>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-border-color space-y-3">
            <button
                onClick={handleSubmit}
                className="w-full md:w-auto inline-flex items-center justify-center px-12 py-3 bg-brand-primary hover:bg-brand-secondary text-text-on-light font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
                확인 및 재분류 시작
            </button>
            <div>
                <button
                    onClick={handleSubmit}
                    className="text-sm text-text-muted hover:text-brand-accent underline"
                >
                    건너뛰기 (AI 추천 그대로 사용)
                </button>
            </div>
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

export default CategoryReviewModal;