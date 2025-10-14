import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
  }

  try {
    // Call Nominatim API from server-side (no CORS issues)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EventScheduler/1.0', // Nominatim requires user agent
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Nominatim');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json({ error: 'Failed to search places' }, { status: 500 });
  }
}

