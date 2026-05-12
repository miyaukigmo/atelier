'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function StockPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [phraseInput, setPhraseInput] = useState('');
  
  const fetchStocks = async () => {
    const { data } = await supabase.from('stocks').select('*, stock_tags(tags(*))').order('created_at', { ascending: false });
    if (data) setStocks(data);
  };

  useEffect(() => {
    fetchStocks();
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
    // メモが追加されたら Inbox を外すかはお好みですが、ここではタグ整理をInbox卒業条件と捉えそのままにします
    await supabase.from('stocks').update({ memo }).eq('id', id);
    setStocks(stocks.map(s => s.id === id ? { ...s, memo } : s));
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* トップバー (クイック入力 & フィルター) */}
      <div className="p-6 border-b border-border bg-surface shrink-0">
        <form onSubmit={handleQuickAdd} className="max-w-4xl mx-auto flex gap-4">
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

      {/* メインエリア (グリッドビュー) */}
      <div className="flex-1 overflow-y-auto p-8">
        {stocks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-secondary text-lg">
            まだアイデアがないみたい！上のバーから思いついた言葉をどんどん投げてね！
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {stocks.map(stock => (
              <div key={stock.id} className="relative bg-surface border border-border rounded-xl p-6 hover:border-accent transition-colors flex flex-col min-h-[200px] shadow-sm">
                {/* Inbox インジケーター */}
                {stock.is_inbox && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent rounded-l-xl" title="未分類 (Inbox)"></div>
                )}
                
                <div className="font-bold text-xl text-primary mb-4 whitespace-pre-wrap flex-1">
                  {stock.phrase}
                </div>
                
                <div className="border-t border-border pt-3 mt-auto">
                  <textarea 
                    className="w-full text-sm bg-transparent border border-transparent hover:border-border focus:border-accent rounded p-2 text-secondary focus:text-primary focus:outline-none resize-none transition-colors"
                    placeholder="背景や意図をメモ..."
                    defaultValue={stock.memo || ''}
                    rows={2}
                    onBlur={(e) => handleUpdateMemo(stock.id, e.target.value, stock.memo)}
                  />
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  {stock.stock_tags?.map((st: any) => (
                    <span key={st.tags.id} className="text-xs bg-background border border-border text-secondary px-2 py-1 rounded">
                      {st.tags.name}
                    </span>
                  ))}
                  <button className="text-xs text-secondary hover:text-primary px-2 py-1 transition-colors">
                    + タグを追加
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
