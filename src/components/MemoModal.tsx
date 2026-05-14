'use client';
import { useState } from 'react';
import { Lightbulb, CheckCircle } from '@phosphor-icons/react';
import MarkdownRenderer from './MarkdownRenderer';

interface MemoModalProps {
  title: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: (v: string) => void;
  isSaving: boolean;
  extractedCount: number | null;
}

export default function MemoModal({ title, value, onChange, onClose, onSave, isSaving, extractedCount }: MemoModalProps) {
  const [tab, setTab] = useState<'preview' | 'edit'>(value ? 'preview' : 'edit');

  return (
    <div
      className="fixed inset-0 bg-[#1c1917]/80 z-50 flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border w-full max-w-4xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-5 py-3 border-b border-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Lightbulb className="w-4 h-4 text-[var(--color-accent-analyze)] shrink-0" />
            <span className="font-bold text-primary truncate">{title}</span>
            <span className="text-secondary text-sm shrink-0">- 曲全体のメモ</span>
            {extractedCount !== null && (
              <span className="ml-2 bg-[var(--color-accent-analyze)] text-[#1c1917] text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 shrink-0 animate-pulse">
                <CheckCircle className="w-3 h-3" /> テクニック {extractedCount}件抽出！
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isSaving && <span className="text-xs text-[var(--color-accent-analyze)]">保存中...</span>}
            <button onClick={onClose} className="text-secondary hover:text-primary text-xl leading-none px-2">×</button>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-border shrink-0">
          <button
            onClick={() => setTab('preview')}
            className={`px-5 py-2 text-xs font-bold transition-colors ${tab === 'preview' ? 'text-[var(--color-accent-analyze)] border-b-2 border-[var(--color-accent-analyze)]' : 'text-secondary hover:text-primary'}`}
          >
            プレビュー
          </button>
          <button
            onClick={() => setTab('edit')}
            className={`px-5 py-2 text-xs font-bold transition-colors ${tab === 'edit' ? 'text-[var(--color-accent-analyze)] border-b-2 border-[var(--color-accent-analyze)]' : 'text-secondary hover:text-primary'}`}
          >
            編集
          </button>
          <div className="ml-auto px-4 flex items-center">
            <span className="text-[10px] text-secondary">フォーカスを外すと自動保存</span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'preview' ? (
            <div className="p-6">
              {value ? (
                <MarkdownRenderer content={value} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-secondary gap-3">
                  <Lightbulb className="w-10 h-10 opacity-20" />
                  <p className="text-sm">まだメモがないよ！「編集」タブから入力しよう</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 h-full">
              <textarea
                autoFocus={tab === 'edit'}
                className="w-full bg-background border border-border p-4 text-sm text-primary focus:border-[var(--color-accent-analyze)] outline-none transition-colors leading-relaxed resize-none font-mono"
                style={{ minHeight: '400px', height: Math.max(400, (value.split('\n').length + 3) * 22) }}
                placeholder={`Geminiの分析結果を貼り付けよう！\n\n## 作詞テクニック セクションがあると自動でTechnicタブにカードが作られるよ`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={(e) => onSave(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-5 py-3 border-t border-border shrink-0 flex justify-between items-center">
          <span className="text-xs text-secondary">{value.length} 文字</span>
          <button
            onClick={onClose}
            className="bg-[var(--color-accent-analyze)] text-[#1c1917] px-5 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            保存して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
