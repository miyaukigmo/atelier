'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { LightbulbIcon } from './icons';

export default function StockPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [stocks, setStocks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchStocks();
    }
  }, [isOpen]);

  const fetchStocks = async () => {
    const { data } = await supabase.from('stocks').select('*').order('created_at', { ascending: false });
    if (data) setStocks(data);
  };

  const filteredStocks = stocks.filter(s => 
    s.phrase.includes(searchTerm) || (s.memo && s.memo.includes(searchTerm))
  );

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-surface border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform">
      <div className="p-4 border-b border-border flex justify-between items-center bg-background">
        <h3 className="font-bold text-primary flex items-center gap-2"><LightbulbIcon className="w-5 h-5" /> Stock パレット</h3>
        <button onClick={onClose} className="text-secondary hover:text-primary text-2xl leading-none">&times;</button>
      </div>
      <div className="p-4 border-b border-border bg-surface shrink-0">
        <input 
          type="text" 
          placeholder="言葉を検索..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background border border-border rounded p-2 text-sm text-primary focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredStocks.map(stock => (
          <div key={stock.id} className="bg-background border border-border rounded p-3 hover:border-accent transition-colors">
            <div className="font-bold text-sm text-primary mb-1 whitespace-pre-wrap">{stock.phrase}</div>
            {stock.memo && <div className="text-xs text-secondary mt-2 border-t border-border pt-1">{stock.memo}</div>}
          </div>
        ))}
        {filteredStocks.length === 0 && (
          <div className="text-center text-xs text-secondary mt-4">見つかりませんでした</div>
        )}
      </div>
    </div>
  );
}
