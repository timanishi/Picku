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

  const query = `${genre && genre !== "指定なし" ? genre : ""} ${location}`.trim();

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${apiKey}&language=ja${budget && budget !== "指定なし" ? `&maxprice=${budget}` : ""}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places API Error:", data.error_message);
      return NextResponse.json(
        { error: data.error_message || "Failed to fetch data from Google Places API" },
        { status: 500 }
      );
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
