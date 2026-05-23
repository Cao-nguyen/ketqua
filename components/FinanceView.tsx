import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGrade } from '../context/GradeContext';
import { Transaction } from '../types';
import { Plus, Wallet, Landmark, PiggyBank, ArrowDownRight, ArrowUpRight, Search, Check, Trash2, Edit2, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

const FinanceView: React.FC = () => {
    const { transactions, addTransaction, updateTransaction, deleteTransaction } = useGrade();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [banks, setBanks] = useState<Bank[]>([]);

    useEffect(() => {
        fetch('https://api.vietqr.io/v2/banks')
            .then(res => res.json())
            .then(data => {
                if (data.code === '00') {
                    setBanks(data.data);
                }
            })
            .catch(err => console.error("Error fetching banks:", err));
    }, []);

    const totalCash = transactions.filter(t => t.wallet === 'CASH').reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
    const totalBank = transactions.filter(t => t.wallet === 'BANK').reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
    const totalFund = transactions.filter(t => t.wallet === 'FUND').reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);

    const totalMoney = totalCash + totalBank + totalFund;
    
    // Total income/expense (this month/all time - we'll do all time for now)
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const handleOpenAdd = () => {
        setEditingTransaction(null);
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (t: Transaction) => {
        setEditingTransaction(t);
        setIsAddModalOpen(true);
    };

    const viewAnimateState = {
        opacity: 1,
        scale: 1,
        y: 0
    };
      
    const emptyViewState = {
        opacity: 0,
        scale: 0.95,
        y: 10
    };

    return (
        <motion.div 
            initial={emptyViewState}
            animate={viewAnimateState}
            exit={emptyViewState}
            className="flex flex-col min-h-full pb-24"
        >
            <div className="px-6 pt-12 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tài Chính</h1>
                    <p className="text-gray-500 mt-2">Quản lý thu chi và nguồn tiền cá nhân.</p>
                </div>
                <button 
                  onClick={handleOpenAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-blue-100 flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline font-medium">Giao dịch mới</span>
                </button>
            </div>

            <div className="px-4 space-y-6">
                {/* Total Balance Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 shadow-lg shadow-blue-600/20 text-white">
                    <div className="mb-2 text-blue-100 font-medium">Tổng Tài Sản</div>
                    <div className="text-4xl font-bold tracking-tight">{formatVND(totalMoney)}</div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
                        <div>
                            <div className="flex items-center gap-1.5 text-blue-100 mb-1 text-sm">
                                <ArrowDownRight size={16} /> Thu nhập
                            </div>
                            <div className="text-xl font-semibold">{formatVND(totalIncome)}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 text-blue-100 mb-1 text-sm">
                                <ArrowUpRight size={16} /> Chi tiêu
                            </div>
                            <div className="text-xl font-semibold">{formatVND(totalExpense)}</div>
                        </div>
                    </div>
                </div>

                {/* Wallets */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/80">
                        <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-2xl mb-3">
                            <Wallet size={20} />
                        </div>
                        <div className="text-gray-500 text-xs sm:text-sm mb-1">Tiền mặt</div>
                        <div className="font-bold text-gray-900 truncate">{formatVND(totalCash)}</div>
                    </div>
                    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/80">
                        <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-2xl mb-3">
                            <Landmark size={20} />
                        </div>
                        <div className="text-gray-500 text-xs sm:text-sm mb-1">Tiền ngân</div>
                        <div className="font-bold text-gray-900 truncate">{formatVND(totalBank)}</div>
                    </div>
                    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/80">
                        <div className="p-3 bg-purple-50 text-purple-600 w-fit rounded-2xl mb-3">
                            <PiggyBank size={20} />
                        </div>
                        <div className="text-gray-500 text-xs sm:text-sm mb-1">Tiền quỹ</div>
                        <div className="font-bold text-gray-900 truncate">{formatVND(totalFund)}</div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-3xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100/80">
                    <h3 className="font-bold text-gray-800 text-lg mb-4">Giao dịch gần đây</h3>
                    
                    {transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Chưa có giao dịch. Bấm "Giao dịch mới" để thêm.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...transactions].sort((a,b) => b.timestamp - a.timestamp).map(t => (
                                <div key={t.id} className="flex items-center gap-4 group">
                                    <div className={`p-3 rounded-2xl flex-shrink-0 ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {t.type === 'INCOME' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-gray-900 truncate">{t.description}</p>
                                            <p className={`font-bold whitespace-nowrap ml-2 ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>{t.type === 'INCOME' ? '+' : '-'}{formatVND(t.amount)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{new Date(t.timestamp).toLocaleDateString('vi-VN')}</span>
                                            <span>•</span>
                                            {t.wallet === 'CASH' && <span className="flex items-center gap-1"><Wallet size={12}/> Tiền mặt</span>}
                                            {t.wallet === 'FUND' && <span className="flex items-center gap-1"><PiggyBank size={12}/> Tiền quỹ</span>}
                                            {t.wallet === 'BANK' && (
                                                <span className="flex items-center gap-1">
                                                    {t.bankLogo ? <img src={t.bankLogo} alt={t.bankName} className="w-4 h-4 rounded-full object-contain bg-white" /> : <Landmark size={12}/>}
                                                    {t.bankName || 'Ngân hàng'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenEdit(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => { if(window.confirm('Xóa giao dịch này?')) deleteTransaction(t.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <TransactionModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        initialData={editingTransaction}
                        banks={banks}
                        onSave={(txn) => {
                            if (editingTransaction) {
                                updateTransaction({ ...editingTransaction, ...txn, id: editingTransaction.id, timestamp: editingTransaction.timestamp });
                            } else {
                                addTransaction(txn);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (txn: Omit<Transaction, 'id' | 'timestamp'>) => void;
    initialData: Transaction | null;
    banks: Bank[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, initialData, banks }) => {
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initialData?.type || 'EXPENSE');
    const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
    const [wallet, setWallet] = useState<'CASH' | 'BANK' | 'FUND'>(initialData?.wallet || 'CASH');
    const [bankCode, setBankCode] = useState<string>(initialData?.bankCode || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [isBankMenuOpen, setIsBankMenuOpen] = useState(false);
    const [searchBank, setSearchBank] = useState('');

    const filteredBanks = banks.filter(b => 
        b.shortName.toLowerCase().includes(searchBank.toLowerCase()) || 
        b.name.toLowerCase().includes(searchBank.toLowerCase())
    );

    const selectedBank = banks.find(b => b.code === bankCode);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount.replace(/\D/g, ''));
        if (numAmount > 0 && description.trim()) {
            onSave({
                type,
                amount: numAmount,
                wallet,
                bankCode: wallet === 'BANK' ? bankCode : undefined,
                bankName: wallet === 'BANK' ? selectedBank?.shortName : undefined,
                bankLogo: wallet === 'BANK' ? selectedBank?.logo : undefined,
                description: description.trim()
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">
                        {initialData ? 'Sửa giao dịch' : 'Thêm giao dịch'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                        <Trash2 size={20} className="hidden" /> {/* Placeholder structure */}
                        ✕
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form id="txn-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Type Toggle */}
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full">
                            <button 
                                type="button"
                                onClick={() => setType('EXPENSE')}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-medium transition-all ${type === 'EXPENSE' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Chi tiêu
                            </button>
                            <button 
                                type="button"
                                onClick={() => setType('INCOME')}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-medium transition-all ${type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Thu nhập
                            </button>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Số tiền (đ)</label>
                            <input 
                                type="number" 
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full text-2xl font-bold bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="0"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả giao dịch</label>
                            <input 
                                type="text" 
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                                placeholder="VD: Mua cơm trưa..."
                            />
                        </div>

                        {/* Wallet Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nguồn tiền</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWallet('CASH')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border ${wallet === 'CASH' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Wallet size={20} className="mb-2" />
                                    <span className="text-xs">Tiền mặt</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWallet('BANK')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border ${wallet === 'BANK' ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Landmark size={20} className="mb-2" />
                                    <span className="text-xs">Tiền ngân</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWallet('FUND')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border ${wallet === 'FUND' ? 'bg-purple-50 border-purple-200 text-purple-700 font-semibold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <PiggyBank size={20} className="mb-2" />
                                    <span className="text-xs">Tiền quỹ</span>
                                </button>
                            </div>
                        </div>

                        {/* Bank Selection */}
                        {wallet === 'BANK' && (
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngân hàng</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsBankMenuOpen(!isBankMenuOpen)}
                                    className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        {selectedBank ? (
                                            <>
                                                <img src={selectedBank.logo} alt={selectedBank.shortName} className="h-6 object-contain" />
                                                <span className="font-medium text-gray-900">{selectedBank.shortName}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-400">Chọn ngân hàng...</span>
                                        )}
                                    </div>
                                    <span className="text-gray-400 text-xs">▼</span>
                                </button>

                                {isBankMenuOpen && (
                                    <div className="absolute z-10 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 max-h-64 overflow-hidden flex flex-col">
                                        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                                            <Search size={16} className="text-gray-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Tìm kiếm..."
                                                value={searchBank}
                                                onChange={(e) => setSearchBank(e.target.value)}
                                                className="w-full bg-transparent outline-none text-sm"
                                            />
                                        </div>
                                        <div className="overflow-y-auto p-2">
                                            {filteredBanks.map(bank => (
                                                <button
                                                    key={bank.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setBankCode(bank.code);
                                                        setIsBankMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <img src={bank.logo} alt={bank.shortName} className="h-6 w-10 object-contain" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 text-sm truncate">{bank.shortName}</div>
                                                    </div>
                                                    {bankCode === bank.code && <Check size={16} className="text-blue-600" />}
                                                </button>
                                            ))}
                                            {filteredBanks.length === 0 && (
                                                <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy ngân hàng</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </form>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        type="submit" 
                        form="txn-form"
                        className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        {initialData ? 'Cập nhật' : 'Lưu giao dịch'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default FinanceView;
