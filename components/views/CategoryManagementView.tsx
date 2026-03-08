import React, { useState, useMemo, useEffect } from 'react';
import { Category, CategoryRule, Transaction } from '../../types';
import { NON_MODIFIABLE_CATEGORIES } from '../../constants';

// --- Sub-components ---

const ManagedCategoryItem: React.FC<{
    category: Category;
    rules: CategoryRule[];
    transactionCount: number;
    maxTransactionCount: number;
    isRenamable: boolean;
    isDeletable: boolean;
    isSelected: boolean;
    onSelect: (name: string) => void;
    onRename: (oldName: string, newName: string) => void;
    onDelete: (category: Category) => void;
    onAddRule: (rule: CategoryRule) => void;
    onDeleteRule: (rule: CategoryRule) => void;
    // D&D Props
    isDraggedOver: boolean;
    onDragStart: () => void;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: () => void;
    onDragLeave: () => void;
}> = (props) => {
    const { category, rules, transactionCount, maxTransactionCount, isRenamable, isDeletable, isSelected, onSelect, onRename, onDelete, onAddRule, onDeleteRule, isDraggedOver, onDragStart, onDrop, onDragOver, onDragEnter, onDragLeave } = props;
    const [isRenaming, setIsRenaming] = useState(false);
    const [draftName, setDraftName] = useState(category.name);
    const [newKeyword, setNewKeyword] = useState('');
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    
    const associatedRules = useMemo(() => 
        rules.filter(r => r.category === category.name), 
    [rules, category.name]);

    useEffect(() => {
        setDraftName(category.name);
        if (!isSelected) {
            setIsRenaming(false);
            setIsConfirmingDelete(false); // Reset confirmation on collapse
        }
    }, [category.name, isSelected]);
    
    const handleRenameConfirm = () => {
        if (draftName.trim() && draftName.trim() !== category.name) {
            onRename(category.name, draftName.trim());
        } else {
            setDraftName(category.name);
        }
        setIsRenaming(false);
    };

    const handleAddKeyword = () => {
        const trimmedKeyword = newKeyword.trim();
        if (trimmedKeyword) {
            onAddRule({ keyword: trimmedKeyword, category: category.name, source: 'manual' });
            setNewKeyword('');
        }
    };

    const barWidth = maxTransactionCount > 0 ? (transactionCount / maxTransactionCount) * 100 : 0;

    return (
        <div 
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            className={`bg-surface-card border rounded-lg transition-all ${isSelected ? 'ring-2 ring-brand-primary shadow-md border-transparent' : 'border-border-color hover:border-slate-300'} ${isDraggedOver ? 'ring-2 ring-brand-accent border-transparent' : ''}`}
        >
            <div
                className='p-2.5 flex justify-between items-center'
            >
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    {/* FIX: Wrapped SVG in a div and moved drag-related props to fix TS error, as 'draggable' is not a valid SVG attribute in React. */}
                    <div
                        draggable={isRenamable}
                        onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-shrink-0 ${!isRenamable ? 'opacity-30 cursor-not-allowed' : 'cursor-grab'}`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-text-muted"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                    </div>
                    {isRenaming ? (
                        <input 
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            onBlur={handleRenameConfirm}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-grow bg-background-main border border-brand-primary rounded-md px-2 py-1 text-sm ring-2 ring-brand-primary w-full text-text-primary"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-2 flex-grow min-w-0 cursor-pointer" onClick={() => onSelect(category.name)}>
                            <span className="font-semibold text-text-primary truncate" title={category.name}>{category.name}</span>
                            <div className="flex items-center gap-1.5 flex-grow min-w-[50px]">
                                <div className="w-full bg-border-color rounded-full h-2.5">
                                    <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${barWidth}%` }}></div>
                                </div>
                                <span className="text-xs text-text-muted font-mono w-6 text-right">{transactionCount}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                    {isConfirmingDelete ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <span className="text-sm font-semibold text-red-500 hidden sm:inline">삭제하시겠습니까?</span>
                            <button
                                onClick={() => onDelete(category)}
                                className="px-3 py-1 text-sm text-white font-semibold bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                            >
                                확인
                            </button>
                            <button
                                onClick={() => setIsConfirmingDelete(false)}
                                className="px-3 py-1 text-sm text-text-muted font-semibold bg-surface-subtle hover:bg-border-color rounded-md"
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); if (!isSelected) onSelect(category.name); setIsRenaming(true); }}
                                title={isRenamable ? "이름 수정" : "기본 카테고리는 이름을 바꿀 수 없습니다."} 
                                disabled={!isRenamable} 
                                className="text-gray-400 hover:text-blue-500 p-1 rounded-full hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }}
                                title={isDeletable ? "삭제" : "기본 카테고리는 삭제할 수 없습니다."} 
                                disabled={!isDeletable}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
             {isSelected && (
                <div className="px-3 pb-3 pt-2 border-t border-border-color space-y-3">
                     <div>
                        <h5 className="text-xs font-semibold text-text-muted mb-2">
                            연결된 키워드 ({associatedRules.length}개)
                        </h5>
                        {associatedRules.length > 0 ? (
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                {associatedRules.map(rule => (
                                    <div key={rule.keyword} className="flex justify-between items-center text-sm bg-surface-subtle py-1 px-2 rounded">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {rule.source === 'ai' && (
                                                <span title="AI 추천 키워드" className="flex-shrink-0 text-xs font-bold text-white bg-brand-accent rounded-full px-2 py-0.5">AI</span>
                                            )}
                                            <span className="text-text-muted truncate" title={rule.keyword}>{rule.keyword}</span>
                                        </div>
                                        <button onClick={() => onDeleteRule(rule)} title="규칙 삭제" className="flex-shrink-0 text-gray-500 hover:text-red-500 p-0.5 rounded-full ml-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-text-muted">연결된 키워드가 없습니다. 아래 입력창을 이용해 규칙을 추가하세요.</p>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="새 키워드 추가"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                            className="flex-grow bg-surface-subtle border border-border-color rounded-md px-2 py-1 text-sm text-text-primary"
                        />
                        <button onClick={handleAddKeyword} className="text-xs px-3 py-1 text-white font-semibold bg-brand-accent rounded-md">추가</button>
                     </div>
                </div>
            )}
        </div>
    );
};


const CategorizedItemsList: React.FC<{
    category: Category | null;
    transactions: Transaction[];
}> = ({ category, transactions }) => {
    const categorizedItems = useMemo(() => {
        if (!category) return [];
        
        const descriptions = transactions
            .filter(t => t.category === category.name)
            .map(t => t.description.trim())
            .filter(Boolean);
        
        const frequencyMap: Record<string, number> = descriptions.reduce((acc, desc) => {
            acc[desc] = (acc[desc] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(frequencyMap).sort(([, a], [, b]) => b - a);
    }, [transactions, category]);
    
    const handleDragStart = (e: React.DragEvent, description: string) => {
        e.dataTransfer.setData("text/plain", description);
        e.dataTransfer.effectAllowed = 'copy';
    };

    if (!category) {
        return (
            <div className="bg-surface-card p-4 rounded-xl shadow-lg border border-border-color h-full flex items-center justify-center min-h-[50vh]">
                <div className="text-center text-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                    <h4 className="text-lg font-semibold text-text-primary mt-2">항목 상세보기</h4>
                    <p className="text-sm mt-1">왼쪽 목록에서 카테고리를 선택하여<br/>분류된 항목들을 확인하고 수정하세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-card p-4 rounded-xl shadow-lg border border-border-color">
            <h4 className="text-xl font-semibold text-text-primary mb-1 px-2">'{category.name}' 카테고리 항목 ({categorizedItems.length})</h4>
            <p className="text-text-muted text-sm mb-4 px-2">잘못 분류된 항목이 있다면, 다른 카테고리로 드래그하여 바로잡으세요.</p>
            <ul className="space-y-1 min-h-[30vh] max-h-[50vh] overflow-y-auto pr-2">
                {categorizedItems.map(([description, count]) => (
                    <li 
                        key={description}
                        draggable
                        onDragStart={(e) => handleDragStart(e, description)}
                        className="cursor-grab bg-surface-subtle p-1.5 px-3 rounded-md border border-border-color text-sm text-text-primary flex justify-between items-center hover:bg-border-color"
                    >
                        <span className="truncate pr-2" title={description}>{description}</span>
                        <span className="flex-shrink-0 text-xs font-mono bg-border-color text-text-muted px-1.5 py-0.5 rounded-full">{count}</span>
                    </li>
                ))}
                {categorizedItems.length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[20vh] text-center text-text-muted">
                        <p>이 카테고리로 분류된 항목이 없습니다.</p>
                    </div>
                )}
            </ul>
        </div>
    );
};


interface CategorySectionProps {
    title: string;
    type: Category['type'];
    categories: Category[]; // Only categories of this type
    rules: CategoryRule[];
    transactionCounts: Record<string, number>;
    maxTransactionCount: number;
    selectedCategory: string | null;
    onSelectCategory: (name: string) => void;
    onAddCategory: (category: Category) => void;
    onDeleteCategory: (category: Category) => void;
    onRenameCategory: (oldName: string, newName: string) => void;
    onAddRule: (rule: CategoryRule) => void;
    onDeleteRule: (rule: CategoryRule) => void;
    // D&D Props
    draggedItem: Category | null;
    dropTarget: string | null;
    onDragStart: (category: Category) => void;
    onDrop: (targetCategory: Category) => void;
    onDragEnter: (categoryName: string) => void;
    onDragLeave: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = (props) => {
    const { title, type, categories, rules, transactionCounts, maxTransactionCount, selectedCategory, onSelectCategory, onAddCategory, onDeleteCategory, onRenameCategory, onAddRule, onDeleteRule, draggedItem, dropTarget, onDragStart, onDrop, onDragEnter, onDragLeave } = props;
    const [newCategoryName, setNewCategoryName] = useState('');
    
    const handleRename = (oldName: string, newName: string) => {
        if (categories.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
            alert("이미 존재하는 카테고리 이름입니다.");
            return;
        }
        onRenameCategory(oldName, newName);
    };

    const handleAddNewCategory = () => {
         const name = newCategoryName.trim();
         if (name && !categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
             const newCat: Category = type === 'operating_income'
               ? { name, type, level1: '수입', level2: '영업 수익', costGroup: null }
               : type === 'non_operating_income'
               ? { name, type, level1: '수입', level2: '영업외 수익', costGroup: null }
               : type === 'operating_expense'
               ? { name, type, level1: '지출', level2: '영업 비용', costGroup: '변동비' }
               : { name, type, level1: '지출', level2: '사업외 지출', costGroup: null };
             onAddCategory(newCat);
             setNewCategoryName('');
         } else if (name) {
             alert("카테고리 이름이 비어있거나 이미 존재합니다.");
         }
    };

    return (
        <div 
            className="bg-surface-card p-4 rounded-xl shadow-lg border border-border-color"
        >
            <div className="flex justify-between items-center mb-4 px-2">
                <h4 className="text-xl font-semibold text-text-primary">{title}</h4>
            </div>
            
            <div className="min-h-[20vh] max-h-[40vh] overflow-y-auto pr-2 space-y-2">
                {categories.map((cat) => {
                    const isNonModifiable = NON_MODIFIABLE_CATEGORIES.includes(cat.name);
                    return (
                        <div key={cat.name} data-category-name={cat.name}>
                            <ManagedCategoryItem
                                category={cat}
                                rules={rules}
                                transactionCount={transactionCounts[cat.name] || 0}
                                maxTransactionCount={maxTransactionCount}
                                isRenamable={!isNonModifiable}
                                isDeletable={!isNonModifiable}
                                isSelected={selectedCategory === cat.name}
                                onSelect={onSelectCategory}
                                onRename={handleRename}
                                onDelete={onDeleteCategory}
                                onAddRule={onAddRule}
                                onDeleteRule={onDeleteRule}
                                // D&D Props
                                isDraggedOver={dropTarget === cat.name && draggedItem?.name !== cat.name}
                                onDragStart={() => onDragStart(cat)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                            
                                    if (draggedItem) { // Reordering category
                                        onDrop(cat);
                                    } else { // Re-assigning description
                                        const keyword = e.dataTransfer.getData("text/plain");
                                        if (keyword) {
                                            onAddRule({ keyword, category: cat.name, source: 'manual' });
                                        }
                                    }
                                    onDragLeave(); // Reset indicator
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    onDragEnter(cat.name);
                                }}
                                onDragEnter={() => onDragEnter(cat.name)}
                                onDragLeave={onDragLeave}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 p-2 border-t border-dashed border-border-color">
               <div className="flex items-center gap-2">
                   <input
                        type="text"
                        placeholder="새 카테고리 이름"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                        className="flex-grow bg-background-main border border-border-color rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary text-text-primary"
                        aria-label={`새 ${title}`}
                   />
                   <button 
                        onClick={handleAddNewCategory}
                        className="px-4 py-2 text-sm text-text-on-light font-semibold bg-brand-primary hover:bg-brand-secondary rounded-lg shadow-sm"
                   >
                       추가
                   </button>
               </div>
            </div>
        </div>
    );
};


interface Props {
    transactions: Transaction[];
    categories: Category[];
    rules: CategoryRule[];
    onAddRule: (rule: CategoryRule) => void;
    onDeleteRule: (rule: CategoryRule) => void;
    onAddCategory: (category: Category) => void;
    onDeleteCategory: (category: Category) => void;
    onRenameCategory: (oldName: string, newName: string) => void;
    onMoveCategory: (draggedName: string, targetName: string) => void;
}

const CategoryManagementView: React.FC<Props> = (props) => {
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<Category | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    const { transactionCounts, maxCount } = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const tx of props.transactions) {
            counts[tx.category] = (counts[tx.category] || 0) + 1;
        }
        const max = Math.max(1, ...Object.values(counts));
        return { transactionCounts: counts, maxCount: max };
    }, [props.transactions]);
    
    const selectedCategory = useMemo(() => {
        return props.categories.find(c => c.name === selectedCategoryName) || null;
    }, [selectedCategoryName, props.categories]);
    
    const {
        operatingIncome,
        nonOperatingIncome,
        operatingExpense,
        nonOperatingExpense,
    } = useMemo(() => ({
        operatingIncome: props.categories.filter(c => c.type === 'operating_income'),
        nonOperatingIncome: props.categories.filter(c => c.type === 'non_operating_income'),
        operatingExpense: props.categories.filter(c => c.type === 'operating_expense'),
        nonOperatingExpense: props.categories.filter(c => c.type === 'non_operating_expense'),
    }), [props.categories]);

    useEffect(() => {
        if (selectedCategoryName && !props.categories.some(c => c.name === selectedCategoryName)) {
            setSelectedCategoryName(null);
        }
    }, [props.categories, selectedCategoryName]);

    const handleSelectCategory = (name: string) => {
        setSelectedCategoryName(prev => prev === name ? null : name);
    };

    const handleDragStart = (category: Category) => {
        setDraggedItem(category);
    };

    const handleDrop = (targetCategory: Category) => {
        if (draggedItem && draggedItem.name !== targetCategory.name && draggedItem.type === targetCategory.type) {
            props.onMoveCategory(draggedItem.name, targetCategory.name);
        }
        setDraggedItem(null);
        setDropTarget(null);
    };

    const handleDragEnter = (categoryName: string) => {
        if (draggedItem) {
            if (props.categories.find(c => c.name === categoryName)?.type === draggedItem.type) {
                setDropTarget(categoryName);
            }
        } else {
            setDropTarget(categoryName);
        }
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const commonProps = {
        rules: props.rules,
        transactionCounts: transactionCounts,
        maxTransactionCount: maxCount,
        selectedCategory: selectedCategoryName,
        onSelectCategory: handleSelectCategory,
        onAddCategory: props.onAddCategory,
        onDeleteCategory: props.onDeleteCategory,
        onRenameCategory: props.onRenameCategory,
        onAddRule: props.onAddRule,
        onDeleteRule: props.onDeleteRule,
        draggedItem,
        dropTarget,
        onDragStart: handleDragStart,
        onDrop: handleDrop,
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-3xl font-bold text-text-inverted">카테고리 및 자동 분류 관리</h3>
                <p className="mt-1 text-text-inverted-muted">
                    AI가 추천한 카테고리를 비즈니스에 맞게 관리하고, 키워드 규칙을 추가하여 자동 분류 정확도를 높일 수 있습니다.
                </p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                     <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-text-primary">수입</h3>
                        <CategorySection 
                            title="영업 수익"
                            type="operating_income"
                            categories={operatingIncome}
                            {...commonProps}
                        />
                         <CategorySection 
                            title="영업외 수익"
                            type="non_operating_income"
                            categories={nonOperatingIncome}
                            {...commonProps}
                        />
                    </div>
                     <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-text-primary">지출</h3>
                        <CategorySection 
                            title="영업 비용"
                            type="operating_expense"
                            categories={operatingExpense}
                            {...commonProps}
                        />
                         <CategorySection 
                            title="사업외 지출"
                            type="non_operating_expense"
                            categories={nonOperatingExpense}
                            {...commonProps}
                        />
                    </div>
                </div>
                <div className="sticky top-6">
                   <CategorizedItemsList 
                     category={selectedCategory} 
                     transactions={props.transactions} 
                   />
                </div>
            </div>
        </div>
    );
};

export default CategoryManagementView;