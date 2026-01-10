
import { Player, Match, Expense, Payment, ScoringRule } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwe7A4htBxfdoEobOVTsP4uG43OOjwhBszfCefc_zWa_VF3A1InlX45ylpmxZqT5nCN/exec';

export const api = {
  /**
   * Busca todos os dados das abas organizadas (JOGADORES, SÚMULAS, DESPESAS, etc).
   */
  async fetchAllData() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error('Erro na resposta da rede');
      const data = await response.json();
      
      if (data && typeof data === 'object') {
        return {
          PLAYERS: Array.isArray(data.PLAYERS) ? data.PLAYERS : [],
          MATCHES: Array.isArray(data.MATCHES) ? data.MATCHES : [],
          EXPENSES: Array.isArray(data.EXPENSES) ? data.EXPENSES : [],
          PAYMENTS: Array.isArray(data.PAYMENTS) ? data.PAYMENTS : [],
          RULES: Array.isArray(data.RULES) ? data.RULES : []
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar dados da planilha:", error);
      return null;
    }
  },

  /**
   * Sincroniza o estado local completo, distribuindo os dados para as abas corretas via POST.
   */
  async syncAllData(allData: { 
    PLAYERS: Player[], 
    MATCHES: Match[], 
    EXPENSES: Expense[], 
    PAYMENTS: Payment[], 
    RULES: ScoringRule[] 
  }) {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'SYNC_ALL_CHANNELS', data: allData }),
      });
      // Com no-cors, não conseguimos ler o corpo da resposta, mas o fetch resolve se enviado.
      console.log("✅ Sincronização multi-abas enviada com sucesso.");
      return true;
    } catch (error) {
      console.error(`❌ Erro na sincronização:`, error);
      return false;
    }
  }
};
