'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Link, ArrowSquareOut, MusicNote, ClipboardText, Check } from '@phosphor-icons/react';

const LINKS = [
  {
    id: 'uta-net',
    label: '歌詞検索',
    description: 'uta-net — 歌詞を調べるときに',
    url: 'https://www.uta-net.com/',
    isGemini: false,
  },
  {
    id: 'tunebat',
    label: 'キー & BPM',
    description: 'Tunebat — 楽曲のキーとBPMを調べるときに',
    url: 'https://tunebat.com/',
    isGemini: false,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    description: 'Google Gemini Notebook — 歌詞をそのまま貼り付けて分析！',
    url: 'https://gemini.google.com/notebook/9d053dee-c584-487e-a718-eb6bd1189770',
    isGemini: true,
  },
];

export default function UrlsPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [copiedSongId, setCopiedSongId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setSongs(data); });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGeminiClick = () => {
    setShowSongPicker(true);
  };

  const handleSelectSongForGemini = async (song: any) => {
    setCopiedSongId(song.id);

    // セクションを取得
    const { data: sections } = await supabase
      .from('song_sections')
      .select('section_name, content')
      .eq('song_id', song.id)
      .order('sort_order', { ascending: true });

    if (!sections || sections.length === 0) {
      showToast('このセクションにまだ歌詞がないみたい！');
      setCopiedSongId(null);
      return;
    }

    // 歌詞をフォーマット
    const formatted = sections
      .map((s: any) => `[${s.section_name}]\n${s.content}`)
      .join('\n\n');
    const text = `# ${song.title}（${song.artist}）\n\n${formatted}`;

    // クリップボードにコピー
    try {
      await navigator.clipboard.writeText(text);
      showToast(`「${song.title}」の歌詞をコピーしました！Geminiに貼り付けてね 📋`);
    } catch {
      showToast('コピーに失敗したよ。手動でコピーしてね！');
    }

    // Geminiを開く
    window.open('https://gemini.google.com/notebook/9d053dee-c584-487e-a718-eb6bd1189770', '_blank');

    setTimeout(() => {
      setShowSongPicker(false);
      setCopiedSongId(null);
    }, 800);
  };

  const handleSkipAndOpenGemini = () => {
    window.open('https://gemini.google.com/notebook/9d053dee-c584-487e-a718-eb6bd1189770', '_blank');
    setShowSongPicker(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border bg-surface shrink-0 flex items-center gap-3">
        <Link weight="duotone" className="w-7 h-7 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-wider">URL</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
        <div className="max-w-2xl mx-auto space-y-4">
          {LINKS.map((link) => (
            <div
              key={link.id}
              onClick={link.isGemini ? handleGeminiClick : () => window.open(link.url, '_blank')}
              className="group border border-border bg-surface p-5 md:p-6 cursor-pointer hover:border-primary transition-colors flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-primary">{link.label}</span>
                  {link.isGemini && (
                    <span className="text-[10px] bg-primary text-background px-2 py-0.5 font-bold">歌詞コピー対応</span>
                  )}
                </div>
                <p className="text-sm text-secondary">{link.description}</p>
                <p className="text-xs text-secondary/60 mt-1 truncate">{link.url}</p>
              </div>
              <ArrowSquareOut className="w-5 h-5 text-secondary group-hover:text-primary transition-colors shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Song Picker Modal */}
      {showSongPicker && (
        <div className="fixed inset-0 bg-[#1c1917]/90 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-bold text-primary text-lg">歌詞を送る曲を選んで</h2>
                <p className="text-xs text-secondary mt-0.5">歌詞がクリップボードにコピーされ、Geminiが開くよ</p>
              </div>
              <button onClick={() => setShowSongPicker(false)} className="text-secondary hover:text-primary text-xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {songs.length === 0 ? (
                <p className="text-secondary text-sm text-center py-8">曲がまだ登録されてないよ</p>
              ) : songs.map(song => (
                <button
                  key={song.id}
                  onClick={() => handleSelectSongForGemini(song)}
                  disabled={copiedSongId === song.id}
                  className="w-full text-left border border-border bg-background p-3 hover:border-primary transition-colors flex items-center gap-3 disabled:opacity-60"
                >
                  {copiedSongId === song.id ? (
                    <Check weight="bold" className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <MusicNote className="w-4 h-4 text-secondary shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-primary truncate">{song.title}</div>
                    <div className="text-xs text-secondary truncate">{song.artist}</div>
                  </div>
                  <ClipboardText className="w-4 h-4 text-secondary ml-auto shrink-0" />
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={handleSkipAndOpenGemini}
                className="w-full text-secondary text-sm hover:text-primary transition-colors py-2"
              >
                歌詞はいらない、そのままGeminiを開く →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-primary text-background px-4 py-2 text-sm font-bold z-[60] whitespace-nowrap max-w-[90vw] text-center">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
