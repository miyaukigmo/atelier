import { redirect } from 'next/navigation';

export default function Home() {
  // デフォルトでAnalyzeタブにリダイレクト
  redirect('/analyze');
}
