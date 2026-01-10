
import { Player, Match, Expense, Payment } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJqAJJAERSdDrjgArvDiqjb5-rl9w9XCjinhp8v-5xeHPKXV2pJgrlfghhsiSwodon5Q/exec';

export const api = {
  async fetchAllData() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data && typeof data === 'object' && data.PLAYERS) {
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  },

  async syncData(type: 'PLAYERS' | 'MATCHES' | 'EXPENSES' | 'PAYMENTS', data: any[]) {
    try {
      // Sincroniza sempre, mesmo vazio, para garantir que o cabeçalho seja criado na planilha
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
