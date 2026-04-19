import { createClient } from "@supabase/supabase-js"

// ============================================================
// SHARED SESSION via COOKIE (SSO antar subdomain)
// ============================================================
// Strategi:
//   - Sesi penuh disimpan di localStorage (per-origin, batas 5-10MB)
//   - access_token + refresh_token disimpan di cookie (shared .gameforsmart.com)
//   - Saat user buka subdomain lain, kita pakai setSession() (BUKAN refreshSession!)
//     agar token tidak dirotasi dan semua app tetap sinkron
//   - Saat salah satu app melakukan auto-refresh, token baru ditulis ke cookie
//     dan app lain akan "ikut" saat user focus/kembali ke tab tersebut
// ============================================================

/**
 * Simpan access_token + refresh_token ke shared cookie (.gameforsmart.com)
 * Format: access_token|refresh_token (~1.5KB, aman di bawah batas 4KB)
 */
export function syncSessionCookie(tokens: { access_token: string; refresh_token: string } | null) {
  if (typeof document === 'undefined') return;
  const hostname = window.location.hostname;
  const isGfs = hostname.endsWith('gameforsmart.com');
  const isHttps = window.location.protocol === 'https:';

  if (!tokens) {
    // Hapus cookie dengan parameter yang persis sama saat dibuat agar browser (Chrome/Safari) mengizinkan penghapusan
    const parts = [
      `gfs-session=`,
      `path=/`,
      `expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `max-age=0`,
      `SameSite=Lax`
    ];
    if (isGfs) parts.push(`domain=.gameforsmart.com`);
    if (isHttps) parts.push(`Secure`);

    document.cookie = parts.join('; ');
    return;
  }

  const value = `${tokens.access_token}|${tokens.refresh_token}`;
  const parts = [
    `gfs-session=${encodeURIComponent(value)}`,
    `path=/`,
    `max-age=${60 * 60 * 24 * 365}`,
    `SameSite=Lax`,
  ];
  if (isGfs) parts.push(`domain=.gameforsmart.com`);
  if (isHttps) parts.push(`Secure`);
  document.cookie = parts.join('; ');
}

/**
 * Baca access_token + refresh_token dari shared cookie
 */
export function getSessionFromCookie(): { access_token: string; refresh_token: string } | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const found = cookies.find(c => c.startsWith('gfs-session='));
  if (!found) return null;
  try {
    const eqIndex = found.indexOf('=');
    const value = decodeURIComponent(found.substring(eqIndex + 1));
    const pipeIndex = value.indexOf('|');
    if (pipeIndex === -1) return null;
    const access_token = value.substring(0, pipeIndex);
    const refresh_token = value.substring(pipeIndex + 1);
    if (!access_token || !refresh_token) return null;
    return { access_token, refresh_token };
  } catch {
    return null;
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrlGame = process.env.NEXT_PUBLIC_SUPABASE_URL_MINE;
const supabaseAnonKeyGame = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MINE;

if (!supabaseUrl) throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("Missing SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!supabaseUrlGame) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL_GAME");
if (!supabaseAnonKeyGame) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY_GAME");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Gunakan localStorage default (aman untuk semua ukuran sesi)
    storageKey: 'gfs-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
export const mysupa = createClient(supabaseUrlGame, supabaseAnonKeyGame, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Type untuk EmbeddedPlayer (dari JSONB game_rooms.players)
export type EmbeddedPlayer = {
  player_id: string;
  nickname: string;
  character_type: string;
  score: number;
  correct_answers: number;
  is_host: boolean;
  position_x: number;
  position_y: number;
  is_alive: boolean;
  joined_at: string;
  power_ups: number;
  health: {
    current: number;
    max: number;
    is_being_attacked: boolean;
    last_attack_time: string;
    speed: number;
    last_answer_time: string;
    countdown: number;
  };
  answers: any[];
  attacks: any[];
  room_id?: string;  // Tambahan untuk fallback
};

export type GameRoom = {
  id: string;
  room_code: string;
  host_id: string | null;
  title: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  duration: number;
  quiz_id: string | null;
  chaser_type: 'zombie' | 'monster1' | 'monster2' | 'monster3' | 'darknight';
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
  game_start_time: string | null;
  countdown_start: string | null;
  question_count: number;
  embedded_questions: any[];
  players: EmbeddedPlayer[];  // Array EmbeddedPlayer
};

export type Quiz = {
  id: string;
  theme: string;
  description: string | null;
  duration: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  questions: Array<{
    id: string | number;
    question: string;
    options: string[];
    correct_answer: string;
  }>;
  created_at: string;
};

export type GameCompletion = {
  id: string;
  player_id: string;
  room_id: string;
  final_health: number;
  correct_answers: number;
  total_questions_answered: number;
  is_eliminated: boolean;
  completion_type: 'partial' | 'full' | 'eliminated';
  survival_duration: number;
  completed_at: string;
};