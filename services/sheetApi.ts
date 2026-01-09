
import { Player, Match, Expense, Payment } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_lSVPDu3aySk0jvX8CL1zKV7rlJT3UFBBb7xUgHj_CTELzpZfyrIhy9ngSaiAWyDwXg/exec';

export const api = {
  async fetchAllData() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?nocache=${Date.now()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      // Basic validation to ensure we got the expected structure
      if (data && typeof data === 'object' && data.PLAYERS) {
        return data;
      }
      console.error("Data received is invalid:", data);
      return null;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  },

  async syncData(type: 'PLAYERS' | 'MATCHES' | 'EXPENSES' | 'PAYMENTS', data: any[]) {
    try {
      // Don't sync if data is obviously empty to prevent accidental wipes
      if (!data || data.length === 0) return true;

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type, data }),
      });
      return true;
    } catch (error) {
      console.error(`Error syncing ${type}:`, error);
      return false;
    }
  }
};
