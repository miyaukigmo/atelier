'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { parseLyrics } from '@/utils/lyricsParser';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSongModal({ isOpen, onClose, onSuccess }: AddSongModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpm, setBpm] = useState('');
  const [songKey, setSongKey] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !lyrics) return;
    
    setLoading(true);
    try {
      // 1. 曲の登録
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .insert([{ 
          title, 
          artist, 
          bpm: bpm ? parseInt(bpm) : null, 
          key: songKey || null 
        }])
        .select()
        .single();

      if (songError) throw songError;

      // 2. 歌詞の分割
      const sections = parseLyrics(lyrics);
      
      // 3. セクションの登録
      const sectionInserts = sections.map((sec, index) => ({
        song_id: songData.id,
        section_name: sec.section_name,
        content: sec.content,
        sort_order: index
      }));

      const { error: sectionError } = await supabase
        .from('song_sections')
        .insert(sectionInserts);

      if (sectionError) throw sectionError;

      onSuccess();
      onClose();
      // Reset form
      setTitle(''); setArtist(''); setBpm(''); setSongKey(''); setLyrics('');
    } catch (err) {
      console.error(err);
      alert('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface border border-border w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-primary">新規曲を登録</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary text-2xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary mb-1">曲名 <span className="text-red-400">*</span></label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-primary focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">アーティスト <span className="text-red-400">*</span></label>
              <input type="text" required value={artist} onChange={e => setArtist(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-primary focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">BPM</label>
              <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-primary focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Key</label>
              <input type="text" value={songKey} onChange={e => setSongKey(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-primary focus:border-accent outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-secondary mb-1">歌詞（[Aメロ]などのタグで自動分割されます） <span className="text-red-400">*</span></label>
            <textarea required value={lyrics} onChange={e => setLyrics(e.target.value)} rows={12} className="w-full bg-background border border-border rounded p-2 text-primary focus:border-accent outline-none resize-none font-sans" placeholder="[Aメロ]&#10;ここに歌詞を入力..." />
          </div>

          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-secondary hover:text-primary mr-2">キャンセル</button>
            <button type="submit" disabled={loading} className="bg-primary text-background px-6 py-2 rounded font-bold hover:opacity-90 disabled:opacity-50">
              {loading ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
