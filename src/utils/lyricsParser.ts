export function parseLyrics(fullText: string) {
  // [Aメロ] または 【Aメロ】 にマッチ
  const regex = /(?:\[(.*?)\]|【(.*?)】)/g;
  
  const sections: { section_name: string; content: string }[] = [];
  const matches = [...fullText.matchAll(regex)];
  
  if (matches.length === 0) {
    return [{ section_name: '全体', content: fullText.trim() }];
  }

  let currentSectionName = 'Intro';

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const sectionName = m[1] || m[2]; // キャプチャグループのどちらか
    const startIndex = m.index!;
    
    if (i === 0 && startIndex > 0) {
      const content = fullText.slice(0, startIndex).trim();
      if (content) {
        sections.push({ section_name: 'Intro', content });
      }
    } else if (i > 0) {
      const prevM = matches[i - 1];
      const prevEnd = prevM.index! + prevM[0].length;
      const content = fullText.slice(prevEnd, startIndex).trim();
      sections.push({ section_name: currentSectionName, content });
    }
    
    currentSectionName = sectionName;
  }
  
  // 最後のセクション
  const lastMatch = matches[matches.length - 1];
  const lastEnd = lastMatch.index! + lastMatch[0].length;
  const lastContent = fullText.slice(lastEnd).trim();
  sections.push({ section_name: currentSectionName, content: lastContent });

  // 空のセクションを除外
  return sections.filter(s => s.content.length > 0);
}
