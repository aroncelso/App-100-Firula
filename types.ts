
export interface Player {
  id: string;
  name: string;
  position: 'Goleiro' | 'Zagueiro' | 'Meio-Campo' | 'Atacante';
  goals: number;
  assists: number;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
  whatsapp?: string;
  active?: boolean;
}

export type EventType = 
  'GOL' | 
  'ASSIST' | 
  'AMARELO' | 
  'VERMELHO' | 
  'FALTA' | 
  'DEFESA_PENALTI' | 
  'GOL_CONTRA' | 
  'PENALTI_PERDIDO' | 
  'PENALTI_SOFRIDO' | 
  'PENALTI_COMETIDO';

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

export interface RatingDetail {
  evaluatorId: string;
  score: number;
}

export interface Match {
  id: string;
  date: string;
  opponent: string;
  opponentLogo?: string;
  label: 'Quadro 1' | 'Quadro 2';
  stats: QuadroStats;
  notes: string;
  coach?: string;
  referee?: string;
  isFriendly?: boolean;
  wo?: 'none' | 'win' | 'loss';
  playerRatings?: Record<string, number>; // Mantém a média para compatibilidade rápida
  detailedRatings?: Record<string, RatingDetail[]>; // Novo: Detalhes por avaliador
  roster?: string[];
}

export interface Payment {
  playerId: string;
  month: string;
  status: 'Pago' | 'Pendente';
  value: number;
  paymentDate?: string;
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  date: string;
  category: 'Fixa' | 'Variável' | string;
}

export interface ScoringRule {
  id: string;
  label: string;
  value: number;
  active: boolean;
  type: 'positive' | 'negative' | 'coach';
  category?: string;
}

export type ScreenType = 'DASHBOARD' | 'SUMULAS' | 'JOGADORES' | 'FINANCEIRO' | 'CADASTRO_JOGADOR' | 'CARTOLA' | 'EDITAR_JOGADOR';
