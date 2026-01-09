import { Player, Match, Expense, Payment } from '../types';

// ATENÇÃO: SUBSTITUA PELA URL DO SEU SCRIPT GOOGLE AQUI
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz68on5gzCIt-QVZxUI3mFCy8e0snKjHYk2PNEwPJsxjs04qufR55wkxMtceGUBbILVZw/exec';

type DataType = 'PLAYERS' | 'MATCHES' | 'EXPENSES' | 'PAYMENTS';

const sendData = async (type: DataType, data: any[]) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Important for Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });
    console.log(`Synced ${type} successfully`);
  } catch (error) {
    console.error(`Error syncing ${type}`, error);
  }
};

export const api = {
  syncPlayers: (players: Player[]) => sendData('PLAYERS', players),
  syncMatches: (matches: Match[]) => sendData('MATCHES', matches),
  syncExpenses: (expenses: Expense[]) => sendData('EXPENSES', expenses),
  syncPayments: (payments: Payment[]) => sendData('PAYMENTS', payments),
};