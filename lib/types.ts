export const CLOTHING_TYPES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
] as const

export const COLORS = [
  "black",
  "white",
  "gray",
  "navy",
  "blue",
  "red",
  "pink",
  "green",
  "yellow",
  "orange",
  "purple",
  "brown",
  "beige",
  "cream",
  "multicolor",
] as const

export const SEASONS = ["spring", "summer", "fall", "winter", "all"] as const

export const OCCASIONS = [
  "casual",
  "work",
  "formal",
  "sport",
  "date",
  "party",
] as const

export const MATERIALS = [
  "cotton",
  "linen",
  "wool",
  "denim",
  "leather",
  "silk",
  "polyester",
  "knit",
  "synthetic",
  "other",
] as const

export const FITS = [
  "slim",
  "regular",
  "relaxed",
  "oversized",
] as const

export const PATTERNS = [
  "solid",
  "striped",
  "plaid",
  "floral",
  "graphic",
  "checkered",
  "abstract",
  "other",
] as const

export const GENDERS = [
  "male",
  "female",
  "non-binary",
  "prefer not to say",
] as const

export type ClothingType = (typeof CLOTHING_TYPES)[number]
export type Color = (typeof COLORS)[number]
export type Season = (typeof SEASONS)[number]
export type Occasion = (typeof OCCASIONS)[number]
export type Material = (typeof MATERIALS)[number]
export type Fit = (typeof FITS)[number]
export type Pattern = (typeof PATTERNS)[number]
export type Gender = (typeof GENDERS)[number]

export interface ClothingItem {
  id: string
  user_id: string
  name: string
  type: ClothingType
  color: Color
  seasons: Season[]
  occasions: Occasion[]
  material?: Material
  fit?: Fit
  pattern?: Pattern
  image_url: string
  image_pathname: string
  last_worn_at: string | null
  created_at: string
  updated_at: string
}

export interface Outfit {
  id: string
  user_id: string
  occasion: Occasion | null
  weather: WeatherData | null
  worn_at: string
  ai_generated: boolean
  items?: OutfitItem[]
}

export interface OutfitItem {
  id: string
  name: string
  type: ClothingType
  color: Color
  image_pathname: string
}

export interface WeatherData {
  temp: number
  feelsLike: number
  humidity: number
  description: string
  icon: string
  location: string
}

export interface User {
  id: string
  email: string
  name: string
  password: string
  gender?: Gender
  location?: string
  created_at: string
}

export interface OutfitSuggestion {
  items: {
    id: string
    name: string
    type: ClothingType
    imagePath: string
  }[]
  additionalItems: string[]
  reasoning: string
  confidence: number
}