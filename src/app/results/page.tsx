'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';

// APIレスポンスに合わせた型定義
interface Restaurant {
  name: string;
  rating: number;
  vicinity: string;
  genre: string;
  price_level: number;
  mapsUrl: string;
  photo: string; // 1枚の写真のURL
}

function Results() {
  const searchParams = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isSelectionCopied, setIsSelectionCopied] = useState(false);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    const currentCount = parseInt(sessionStorage.getItem('requestCount') || '0', 10);
    setRequestCount(currentCount);

    if (currentCount >= 3) {
      setError('検索回数の上限に達しました。同じセッションでは3回まで検索できます。');
      setLimitReached(true);
      setLoading(false);
      setRestaurants([]); // Clear previous results
      return;
    }

    setLoading(true);
    setError(null);
    const location = searchParams.get('location');
    const genre = searchParams.get('genre');
    const budget = searchParams.get('budget');

    try {
      const response = await fetch(
        `/api/restaurants?location=${location}&genre=${genre}&budget=${budget}`
      );
      const data = await response.json();

      // API側でエラーが返された場合
      if (response.status !== 200) {
        throw new Error(data.error || 'お店の検索に失敗しました。');
      }

      setRestaurants(data);

      // Increment count after successful fetch
      const newCount = currentCount + 1;
      sessionStorage.setItem('requestCount', newCount.toString());
      setRequestCount(newCount);
      if (newCount >= 3) {
        setLimitReached(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleShuffleClick = () => {
    fetchRestaurants();
  };

  const handleCopyAllClick = () => {
    if (restaurants.length === 0) return;
    const allUrls = restaurants.map(r => r.mapsUrl).join('\n');
    navigator.clipboard.writeText(allUrls);
    setIsAllCopied(true);
    setTimeout(() => setIsAllCopied(false), 2000); // Reset after 2 seconds
  };

  const handleCheckboxChange = (url: string) => {
    setSelectedRestaurants(prev =>
      prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const handleCopySelectedClick = () => {
    if (selectedRestaurants.length === 0) return;
    const selectedUrls = selectedRestaurants.join('\n');
    navigator.clipboard.writeText(selectedUrls);
    setIsSelectionCopied(true);
    setTimeout(() => setIsSelectionCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">お店を探しています...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800">検索結果</h1>
        <p className="text-gray-600 mt-2">あなたへのおすすめ9選はこちら！</p>
      </header>

      {error ? (
         <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
           <p className="text-lg text-red-500">エラー: {error}</p>
         </div>
      ) : (
        <div className="w-full max-w-4xl grid gap-6 md:grid-cols-3">
          {restaurants.map((resto, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
              <div className="relative">
                {resto.photo ? (
                  <img src={resto.photo} alt={resto.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image Available</span>
                  </div>
                )}
              </div>
              <div className="p-6 flex-grow">
                <a href={resto.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {resto.name}
                  </h2>
                </a>
                <p className="text-md text-gray-600 mb-4">{resto.vicinity}</p>
                <div className="flex items-center mb-4">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="font-bold text-gray-800">{resto.rating}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <span>{resto.genre}</span>
                  <span className="mx-2">•</span>
                  <span>{'¥'.repeat(resto.price_level)}</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    checked={selectedRestaurants.includes(resto.mapsUrl)}
                    onChange={() => handleCheckboxChange(resto.mapsUrl)}
                  />
                  <span className="text-gray-700">URLをコピー対象にする</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <button
          onClick={handleShuffleClick}
          disabled={limitReached}
          className={`bg-blue-600 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-300 ${
            limitReached
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-blue-700'
          }`}
        >
          もう一度シャッフル ({3 - requestCount}回残っています)
        </button>
        <button
          onClick={handleCopyAllClick}
          disabled={restaurants.length === 0}
          className={`ml-4 bg-green-600 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-300 ${
            restaurants.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
          }`}
        >
          {isAllCopied ? 'Copied!' : 'Copy All URLs'}
        </button>
        <button
          onClick={handleCopySelectedClick}
          disabled={selectedRestaurants.length === 0}
          className={`ml-4 bg-purple-600 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-300 ${
            selectedRestaurants.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
          }`}
        >
          {isSelectionCopied ? 'Copied!' : `Copy Selected (${selectedRestaurants.length})`}
        </button>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50"><p className="text-lg text-gray-700">読み込み中...</p></div>}>
      <Results />
    </Suspense>
  );
}