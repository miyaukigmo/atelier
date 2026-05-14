import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * シンプルなマークダウンレンダラー
 * 対応: ## 見出し, **太字**, - 箇条書き, | テーブル, --- 水平線, 【】ブロック
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  const renderInline = (text: string): React.ReactNode => {
    // **太字** の処理
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (line.trim() === '') {
      i++;
      continue;
    }

    // --- 水平線
    if (/^-{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="border-border my-4" />);
      i++;
      continue;
    }

    // ## 見出し (h2)
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-[var(--color-accent-analyze)] mt-6 mb-2 pb-1 border-b border-[var(--color-accent-analyze)]/30 flex items-center gap-1.5">
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // ### 見出し (h3)
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-primary mt-4 mb-1.5">
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // 【】で始まるブロック（セクションラベル）
    if (line.startsWith('【') && line.includes('】')) {
      elements.push(
        <div key={i} className="mt-4 mb-1.5">
          <span className="text-xs font-bold text-[var(--color-accent-analyze)] bg-[var(--color-accent-analyze)]/10 px-2 py-0.5 border border-[var(--color-accent-analyze)]/30">
            {line}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // テーブル (| から始まる行)
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // セパレーター行を除外
      const dataLines = tableLines.filter(l => !/^\|[\s\-:]+\|/.test(l) || l.replace(/[\|\-\s:]/g, '').length > 0);
      const [headerLine, ...bodyLines] = dataLines.filter(l => !/^[\|\s\-:]+$/.test(l));

      if (!headerLine) continue;
      const headerCells = headerLine.split('|').map(c => c.trim()).filter(Boolean);
      const bodyRows = bodyLines
        .filter(l => !/^[\|\s\-:]+$/.test(l))
        .map(l => l.split('|').map(c => c.trim()).filter(Boolean));

      elements.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="text-left px-3 py-1.5 bg-[var(--color-accent-analyze)]/10 border border-border font-bold text-primary">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="even:bg-surface">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 border border-border text-secondary align-top">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 箇条書き (- または * で始まる)
    if (/^[-*]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 space-y-1 pl-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex gap-2 text-sm text-secondary leading-relaxed">
              <span className="text-[var(--color-accent-analyze)] shrink-0 mt-0.5">·</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // テクニック行: **タイトル**：説明  （箇条書きなし版）
    const techMatch = line.match(/^\*\*(.+?)\*\*[：:]\s*(.+)$/);
    if (techMatch) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm my-1 leading-relaxed">
          <strong className="text-primary shrink-0">{techMatch[1]}：</strong>
          <span className="text-secondary">{techMatch[2]}</span>
        </div>
      );
      i++;
      continue;
    }

    // 通常テキスト
    elements.push(
      <p key={i} className="text-sm text-secondary leading-relaxed my-0.5">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div className={`markdown-content ${className}`}>
      {elements}
    </div>
  );
}
