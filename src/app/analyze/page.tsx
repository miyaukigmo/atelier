'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import AddSongModal from '@/components/AddSongModal';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import MemoModal from '@/components/MemoModal';
import { ArrowLeft, MicrophoneStage, HighlighterCircle, Lightbulb, Star, Plus, MagnifyingGlass, Tag, X, CheckCircle } from '@phosphor-icons/react';
import ResizableLayout from '@/components/ResizableLayout';

type SearchResult = {
  song_id: string;
  song_title: string;
  song_artist: string;
  section_id: string;
  section_name: string;
  match_type: 'lyrics' | 'memo' | 'tag';
  match_text: string;
  tag_names?: string[];
};

export default function AnalyzePage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 左ペインのモード: 'list' | 'search'
  const [leftMode, setLeftMode] = useState<'list' | 'search'>('list');
  const [songSearch, setSongSearch] = useState('');

  // 全文検索
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'lyrics' | 'memo' | 'tag'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Tag management
  const [allTags, setAllTags] = useState<any[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // 選択中セクションにフォーカス
  const [highlightSectionId, setHighlightSectionId] = useState<string | null>(null);

  // 曲メモ
  const [songMemoValue, setSongMemoValue] = useState<string>('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  // テクニック抽出
  const parseTechniques = (memo: string): { title: string; description: string }[] => {
    const techMatch = memo.match(/## 作詞テクニック\n([\s\S]*?)(?=\n##|\n---|\/\*|$)/);
    if (!techMatch) return [];
    const section = techMatch[1];
    const lines = section.split('\n').filter(l => l.trim());
    const results: { title: string; description: string }[] = [];
    for (const line of lines) {
      // **タイトル**：説明  または  **タイトル**: 説明
      const m = line.match(/^\*\*(.+?)\*\*[：:]\s*(.+)$/);
      if (m) results.push({ title: m[1].trim(), description: m[2].trim() });
    }
    return results;
  };

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
    setSongMemoValue(song.memo || '');
    const { data } = await supabase
      .from('song_sections')
      .select('*, phrase_highlights(*), song_section_tags(tags(*))')
      .eq('song_id', song.id)
      .order('sort_order', { ascending: true });
    if (data) setSections(data);
  };

  const handleSaveSongMemo = async (memo: string) => {
    if (!selectedSong) return;
    setIsSavingMemo(true);
    await supabase.from('songs').update({ memo }).eq('id', selectedSong.id);
    setSelectedSong((prev: any) => ({ ...prev, memo }));
    setSongs(songs.map(s => s.id === selectedSong.id ? { ...s, memo } : s));

    // テクニック自動抽出
    const techniques = parseTechniques(memo);
    if (techniques.length > 0) {
      // 既存のテクニックを削除してから再挿入
      await supabase.from('song_techniques').delete().eq('song_id', selectedSong.id);
      await supabase.from('song_techniques').insert(
        techniques.map(t => ({ song_id: selectedSong.id, title: t.title, description: t.description, source_text: memo }))
      );
      setExtractedCount(techniques.length);
      setTimeout(() => setExtractedCount(null), 4000);
    }

    setTimeout(() => setIsSavingMemo(false), 600);
  };

  const handleSelectResult = async (result: SearchResult) => {
    const song = songs.find(s => s.id === result.song_id) || { id: result.song_id, title: result.song_title, artist: result.song_artist };
    await handleSelectSong(song);
    setHighlightSectionId(result.section_id);
    setLeftMode('list');
    setTimeout(() => {
      const el = document.getElementById(`section-${result.section_id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const runGlobalSearch = useCallback(async (q: string, filter: typeof searchFilter) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    const results: SearchResult[] = [];

    // 全セクションを取得（歌詞・メモ・タグ）
    const { data: sectionsData } = await supabase
      .from('song_sections')
      .select('id, section_name, content, memo, song_id, songs(title, artist), song_section_tags(tags(id, name))')
      .order('sort_order', { ascending: true });

    if (sectionsData) {
      for (const sec of sectionsData) {
        const song = sec.songs as any;
        const tagNames: string[] = ((sec.song_section_tags as any[]) || []).map((st: any) => st.tags?.name).filter(Boolean);

        const base = {
          song_id: sec.song_id,
          song_title: song?.title || '',
          song_artist: song?.artist || '',
          section_id: sec.id,
          section_name: sec.section_name,
          tag_names: tagNames,
        };

        const lq = q.toLowerCase();

        if ((filter === 'all' || filter === 'lyrics') && sec.content?.toLowerCase().includes(lq)) {
          results.push({ ...base, match_type: 'lyrics', match_text: sec.content });
        }
        if ((filter === 'all' || filter === 'memo') && sec.memo?.toLowerCase().includes(lq)) {
          results.push({ ...base, match_type: 'memo', match_text: sec.memo });
        }
        if ((filter === 'all' || filter === 'tag') && tagNames.some(t => t.toLowerCase().includes(lq))) {
          results.push({ ...base, match_type: 'tag', match_text: tagNames.join(', ') });
        }
      }
    }

    setSearchResults(results);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (leftMode === 'search') runGlobalSearch(globalQuery, searchFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalQuery, searchFilter, leftMode, runGlobalSearch]);

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
      alert("ハイライトしたいテキストをマウスで選択してからボタンを押してね！");
      return;
    }
    const container = document.getElementById(`section-content-${section.id}`);
    if (!container || !container.contains(selection.anchorNode)) {
      alert("このセクションのテキストを選択してね！");
      return;
    }
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preSelectionRange.toString().length;
    const text = range.toString();
    const endIndex = startIndex + text.length;
    const { data } = await supabase.from('phrase_highlights').insert([{
      section_id: section.id, phrase_text: text, start_index: startIndex, end_index: endIndex
    }]).select().single();
    if (data) {
      setSections(sections.map(s => s.id === section.id
        ? { ...s, phrase_highlights: [...(s.phrase_highlights || []), data] }
        : s));
    }
    selection.removeAllRanges();
  };

  const handleDeleteHighlight = async (sectionId: string, highlightId: string) => {
    await supabase.from('phrase_highlights').delete().eq('id', highlightId);
    setSections(sections.map(s => s.id === sectionId
      ? { ...s, phrase_highlights: (s.phrase_highlights || []).filter((hl: any) => hl.id !== highlightId) }
      : s
    ));
  };

  const renderHighlightedText = (text: string, highlights: any[], sectionId: string) => {
    if (!highlights || highlights.length === 0) return text;
    const sorted = [...highlights].sort((a, b) => a.start_index - b.start_index);
    let lastIndex = 0;
    const elements: any[] = [];
    sorted.forEach((hl) => {
      if (hl.start_index >= lastIndex) {
        elements.push(text.slice(lastIndex, hl.start_index));
        elements.push(
          <mark
            key={hl.id}
            title="クリックでハイライトを削除"
            onClick={() => handleDeleteHighlight(sectionId, hl.id)}
            className="bg-[var(--color-accent-analyze)] text-[#161616] px-1 mx-0.5 cursor-pointer hover:opacity-60 hover:line-through transition-all"
          >
            {text.slice(hl.start_index, hl.end_index)}
          </mark>
        );
        lastIndex = hl.end_index;
      }
    });
    elements.push(text.slice(lastIndex));
    return elements;
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, 80);
    const start = Math.max(0, idx - 20);
    const end = Math.min(text.length, idx + query.length + 60);
    const excerpt = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
    return excerpt;
  };

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
    s.artist?.toLowerCase().includes(songSearch.toLowerCase())
  );

  // ===== LEFT PANE =====
  const leftPane = (
    <div className="bg-surface flex flex-col h-full">
      {/* モード切替 */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setLeftMode('list')}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${leftMode === 'list' ? 'bg-primary text-background' : 'text-secondary hover:text-primary'}`}
        >
          曲一覧
        </button>
        <button
          onClick={() => { setLeftMode('search'); }}
          className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-1 ${leftMode === 'search' ? 'bg-primary text-background' : 'text-secondary hover:text-primary'}`}
        >
          <MagnifyingGlass className="w-4 h-4" /> 全文検索
        </button>
      </div>

      {leftMode === 'list' ? (
        <>
          <div className="p-4 border-b border-border shrink-0">
            <input
              type="text"
              placeholder="タイトル / アーティストで絞り込み..."
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-primary text-sm focus:outline-none focus:border-[var(--color-accent-analyze)] transition-colors"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredSongs.length === 0 ? (
              <p className="text-secondary text-sm text-center mt-4">曲がまだないよ！</p>
            ) : filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => handleSelectSong(song)}
                className={`p-3 border cursor-pointer transition-colors overflow-hidden ${selectedSong?.id === song.id ? 'border-[var(--color-accent-analyze)] bg-[rgba(134,239,172,0.07)]' : 'border-border bg-background hover:border-[var(--color-accent-analyze)]'}`}
              >
                <div className={`font-bold truncate text-sm ${selectedSong?.id === song.id ? 'text-[var(--color-accent-analyze)]' : 'text-primary'}`}>{song.title}</div>
                <div className="text-xs text-secondary truncate">{song.artist}</div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full border border-[var(--color-accent-analyze)] text-[var(--color-accent-analyze)] py-2 hover:bg-[var(--color-accent-analyze)] hover:text-[#1c1917] transition-colors font-bold flex items-center justify-center gap-2 text-sm"
            >
              <Plus weight="bold" /> 新規曲を登録
            </button>
          </div>
        </>
      ) : (
        <>
          {/* 全文検索 */}
          <div className="p-4 border-b border-border shrink-0 space-y-3">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="歌詞・メモ・タグを横断検索..."
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                autoFocus
                className="w-full bg-background border border-border pl-9 pr-9 py-2 text-primary text-sm focus:outline-none focus:border-[var(--color-accent-analyze)] transition-colors"
              />
              {globalQuery && (
                <button onClick={() => { setGlobalQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {(['all', 'lyrics', 'memo', 'tag'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSearchFilter(f)}
                  className={`flex-1 py-1 text-xs border transition-colors ${searchFilter === f ? 'bg-[var(--color-accent-analyze)] text-[#1c1917] border-[var(--color-accent-analyze)] font-bold' : 'border-border text-secondary hover:text-primary'}`}
                >
                  {f === 'all' ? 'すべて' : f === 'lyrics' ? '歌詞' : f === 'memo' ? 'メモ' : 'タグ'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isSearching && <p className="text-secondary text-xs text-center mt-4">検索中...</p>}
            {!isSearching && globalQuery && searchResults.length === 0 && (
              <p className="text-secondary text-xs text-center mt-4">「{globalQuery}」の検索結果なし</p>
            )}
            {!isSearching && !globalQuery && (
              <p className="text-secondary text-xs text-center mt-8 leading-relaxed">
                キーワードを入力すると<br />全曲を横断して検索するよ！
              </p>
            )}
            {searchResults.map((r, i) => (
              <div
                key={`${r.section_id}-${r.match_type}-${i}`}
                onClick={() => handleSelectResult(r)}
                className="border border-border bg-background p-3 cursor-pointer hover:border-[var(--color-accent-analyze)] transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 font-bold ${r.match_type === 'lyrics' ? 'bg-[var(--color-accent-analyze)] text-[#1c1917]' : r.match_type === 'memo' ? 'bg-[var(--color-accent-write)] text-[#1c1917]' : 'bg-[var(--color-accent-stock)] text-[#1c1917]'}`}>
                    {r.match_type === 'lyrics' ? '歌詞' : r.match_type === 'memo' ? 'メモ' : 'タグ'}
                  </span>
                  <span className="text-xs text-[var(--color-accent-analyze)] font-bold truncate">{r.song_title}</span>
                </div>
                <div className="text-[11px] text-secondary mb-1">{r.song_artist} · {r.section_name}</div>
                {r.match_type === 'tag' ? (
                  <div className="flex flex-wrap gap-1">
                    {r.tag_names?.map(t => (
                      <span key={t} className={`text-[10px] px-1.5 py-0.5 border ${t.toLowerCase().includes(globalQuery.toLowerCase()) ? 'border-[var(--color-accent-stock)] text-[var(--color-accent-stock)]' : 'border-border text-secondary'}`}>{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-primary leading-relaxed line-clamp-2">{highlightMatch(r.match_text, globalQuery)}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ===== RIGHT PANE =====
  const rightPane = (
    <div className="bg-background flex flex-col h-full overflow-y-auto">
      {!selectedSong ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-secondary">
          <MagnifyingGlass className="w-12 h-12 opacity-20" />
          <p className="text-lg">左から曲を選ぶか、全文検索してね！</p>
        </div>
      ) : (
        <div className="p-8 max-w-4xl mx-auto w-full" onClick={() => setActiveDropdownId(null)}>
          <div className="mb-6 border-b border-border pb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-primary">{selectedSong.title}</h1>
            <div className="flex gap-3 text-sm text-secondary flex-wrap mb-4">
              <span className="bg-surface px-3 py-1 border border-border flex items-center gap-1"><MicrophoneStage className="w-4 h-4" /> {selectedSong.artist}</span>
              {selectedSong.bpm && <span className="bg-surface px-3 py-1 border border-border">BPM: {selectedSong.bpm}</span>}
              {selectedSong.key && <span className="bg-surface px-3 py-1 border border-border">Key: {selectedSong.key}</span>}
            </div>

            {/* 曲全体メモ — クリックでモーダル */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMemoModalOpen(true); }}
                className="w-full text-left bg-surface border border-border p-4 hover:border-[var(--color-accent-analyze)] transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-secondary tracking-wider uppercase flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> 曲全体のメモ
                  </span>
                  <span className="text-[10px] text-secondary group-hover:text-[var(--color-accent-analyze)] transition-colors">
                    {songMemoValue ? 'クリックして編集' : 'クリックして記録'} ↗
                  </span>
                </div>
                {songMemoValue ? (
                  <MarkdownRenderer content={songMemoValue} className="line-clamp-[6] overflow-hidden pointer-events-none" />
                ) : (
                  <p className="text-sm text-secondary/50">Geminiの分析結果や、曲全体の考察をここに残しておこう...</p>
                )}
              </button>
              {/* 抽出成功バッジ */}
              {extractedCount !== null && (
                <div className="absolute -top-3 right-4 bg-[var(--color-accent-analyze)] text-[#1c1917] text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 animate-pulse">
                  <CheckCircle className="w-3 h-3" /> テクニック {extractedCount}件抽出！
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 pb-20">
            {sections.map(section => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                className={`border p-6 transition-all ${highlightSectionId === section.id ? 'border-[var(--color-accent-analyze)] ring-1 ring-[var(--color-accent-analyze)]' : section.is_favorite ? 'border-[var(--color-accent-analyze)]' : 'border-border'} bg-surface`}
              >
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="font-bold text-lg text-primary bg-background px-3 py-1 border border-border inline-block">
                    {section.section_name}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleExtractPhrase(section)}
                      className="flex items-center gap-1 text-xs bg-background border border-border px-3 py-1.5 hover:border-[var(--color-accent-analyze)] hover:text-[var(--color-accent-analyze)] transition-colors text-primary font-bold"
                    >
                      <HighlighterCircle className="w-4 h-4" /> フレーズ抽出
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(section.id, section.is_favorite)}
                      className={`flex items-center gap-1 text-xs px-3 py-1.5 border transition-colors ${section.is_favorite ? 'bg-[var(--color-accent-analyze)] text-[#161616] border-[var(--color-accent-analyze)] font-bold' : 'bg-background border-border text-secondary hover:text-primary'}`}
                    >
                      <Star weight={section.is_favorite ? 'fill' : 'regular'} className="w-4 h-4" />
                      {section.is_favorite ? 'お気に入り中' : 'お気に入り'}
                    </button>
                  </div>
                </div>

                <div id={`section-content-${section.id}`} className="whitespace-pre-wrap font-sans text-primary mb-6 leading-relaxed text-lg">
                  {renderHighlightedText(section.content, section.phrase_highlights ?? [], section.id)}
                </div>

                <div className="border-t border-border pt-4 mt-2">
                  <label className="flex items-center gap-1 text-xs text-secondary mb-2"><Lightbulb className="w-4 h-4" /> セクションメモ</label>
                  <textarea
                    className="w-full bg-background border border-border p-3 text-sm text-primary focus:border-[var(--color-accent-analyze)] outline-none resize-none mb-3"
                    rows={2}
                    placeholder="気付き・考察..."
                    value={section.memo || ''}
                    onChange={(e) => handleUpdateMemo(section.id, e.target.value)}
                  />

                  <div className="flex flex-wrap gap-2 items-center relative" onClick={(e) => e.stopPropagation()}>
                    {section.song_section_tags?.map((st: any) => (
                      <span key={st.tags.id} className="group flex items-center text-xs bg-background border border-border text-secondary pl-2 pr-1 py-1">
                        <Tag className="w-3 h-3 mr-1 opacity-50" />
                        {st.tags.name}
                        <button onClick={() => handleToggleSectionTag(section.id, st.tags.id, true)} className="ml-1 w-4 h-4 flex items-center justify-center hover:text-primary">×</button>
                      </span>
                    ))}
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === section.id ? null : section.id)}
                      className="text-xs text-secondary hover:text-primary px-2 py-1 transition-colors flex items-center gap-1 border border-transparent hover:border-border"
                    >
                      <Plus className="w-3 h-3" /> タグを追加
                    </button>

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
  );

  return (
    <div className="h-full w-full">
      <ResizableLayout
        leftPanel={leftPane}
        rightPanel={rightPane}
        defaultLeftPercent={28}
        minLeftPercent={18}
        maxLeftPercent={50}
        handleColor="var(--color-accent-analyze)"
        mobileShowRight={!!selectedSong}
        onMobileBack={() => setSelectedSong(null)}
        mobileBackLabel="曲一覧"
      />
      <AddSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { fetchSongs(); }}
      />

      {/* ===== 曲全体メモ モーダル ===== */}
      {isMemoModalOpen && selectedSong && (
        <MemoModal
          title={selectedSong.title}
          value={songMemoValue}
          onChange={setSongMemoValue}
          onClose={() => { handleSaveSongMemo(songMemoValue); setIsMemoModalOpen(false); }}
          isSaving={isSavingMemo}
          extractedCount={extractedCount}
          onSave={handleSaveSongMemo}
        />
      )}
    </div>
  );
}
