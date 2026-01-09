import { Player, Match, Expense, Payment } from '../types';

// ATENÇÃO: SUBSTITUA PELA URL DO SEU SCRIPT GOOGLE AQUI
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwuA5E2YKb9PIZ7Er7pW0nl4u1OcV4Fs7GruQyZ11T46nif8Db9Wu7n51EzT0P3P3x1_g/exec';

type DataType = 'PLAYERS' | 'MATCHES' | 'EXPENSES' | 'PAYMENTS';

const sendData = async (type: DataType, data: any[]) => {
  try {
    // Using 'text/plain' prevents CORS preflight requests for POST
    // Google Apps Script reads the body via e.postData.contents regardless of Content-Type
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ type, data }),
    });
    console.log(`Synced ${type} successfully`);
  } catch (error) {
    console.error(`Error syncing ${type}`, error);
  }
};

const fetchAllData = async () => {
    try {
        // Removed headers object to avoid CORS preflight issues.
        // Google Apps Script redirects (302) to GoogleUserContent, and custom headers break this chain in fetch.
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=read&nocache=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching data. Check internet connection or if GAS is deployed as 'Anyone'.", error);
        return null;
    }
}

export const api = {
  syncPlayers: (players: Player[]) => sendData('PLAYERS', players),
  syncMatches: (matches: Match[]) => sendData('MATCHES', matches),
  syncExpenses: (expenses: Expense[]) => sendData('EXPENSES', expenses),
  syncPayments: (payments: Payment[]) => sendData('PAYMENTS', payments),
  fetchAllData
};