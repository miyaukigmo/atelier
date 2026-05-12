'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function StockPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [phraseInput, setPhraseInput] = useState('');
  
  // Tag management
  const [allTags, setAllTags] = useState<any[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const fetchStocks = async () => {
    const { data } = await supabase.from('stocks').select('*, stock_tags(tags(*))').order('created_at', { ascending: false });
    if (data) setStocks(data);
  };

  const fetchAllTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name', { ascending: true });
    if (data) setAllTags(data);
  };

  useEffect(() => {
    fetchStocks();
    fetchAllTags();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phraseInput.trim()) return;
    
    await supabase.from('stocks').insert([{ phrase: phraseInput.trim(), is_inbox: true }]);
    setPhraseInput('');
    fetchStocks();
  };

  const handleUpdateMemo = async (id: string, memo: string, oldMemo: string) => {
    if (memo === oldMemo) return;
    await supabase.from('stocks').update({ memo }).eq('id', id);
    setStocks(stocks.map(s => s.id === id ? { ...s, memo } : s));
  };

  const handleToggleStockTag = async (stockId: string, tagId: string, hasTag: boolean) => {
    if (hasTag) {
      await supabase.from('stock_tags').delete().match({ stock_id: stockId, tag_id: tagId });
    } else {
      await supabase.from('stock_tags').insert([{ stock_id: stockId, tag_id: tagId }]);
      // タグが付いたら Inbox を外す
      await supabase.from('stocks').update({ is_inbox: false }).eq('id', stockId);
    }
    fetchStocks();
  };

  // フィルター処理 (AND検索)
  const filteredStocks = stocks.filter(stock => {
    if (filterTags.length === 0) return true;
    const stockTagIds = stock.stock_tags?.map((st: any) => st.tags.id) || [];
    return filterTags.every(tagId => stockTagIds.includes(tagId));
  });

  return (
    <div className="flex flex-col h-full w-full bg-background" onClick={() => setActiveDropdownId(null)}>
      {/* トップバー (クイック入力 & フィルター) */}
      <div className="p-6 border-b border-border bg-surface shrink-0">
        <form onSubmit={handleQuickAdd} className="max-w-4xl mx-auto flex gap-4 mb-4">
          <input 
            type="text" 
            value={phraseInput}
            onChange={(e) => setPhraseInput(e.target.value)}
            placeholder="ふと思いついたフレーズを入力してEnter（とりあえずInboxへ直行！）" 
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-primary transition-colors text-lg"
          />
          <button type="submit" disabled={!phraseInput.trim()} className="bg-primary text-background font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            + 追加
          </button>
        </form>
      </div>

      {/* フィルターバー */}
      {allTags.length > 0 && (
        <div className="px-6 py-3 border-b border-border bg-background flex gap-4 overflow-x-auto shrink-0">
          <div className="text-sm font-bold text-secondary flex items-center whitespace-nowrap">Filter:</div>
          <div className="flex gap-2">
            {allTags.map(tag => {
              const isActive = filterTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (isActive) {
                      setFilterTags(filterTags.filter(id => id !== tag.id));
                    } else {
                      setFilterTags([...filterTags, tag.id]);
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-background border-primary font-bold shadow-sm' : 'bg-surface text-secondary border-border hover:border-accent'}`}
                >
                  {tag.name}
                </button>
              );
            })}
            {filterTags.length > 0 && (
              <button 
                onClick={() => setFilterTags([])}
                className="text-xs px-3 py-1.5 text-secondary hover:text-primary transition-colors ml-2"
              >
                クリア
              </button>
            )}
          </div>
        </div>
      )}

      {/* メインエリア (グリッドビュー) */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredStocks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-secondary text-lg">
            {stocks.length === 0 
              ? "まだアイデアがないみたい！上のバーから思いついた言葉をどんどん投げてね！"
              : "フィルターに一致するアイデアがないよ！"}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredStocks.map(stock => (
              <div key={stock.id} className="relative bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors flex flex-col min-h-[200px] shadow-sm">
                {/* Inbox インジケーター */}
                {stock.is_inbox && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent rounded-l-xl" title="未分類 (Inbox)"></div>
                )}
                
                <div className="font-bold text-xl text-primary mb-4 whitespace-pre-wrap flex-1">
                  {stock.phrase}
                </div>
                
                <div className="border-t border-border pt-3 mt-auto mb-3">
                  <textarea 
                    className="w-full text-sm bg-transparent border border-transparent hover:border-border focus:border-accent rounded p-2 text-secondary focus:text-primary focus:outline-none resize-none transition-colors"
                    placeholder="背景や意図をメモ..."
                    defaultValue={stock.memo || ''}
                    rows={2}
                    onBlur={(e) => handleUpdateMemo(stock.id, e.target.value, stock.memo)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 items-center relative" onClick={(e) => e.stopPropagation()}>
                  {stock.stock_tags?.map((st: any) => (
                    <span key={st.tags.id} className="group flex items-center text-xs bg-background border border-border text-secondary pl-2 pr-1 py-1 rounded transition-colors hover:border-accent">
                      {st.tags.name}
                      <button 
                        onClick={() => handleToggleStockTag(stock.id, st.tags.id, true)}
                        className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-accent hover:text-primary"
                      >&times;</button>
                    </span>
                  ))}
                  <button 
                    onClick={() => setActiveDropdownId(activeDropdownId === stock.id ? null : stock.id)}
                    className="text-xs text-secondary hover:text-primary px-2 py-1 transition-colors"
                  >
                    + タグを追加
                  </button>

                  {/* タグ選択ドロップダウン */}
                  {activeDropdownId === stock.id && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl z-10 p-4 flex flex-col gap-4 max-h-[300px] overflow-y-auto">
                      {['Focus', 'Gimmick', 'Context'].map(axis => {
                        const axisTags = allTags.filter(t => t.axis_category === axis);
                        if (axisTags.length === 0) return null;
                        return (
                          <div key={axis}>
                            <div className="text-[10px] uppercase font-bold text-secondary mb-2 tracking-wider">{axis}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {axisTags.map(tag => {
                                const hasTag = stock.stock_tags?.some((st: any) => st.tags.id === tag.id);
                                return (
                                  <button
                                    key={tag.id}
                                    onClick={() => handleToggleStockTag(stock.id, tag.id, hasTag)}
                                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${hasTag ? 'bg-primary text-background border-primary' : 'bg-background text-secondary border-border hover:border-accent hover:text-primary'}`}
                                  >
                                    {tag.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
