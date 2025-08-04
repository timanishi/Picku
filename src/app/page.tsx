'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [genre, setGenre] = useState('指定なし');
  const [budget, setBudget] = useState('指定なし');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!'); // デバッグログ
    const params = new URLSearchParams({
      location,
      genre,
      budget,
    });
    console.log('Redirecting to:', `/results?${params.toString()}`); // デバッグログ
    router.push(`/results?${params.toString()}`);
  };

  const selectClassName =
    "shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-md">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-800">Picku</h1>
          <p className="text-gray-600 mt-2">
            近くの飲食店を自動で提案します
          </p>
        </header>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-xl rounded-lg px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-6">
            <label
              htmlFor="location"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              場所 (駅名やエリア名)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              id="location"
              placeholder="例: 新宿駅"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="genre"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              ジャンル (任意)
            </label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className={selectClassName}
            >
              <option>指定なし</option>
              <option>和食</option>
              <option>中華</option>
              <option>イタリアン</option>
              <option>フレンチ</option>
              <option>ラーメン</option>
              <option>カフェ</option>
              <option>居酒屋</option>
            </select>
          </div>

          <div className="mb-8">
            <label
              htmlFor="budget"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              金額感 (任意)
            </label>
            <select
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={selectClassName}
            >
              <option>指定なし</option>
              <option value="1">¥（〜999円）</option>
              <option value="2">¥¥（1,000円〜2,999円）</option>
              <option value="3">¥¥¥（3,000円〜5,999円）</option>
              <option value="4">¥¥¥¥（6,000円〜）</option>
            </select>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-300"
            >
              候補を探す
            </button>
          </div>
        </form>
        <footer className="text-center text-gray-500 text-xs mt-6">
          &copy; 2025 Picku. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
