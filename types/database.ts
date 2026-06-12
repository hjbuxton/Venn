export type BudgetRange =
  | "under_300"
  | "300_500"
  | "500_800"
  | "800_1200"
  | "1200_plus";

export type TripVibe =
  | "beach"
  | "city"
  | "party"
  | "chill"
  | "adventure"
  | "culture";

export type Distance = "uk" | "europe" | "anywhere";

export type TripStatus = "collecting" | "ready" | "planned";

export type MessageType = "text" | "venn_card" | "system";

export interface DateRange {
  from: string; // ISO date string (yyyy-mm-dd)
  to: string; // ISO date string (yyyy-mm-dd)
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Trip {
  id: string;
  name: string;
  organiser_id: string;
  travel_window: DateRange | null;
  group_size: number;
  invite_code: string;
  status: TripStatus;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  joined_at: string;
  preferences_submitted: boolean;
  // joined via select from users table
  user?: User;
}

export interface Preferences {
  id: string;
  trip_id: string;
  user_id: string;
  budget_range: BudgetRange;
  available_dates: DateRange;
  trip_vibes: TripVibe[];
  deal_breakers: string | null;
  distance: Distance;
  created_at: string;
}

export interface VennRecommendationItem {
  destination: string;
  country?: string;
  dates: string;
  checkin: string; // ISO date string (yyyy-mm-dd)
  checkout: string; // ISO date string (yyyy-mm-dd)
  accommodation: string;
  description?: string;
  price_per_person: string;
  vibe_match?: string;
  booking_url: string;
}

export interface VennRecommendation {
  id: string;
  trip_id: string;
  triggered_by: string;
  recommendations_json: VennRecommendationItem[];
  created_at: string;
}

export interface Message {
  id: string;
  trip_id: string;
  user_id: string | null;
  content: string;
  message_type: MessageType;
  created_at: string;
  // joined via select from users table
  user?: User;
  // present when message_type === 'venn_card'
  recommendation?: VennRecommendation;
}

export const BUDGET_LABELS: Record<BudgetRange, string> = {
  under_300: "Under £300",
  "300_500": "£300 - £500",
  "500_800": "£500 - £800",
  "800_1200": "£800 - £1,200",
  "1200_plus": "£1,200+",
};

export const VIBE_LABELS: Record<TripVibe, string> = {
  beach: "Beach & sun",
  city: "City break",
  party: "Party holiday",
  chill: "Chill & relax",
  adventure: "Adventure",
  culture: "Culture & sightseeing",
};

export const DISTANCE_LABELS: Record<Distance, string> = {
  uk: "UK only",
  europe: "Europe",
  anywhere: "Anywhere",
};
