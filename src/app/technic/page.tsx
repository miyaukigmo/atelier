'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Lightbulb, MagnifyingGlass, Pencil, Check, Trash, X } from '@phosphor-icons/react';

type Technique = {
  id: string;
  song_id: string;
  title: string;
  description: string;
  created_at: string;
  songs?: { title: string; artist: string };
};

export default function TechnicPage() {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [selectedSongFilter, setSelectedSongFilter] = useState<string | null>(null);

  const fetchTechniques = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('song_techniques')
      .select('*, songs(title, artist)')
      .order('created_at', { ascending: false });
    if (data) setTechniques(data as Technique[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTechniques();
  }, []);

  const handleStartEdit = (tech: Technique) => {
    setEditingId(tech.id);
    setEditTitle(tech.title);
    setEditDesc(tech.description);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editDesc.trim()) return;
    await supabase.from('song_techniques').update({ title: editTitle.trim(), description: editDesc.trim() }).eq('id', id);
    setTechniques(techniques.map(t => t.id === id ? { ...t, title: editTitle.trim(), description: editDesc.trim() } : t));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('このテクニックカードを削除する？')) return;
    await supabase.from('song_techniques').delete().eq('id', id);
    setTechniques(techniques.filter(t => t.id !== id));
  };

  // 曲ごとのフィルタリスト
  const songList = Array.from(
    new Map(techniques.map(t => [t.song_id, { id: t.song_id, title: (t.songs as any)?.title || '不明' }])).values()
  );

  const filtered = techniques.filter(t => {
    const matchSong = selectedSongFilter ? t.song_id === selectedSongFilter : true;
    const q = searchQuery.toLowerCase();
    const matchQuery = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    return matchSong && matchQuery;
  });

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* ヘッダー */}
      <div className="p-6 border-b border-border bg-surface shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb weight="fill" className="w-7 h-7 text-[var(--color-accent-analyze)]" />
            <h1 className="text-2xl font-bold text-primary tracking-wider">TECHNIC</h1>
            <span className="text-secondary text-sm ml-1">— 分析から吸い上げた作詞テクニック集</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* 検索 */}
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="テクニック名や説明で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border pl-9 pr-4 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent-analyze)] transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 曲フィルタ */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSongFilter(null)}
                className={`text-xs px-3 py-1.5 border transition-colors ${!selectedSongFilter ? 'bg-[var(--color-accent-analyze)] text-[#1c1917] border-[var(--color-accent-analyze)] font-bold' : 'border-border text-secondary hover:text-primary'}`}
              >
                すべて ({techniques.length})
              </button>
              {songList.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSongFilter(selectedSongFilter === s.id ? null : s.id)}
                  className={`text-xs px-3 py-1.5 border transition-colors truncate max-w-[140px] ${selectedSongFilter === s.id ? 'bg-[var(--color-accent-analyze)] text-[#1c1917] border-[var(--color-accent-analyze)] font-bold' : 'border-border text-secondary hover:text-primary'}`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* カードグリッド */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-secondary">
              <span className="text-sm">読み込み中...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-secondary gap-4">
              <Lightbulb className="w-14 h-14 opacity-10" />
              <p className="text-lg font-bold text-primary">テクニックがまだないよ！</p>
              <p className="text-sm text-center leading-relaxed">
                Analyzeタブで曲を選び、曲全体のメモにGemini分析結果を貼り付けよう。<br />
                <span className="text-[var(--color-accent-analyze)] font-bold">## 作詞テクニック</span> セクションがあれば自動でここにカードが作られるよ！
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
              {filtered.map(tech => (
                <TechCard
                  key={tech.id}
                  tech={tech}
                  isEditing={editingId === tech.id}
                  editTitle={editTitle}
                  editDesc={editDesc}
                  onEditTitleChange={setEditTitle}
                  onEditDescChange={setEditDesc}
                  onStartEdit={() => handleStartEdit(tech)}
                  onSaveEdit={() => handleSaveEdit(tech.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => handleDelete(tech.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== カードコンポーネント =====
function TechCard({
  tech,
  isEditing,
  editTitle,
  editDesc,
  onEditTitleChange,
  onEditDescChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  tech: Technique;
  isEditing: boolean;
  editTitle: string;
  editDesc: string;
  onEditTitleChange: (v: string) => void;
  onEditDescChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const songTitle = (tech.songs as any)?.title || '不明';

  return (
    <div className={`bg-surface border flex flex-col transition-all ${isEditing ? 'border-[var(--color-accent-analyze)] ring-1 ring-[var(--color-accent-analyze)]' : 'border-border hover:border-[var(--color-accent-analyze)]/50'}`}>
      {/* カードヘッダー（曲名） */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-accent-analyze)] font-bold truncate">{songTitle}</span>
        <div className="flex gap-1 shrink-0">
          {isEditing ? (
            <>
              <button onClick={onSaveEdit} className="p-1.5 text-[var(--color-accent-analyze)] hover:opacity-70" title="保存">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={onCancelEdit} className="p-1.5 text-secondary hover:text-primary" title="キャンセル">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={onStartEdit} className="p-1.5 text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="編集">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="p-1.5 text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" title="削除">
                <Trash className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* カード本体 */}
      <div className="p-4 flex flex-col gap-3 flex-1 group">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
              autoFocus
              className="font-bold text-primary bg-background border border-[var(--color-accent-analyze)] px-2 py-1 text-sm focus:outline-none w-full"
            />
            <textarea
              value={editDesc}
              onChange={(e) => onEditDescChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onCancelEdit(); }}
              className="text-secondary text-sm bg-background border border-border px-2 py-1.5 focus:outline-none focus:border-[var(--color-accent-analyze)] resize-none w-full leading-relaxed"
              rows={3}
            />
          </>
        ) : (
          <>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-analyze)] mt-1.5 shrink-0" />
              <h3 className="font-bold text-primary text-sm leading-snug">{tech.title}</h3>
            </div>
            <p className="text-secondary text-sm leading-relaxed pl-3.5">{tech.description}</p>
          </>
        )}

        {/* 編集/削除ボタン（ホバー時表示） */}
        {!isEditing && (
          <div className="flex gap-2 mt-auto pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onStartEdit}
              className="flex items-center gap-1 text-[10px] text-secondary hover:text-primary transition-colors"
            >
              <Pencil className="w-3 h-3" /> 編集
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-[10px] text-secondary hover:text-primary transition-colors ml-auto"
            >
              <Trash className="w-3 h-3" /> 削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
