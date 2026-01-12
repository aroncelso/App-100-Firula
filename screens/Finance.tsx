
import React, { useState, useMemo, useEffect } from 'react';
import { Player, Payment, Expense } from '../types';
import { Wallet, TrendingUp, TrendingDown, Plus, Banknote, Calendar, Receipt, History, DollarSign, Layers, BarChart3, PieChart, ArrowUpCircle, ArrowDownCircle, Trash2, Pencil, AlertCircle, CheckCircle2, RotateCcw, Lock, Users, UserMinus, UserCheck, Clock, Filter, ChevronDown, Search, FileText, ArrowUpRight, ArrowDownRight, Share2, MessageCircle, Megaphone, UserPlus, X } from 'lucide-react';

interface Props {
  payments: Payment[];
  players: Player[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const ensureISO = (dateStr: any): string => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  
  if (str.includes('-')) {
    const tSplit = str.split('T');
    const datePart = tSplit[0];
    const parts = datePart.split('-');
    
    if (parts.length === 3 && parts[0].length === 4) return datePart;
    if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
  }
  
  return '';
};

const parseSafeDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const parts = dateStr.split('T')[0].split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

// Helper para obter data local no formato YYYY-MM-DD
const getTodayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Finance: React.FC<Props> = ({ payments, players, setPayments, expenses, setExpenses }) => {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'history' | 'analysis'>('payments');
  
  // Forms States
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  // Avulso States
  const [showAvulsoModal, setShowAvulsoModal] = useState(false);
  const [avulsoValue, setAvulsoValue] = useState('');
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Estados para filtro de mensalidade/receita
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  // Estados para filtro de Transações (Entradas/Saídas)
  const [transactionSearchMonth, setTransactionSearchMonth] = useState(MONTHS[now.getMonth()]);
  const [transactionSearchYear, setTransactionSearchYear] = useState(now.getFullYear().toString());

  // Estados para filtro de Análise
  const [analysisMonth, setAnalysisMonth] = useState(MONTHS[now.getMonth()]);
  const [analysisYear, setAnalysisYear] = useState(now.getFullYear().toString());

  // GENERIC TRANSACTION FORM STATE
  const [newDesc, setNewDesc] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState(getTodayISO());
  const [newCategory, setNewCategory] = useState<string>('Variável');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');

  // --- LÓGICA DE FILTROS DINÂMICOS ---
  const validPeriods = useMemo(() => {
    const periods = new Set<string>();
    
    const addDate = (dateStr: string) => {
        const d = parseSafeDate(dateStr);
        if (!isNaN(d.getTime())) {
            periods.add(`${d.getFullYear()}-${d.getMonth()}`); 
        }
    };

    payments.forEach(p => {
        if (p.status === 'Pago' && p.paymentDate) addDate(p.paymentDate);
    });

    expenses.forEach(e => {
        if (e.date) addDate(e.date);
    });

    periods.add(`${now.getFullYear()}-${now.getMonth()}`);

    return Array.from(periods).map(p => {
        const [y, m] = p.split('-');
        return { year: y, monthIndex: parseInt(m) };
    });
  }, [payments, expenses]);

  const availableYears = useMemo(() => {
    const years = new Set(validPeriods.map(p => p.year));
    return Array.from(years).sort().reverse();
  }, [validPeriods]);

  const outflows = useMemo(() => expenses.filter(e => !e.type || e.type === 'expense'), [expenses]);
  const extraRevenues = useMemo(() => expenses.filter(e => e.type === 'income'), [expenses]);

  // 1. ABA PAGAMENTOS (MENSAL)
  const availablePaymentMonths = useMemo(() => {
    return validPeriods
        .filter(p => p.year === selectedYear)
        .sort((a, b) => a.monthIndex - b.monthIndex)
        .map(p => MONTHS[p.monthIndex]);
  }, [validPeriods, selectedYear]);

  useEffect(() => {
    if (!availablePaymentMonths.includes(selectedMonth) && availablePaymentMonths.length > 0) {
        setSelectedMonth(availablePaymentMonths[availablePaymentMonths.length - 1]);
    }
  }, [selectedYear, availablePaymentMonths]);

  // 2. ABA ENTRADAS/SAÍDAS
  const availableTransactionMonths = useMemo(() => {
    return validPeriods
        .filter(p => p.year === transactionSearchYear)
        .sort((a, b) => a.monthIndex - b.monthIndex)
        .map(p => MONTHS[p.monthIndex]);
  }, [validPeriods, transactionSearchYear]);

  useEffect(() => {
    if (!availableTransactionMonths.includes(transactionSearchMonth) && availableTransactionMonths.length > 0) {
        setTransactionSearchMonth(availableTransactionMonths[availableTransactionMonths.length - 1]);
    }
  }, [transactionSearchYear, availableTransactionMonths]);

  // 3. ABA ANÁLISE
  const availableAnalysisMonths = useMemo(() => {
    return validPeriods
        .filter(p => p.year === analysisYear)
        .sort((a, b) => a.monthIndex - b.monthIndex)
        .map(p => MONTHS[p.monthIndex]);
  }, [validPeriods, analysisYear]);

  useEffect(() => {
    if (!availableAnalysisMonths.includes(analysisMonth) && availableAnalysisMonths.length > 0) {
        setAnalysisMonth(availableAnalysisMonths[availableAnalysisMonths.length - 1]);
    }
  }, [analysisYear, availableAnalysisMonths]);

  const currentPeriod = `${selectedMonth} / ${selectedYear}`;
  const analysisPeriod = `${analysisMonth} / ${analysisYear}`;

  const activePlayersList = useMemo(() => players.filter(p => p.active !== false), [players]);

  const { paidPlayers, unpaidPlayers, pendingAvulsos } = useMemo(() => {
    const paid: { player: Player, payment?: Payment }[] = [];
    const unpaid: { player: Player, payment?: Payment }[] = [];
    const avulsos: Player[] = [];

    // 1. LISTA DE PAGOS: Baseada na DATA DO PAGAMENTO (Regime de Caixa)
    const paidInPeriod = payments.filter(p => {
        if (p.status !== 'Pago') return false;
        const pDate = parseSafeDate(p.paymentDate || ''); 
        const pMonth = MONTHS[pDate.getMonth()];
        const pYear = pDate.getFullYear().toString();
        return pMonth === selectedMonth && pYear === selectedYear;
    });

    paidInPeriod.forEach(p => {
        const player = players.find(pl => pl.id === p.playerId);
        if (player) {
            paid.push({ player, payment: p });
        }
    });

    // 2. LISTA DE PENDENTES e AVULSOS
    activePlayersList.forEach(player => {
        // Verifica se já tem pagamento registrado para o MÊS DE REFERÊNCIA (independente da data de pgto)
        // Se já pagou este mês, não aparece nem em Pendentes nem em Avulsos Disponíveis
        const existingPayment = payments.find(p => p.playerId === player.id && p.month === currentPeriod && p.status === 'Pago');
        if (existingPayment) return;

        const paymentRef = payments.find(p => p.playerId === player.id && p.month === currentPeriod);

        if (player.paymentType === 'Avulso') {
            // Avulsos só aparecem na lista de "Registrar" se ainda não pagaram
            avulsos.push(player);
        } else {
            // Mensalistas vão para a lista de Pendentes
            if (!paymentRef || paymentRef.status === 'Pendente') {
                unpaid.push({ player, payment: paymentRef });
            }
        }
    });

    return { 
      paidPlayers: paid.sort((a, b) => (a.player.name || '').localeCompare(b.player.name || '')), 
      unpaidPlayers: unpaid.sort((a, b) => (a.player.name || '').localeCompare(b.player.name || '')),
      pendingAvulsos: avulsos.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    };
  }, [activePlayersList, payments, currentPeriod, selectedMonth, selectedYear]);

  const filteredExtraRevenues = useMemo(() => {
      return extraRevenues.filter(ex => {
          const d = parseSafeDate(ex.date);
          const mMatch = MONTHS[d.getMonth()] === selectedMonth;
          const yMatch = d.getFullYear().toString() === selectedYear;
          return mMatch && yMatch;
      });
  }, [extraRevenues, selectedMonth, selectedYear]);

  // FILTRO DE TRANSAÇÕES (ENTRADAS E SAÍDAS)
  const filteredTransactions = useMemo(() => {
    return expenses.filter(ex => {
      const d = parseSafeDate(ex.date);
      const mMatch = MONTHS[d.getMonth()] === transactionSearchMonth;
      const yMatch = d.getFullYear().toString() === transactionSearchYear;
      return mMatch && yMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, transactionSearchMonth, transactionSearchYear]);

  // Cálculos Gerais
  const totalMonthlyFees = useMemo(() => payments.filter(p => p.status === 'Pago').reduce((acc, p) => acc + (Number(p.value) || 0), 0), [payments]);
  const totalExtraRevenue = useMemo(() => extraRevenues.reduce((acc, e) => acc + (Number(e.value) || 0), 0), [extraRevenues]);
  const totalRevenueAllTime = totalMonthlyFees + totalExtraRevenue;
  
  const totalExpensesAllTime = useMemo(() => outflows.reduce((acc, e) => acc + (Number(e.value) || 0), 0), [outflows]);
  const globalBalance = totalRevenueAllTime - totalExpensesAllTime;

  // Cálculos Filtrados para Análise
  const filteredFeesRevenueAnalysis = useMemo(() => {
    return payments
      .filter(p => {
          if (p.status !== 'Pago') return false;
          const d = parseSafeDate(p.paymentDate || '');
          return MONTHS[d.getMonth()] === analysisMonth && d.getFullYear().toString() === analysisYear;
      })
      .reduce((acc, p) => acc + (Number(p.value) || 0), 0);
  }, [payments, analysisMonth, analysisYear]);

  const filteredExtraRevenueAnalysis = useMemo(() => {
      return extraRevenues
        .filter(ex => {
            const d = parseSafeDate(ex.date);
            return MONTHS[d.getMonth()] === analysisMonth && d.getFullYear().toString() === analysisYear;
        })
        .reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  }, [extraRevenues, analysisMonth, analysisYear]);

  const filteredRevenueAnalysis = filteredFeesRevenueAnalysis + filteredExtraRevenueAnalysis;

  const filteredExpensesAnalysis = useMemo(() => {
    return outflows
      .filter(ex => {
        const d = parseSafeDate(ex.date);
        const mMatch = MONTHS[d.getMonth()] === analysisMonth;
        const yMatch = d.getFullYear().toString() === analysisYear;
        return mMatch && yMatch;
      })
      .reduce((acc, e) => acc + (Number(e.value) || 0), 0);
  }, [outflows, analysisMonth, analysisYear]);

  const filteredBalanceAnalysis = filteredRevenueAnalysis - filteredExpensesAnalysis;

  const detailedAnalysisList = useMemo(() => {
      const pList = payments
        .filter(p => {
            if (p.status !== 'Pago') return false;
            const d = parseSafeDate(p.paymentDate || '');
            return MONTHS[d.getMonth()] === analysisMonth && d.getFullYear().toString() === analysisYear;
        })
        .map(p => ({
            id: `${p.playerId}-${p.month}`,
            date: p.paymentDate,
            desc: players.find(pl => pl.id === p.playerId)?.name || 'Atleta Desconhecido',
            subLabel: 'MENSALIDADE',
            value: p.value,
            type: 'IN' as const
        }));

      const extraIncList = extraRevenues
        .filter(e => {
            const d = parseSafeDate(e.date);
            return MONTHS[d.getMonth()] === analysisMonth && d.getFullYear().toString() === analysisYear;
        })
        .map(e => ({
            id: e.id,
            date: e.date,
            desc: e.description,
            subLabel: e.category,
            value: e.value,
            type: 'IN' as const
        }));

      const eList = outflows
        .filter(e => {
            const d = parseSafeDate(e.date);
            return MONTHS[d.getMonth()] === analysisMonth && d.getFullYear().toString() === analysisYear;
        })
        .map(e => ({
            id: e.id,
            date: e.date,
            desc: e.description,
            subLabel: e.category,
            value: e.value,
            type: 'OUT' as const
        }));

      return [...pList, ...extraIncList, ...eList].sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
      });
  }, [payments, outflows, extraRevenues, players, analysisMonth, analysisYear]);


  // PAGAMENTOS ACTIONS
  const togglePayment = (playerId: string, monthRef: string) => {
    setPayments(prev => {
      const existingIdx = prev.findIndex(p => p.playerId === playerId && p.month === monthRef);
      const todayIso = getTodayISO();
      
      if (existingIdx !== -1) {
        const updated = [...prev];
        const newStatus = updated[existingIdx].status === 'Pago' ? 'Pendente' : 'Pago';
        updated[existingIdx] = { 
          ...updated[existingIdx], 
          status: newStatus as 'Pago' | 'Pendente', 
          paymentDate: newStatus === 'Pago' ? todayIso : ''
        };
        return updated;
      } else {
        return [...prev, { playerId, month: monthRef, status: 'Pago', value: 0, paymentDate: todayIso }];
      }
    });
  };

  const handlePayAvulso = (player: Player) => {
      const val = parseFloat(avulsoValue) || 0;
      const todayIso = getTodayISO();
      
      setPayments(prev => [
          ...prev, 
          { 
              playerId: player.id, 
              month: currentPeriod, 
              status: 'Pago', 
              value: val, 
              paymentDate: todayIso 
          }
      ]);
      setAvulsoValue('');
  };

  const updatePaymentValue = (playerId: string, val: string, monthRef: string) => {
    const v = parseFloat(val) || 0;
    setPayments(prev => {
      const existingIdx = prev.findIndex(p => p.playerId === playerId && p.month === monthRef);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], value: v };
        return updated;
      } else {
        return [...prev, { playerId, month: monthRef, status: 'Pendente', value: v }];
      }
    });
  };

  const updatePaymentDate = (playerId: string, date: string, monthRef: string) => {
    setPayments(prev => {
      const existingIdx = prev.findIndex(p => p.playerId === playerId && p.month === monthRef);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], paymentDate: date };
        return updated;
      }
      return prev;
    });
  };

  // HANDLERS FOR TRANSACTIONS
  const handleSaveTransaction = () => {
    if (!newDesc || !newValue) return;
    const val = parseFloat(newValue) || 0;
    
    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { 
          ...e, description: newDesc.toUpperCase(), value: val, date: newDate, category: newCategory, type: newType 
      } : e));
    } else {
      setExpenses(prev => [{ 
          id: Date.now().toString(), description: newDesc.toUpperCase(), value: val, date: newDate, category: newCategory, type: newType 
      }, ...prev]);
    }
    resetForm();
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Deseja realmente excluir este lançamento?')) {
      setExpenses(prev => prev.filter(e => String(e.id) !== String(id)));
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setNewDesc('');
    setNewValue('');
    setNewDate(getTodayISO());
    setNewType('expense');
    setShowTransactionForm(false);
  };

  const openEdit = (ex: Expense) => {
      setEditingExpense(ex);
      setNewDesc(ex.description);
      setNewValue(ex.value.toString());
      setNewDate(ensureISO(ex.date));
      setNewCategory(ex.category);
      setNewType(ex.type || 'expense');
      setShowTransactionForm(true);
  };

  // SHARING
  const handleShareMonthlyReport = () => {
      const totalFees = paidPlayers.reduce((acc, curr) => acc + (curr.payment?.value || 0), 0);
      const totalExtra = filteredExtraRevenues.reduce((acc, curr) => acc + curr.value, 0);
      const totalReceived = totalFees + totalExtra;
      
      let text = `*FINANCEIRO 100 FIRULA*\n`;
      text += `📅 *Período:* ${currentPeriod}\n\n`;
      
      text += `✅ *RECEBIDOS (${paidPlayers.length + filteredExtraRevenues.length})*\n`;
      text += `💰 *Total Arrecadado:* R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      text += `━━━━━━━━━━━━━━━━━━\n`;
      
      if (paidPlayers.length > 0) {
        text += `\n*--- Mensalidades ---*\n`;
        paidPlayers.forEach(p => {
           const val = (p.payment?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
           text += `▪ ${p.player.name} (R$ ${val})\n`;
        });
      }
      
      if (filteredExtraRevenues.length > 0) {
          text += `\n*--- Outras Receitas ---*\n`;
          filteredExtraRevenues.forEach(ex => {
              const val = ex.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              text += `▪ ${ex.description} (R$ ${val})\n`;
          });
      }

      if (paidPlayers.length === 0 && filteredExtraRevenues.length === 0) {
        text += `_Nenhum pagamento registrado._\n`;
      }
      
      text += `\n⚠️ *PENDENTES (${unpaidPlayers.length})*\n`;
      text += `━━━━━━━━━━━━━━━━━━\n`;
      if (unpaidPlayers.length > 0) {
        unpaidPlayers.forEach(p => {
           text += `▪ ${p.player.name}\n`;
        });
      } else {
        text += `_Todos em dia!_\n`;
      }

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareAnalysis = () => {
    const fmtMoney = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    
    let text = `*RELATÓRIO FINANCEIRO - 100 FIRULA*\n\n`;
    text += `💰 *SALDO GERAL ACUMULADO*\n`;
    text += `R$ ${fmtMoney(globalBalance)}\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    text += `📅 *PERÍODO: ${analysisPeriod}*\n`;
    text += `🟢 Entradas: R$ ${fmtMoney(filteredRevenueAnalysis)}\n`;
    text += `🔴 Saídas: R$ ${fmtMoney(filteredExpensesAnalysis)}\n`;
    text += `🔹 *Saldo do Mês: R$ ${fmtMoney(filteredBalanceAnalysis)}*\n\n`;
    text += `📝 *DETALHAMENTO*\n`;
    if (detailedAnalysisList.length > 0) {
      detailedAnalysisList.forEach(item => {
         const sign = item.type === 'IN' ? '+' : '-';
         const dateStr = parseSafeDate(item.date).toLocaleDateString('pt-BR');
         text += `${sign} R$ ${fmtMoney(item.value)} | ${item.desc} (${dateStr})\n`;
      });
    } else {
      text += `_Sem movimentações neste período._\n`;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNotifyPlayer = (player: Player) => {
    if (!player.whatsapp) {
        alert('Este atleta não possui WhatsApp cadastrado.');
        return;
    }
    const cleanPhone = String(player.whatsapp).replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = `Eai, ${player.name}, tudo bem?
A mensalidade do 100 Firula referente a ${currentPeriod}, no valor de R$ 100,00, ainda está pendente.
Quando puder regularizar, por favor me avise.
Valeu`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleChargeAllPending = () => {
    if (unpaidPlayers.length === 0) {
        alert("Não há pendências para cobrar.");
        return;
    }
    let text = `⚠️ *AVISO DE MENSALIDADE - 100 FIRULA*\n`;
    text += `📅 *Referência:* ${currentPeriod}\n\n`;
    text += `Galera, os seguintes atletas estão pendentes:\n`;
    text += `------------------------------\n`;
    unpaidPlayers.forEach(({ player }) => {
        text += `❌ ${player.name}\n`;
    });
    text += `------------------------------\n`;
    text += `💰 Valor: R$ 100,00\n`;
    text += `Favor regularizar assim que possível!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="px-1 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight uppercase">Caixa <span className="text-[#F4BE02]">100Firula</span></h2>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Gestão Financeira</p>
        </div>
        <button onClick={() => setActiveTab('history')} className={`p-3 rounded-2xl border transition-all ${activeTab === 'history' ? 'bg-[#F4BE02] text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 border-white/10 text-white/40'}`}>
          <History size={20} />
        </button>
      </div>

      <div className="bg-[#111] p-1.5 rounded-2xl grid grid-cols-3 gap-1">
        <TabBtn active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<Banknote size={14}/>} label="Mensal." />
        <TabBtn active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={<Receipt size={14}/>} label="Entradas e Saídas" />
        <TabBtn active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<BarChart3 size={14}/>} label="Análise" />
      </div>

      <div className="bg-gradient-to-br from-[#111] to-black p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4BE02]/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Saldo Geral Acumulado</span>
          <h2 className={`text-5xl font-display font-bold ${globalBalance >= 0 ? 'text-white' : 'text-red-500'}`}>
            <span className="text-lg text-[#F4BE02] mr-1">R$</span>{Math.abs(globalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
          <div className="grid grid-cols-2 gap-8 w-full mt-6 pt-6 border-t border-white/5 text-center">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-green-500/60 mb-1">Receitas</p>
              <p className="font-bold text-lg text-white">R$ {totalRevenueAllTime.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-red-500/60 mb-1">Despesas</p>
              <p className="font-bold text-lg text-white">R$ {totalExpensesAllTime.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'payments' && (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Filter size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtro de Visualização</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <select 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availablePaymentMonths.map(m => <option key={m} value={m} className="text-black bg-white">{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableYears.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
            </div>
            <div className="flex justify-center items-center gap-2 pt-2">
                <span className="text-[8px] font-bold text-[#F4BE02]/60 uppercase tracking-[0.3em] flex-1 text-center">Período: {currentPeriod}</span>
                <button 
                  onClick={handleShareMonthlyReport}
                  className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95"
                >
                  <Share2 size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Compartilhar</span>
                </button>
            </div>
          </div>

          <div className="space-y-10">
            {/* AVULSOS - SEÇÃO OPCIONAL DE PAGAMENTO RÁPIDO */}
            <div className="space-y-2">
                {!showAvulsoModal ? (
                    <button 
                        onClick={() => setShowAvulsoModal(true)}
                        className="w-full py-4 bg-white/5 border border-dashed border-white/10 rounded-[24px] flex items-center justify-center gap-2 text-white/40 hover:text-[#F4BE02] hover:border-[#F4BE02] transition-all"
                    >
                        <UserPlus size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Registrar Avulso</span>
                    </button>
                ) : (
                    <div className="bg-[#111] p-5 rounded-[24px] border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                         <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-xs uppercase text-[#F4BE02]">Registrar Pagamento Avulso</h4>
                            <button onClick={() => { setShowAvulsoModal(false); setAvulsoValue(''); }}><X size={16} className="text-white/20 hover:text-white" /></button>
                         </div>
                         <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                             {pendingAvulsos.length > 0 ? pendingAvulsos.map(p => (
                                 <div key={p.id} className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                     <div className="flex flex-col">
                                         <span className="text-xs font-bold text-white uppercase">{p.name}</span>
                                         <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{p.position}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <input 
                                            type="number" 
                                            placeholder="R$" 
                                            className="w-16 bg-black border border-white/10 rounded-lg p-2 text-right text-xs font-bold text-[#F4BE02] outline-none"
                                            value={avulsoValue}
                                            onChange={e => setAvulsoValue(e.target.value)}
                                         />
                                         <button 
                                            onClick={() => handlePayAvulso(p)}
                                            className="bg-[#F4BE02] text-black p-2 rounded-lg font-bold text-[9px] uppercase tracking-wider"
                                         >
                                            OK
                                         </button>
                                     </div>
                                 </div>
                             )) : (
                                 <div className="text-center py-6">
                                     <p className="text-[9px] font-black uppercase text-white/20">Todos os avulsos já pagaram nesta referência.</p>
                                 </div>
                             )}
                         </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <UserMinus size={16} className="text-red-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Pendentes ({unpaidPlayers.length})</h3>
                    <span className="text-[7px] font-black uppercase tracking-wider text-red-500/40">Ref: {currentPeriod}</span>
                  </div>
                </div>
                <button 
                  onClick={handleChargeAllPending}
                  disabled={unpaidPlayers.length === 0}
                  className="bg-[#F4BE02] text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-yellow-500/10 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  <Megaphone size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Cobrar Geral</span>
                </button>
              </div>
              <div className="space-y-3">
                {unpaidPlayers.length > 0 ? unpaidPlayers.map(({ player, payment }) => (
                  <div key={player.id} className="bg-[#0A0A0A] rounded-[24px] border border-white/5 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border border-white/10 transition-colors ${payment?.value ? 'bg-[#F4BE02]/10 text-[#F4BE02]' : 'bg-white/5 text-white/20'}`}>
                          {player.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm uppercase text-white/90 truncate max-w-[120px]">{player.name}</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{player.position}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => togglePayment(player.id, payment?.month || currentPeriod)} 
                        className="px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-[#F4BE02] text-black shadow-lg shadow-yellow-500/10 active:scale-95 transition-all"
                      >
                        MARCAR PAGO
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <DollarSign size={14} className="text-white/20" />
                        <input 
                            type="number" 
                            placeholder="VALOR R$" 
                            value={payment?.value || ''} 
                            onChange={e => updatePaymentValue(player.id, e.target.value, payment?.month || currentPeriod)} 
                            className="bg-transparent flex-1 text-right font-display font-bold text-sm text-[#F4BE02] outline-none placeholder:text-white/5" 
                        />
                      </div>
                      <button
                        onClick={() => handleNotifyPlayer(player)}
                        className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-black transition-all"
                      >
                        <MessageCircle size={20} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center bg-white/[0.01] rounded-[32px] border border-dashed border-white/10">
                     <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3"><CheckCircle2 size={24} className="text-green-500" /></div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Sem pendências (Ref: {currentPeriod})</p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-white/5 mx-2"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <UserCheck size={16} className="text-green-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Recebidos ({paidPlayers.length})</h3>
                    <span className="text-[7px] font-black uppercase tracking-wider text-green-500/40">Data Pag: {currentPeriod}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {paidPlayers.length > 0 ? paidPlayers.map(({ player, payment }) => (
                  <div key={`${player.id}-${payment?.month}`} className="bg-green-500/[0.02] rounded-[24px] border border-green-500/20 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500 text-black flex items-center justify-center font-bold text-lg"><CheckCircle2 size={22} strokeWidth={3} /></div>
                        <div>
                          <h4 className="font-bold text-sm uppercase text-white/90 truncate max-w-[120px]">{player.name}</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest text-green-500/60">REF: {payment?.month}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => togglePayment(player.id, payment?.month || currentPeriod)} 
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all flex items-center justify-center active:scale-90"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-green-500/10 p-2.5 rounded-xl border border-green-500/10">
                        <DollarSign size={14} className="text-green-500/40" />
                        <input 
                            type="number" 
                            placeholder="VALOR" 
                            value={payment?.value || ''} 
                            onChange={e => updatePaymentValue(player.id, e.target.value, payment?.month || currentPeriod)} 
                            className="bg-transparent flex-1 font-display font-bold text-sm text-green-500 outline-none placeholder:text-green-500/20" 
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <Clock size={14} className="text-white/20" />
                        <input 
                            type="date" 
                            value={ensureISO(payment?.paymentDate)} 
                            onChange={e => updatePaymentDate(player.id, e.target.value, payment?.month || currentPeriod)} 
                            className="bg-transparent flex-1 text-[10px] font-bold text-white/80 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-10 text-[9px] font-black uppercase tracking-widest">Nenhuma mensalidade recebida em {currentPeriod}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'expenses' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {!showTransactionForm ? (
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setNewType('income'); setShowTransactionForm(true); }} className="bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-500 p-5 rounded-[24px] flex items-center justify-center gap-3 transition-all">
                  <ArrowUpCircle size={20}/> <span className="text-xs font-black uppercase tracking-widest">Nova Receita</span>
                </button>
                <button onClick={() => { setNewType('expense'); setShowTransactionForm(true); }} className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 p-5 rounded-[24px] flex items-center justify-center gap-3 transition-all">
                  <ArrowDownCircle size={20}/> <span className="text-xs font-black uppercase tracking-widest">Nova Despesa</span>
                </button>
            </div>
          ) : (
            <div className="bg-[#0A0A0A] p-5 rounded-[24px] border border-white/10 space-y-4">
               <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm uppercase">{editingExpense ? 'Editar Lançamento' : 'Novo Lançamento'}</h4>
                  <button onClick={resetForm} className="text-[9px] font-black text-white/20 uppercase tracking-widest">Fechar</button>
               </div>
               
               <div className="flex bg-[#111] p-1 rounded-xl">
                  <button onClick={() => setNewType('income')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newType === 'income' ? 'bg-green-500 text-black shadow-lg' : 'text-white/30 hover:bg-white/5'}`}>Entrada</button>
                  <button onClick={() => setNewType('expense')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newType === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-white/30 hover:bg-white/5'}`}>Saída</button>
               </div>

               <div className="space-y-4">
                  <input type="text" placeholder="DESCRIÇÃO" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold uppercase outline-none focus:border-[#F4BE02]/50" value={newDesc} onChange={e => setNewDesc(e.target.value.toUpperCase())} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="VALOR" className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold outline-none" value={newValue} onChange={e => setNewValue(e.target.value)} />
                    <input type="date" className="bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none" value={newDate} onChange={e => setNewDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setNewCategory('Fixa')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border ${newCategory === 'Fixa' ? 'bg-[#F4BE02] text-black border-[#F4BE02]' : 'bg-white/5 text-white/30 border-white/5'}`}>Fixa</button>
                    <button onClick={() => setNewCategory('Variável')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border ${newCategory === 'Variável' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/30 border-white/5'}`}>Variável</button>
                  </div>
                  <button 
                    onClick={handleSaveTransaction} 
                    className={`w-full text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${newType === 'income' ? 'bg-green-500 shadow-green-500/20' : 'bg-red-600 shadow-red-500/20'}`}
                  >
                    Confirmar {newType === 'income' ? 'Receita' : 'Saída'}
                  </button>
               </div>
            </div>
          )}

          {/* FILTRO DE PESQUISA NAS TRANSAÇÕES */}
          <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3 mt-4">
            <div className="flex items-center gap-2 px-1">
                <Search size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtro de Lançamentos</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <select 
                        value={transactionSearchMonth} 
                        onChange={e => setTransactionSearchMonth(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableTransactionMonths.map(m => <option key={m} value={m} className="text-black bg-white">{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={transactionSearchYear} 
                        onChange={e => setTransactionSearchYear(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableYears.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? filteredTransactions.map(ex => {
              const isIncome = ex.type === 'income';
              return (
                <div key={ex.id} className="bg-[#0A0A0A] p-4 rounded-[24px] border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isIncome ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                      {isIncome ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase truncate max-w-[140px] text-white/90">{ex.description}</h4>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{parseSafeDate(ex.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-display font-bold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'} R$ {ex.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEdit(ex)} 
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                      >
                        <Pencil size={12}/>
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(ex.id)} 
                        className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-all active:scale-90"
                      >
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center opacity-20 flex flex-col items-center">
                 <Receipt size={40} className="mb-2" />
                 <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma movimentação encontrada</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'analysis' && (
        <section className="space-y-6 animate-in fade-in slide-in-from-right-4">
          
          {/* FILTRO DE PESQUISA (ANÁLISE) */}
          <div className="bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Search size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filtrar Análise</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <select 
                        value={analysisMonth} 
                        onChange={e => setAnalysisMonth(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableAnalysisMonths.map(m => <option key={m} value={m} className="text-black bg-white">{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
                <div className="relative">
                    <select 
                        value={analysisYear} 
                        onChange={e => setAnalysisYear(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#F4BE02]/50 transition-all text-white"
                    >
                        {availableYears.map(y => <option key={y} value={y} className="text-black bg-white">{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
            </div>
            <div className="flex justify-center items-center gap-2 pt-2">
                <button 
                  onClick={handleShareAnalysis}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95"
                >
                  <Share2 size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Compartilhar Análise</span>
                </button>
            </div>
          </div>

          {/* RESULTADO FILTRADO */}
          <div className="bg-[#111] border border-white/10 rounded-[32px] p-6 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-display font-bold uppercase tracking-tight">Resultado: {analysisMonth}</h3>
                <div className={`p-2 rounded-xl ${filteredBalanceAnalysis >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}><PieChart size={20}/></div>
             </div>
             <div className="grid grid-cols-1 gap-2">
                <SummaryItem icon={<ArrowUpCircle size={18} className="text-green-500"/>} label="Receitas (Filtro)" value={filteredRevenueAnalysis} color="text-green-500" />
                <SummaryItem icon={<ArrowDownCircle size={18} className="text-red-500"/>} label="Saídas (Filtro)" value={filteredExpensesAnalysis} color="text-red-500" />
                <div className="h-[1px] bg-white/5 my-1"></div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Saldo (Filtro)</span>
                   <span className={`text-xl font-display font-bold ${filteredBalanceAnalysis >= 0 ? 'text-white' : 'text-red-500'}`}>R$ {Math.abs(filteredBalanceAnalysis).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>

          {/* LISTA DETALHADA DO PERÍODO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <FileText size={14} className="text-[#F4BE02]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Detalhamento do Período</span>
            </div>
            {detailedAnalysisList.length > 0 ? (
                <div className="grid gap-2">
                    {detailedAnalysisList.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="bg-[#0A0A0A] p-3 rounded-2xl border border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {item.type === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-white/90">{item.desc}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{parseSafeDate(item.date || '').toLocaleDateString('pt-BR')}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-white/20"></span>
                                        <span className="text-[7px] font-black uppercase tracking-wider text-white/20">{item.subLabel}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`font-display font-bold text-xs ${item.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
                                {item.type === 'IN' ? '+' : '-'} R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Sem lançamentos neste período</p>
                </div>
            )}
          </div>

          {/* RESULTADO GERAL (Mantido como secundário) */}
           <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-6 space-y-4 opacity-50 hover:opacity-100 transition-opacity">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-display font-bold uppercase tracking-tight text-white/60">Acumulado Geral</h3>
             </div>
             <div className="grid grid-cols-1 gap-2">
                <SummaryItem icon={<ArrowUpCircle size={18} className="text-white/20"/>} label="Total Recebido" value={totalRevenueAllTime} color="text-white/40" />
                <SummaryItem icon={<ArrowDownCircle size={18} className="text-white/20"/>} label="Total Gasto" value={totalExpensesAllTime} color="text-white/40" />
                <div className="h-[1px] bg-white/5 my-1"></div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Saldo Atual</span>
                   <span className={`text-xl font-display font-bold ${globalBalance >= 0 ? 'text-white/50' : 'text-red-500/50'}`}>R$ {Math.abs(globalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="px-1 flex justify-between items-center">
             <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Histórico de Movimentações</h3>
             <button onClick={() => setActiveTab('payments')} className="text-[#F4BE02] text-[10px] font-black uppercase tracking-widest">Voltar</button>
          </div>
          <div className="space-y-2">
            {[...payments.filter(p => p.status === 'Pago').map(p => ({ ...p, type: 'IN' as const, dateLabel: p.paymentDate || 'SEM DATA', desc: players.find(pl => pl.id === p.playerId)?.name || 'ATLETA' })), 
              ...expenses.map(e => ({ ...e, type: e.type === 'income' ? 'IN' as const : 'OUT' as const, dateLabel: e.date, desc: e.description }))
            ].sort((a, b) => b.dateLabel.localeCompare(a.dateLabel)).map((item, i) => (
              <div key={i} className="bg-[#0A0A0A] p-4 rounded-[20px] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'IN' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {item.type === 'IN' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  </div>
                  <div>
                    <h5 className="font-bold text-[10px] uppercase truncate max-w-[150px] text-white/90">{item.desc}</h5>
                    <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">{item.dateLabel}</span>
                  </div>
                </div>
                <span className={`font-display font-bold text-sm ${item.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>R$ {item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#F4BE02] text-black' : 'text-white/30 hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

const SummaryItem = ({ icon, label, value, color }: any) => (
  <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
    </div>
    <span className={`font-display font-bold text-lg ${color}`}>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
  </div>
);

export default Finance;
