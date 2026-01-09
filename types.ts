
export interface Player {
  id: string;
  name: string;
  position: 'Goleiro' | 'Zagueiro' | 'Meio-Campo' | 'Atacante';
  goals: number;
  assists: number;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
}

export type EventType = 'GOL' | 'ASSIST' | 'AMARELO' | 'VERMELHO' | 'FALTA';

export interface MatchEvent {
  id: string;
  playerId: string;
  type: EventType;
}

export interface HalfStats {
  fouls: number;
  opponentGoals: number;
  opponentFouls: number;
  events: MatchEvent[];
}

export interface QuadroStats {
  tempo1: HalfStats;
  tempo2: HalfStats;
}

// Updated Match interface: Represents ONE game (Quadro 1 OR Quadro 2)
export interface Match {
  id: string;
  date: string;
  opponent: string;
  label: 'Quadro 1' | 'Quadro 2'; // Identifies which team played
  stats: QuadroStats; // Contains stats for this specific game
  notes: string;
  coach?: string; // New: Coach name
  isFriendly?: boolean; // New: If true, points = 0
  wo?: 'none' | 'win' | 'loss'; // New: Walkover status
  playerRatings?: Record<string, number>; // New: playerId -> score (1-10)
  roster?: string[]; // New: List of Player IDs present in this match
}

export interface Payment {
  playerId: string;
  month: string;
  status: 'Pago' | 'Pendente';
  value: number;
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  date: string;
  category?: string;
}

export type ScreenType = 'DASHBOARD' | 'SUMULAS' | 'JOGADORES' | 'FINANCEIRO' | 'CADASTRO_JOGADOR';