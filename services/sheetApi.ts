
import { Player, Match, Expense, Payment, ScoringRule } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwIYLQZ4wZLfBTvlYNhvE_n5UUyA4gGncc1pa-b6VOewMFHvVDyIkSuMGcMq2detix0PA/exec';

export const api = {
  /**
   * Busca todos os dados da planilha unificada.
   * Usa nocache para garantir que os dados de "consulta" sejam os mais atuais.
   */
  async fetchAllData() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error('Erro na resposta da rede');
      const data = await response.json();
      
      if (data && typeof data === 'object') {
        return {
          PLAYERS: data.PLAYERS || [],
          MATCHES: data.MATCHES || [],
          EXPENSES: data.EXPENSES || [],
          PAYMENTS: data.PAYMENTS || [],
          RULES: data.RULES || []
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar dados da planilha:", error);
      return null;
    }
  },

  /**
   * Sincroniza o estado local completo do app com a planilha.
   */
  async syncAllData(allData: { 
    PLAYERS: Player[], 
    MATCHES: Match[], 
    EXPENSES: Expense[], 
    PAYMENTS: Payment[], 
    RULES: ScoringRule[] 
  }) {
    try {
      // Usamos POST com mode: no-cors para evitar problemas de redirecionamento do Google Script
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'ALL_DATA', data: allData }),
      });
      console.log("✅ Sincronização em nuvem concluída com sucesso.");
      return true;
    } catch (error) {
      console.error(`❌ Erro na sincronização global:`, error);
      return false;
    }
  }
};
