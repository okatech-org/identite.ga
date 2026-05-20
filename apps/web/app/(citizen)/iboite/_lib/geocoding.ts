/**
 * Reverse geocoding via Nominatim/OpenStreetMap.
 *
 * Pourquoi Nominatim : gratuit, libre, pas de clé. Trade-off : couverture
 * Gabon imparfaite (urbanisme non normalisé) — on récupère ce qu'on peut
 * (suburb, city_district, town, country) et l'utilisateur peut éditer le
 * quartier à la main.
 *
 * Usage policy à respecter : <= 1 req/sec, User-Agent identifiant l'app.
 * Pour la prod, on devra héberger notre propre instance Nominatim ou passer
 * à Google Geocoding via `NEXT_PUBLIC_GEOCODER=google` (non implémenté pour
 * cette première passe).
 */

export type ReverseGeocodeResult = {
  addressLine: string | null
  district: string | null
  city: string | null
  postalCode: string | null
  country: string
  raw: unknown
}

type NominatimAddress = {
  road?: string
  pedestrian?: string
  neighbourhood?: string
  suburb?: string
  quarter?: string
  city_district?: string
  village?: string
  town?: string
  city?: string
  county?: string
  state?: string
  postcode?: string
  country?: string
  country_code?: string
}

type NominatimResponse = {
  display_name?: string
  address?: NominatimAddress
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse"

/**
 * Reverse geocoding d'une paire (lat, lng) en adresse FR.
 * Throw si la requête échoue. Retourne `country: "Gabon"` par défaut (le
 * marché cible) si Nominatim ne renvoie rien d'utile.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const url = new URL(NOMINATIM_ENDPOINT)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lng))
  url.searchParams.set("accept-language", "fr")
  url.searchParams.set("zoom", "18")
  url.searchParams.set("addressdetails", "1")

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim usage policy : identifier l'app appelante.
      "User-Agent": "identite.ga/0.1 (iBoîte address setup)",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    throw new Error(`Geocoder HTTP ${res.status}`)
  }
  const data = (await res.json()) as NominatimResponse
  const addr = data.address ?? {}

  const district =
    addr.neighbourhood ??
    addr.suburb ??
    addr.quarter ??
    addr.city_district ??
    null

  const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? null
  const country = addr.country ?? "Gabon"

  return {
    addressLine: data.display_name ?? null,
    district,
    city,
    postalCode: addr.postcode ?? null,
    country,
    raw: data,
  }
}

export type GeolocationCoordinates = {
  latitude: number
  longitude: number
  accuracy: number | null
}

/**
 * Wrapper Promise sur `navigator.geolocation.getCurrentPosition`.
 * Délai par défaut 12 s, fallback raisonnable pour mobile lent.
 */
export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 12_000 },
): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Géolocalisation indisponible sur ce navigateur."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        }),
      (err) => reject(err),
      options,
    )
  })
}
