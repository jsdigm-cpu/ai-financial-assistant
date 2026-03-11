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
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: () => void;
    onDragLeaveEvent: (e: React.DragEvent) => void;
}> = (props) => {
    const { category, rules, transactionCount, maxTransactionCount, isRenamable, isDeletable, isSelected, onSelect, onRename, onDelete, onAddRule, onDeleteRule, isDraggedOver, onDragStart, onDragEnd, onDrop, onDragOver, onDragEnter, onDragLeaveEvent } = props;
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
            onDragLeave={onDragLeaveEvent}
            className={`bg-surface-card border rounded-lg transition-all ${isSelected ? 'ring-2 ring-brand-primary shadow-md border-transparent' : 'border-border-color hover:border-slate-400'} ${isDraggedOver ? 'ring-2 ring-green-500 border-green-400 bg-green-50 shadow-lg scale-[1.02]' : ''}`}
        >
            <div
                className='p-2.5 flex justify-between items-center'
            >
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <div
                        draggable={isRenamable}
                        onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
                        onDragEnd={(e) => { e.stopPropagation(); onDragEnd(); }}
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
                                className="text-slate-400 hover:text-blue-600 p-1 rounded-full hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }}
                                title={isDeletable ? "삭제" : "기본 카테고리는 삭제할 수 없습니다."} 
                                disabled={!isDeletable}
                                className="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
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
    onDescriptionDragStart?: (desc: string) => void;
    onDescriptionDragEnd?: () => void;
}> = ({ category, transactions, onDescriptionDragStart, onDescriptionDragEnd }) => {
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
        e.dataTransfer.effectAllowed = 'copyMove';
        onDescriptionDragStart?.(description);
    };

    if (!category) {
        return (
            <div className="bg-surface-card p-5 rounded-xl shadow-lg border border-border-color flex flex-col h-full min-h-[500px]">
                <div className="border-b border-border-color pb-3 mb-4">
                    <h4 className="text-xl font-bold text-text-primary">항목 상세보기</h4>
                    <p className="text-sm text-text-muted mt-1">왼쪽 목록에서 카테고리를 클릭하면, 해당 항목에 분류된 거래 내역이 여기에 표시됩니다.</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-text-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                        <p className="text-base font-semibold mt-3">카테고리를 선택해 주세요</p>
                        <p className="text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                            잘못 분류된 거래 항목은 이곳에서 마우스로 끌어다가(드래그) 왼쪽의 올바른 카테고리에 놓으면(드롭) 자동으로 재분류됩니다.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-card p-5 rounded-xl shadow-lg border border-border-color flex flex-col h-full min-h-[500px]">
            <div className="border-b border-border-color pb-3 mb-4">
                <h4 className="text-xl font-bold text-text-primary">항목 상세보기</h4>
                <p className="text-sm text-text-muted mt-1">선택된 카테고리에 속한 거래 내역입니다. 항목을 드래그하여 왼쪽의 다른 카테고리에 놓으면 분류를 변경할 수 있습니다.</p>
            </div>
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg px-4 py-2 mb-3">
                <span className="text-lg font-bold text-brand-primary">'{category.name}'</span>
                <span className="text-sm text-text-muted ml-2">({categorizedItems.length}개 항목)</span>
            </div>
            <ul className="space-y-1 flex-1 overflow-y-auto pr-2">
                {categorizedItems.map(([description, count]) => (
                    <li
                        key={description}
                        draggable
                        onDragStart={(e) => handleDragStart(e, description)}
                        onDragEnd={() => onDescriptionDragEnd?.()}
                        className="cursor-grab bg-surface-subtle p-2 px-3 rounded-md border border-border-color text-sm text-text-primary flex justify-between items-center hover:bg-blue-50 hover:border-blue-300 active:cursor-grabbing transition-colors"
                    >
                        <span className="truncate pr-2" title={description}>{description}</span>
                        <span className="flex-shrink-0 text-xs font-mono bg-border-color text-text-muted px-2 py-0.5 rounded-full">{count}</span>
                    </li>
                ))}
                {categorizedItems.length === 0 && (
                    <div className="flex items-center justify-center flex-1 min-h-[20vh] text-center text-text-muted">
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
    onDragEnd: () => void;
    onDrop: (targetCategory: Category) => void;
    onDragEnter: (categoryName: string) => void;
    onDragLeave: () => void;
    onDragLeaveEvent: (e: React.DragEvent) => void;
    draggedDescription: string | null;
}

const CategorySection: React.FC<CategorySectionProps> = (props) => {
    const { title, type, categories, rules, transactionCounts, maxTransactionCount, selectedCategory, onSelectCategory, onAddCategory, onDeleteCategory, onRenameCategory, onAddRule, onDeleteRule, draggedItem, dropTarget, onDragStart, onDragEnd, onDrop, onDragEnter, onDragLeave, onDragLeaveEvent, draggedDescription } = props;
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
                                onDragEnd={onDragEnd}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    const plainText = e.dataTransfer.getData("text/plain");

                                    if (plainText) {
                                        onAddRule({ keyword: plainText, category: cat.name, source: 'manual' });
                                    } else if (draggedDescription) {
                                        // Description drag from right panel (React state 기반 - 브라우저 호환성 보장)
                                        onAddRule({ keyword: draggedDescription, category: cat.name, source: 'manual' });
                                    } else if (draggedItem) {
                                        // Category reordering
                                        onDrop(cat);
                                    }
                                    onDragLeave();
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = draggedItem ? 'move' : 'copy';
                                    if (draggedItem || draggedDescription) {
                                        onDragEnter(cat.name);
                                    }
                                }}
                                onDragEnter={() => onDragEnter(cat.name)}
                                onDragLeaveEvent={onDragLeaveEvent}
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

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDropTarget(null);
    };

    const handleDrop = (targetCategory: Category) => {
        if (draggedItem && draggedItem.name !== targetCategory.name && draggedItem.type === targetCategory.type) {
            props.onMoveCategory(draggedItem.name, targetCategory.name);
        }
        setDraggedItem(null);
        setDropTarget(null);
    };

    const [draggedDescription, setDraggedDescription] = useState<string | null>(null);

    const handleDragEnter = (categoryName: string) => {
        if (draggedItem) {
            // Category reordering - only allow within same type
            if (props.categories.find(c => c.name === categoryName)?.type === draggedItem.type) {
                setDropTarget(categoryName);
            }
        } else if (draggedDescription) {
            // Description drag from right panel - allow drop on any category
            setDropTarget(categoryName);
        }
    };

    const handleDragLeave = () => {
        setDropTarget(null);
        setDraggedDescription(null);
    };

    const handleDragLeaveEvent = (e: React.DragEvent) => {
        // Only clear dropTarget if actually leaving the container (not entering a child)
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;
        if (!currentTarget.contains(relatedTarget)) {
            setDropTarget(null);
        }
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
        onDragEnd: handleDragEnd,
        onDrop: handleDrop,
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragLeaveEvent: handleDragLeaveEvent,
        draggedDescription,
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-3xl font-bold text-text-inverted">카테고리 및 자동 분류 관리</h3>
                <p className="mt-1 text-text-inverted-muted">
                    통장 거래가 어떤 항목(예: 식자재, 인건비, 카드매출 등)으로 분류되는지 관리하는 화면입니다.
                    왼쪽에서 분류 항목을 추가/삭제/이름변경할 수 있고, 오른쪽에서 각 항목에 속한 거래 내역을 확인할 수 있습니다.
                    잘못 분류된 거래는 오른쪽에서 드래그하여 왼쪽의 올바른 항목에 놓으면 자동으로 재분류됩니다.
                </p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
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
                <div className="h-full">
                   <CategorizedItemsList
                     category={selectedCategory}
                     transactions={props.transactions}
                     onDescriptionDragStart={(desc) => setDraggedDescription(desc)}
                     onDescriptionDragEnd={() => setDraggedDescription(null)}
                   />
                </div>
            </div>
        </div>
    );
};

export default CategoryManagementView;