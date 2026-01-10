
import { Player, Match, Expense, Payment } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJqAJJAERSdDrjgArvDiqjb5-rl9w9XCjinhp8v-5xeHPKXV2pJgrlfghhsiSwodon5Q/exec';

export const api = {
  async fetchAllData() {
    try {
      // Usando sinalizador de tempo para evitar caches agressivos do navegador
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?nocache=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && typeof data === 'object' && data.PLAYERS) {
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching data from Google Sheets:", error);
      // Retorna null para disparar o estado de erro no App.tsx
      return null;
    }
  },

  async syncData(type: 'PLAYERS' | 'MATCHES' | 'EXPENSES' | 'PAYMENTS', data: any[]) {
    try {
      // POST para Google Apps Script com redirecionamento exige modo no-cors em muitos ambientes locais
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type, data: data || [] }),
      });
      return true;
    } catch (error) {
      console.error(`Error syncing ${type}:`, error);
      return false;
    }
  }
};
