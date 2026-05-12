'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import AddSongModal from '@/components/AddSongModal';
import { ArrowLeft, MicrophoneStage, HighlighterCircle, Lightbulb, Star, Plus } from '@phosphor-icons/react';
import { Panel, Group, Separator } from 'react-resizable-panels';

export default function AnalyzePage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tag management
  const [allTags, setAllTags] = useState<any[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const fetchSongs = async () => {
    const { data } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
    if (data) setSongs(data);
  };

  const fetchAllTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name', { ascending: true });
    if (data) setAllTags(data);
  };

  useEffect(() => {
    fetchSongs();
    fetchAllTags();
  }, []);

  const handleSelectSong = async (song: any) => {
    setSelectedSong(song);
    // Fetch sections with their highlights and tags
    const { data } = await supabase
      .from('song_sections')
      .select('*, phrase_highlights(*), song_section_tags(tags(*))')
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

  const handleToggleSectionTag = async (sectionId: string, tagId: string, hasTag: boolean) => {
    if (hasTag) {
      await supabase.from('song_section_tags').delete().match({ section_id: sectionId, tag_id: tagId });
    } else {
      await supabase.from('song_section_tags').insert([{ section_id: sectionId, tag_id: tagId }]);
    }
    
    // UIステートの更新
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const currentTags = s.song_section_tags || [];
        if (hasTag) {
          return { ...s, song_section_tags: currentTags.filter((st: any) => st.tags.id !== tagId) };
        } else {
          const tagToAdd = allTags.find(t => t.id === tagId);
          return { ...s, song_section_tags: [...currentTags, { tags: tagToAdd }] };
        }
      }
      return s;
    }));
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
          <mark key={hl.id} className="bg-[var(--color-accent-analyze)] text-[#161616] px-1 mx-0.5 cursor-pointer hover:opacity-80" title="保存されたフレーズ">
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
    <div className="flex h-full w-full" onClick={() => setActiveDropdownId(null)}>
      <Group orientation="horizontal" className="h-full w-full">
        {/* 左ペイン (30%) */}
        <Panel defaultSize={30} minSize={20} maxSize={50} className="bg-surface flex flex-col h-full border-r border-border relative">
        <div className="p-4 border-b border-border">
          <input 
            type="text" 
            placeholder="曲を検索..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border px-3 py-2 text-primary focus:outline-none focus:border-[var(--color-accent-analyze)] transition-colors"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {songs.length === 0 ? (
            <p className="text-secondary text-sm text-center mt-4">曲がまだないよ！</p>
          ) : (
            songs.filter(song => 
              song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              song.artist?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(song => (
              <div 
                key={song.id} 
                onClick={() => handleSelectSong(song)}
                className={`p-3 border cursor-pointer transition-colors ${selectedSong?.id === song.id ? 'border-[var(--color-accent-analyze)] bg-[rgba(0,255,65,0.05)]' : 'border-border bg-background hover:border-[var(--color-accent-analyze)]'}`}
              >
                <div className={`font-bold ${selectedSong?.id === song.id ? 'text-[var(--color-accent-analyze)]' : 'text-primary'}`}>{song.title}</div>
                <div className="text-sm text-secondary">{song.artist}</div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-border">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full border border-[var(--color-accent-analyze)] text-[var(--color-accent-analyze)] py-2 hover:bg-[var(--color-accent-analyze)] hover:text-[#1c1917] transition-colors font-bold flex items-center justify-center gap-2"
          >
            <Plus weight="bold" /> 新規曲を登録
          </button>
        </div>
      </Panel>

      <Separator className="w-1 bg-border hover:bg-[var(--color-accent-analyze)] transition-colors cursor-col-resize z-10 shrink-0" />

      {/* 右ペイン (70%) */}
      <Panel defaultSize={70} minSize={50} className="bg-background flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto flex flex-col h-full">
        {!selectedSong ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-secondary text-lg">
            <ArrowLeft className="w-6 h-6" /> 左から曲を選ぶか、新しく登録してね！
          </div>
        ) : (
          <div className="p-8 max-w-4xl mx-auto w-full">
            {/* ヘッダー */}
            <div className="mb-8 border-b border-border pb-6">
              <h1 className="text-4xl font-bold mb-3 text-primary">{selectedSong.title}</h1>
              <div className="flex gap-3 text-sm text-secondary">
                <span className="bg-surface px-3 py-1 border border-border flex items-center gap-1"><MicrophoneStage className="w-4 h-4" /> {selectedSong.artist}</span>
                {selectedSong.bpm && <span className="bg-surface px-3 py-1 border border-border">BPM: {selectedSong.bpm}</span>}
                {selectedSong.key && <span className="bg-surface px-3 py-1 border border-border">Key: {selectedSong.key}</span>}
              </div>
            </div>

            {/* セクション群 */}
            <div className="space-y-6 pb-20">
              {sections.map(section => (
                <div key={section.id} className={`border ${section.is_favorite ? 'border-[var(--color-accent-analyze)]' : 'border-border'} bg-surface p-6 transition-all`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-primary bg-background px-3 py-1 border border-border inline-block">
                      {section.section_name}
                    </h3>
                    <div className="space-x-2">
                      <button 
                        onClick={() => handleExtractPhrase(section)}
                        className="flex items-center gap-1 text-xs bg-background border border-border px-3 py-1.5 hover:border-[var(--color-accent-analyze)] hover:text-[var(--color-accent-analyze)] transition-colors text-primary font-bold"
                      >
                        <HighlighterCircle className="w-4 h-4" /> フレーズ抽出
                      </button>
                      <button 
                        onClick={() => handleToggleFavorite(section.id, section.is_favorite)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 border transition-colors ${section.is_favorite ? 'bg-[var(--color-accent-analyze)] text-[#161616] border-[var(--color-accent-analyze)] font-bold' : 'bg-background border-border text-secondary hover:text-primary hover:border-border'}`}
                      >
                        {section.is_favorite ? <><Star weight="fill" className="w-4 h-4" /> お気に入り</> : <><Star className="w-4 h-4" /> お気に入り</>}
                      </button>
                    </div>
                  </div>
                  
                  {/* ハイライト対応のテキスト描画 */}
                  <div id={`section-content-${section.id}`} className="whitespace-pre-wrap font-sans text-primary mb-6 leading-relaxed text-lg">
                    {renderHighlightedText(section.content, section.phrase_highlights)}
                  </div>

                  <div className="border-t border-border pt-4 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <label className="flex items-center gap-1 text-xs text-secondary"><Lightbulb className="w-4 h-4" /> セクションメモ（考察・気付き）</label>
                    </div>
                    <textarea 
                      className="w-full bg-background border border-border p-3 text-sm text-primary focus:border-[var(--color-accent-analyze)] outline-none resize-none mb-3"
                      rows={2}
                      placeholder="このセクションの展開がめっちゃエモい..."
                      value={section.memo || ''}
                      onChange={(e) => handleUpdateMemo(section.id, e.target.value)}
                    />
                    
                    {/* タグ付けUI */}
                    <div className="flex flex-wrap gap-2 items-center relative" onClick={(e) => e.stopPropagation()}>
                      {section.song_section_tags?.map((st: any) => (
                        <span key={st.tags.id} className="group flex items-center text-xs bg-background border border-border text-secondary pl-2 pr-1 py-1 transition-colors">
                          {st.tags.name}
                          <button 
                            onClick={() => handleToggleSectionTag(section.id, st.tags.id, true)}
                            className="ml-1 w-4 h-4 flex items-center justify-center hover:text-primary"
                          >&times;</button>
                        </span>
                      ))}
                      <button 
                        onClick={() => setActiveDropdownId(activeDropdownId === section.id ? null : section.id)}
                        className="text-xs text-secondary hover:text-primary px-2 py-1 transition-colors flex items-center gap-1"
                      >
                        <Plus /> タグを追加
                      </button>

                      {/* タグ選択ドロップダウン */}
                      {activeDropdownId === section.id && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border z-10 p-4 flex flex-col gap-4 max-h-[300px] overflow-y-auto">
                          {['Focus', 'Gimmick', 'Context'].map(axis => {
                            const axisTags = allTags.filter(t => t.axis_category === axis);
                            if (axisTags.length === 0) return null;
                            return (
                              <div key={axis}>
                                <div className="text-[10px] uppercase font-bold text-secondary mb-2 tracking-wider">{axis}</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {axisTags.map(tag => {
                                    const hasTag = section.song_section_tags?.some((st: any) => st.tags.id === tag.id);
                                    return (
                                      <button
                                        key={tag.id}
                                        onClick={() => handleToggleSectionTag(section.id, tag.id, hasTag)}
                                        className={`text-xs px-2.5 py-1.5 border transition-colors ${hasTag ? 'bg-[var(--color-accent-analyze)] text-[#161616] border-[var(--color-accent-analyze)] font-bold' : 'bg-background text-secondary border-border hover:border-[var(--color-accent-analyze)] hover:text-primary'}`}
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
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </Panel>
      </Group>

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
