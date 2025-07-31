import { NextResponse } from "next/server";

// Google Places APIのレスポンスの型定義 (必要なものだけ)
interface Place {
  name: string;
  rating?: number;
  formatted_address?: string; // vicinityから変更
  price_level?: number;
  photos?: { photo_reference: string }[];
  types?: string[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");
  const genre = searchParams.get("genre");
  const budget = searchParams.get("budget");

  if (!location) {
    return NextResponse.json(
      { error: "Location is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is not configured" },
      { status: 500 }
    );
  }

  const defaultQuery = "飲食店"; // "飲食店" means restaurants in Japanese
  const query = `${genre && genre !== "指定なし" ? genre : defaultQuery} ${location}`.trim();

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${apiKey}&language=ja${budget && budget !== "指定なし" ? `&maxprice=${budget}` : ""}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // ステータスに応じたエラーハンドリング
    if (data.status !== "OK") {
      let errorMessage = "Failed to fetch data from Google Places API";
      let status = 500;

      switch (data.status) {
        case "ZERO_RESULTS":
          errorMessage = "条件に合うお店が見つかりませんでした。";
          status = 404;
          break;
        case "INVALID_REQUEST":
          errorMessage = "検索条件が無効です。場所を正しく入力してください。";
          status = 400;
          break;
        case "OVER_QUERY_LIMIT":
          errorMessage = "一時的に利用が集中しています。しばらくしてから再度お試しください。";
          status = 429;
          break;
        case "REQUEST_DENIED":
          errorMessage = "APIキーが無効か、権限がありません。";
          status = 403;
          break;
        default:
          errorMessage = data.error_message || "不明なエラーが発生しました。";
          status = 500;
          break;
      }
      console.error(`Google Places API Error: ${data.status} - ${data.error_message || ''}`);
      return NextResponse.json({ error: errorMessage }, { status });
    }

    const shuffledRestaurants = (data.results as Place[])
      .sort(() => 0.5 - Math.random())
      .slice(0, 9);

    const formattedRestaurants = shuffledRestaurants.map((place) => {
      const address = place.formatted_address || "住所情報なし";
      const photoUrl =
        place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : ""; // 写真がない場合は空文字
      return {
        name: place.name,
        rating: place.rating || 0,
        vicinity: address, // フロントの互換性のためキーはvicinityのまま
        genre: place.types?.[0] || "ジャンル情報なし",
        price_level: place.price_level || 0,
        photo: photoUrl,
        // Googleマップへのリンクを生成
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${place.name}, ${address}`
        )}`,
      };
    });

    return NextResponse.json(formattedRestaurants);

  } catch (error) {
    console.error("Error fetching from Google Places API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
