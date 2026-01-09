import React, { useState } from 'react';
import { Player, Payment, Expense } from '../types';
import { Wallet, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Plus, Banknote, Calendar, Receipt } from 'lucide-react';

interface Props {
  payments: Payment[];
  players: Player[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const Finance: React.FC<Props> = ({ payments, players, setPayments, expenses, setExpenses }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  
  // Expense Form State
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseValue, setNewExpenseValue] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculations
  const totalRevenue = payments.filter(p => p.status === 'Pago').reduce((acc, p) => acc + p.value, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.value, 0);
  const balance = totalRevenue - totalExpenses;
  
  // Progress for payments
  const totalPaidCount = payments.filter(p => p.status === 'Pago').length;
  const progress = (totalPaidCount / players.length) * 100;

  const togglePayment = (playerId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.playerId === playerId) {
        return { ...p, status: p.status === 'Pago' ? 'Pendente' : 'Pago' };
      }
      return p;
    }));
  };

  const handleAddExpense = () => {
    if (!newExpenseDesc || !newExpenseValue) return;
    
    const expense: Expense = {
      id: Date.now().toString(),
      description: newExpenseDesc,
      value: parseFloat(newExpenseValue),
      date: newExpenseDate,
      category: 'Geral'
    };

    setExpenses(prev => [expense, ...prev]);
    setNewExpenseDesc('');
    setNewExpenseValue('');
    setShowExpenseForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-2xl font-display font-bold tracking-tight">FINANCEIRO</h2>
        <p className="text-[10px] font-black text-[#F4BE02] uppercase tracking-[0.2em]">Controle de Caixa</p>
      </div>

      {/* Tabs */}
      <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
             activeTab === 'payments' 
             ? 'bg-[#F4BE02] text-black shadow-lg' 
             : 'text-white/30 hover:bg-white/5'
          }`}
        >
          <Banknote size={14} /> Mensalidades
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
             activeTab === 'expenses' 
             ? 'bg-[#F4BE02] text-black shadow-lg' 
             : 'text-white/30 hover:bg-white/5'
          }`}
        >
          <Receipt size={14} /> Despesas
        </button>
      </div>

      {/* Balance Card (Shared) */}
      <div className="bg-gradient-to-br from-[#111] to-black p-8 rounded-[32px] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F4BE02]/5 rounded-full blur-[60px]"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-10 h-10 bg-[#F4BE02]/10 rounded-xl flex items-center justify-center text-[#F4BE02]">
                <Wallet size={20} />
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Saldo em Caixa</span>
                <span className={`text-[10px] font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {balance >= 0 ? 'Positivo' : 'Negativo'}
                </span>
             </div>
          </div>
          
          <h2 className={`text-5xl font-display font-bold tracking-tighter ${balance >= 0 ? 'text-white' : 'text-red-500'}`}>
            <span className="text-lg font-bold text-[#F4BE02] mr-1">R$</span>{Math.abs(balance).toFixed(2)}
          </h2>

          <div className="grid grid-cols-2 gap-8 w-full mt-6 pt-6 border-t border-white/5">
              <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-green-500 mb-1">
                      <TrendingUp size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Entradas</span>
                  </div>
                  <span className="font-bold text-lg">R$ {totalRevenue.toFixed(0)}</span>
              </div>
              <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-red-500 mb-1">
                      <TrendingDown size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Saídas</span>
                  </div>
                  <span className="font-bold text-lg">R$ {totalExpenses.toFixed(0)}</span>
              </div>
          </div>
        </div>
      </div>

      {/* --- TAB: MENSALIDADES --- */}
      {activeTab === 'payments' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="px-1 flex justify-between items-end">
              <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Pagamentos</h3>
                  <p className="text-[9px] text-white/20 mt-1">Novembro / 2024</p>
              </div>
              <div className="text-right">
                  <span className="text-[10px] font-black text-[#F4BE02]">{progress.toFixed(0)}%</span>
                  <div className="h-1.5 w-20 bg-white/5 rounded-full overflow-hidden mt-1">
                    <div 
                        className="h-full bg-gradient-to-r from-[#F4BE02] to-[#FFD700] rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                  </div>
              </div>
            </div>
            
            <div className="space-y-3 pb-32">
              {players.map(player => {
                const payment = payments.find(p => p.playerId === player.id);
                const isPaid = payment?.status === 'Pago';
                const playerName = player.name || '';

                return (
                  <div 
                    key={player.id} 
                    className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] flex items-center justify-between hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-sm border transition-colors
                        ${isPaid 
                          ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                          : 'bg-[#E70205]/10 border-[#E70205]/20 text-[#E70205]'}`}
                      >
                        {playerName.charAt(0) || '?'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm tracking-tight">{playerName}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-green-500' : 'bg-[#E70205]'}`}></span>
                           <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">R$ {payment?.value.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => togglePayment(player.id)}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                        ${isPaid 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                          : 'bg-white/[0.03] text-white/40 border border-white/[0.05] active:bg-[#E70205]/20 active:text-[#E70205]'}`}
                    >
                      {isPaid ? 'PAGO' : 'PENDENTE'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
      )}

      {/* --- TAB: DESPESAS --- */}
      {activeTab === 'expenses' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-32">
              
              {!showExpenseForm ? (
                  <button 
                    onClick={() => setShowExpenseForm(true)}
                    className="w-full bg-white/[0.03] border border-dashed border-white/20 hover:border-[#F4BE02] hover:bg-[#F4BE02]/5 text-white/40 hover:text-[#F4BE02] p-5 rounded-[24px] flex items-center justify-center gap-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#F4BE02] group-hover:text-black transition-colors">
                      <Plus size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Lançar Nova Despesa</span>
                  </button>
              ) : (
                  <div className="bg-[#0A0A0A] p-5 rounded-[24px] border border-white/10 space-y-4">
                      <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-sm text-white">Nova Despesa</h4>
                          <button onClick={() => setShowExpenseForm(false)} className="text-white/40 hover:text-white text-xs font-bold uppercase">Cancelar</button>
                      </div>
                      
                      <div className="space-y-3">
                          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5 focus-within:border-[#F4BE02]/50 transition-colors">
                              <Receipt size={16} className="text-white/30" />
                              <input 
                                type="text" 
                                placeholder="Descrição (Ex: Água, Arbitragem)"
                                className="bg-transparent w-full outline-none text-sm font-bold placeholder:text-white/20"
                                value={newExpenseDesc}
                                onChange={e => setNewExpenseDesc(e.target.value)}
                              />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5 focus-within:border-[#F4BE02]/50 transition-colors">
                                  <span className="text-white/30 font-bold text-sm">R$</span>
                                  <input 
                                    type="number" 
                                    placeholder="0.00"
                                    className="bg-transparent w-full outline-none text-sm font-bold placeholder:text-white/20"
                                    value={newExpenseValue}
                                    onChange={e => setNewExpenseValue(e.target.value)}
                                  />
                              </div>
                              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5 focus-within:border-[#F4BE02]/50 transition-colors">
                                  <Calendar size={16} className="text-white/30" />
                                  <input 
                                    type="date"
                                    className="bg-transparent w-full outline-none text-xs font-bold text-white/70"
                                    value={newExpenseDate}
                                    onChange={e => setNewExpenseDate(e.target.value)}
                                  />
                              </div>
                          </div>

                          <button 
                            onClick={handleAddExpense}
                            disabled={!newExpenseDesc || !newExpenseValue}
                            className="w-full bg-[#E70205] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
                          >
                             Confirmar Lançamento
                          </button>
                      </div>
                  </div>
              )}

              <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40 px-1">Histórico de Saídas</h3>
                  
                  {expenses.length > 0 ? expenses.map(expense => (
                      <div key={expense.id} className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/[0.06] flex items-center justify-between hover:border-white/10 transition-all">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[#E70205]/10 flex items-center justify-center text-[#E70205] border border-[#E70205]/20">
                                  <TrendingDown size={18} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-sm text-white">{expense.description}</h4>
                                  <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">
                                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                                  </span>
                              </div>
                          </div>
                          <span className="text-red-500 font-display font-bold text-lg">
                              - R$ {expense.value.toFixed(2)}
                          </span>
                      </div>
                  )) : (
                      <div className="text-center py-10 opacity-20">
                          <Receipt size={40} className="mx-auto mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma despesa lançada</p>
                      </div>
                  )}
              </div>
          </section>
      )}

    </div>
  );
};

export default Finance;