export async function searchCities(query: string): Promise<CityResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`
    );
    const data = await response.json();

    if (!data.results) return [];

    return data.results.map((r: any): CityResult => ({
      name: r.name,
      admin1: r.admin1 || '',
      country: r.country || '',
      country_code: r.country_code || '',
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone,
      displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    }));
  } catch (e) {
    console.error('Geocoding error:', e);
    return [];
  }
}

export interface CityResult {
  name: string;
  admin1: string;
  country: string;
  country_code: string;
  lat: number;
  lon: number;
  timezone?: string;
  displayName: string;
}
