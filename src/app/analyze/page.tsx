'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import AddSongModal from '@/components/AddSongModal';

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
    // Fetch sections
    const { data } = await supabase
      .from('song_sections')
      .select('*')
      .eq('song_id', song.id)
      .order('sort_order', { ascending: true });
    
    if (data) setSections(data);
  };

  const handleUpdateMemo = async (sectionId: string, memo: string) => {
    // Optimistic update
    setSections(sections.map(s => s.id === sectionId ? { ...s, memo } : s));
    await supabase.from('song_sections').update({ memo }).eq('id', sectionId);
  };

  const handleToggleFavorite = async (sectionId: string, currentFav: boolean) => {
    const newFav = !currentFav;
    setSections(sections.map(s => s.id === sectionId ? { ...s, is_favorite: newFav } : s));
    await supabase.from('song_sections').update({ is_favorite: newFav }).eq('id', sectionId);
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
          <div className="flex-1 flex items-center justify-center text-secondary text-lg">
            👈 左から曲を選ぶか、新しく登録してね！
          </div>
        ) : (
          <div className="p-8 max-w-4xl mx-auto w-full">
            {/* ヘッダー */}
            <div className="mb-8 border-b border-border pb-6">
              <h1 className="text-4xl font-bold mb-3 text-primary">{selectedSong.title}</h1>
              <div className="flex gap-3 text-sm text-secondary">
                <span className="bg-surface px-3 py-1 rounded-full border border-border">🎤 {selectedSong.artist}</span>
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
                      <button className="text-xs bg-background border border-border px-3 py-1.5 rounded hover:bg-accent transition-colors text-primary">
                        🖊️ フレーズ抽出
                      </button>
                      <button 
                        onClick={() => handleToggleFavorite(section.id, section.is_favorite)}
                        className={`text-xs px-3 py-1.5 rounded border transition-colors ${section.is_favorite ? 'bg-primary text-background border-primary font-bold' : 'bg-background border-border text-secondary hover:bg-accent'}`}
                      >
                        {section.is_favorite ? '★ お気に入り' : '☆ お気に入り'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="whitespace-pre-wrap font-sans text-primary mb-6 leading-relaxed text-lg">
                    {section.content}
                  </div>

                  <div className="border-t border-border pt-4">
                    <label className="block text-xs text-secondary mb-2">💡 セクションメモ（考察・気付き）</label>
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
