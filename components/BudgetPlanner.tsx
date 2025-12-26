
import React, { useState } from 'react';
import type { BudgetItem, Currency, ExchangeRates } from '../types';
import { TrashIcon } from './icons';

interface BudgetChartProps {
    items: BudgetItem[];
    currency: Currency;
    exchangeRates: ExchangeRates;
}

const BudgetChart: React.FC<BudgetChartProps> = ({ items, currency, exchangeRates }) => {
    const currencySymbols: { [key in Currency]: string } = { USD: '$', EUR: '€', PLN: 'zł', CHF: 'CHF' };
    const currentSymbol = currencySymbols[currency];
    const rate = exchangeRates[currency];

    // FIX: Explicitly type the accumulator and the return type of the reduce callback to ensure
    // TypeScript correctly infers `byCategory` as `Record<string, number>`, resolving
    // 'unknown' type errors in subsequent arithmetic operations.
    const byCategory = items.reduce((acc: Record<string, number>, item): Record<string, number> => {
        // Use nullish coalescing operator `??` for clarity, ensuring acc[item.category] is a number before addition.
        acc[item.category] = (acc[item.category] ?? 0) + item.amount;
        return acc;
    }, {}); // Initial value is an empty object, type inferred from the callback's return.

    // `total` will now be correctly inferred as `number` because `byCategory` values are `number`.
    const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0);

    if (total === 0) {
        return <div className="text-center text-slate-500 dark:text-slate-400 py-8">Add some expenses to see your budget breakdown.</div>;
    }

    const colors: { [key: string]: string } = {
        Transport: 'bg-blue-500', Lodging: 'bg-purple-500', Food: 'bg-orange-500',
        Activities: 'bg-green-500', Shopping: 'bg-pink-500', Other: 'bg-slate-500',
    };

    return (
        <div className="space-y-4">
            {Object.entries(byCategory).map(([category, amountInUSD]) => {
                // `total` and `amountInUSD` are now correctly typed as `number` due to `byCategory`'s type definition.
                const width = total > 0 ? (amountInUSD / total) * 100 : 0;
                const displayAmount = (amountInUSD * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return (
                    <div key={category} className="w-full">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{category}</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{`${currentSymbol}${displayAmount}`}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[category] || colors.Other}`} style={{ width: `${width}%`, transition: 'width 0.5s ease-in-out' }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

interface BudgetPlannerProps {
    items: BudgetItem[];
    onAddItem: (item: Omit<BudgetItem, 'id'>) => void;
    onDeleteItem: (id: number) => void;
    currency: Currency;
    onCurrencyChange: (currency: Currency) => void;
    exchangeRates: ExchangeRates;
    onRatesChange: (rates: ExchangeRates) => void;
}

const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ items, onAddItem, onDeleteItem, currency, onCurrencyChange, exchangeRates, onRatesChange }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<BudgetItem['category']>('Food');
    const [showRatesManager, setShowRatesManager] = useState(false);

    const currencySymbols: { [key in Currency]: string } = { USD: '$', EUR: '€', PLN: 'zł', CHF: 'CHF' };
    const currentSymbol = currencySymbols[currency];
    const rate = exchangeRates[currency];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount || isNaN(parseFloat(amount))) return;
        const amountInBase = parseFloat(amount) / rate;
        onAddItem({ name, amount: amountInBase, category });
        setName('');
        setAmount('');
        setCategory('Food');
    };

    const totalBudgetInUSD = items.reduce((sum, item) => sum + item.amount, 0);
    const totalBudgetDisplay = (totalBudgetInUSD * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const RateManagerModal = () => {
        const [internalRates, setInternalRates] = useState(exchangeRates);
        const handleRateChange = (curr: string, value: string) => {
            const newRates = { ...internalRates, [curr]: parseFloat(value) || 0 };
            setInternalRates(newRates);
        };
        const handleSave = () => {
            onRatesChange(internalRates);
            setShowRatesManager(false);
        };

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowRatesManager(false)}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in-up border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manage Exchange Rates</h3>
                        <button onClick={() => setShowRatesManager(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl">&times;</button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">All values are relative to 1 USD.</p>
                    <div className="space-y-3">
                        {Object.keys(currencySymbols).filter(c => c !== 'USD').map(curr => (
                            <div key={curr} className="flex items-center gap-4">
                                <label htmlFor={`rate-${curr}`} className="w-20 font-medium text-slate-700 dark:text-slate-300">{`1 USD to ${curr}`}</label>
                                <input id={`rate-${curr}`} type="number" step="0.0001" value={internalRates[curr]} onChange={(e) => handleRateChange(curr, e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        ))}
                    </div>
                    <button onClick={handleSave} className="mt-6 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">Save Rates</button>
                </div>
            </div>
        );
    };

    return (
        <div>
            {showRatesManager && <RateManagerModal />}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 h-full">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Trip Budget</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="currency-select" className="sr-only">Select Currency</label>
                        <select id="currency-select" value={currency} onChange={e => onCurrencyChange(e.target.value as Currency)} className="block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            {Object.keys(currencySymbols).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-8">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Spending Breakdown</h3>
                        <BudgetChart items={items} currency={currency} exchangeRates={exchangeRates} />
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Total Estimated Cost:</p>
                                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{`${currentSymbol}${totalBudgetDisplay}`}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowRatesManager(true)} className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Manage Exchange Rates</button>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Add New Expense</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Sushi dinner" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-slate-500 sm:text-sm">{currentSymbol}</span></div>
                                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100.00" required className="pl-7 mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                                <select value={category} onChange={e => setCategory(e.target.value as BudgetItem['category'])} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    {['Transport', 'Lodging', 'Food', 'Activities', 'Shopping', 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">Add Expense</button>
                        </form>
                        <ul className="mt-6 space-y-2 max-h-40 overflow-y-auto pr-2">
                            {items.map(item => (
                                <li key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{item.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{`${currentSymbol}${(item.amount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
                                        <button onClick={() => onDeleteItem(item.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 p-1"><TrashIcon /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetPlanner;