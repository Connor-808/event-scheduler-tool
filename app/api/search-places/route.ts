import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  if (!mapboxToken) {
    console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }

  try {
    // Using Mapbox Geocoding API - great for finding businesses/POIs
    // proximity=-73.989,40.733 centers results around NYC
    // types=poi,address prioritizes places and addresses
    // country=us limits to USA
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${mapboxToken}&limit=5&country=us&types=poi,address&proximity=-73.989,40.733`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Mapbox');
    }

    const data = await response.json();
    
    // Transform Mapbox response to match our component's expected format
    const places = data.features?.map((feature: {
      place_name: string;
      text: string;
      properties?: { address?: string };
      context?: Array<{ id: string; text: string }>;
    }) => ({
      display_name: feature.place_name,
      name: feature.text,
      address: {
        road: feature.properties?.address,
        city: feature.context?.find((c) => c.id.startsWith('place'))?.text,
        state: feature.context?.find((c) => c.id.startsWith('region'))?.text,
        country: 'United States',
      },
    })) || [];

    return NextResponse.json(places);
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json({ error: 'Failed to search places' }, { status: 500 });
  }
}

