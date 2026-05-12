'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import StockPalette from '@/components/StockPalette';
import { Pen, ArrowLeft, Lightbulb, ChatCircle, Trash, CaretUp, CaretDown, Plus } from '@phosphor-icons/react';
import ResizableLayout from '@/components/ResizableLayout';

export default function WritePage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeDraft, setActiveDraft] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    fetchDrafts();
    
    // パレット用のショートカットキー (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchDrafts = async () => {
    const { data } = await supabase.from('drafts').select('*').order('updated_at', { ascending: false });
    if (data) setDrafts(data);
  };

  const handleCreateDraft = async () => {
    const { data } = await supabase.from('drafts').insert([{ title: '無題のドラフト' }]).select().single();
    if (data) {
      setDrafts([data, ...drafts]);
      handleSelectDraft(data);
    }
  };

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('このドラフトを本当に削除する？（元には戻せないよ！）')) return;
    
    await supabase.from('drafts').delete().eq('id', draftId);
    setDrafts(drafts.filter(d => d.id !== draftId));
    if (activeDraft?.id === draftId) {
      setActiveDraft(null);
      setSections([]);
    }
  };

  const handleSelectDraft = async (draft: any) => {
    setActiveDraft(draft);
    const { data } = await supabase.from('draft_sections').select('*').eq('draft_id', draft.id).order('sort_order', { ascending: true });
    if (data) setSections(data);
  };

  const handleUpdateDraftTitle = async (title: string) => {
    setActiveDraft({ ...activeDraft, title });
    await supabase.from('drafts').update({ title, updated_at: new Date() }).eq('id', activeDraft.id);
    setDrafts(drafts.map(d => d.id === activeDraft.id ? { ...d, title } : d));
  };

  const handleAddSection = async () => {
    if (!activeDraft) return;
    const newOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order || 0)) + 1 : 0;
    const { data } = await supabase.from('draft_sections').insert([{
      draft_id: activeDraft.id,
      section_name: '新しいセクション',
      sort_order: newOrder,
      main_content: '',
      sub_content: ''
    }]).select().single();
    
    if (data) {
      setSections([...sections, data]);
    }
  };

  const handleUpdateSection = async (id: string, field: string, value: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    await supabase.from('draft_sections').update({ [field]: value }).eq('id', id);
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('このセクションを削除してもいい？')) return;
    await supabase.from('draft_sections').delete().eq('id', id);
    setSections(sections.filter(s => s.id !== id));
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // スワップ
    const currentSection = newSections[index];
    const targetSection = newSections[targetIndex];
    
    const currentOrder = currentSection.sort_order;
    currentSection.sort_order = targetSection.sort_order;
    targetSection.sort_order = currentOrder;

    newSections[index] = targetSection;
    newSections[targetIndex] = currentSection;

    setSections(newSections);

    // DB更新 (並列処理)
    await Promise.all([
      supabase.from('draft_sections').update({ sort_order: currentSection.sort_order }).eq('id', currentSection.id),
      supabase.from('draft_sections').update({ sort_order: targetSection.sort_order }).eq('id', targetSection.id)
    ]);
  };

  const leftPane = (
    <div className="bg-surface flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border font-bold text-primary flex justify-between items-center shrink-0">
        <span className="flex items-center gap-2"><Pen className="w-4 h-4" /> 制作中の曲</span>
        <button onClick={handleCreateDraft} className="text-secondary hover:text-[var(--color-accent-write)] px-2 border border-transparent hover:border-[var(--color-accent-write)] transition-colors"><Plus /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {drafts.map(draft => (
          <div 
            key={draft.id} 
            onClick={() => handleSelectDraft(draft)}
            className={`p-3 border cursor-pointer transition-colors text-sm flex justify-between items-center group overflow-hidden ${activeDraft?.id === draft.id ? 'bg-[rgba(0,229,255,0.05)] border-[var(--color-accent-write)] text-[var(--color-accent-write)]' : 'bg-background border-border text-secondary hover:border-[var(--color-accent-write)]'}`}
          >
            <span className="truncate pr-2 whitespace-nowrap">{draft.title}</span>
            <button 
              onClick={(e) => handleDeleteDraft(draft.id, e)}
              className={`hover:text-primary transition-opacity ${activeDraft?.id === draft.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              title="削除"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );


  const rightPane = (
    <div className="flex flex-col h-full overflow-hidden bg-background">
        {!activeDraft ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-secondary text-lg">
            <ArrowLeft className="w-6 h-6" /> 左からドラフトを選ぶか、新しく作ってね！
          </div>
        ) : (
          <div className="p-8 max-w-5xl mx-auto w-full pb-32">
            {/* ヘッダー: タイトル */}
            <div className="mb-8 border-b border-border pb-4 flex justify-between items-end">
              <input 
                type="text" 
                value={activeDraft.title}
                onChange={(e) => handleUpdateDraftTitle(e.target.value)}
                className="text-4xl font-bold bg-transparent text-primary focus:outline-none border-b border-transparent focus:border-border w-2/3 transition-colors"
                placeholder="仮タイトル..."
              />
              <button 
                onClick={() => setIsPaletteOpen(true)}
                className="border border-[var(--color-accent-write)] text-[var(--color-accent-write)] px-4 py-2 hover:bg-[var(--color-accent-write)] hover:text-[#161616] transition-colors text-sm font-bold flex items-center gap-2"
              >
                <Lightbulb weight="fill" className="w-4 h-4" /> Stockを検索 (Cmd+K)
              </button>
            </div>

            {/* セクション群 */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={section.id} className="bg-surface border border-border p-6 relative group">
                  
                  {/* アクションボタン (右上) */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface pl-2">
                    <button 
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-secondary hover:text-[var(--color-accent-write)] disabled:opacity-30 disabled:hover:text-secondary"
                      title="上に移動"
                    ><CaretUp className="w-5 h-5" /></button>
                    <button 
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-1.5 text-secondary hover:text-[var(--color-accent-write)] disabled:opacity-30 disabled:hover:text-secondary"
                      title="下に移動"
                    ><CaretDown className="w-5 h-5" /></button>
                    <div className="w-px h-4 bg-border mx-1"></div>
                    <button 
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-1.5 text-secondary hover:text-primary"
                      title="セクションを削除"
                    ><Trash className="w-4 h-4" /></button>
                  </div>

                  <div className="mb-4 pr-32">
                    <input 
                      type="text" 
                      value={section.section_name}
                      onChange={(e) => handleUpdateSection(section.id, 'section_name', e.target.value)}
                      className="font-bold text-lg text-primary bg-background border border-border px-3 py-1 focus:outline-none focus:border-[var(--color-accent-write)] transition-colors"
                      placeholder="セクション名 (Aメロなど)"
                    />
                  </div>
                  
                  {/* 2ペイン (メイン & サブ) */}
                  <div className="grid grid-cols-2 gap-6 h-64">
                    <div className="flex flex-col h-full">
                      <label className="flex items-center gap-1.5 text-xs text-secondary mb-2 uppercase font-bold tracking-wider"><Pen className="w-3 h-3" /> メイン枠（歌詞）</label>
                      <textarea 
                        value={section.main_content || ''}
                        onChange={(e) => handleUpdateSection(section.id, 'main_content', e.target.value)}
                        className="flex-1 bg-background border border-border p-4 text-primary focus:outline-none focus:border-[var(--color-accent-write)] resize-none font-sans leading-relaxed text-lg transition-colors"
                        placeholder="ここに組み上がってきた歌詞を書く..."
                      />
                    </div>
                    <div className="flex flex-col h-full">
                      <label className="flex items-center gap-1.5 text-xs text-secondary mb-2 uppercase font-bold tracking-wider opacity-70"><ChatCircle className="w-3 h-3" /> サブ枠（アイデアプール）</label>
                      <textarea 
                        value={section.sub_content || ''}
                        onChange={(e) => handleUpdateSection(section.id, 'sub_content', e.target.value)}
                        className="flex-1 bg-background border border-border p-4 text-secondary focus:outline-none focus:border-[var(--color-accent-write)] resize-none font-sans leading-relaxed opacity-80 transition-colors text-sm"
                        placeholder="使いたい言葉の断片やイメージを置いておく..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <button 
                onClick={handleAddSection}
                className="w-full border border-dashed border-border bg-surface text-secondary py-4 hover:border-[var(--color-accent-write)] hover:text-primary transition-colors font-bold"
              >
                + セクションを追加
              </button>
            </div>
          </div>
        )}
    </div>
  );

  return (
    <div className="h-full w-full bg-background relative overflow-hidden">
      <ResizableLayout
        leftPanel={leftPane}
        rightPanel={rightPane}
        defaultLeftPercent={22}
        minLeftPercent={12}
        maxLeftPercent={45}
        handleColor="var(--color-accent-write)"
      />

      {/* 右からスライドインするStockパレット */}
      <StockPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}
