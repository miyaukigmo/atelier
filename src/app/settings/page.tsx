'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Gear, Tag, X } from '@phosphor-icons/react';

const INITIAL_TAGS = [
  { axis_category: 'Focus', name: '情景' },
  { axis_category: 'Focus', name: '心情' },
  { axis_category: 'Focus', name: '過去回想' },
  { axis_category: 'Focus', name: 'クローズアップ' },
  { axis_category: 'Gimmick', name: '比喩' },
  { axis_category: 'Gimmick', name: 'セリフ・語りかけ' },
  { axis_category: 'Gimmick', name: '疑問・自問' },
  { axis_category: 'Gimmick', name: '表現技法' },
  { axis_category: 'Gimmick', name: '語感・リズム' },
  { axis_category: 'Context', name: '哲学' },
  { axis_category: 'Context', name: '気付き・変化' },
  { axis_category: 'Context', name: '日常・あるある' },
  { axis_category: 'Context', name: '違和感・フック' },
];

export default function SettingsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagNames, setNewTagNames] = useState<{ [key: string]: string }>({
    Focus: '',
    Gimmick: '',
    Context: ''
  });

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name', { ascending: true });
    if (data) setTags(data);
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSetupInitialTags = async () => {
    // 既存のタグと被らないようにチェック
    const existingNames = tags.map(t => t.name);
    const tagsToInsert = INITIAL_TAGS.filter(t => !existingNames.includes(t.name));
    
    if (tagsToInsert.length > 0) {
      await supabase.from('tags').insert(tagsToInsert);
      fetchTags();
    } else {
      alert('初期タグはすでに登録されているみたい！');
    }
  };

  const handleAddTag = async (axis: string) => {
    const name = newTagNames[axis]?.trim();
    if (!name) return;

    const { data, error } = await supabase.from('tags').insert([{ axis_category: axis, name }]).select();
    if (data && !error) {
      setNewTagNames(prev => ({ ...prev, [axis]: '' }));
      fetchTags();
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!window.confirm('このタグを削除してもいい？（ストックについたタグも外れちゃうかも！）')) return;
    await supabase.from('tags').delete().eq('id', id);
    fetchTags();
  };

  const renderTagSection = (axis: string, title: string, description: string) => {
    const axisTags = tags.filter(t => t.axis_category === axis);

    return (
      <div className="bg-surface border border-border p-6">
        <h3 className="font-bold text-xl text-primary mb-1">{title}</h3>
        <p className="text-sm text-secondary mb-4">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {axisTags.map(tag => (
            <div key={tag.id} className="group flex items-center bg-background border border-border pl-3 pr-1 py-1 text-sm text-primary transition-colors hover:border-primary">
              <span>{tag.name}</span>
              <button 
                onClick={() => handleDeleteTag(tag.id)}
                className="ml-2 flex items-center justify-center text-secondary hover:text-primary transition-colors"
                title="削除"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {axisTags.length === 0 && <span className="text-secondary text-sm py-1">まだタグがないよ</span>}
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTagNames[axis]} 
            onChange={(e) => setNewTagNames(prev => ({ ...prev, [axis]: e.target.value }))}
            onKeyDown={(e) => { if(e.key === 'Enter') handleAddTag(axis) }}
            placeholder="新しいタグ名を入力..." 
            className="flex-1 bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary"
          />
          <button 
            onClick={() => handleAddTag(axis)}
            disabled={!newTagNames[axis]?.trim()}
            className="border border-primary text-primary font-bold px-4 py-2 text-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary hover:bg-primary hover:text-[#161616] transition-colors"
          >
            追加
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="p-8 border-b border-border bg-surface shrink-0 flex items-center gap-3">
        <Gear weight="duotone" className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary tracking-wider">SETTINGS</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
              <Tag weight="duotone" className="w-6 h-6" /> タグ管理 (Stock用)
            </h2>
            <p className="text-secondary mb-6">Stockタブでアイデアを分類するためのタグ軸を管理します。</p>

            {tags.length === 0 && (
              <div className="bg-surface border border-border p-6 mb-8 text-center">
                <p className="text-primary font-bold mb-4">タグがまだ一つもないみたい！初期セットアップをする？</p>
                <button 
                  onClick={handleSetupInitialTags}
                  className="border border-primary text-primary font-bold px-6 py-3 hover:bg-primary hover:text-[#161616] transition-colors"
                >
                  初期タグをセットアップする
                </button>
              </div>
            )}

            <div className="space-y-6">
              {renderTagSection('Focus', 'Focus (視点・対象)', 'どこにカメラを向けているか、何を描写しているか。')}
              {renderTagSection('Gimmick', 'Gimmick (技法・構造)', 'どんな表現技法を使っているか、どういう構造になっているか。')}
              {renderTagSection('Context', 'Context (文脈・成分)', 'どういう背景があるか、何を伝えようとしているか。')}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
