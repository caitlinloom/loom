// ─── Loom shared types ────────────────────────────────────────────────────────

export type Gender =
  | 'Man'
  | 'Woman'
  | 'Trans man'
  | 'Trans woman'
  | 'Non-binary';

export type Orientation =
  | 'Straight'
  | 'Gay'
  | 'Lesbian'
  | 'Bisexual'
  | 'Pansexual'
  | 'Queer'
  | 'Other';

export type Religion =
  | 'Christianity'
  | 'Islam'
  | 'Judaism'
  | 'Hinduism'
  | 'Buddhism'
  | 'Sikhism'
  | 'Spiritual'
  | 'Agnostic'
  | 'Atheist'
  | 'Other';

export type MonogamyStance =
  | 'Strictly monogamous'
  | 'Monogamous, but open-minded'
  | 'Open to ethical non-monogamy'
  | 'Prefer open relationships'
  | 'Polyamorous';

// Row shapes mirroring Supabase tables
export interface Profile {
  id:                   string;
  phone:                string | null;
  name:                 string | null;
  birth_date:           string | null;    // ISO date YYYY-MM-DD
  gender:               Gender | null;
  orientation:          Orientation | null;
  religion:             Religion | null;
  monogamy:             MonogamyStance | null;
  bio:                  string | null;
  location_name:        string | null;
  location_lat:         number | null;
  location_lng:         number | null;
  onboarding_step:      number;           // 0=auth 1=subscribed 2=profile 3=prefs 4=questions(done)
  created_at:           string;
  updated_at:           string;
}

export interface Photo {
  id:         string;
  user_id:    string;
  url:        string;
  position:   0 | 1 | 2 | 3;
  created_at: string;
}

export interface Preferences {
  id:               string;
  user_id:          string;
  genders:          Gender[];
  orientations:     Orientation[];
  monogamy_stances: MonogamyStance[];
  religions:        Religion[];
  age_min:          number;
  age_max:          number;
  distance_miles:   number;
  updated_at:       string;
}

export interface QuestionAnswer {
  id:          string;
  user_id:     string;
  question_id: number;
  answer:      number;   // index for choice (0-4), raw value for scale (0-9)
  created_at:  string;
}

export interface CompatibilityScore {
  id:                  string;
  user_a:              string;
  user_b:              string;
  overall:             number;
  cat_values:          number;
  cat_communication:   number;
  cat_lifestyle:       number;
  cat_finances:        number;
  cat_intimacy:        number;
  cat_family:          number;
  cat_growth:          number;
  cat_dealbreakers:    number;
  calculated_at:       string;
}

export interface Interaction {
  id:         string;
  from_user:  string;
  to_user:    string;
  action:     'like' | 'pass';
  created_at: string;
}

export interface Match {
  id:         string;
  user_a:     string;
  user_b:     string;
  created_at: string;
}

export interface Message {
  id:         string;
  match_id:   string;
  sender_id:  string;
  content:    string;
  created_at: string;
  read_at:    string | null;
}

export interface Subscription {
  id:                    string;
  user_id:               string;
  stripe_customer_id:    string | null;
  stripe_subscription_id: string | null;
  status:                'active' | 'canceled' | 'past_due' | 'trialing' | null;
  current_period_end:    string | null;
  created_at:            string;
  updated_at:            string;
}

// ─── View models ─────────────────────────────────────────────────────────────

// Full profile as shown in the browse feed — joined from multiple tables
export interface UserCard {
  id:          string;
  name:        string;
  age:         number;
  bio:         string;
  gender:      Gender;
  orientation: Orientation;
  religion:    Religion;
  monogamy:    MonogamyStance;
  location_name: string;
  distance_miles: number;
  photos:      string[];   // ordered by position, [0] is main photo
  compat: {
    overall:       number;
    values:        number;
    communication: number;
    lifestyle:     number;
    finances:      number;
    intimacy:      number;
    family:        number;
    growth:        number;
    dealbreakers:  number;
  };
}

// ─── Navigation param types ───────────────────────────────────────────────────
export type RootStackParamList = {
  index:                    undefined;
  '(auth)/signup':          undefined;
  '(auth)/verify':          { phone: string };
  '(onboarding)/subscribe': undefined;
  '(onboarding)/profile':   undefined;
  '(onboarding)/preferences': undefined;
  '(onboarding)/questions': undefined;
  '(app)/browse':           undefined;
  '(app)/browse/[id]':      { id: string };
  '(app)/chat':             undefined;
  '(app)/chat/[id]':        { id: string; matchId: string };
  '(app)/settings':         undefined;
};
