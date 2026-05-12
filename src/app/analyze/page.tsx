'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import AddSongModal from '@/components/AddSongModal';
import { ArrowLeftIcon, MicIcon, EditIcon, LightbulbIcon, StarIcon, StarOutlineIcon } from '@/components/icons';

export default function AnalyzePage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSongs = async () => {
    const { data } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
    if (data) setSongs(data);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleSelectSong = async (song: any) => {
    setSelectedSong(song);
    // Fetch sections with their highlights
    const { data } = await supabase
      .from('song_sections')
      .select('*, phrase_highlights(*)')
      .eq('song_id', song.id)
      .order('sort_order', { ascending: true });
    
    if (data) setSections(data);
  };

  const handleUpdateMemo = async (sectionId: string, memo: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, memo } : s));
    await supabase.from('song_sections').update({ memo }).eq('id', sectionId);
  };

  const handleToggleFavorite = async (sectionId: string, currentFav: boolean) => {
    const newFav = !currentFav;
    setSections(sections.map(s => s.id === sectionId ? { ...s, is_favorite: newFav } : s));
    await supabase.from('song_sections').update({ is_favorite: newFav }).eq('id', sectionId);
  };

  const handleExtractPhrase = async (section: any) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      alert("ハイライトしたいテキストをマウスで選択（ドラッグ）してからボタンを押してね！");
      return;
    }

    const container = document.getElementById(`section-content-${section.id}`);
    if (!container || !container.contains(selection.anchorNode)) {
      alert("このセクションのテキストを選択してね！");
      return;
    }

    // 選択範囲の絶対位置（start_index, end_index）を計算
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preSelectionRange.toString().length;
    const text = range.toString();
    const endIndex = startIndex + text.length;

    // データベースに保存
    const { data, error } = await supabase.from('phrase_highlights').insert([{
      section_id: section.id,
      phrase_text: text,
      start_index: startIndex,
      end_index: endIndex
    }]).select().single();

    if (data) {
      setSections(sections.map(s => {
        if (s.id === section.id) {
          return { ...s, phrase_highlights: [...(s.phrase_highlights || []), data] };
        }
        return s;
      }));
    }
    
    selection.removeAllRanges();
  };

  const renderHighlightedText = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) return text;
    
    // 開始位置順にソート
    const sorted = [...highlights].sort((a, b) => a.start_index - b.start_index);
    
    let lastIndex = 0;
    const elements = [];
    
    sorted.forEach((hl, idx) => {
      if (hl.start_index >= lastIndex) {
        // ハイライトの前のテキスト
        elements.push(text.slice(lastIndex, hl.start_index));
        // ハイライト部分
        elements.push(
          <mark key={hl.id} className="bg-accent text-primary px-1 rounded mx-0.5 shadow-sm transition-colors cursor-pointer hover:bg-opacity-80" title="保存されたフレーズ">
            {text.slice(hl.start_index, hl.end_index)}
          </mark>
        );
        lastIndex = hl.end_index;
      }
    });
    
    // 残りのテキスト
    elements.push(text.slice(lastIndex));
    return elements;
  };

  return (
    <div className="flex h-full w-full">
      {/* 左ペイン (30%) */}
      <div className="w-[30%] min-w-[250px] border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <input 
            type="text" 
            placeholder="曲を検索..." 
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {songs.length === 0 ? (
            <p className="text-secondary text-sm text-center mt-4">曲がまだないよ！</p>
          ) : (
            songs.map(song => (
              <div 
                key={song.id} 
                onClick={() => handleSelectSong(song)}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedSong?.id === song.id ? 'bg-accent border-accent' : 'bg-background border-border hover:border-accent'}`}
              >
                <div className="font-bold text-primary">{song.title}</div>
                <div className="text-sm text-secondary">{song.artist}</div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary text-background py-2 rounded-md hover:opacity-90 transition-opacity font-bold"
          >
            + 新規曲を登録
          </button>
        </div>
      </div>

      {/* 右ペイン (70%) */}
      <div className="flex-1 bg-background flex flex-col overflow-y-auto relative">
        {!selectedSong ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-secondary text-lg">
            <ArrowLeftIcon className="w-6 h-6" /> 左から曲を選ぶか、新しく登録してね！
          </div>
        ) : (
          <div className="p-8 max-w-4xl mx-auto w-full">
            {/* ヘッダー */}
            <div className="mb-8 border-b border-border pb-6">
              <h1 className="text-4xl font-bold mb-3 text-primary">{selectedSong.title}</h1>
              <div className="flex gap-3 text-sm text-secondary">
                <span className="bg-surface px-3 py-1 rounded-full border border-border flex items-center gap-1"><MicIcon className="w-4 h-4" /> {selectedSong.artist}</span>
                {selectedSong.bpm && <span className="bg-surface px-3 py-1 rounded-full border border-border">BPM: {selectedSong.bpm}</span>}
                {selectedSong.key && <span className="bg-surface px-3 py-1 rounded-full border border-border">Key: {selectedSong.key}</span>}
              </div>
            </div>

            {/* セクション群 */}
            <div className="space-y-6 pb-20">
              {sections.map(section => (
                <div key={section.id} className={`border ${section.is_favorite ? 'border-primary shadow-sm' : 'border-border'} bg-surface rounded-lg p-6 transition-all`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-primary bg-background px-3 py-1 rounded border border-border inline-block">
                      {section.section_name}
                    </h3>
                    <div className="space-x-2">
                      <button 
                        onClick={() => handleExtractPhrase(section)}
                        className="flex items-center gap-1 text-xs bg-background border border-border px-3 py-1.5 rounded hover:bg-accent transition-colors text-primary font-bold"
                      >
                        <EditIcon className="w-3 h-3" /> フレーズ抽出
                      </button>
                      <button 
                        onClick={() => handleToggleFavorite(section.id, section.is_favorite)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition-colors ${section.is_favorite ? 'bg-primary text-background border-primary font-bold' : 'bg-background border-border text-secondary hover:bg-accent'}`}
                      >
                        {section.is_favorite ? <><StarIcon className="w-3 h-3" /> お気に入り</> : <><StarOutlineIcon className="w-3 h-3" /> お気に入り</>}
                      </button>
                    </div>
                  </div>
                  
                  {/* ハイライト対応のテキスト描画 */}
                  <div id={`section-content-${section.id}`} className="whitespace-pre-wrap font-sans text-primary mb-6 leading-relaxed text-lg">
                    {renderHighlightedText(section.content, section.phrase_highlights)}
                  </div>

                  <div className="border-t border-border pt-4">
                    <label className="flex items-center gap-1 text-xs text-secondary mb-2"><LightbulbIcon className="w-3 h-3" /> セクションメモ（考察・気付き）</label>
                    <textarea 
                      className="w-full bg-background border border-border rounded p-3 text-sm text-primary focus:border-accent outline-none resize-none"
                      rows={2}
                      placeholder="このセクションの展開がめっちゃエモい..."
                      value={section.memo || ''}
                      onChange={(e) => handleUpdateMemo(section.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddSongModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          fetchSongs();
        }}
      />
    </div>
  );
}
