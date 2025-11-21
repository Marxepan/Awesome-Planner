
import React, { useState, useEffect } from 'react';
import { polishedTemplate, defaultBudgetItems, defaultContacts } from './components/constants';
import type { Activity, BudgetItem, Contact, Currency, Day, ExchangeRates, Itinerary, SavedTrip } from './types';
import { GlobeIcon, CalendarIcon, SparklesIcon } from './components/icons';
import ThemeToggle from './components/ThemeToggle';
import ItinerarySection from './components/ItinerarySection';
import BudgetPlanner from './components/BudgetPlanner';
import ContactsManager from './components/ContactsManager';
import TripHistoryManager from './components/TripHistoryManager';

// Declare third-party libraries on the window object
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

function App() {
    const [destination, setDestination] = useState('Tokyo, Japan');
    const [startDate, setStartDate] = useState('2024-10-15');
    const [endDate, setEndDate] = useState('2024-10-20');
    const [interests, setInterests] = useState('Ramen, ancient temples, arcades, and street fashion.');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // State Management with localStorage
    const loadState = <T,>(key: string, defaultValue: T): T => {
        try {
            const saved = localStorage.getItem(key);
            if (saved === null) return defaultValue;
            return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to load state from localStorage for key:", key, e);
            return defaultValue;
        }
    };

    const [itinerary, setItinerary] = useState<Itinerary | null>(() => loadState('travelItinerary', null));
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => loadState('travelBudgetItems', []));
    const [contacts, setContacts] = useState<Contact[]>(() => loadState('travelContacts', []));
    const [currency, setCurrency] = useState<Currency>(() => loadState('travelDisplayCurrency', 'USD'));
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => loadState('travelExchangeRates', {
        USD: 1, EUR: 0.92, PLN: 4.05, CHF: 0.91
    }));
    const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => loadState('savedTravelTrips', []));
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');

    // Effect to handle theme changes
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);
    
    // Effect for sticky header
    useEffect(() => {
        const formEl = document.getElementById('generation-form');
        if (!formEl) return;
        
        const handleScroll = () => {
            const formBottom = formEl.getBoundingClientRect().bottom;
            setIsScrolled(formBottom < 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [itinerary]);
    
    // Effect to save state to localStorage whenever it changes
    useEffect(() => {
        try {
            if (itinerary) {
                localStorage.setItem('travelItinerary', JSON.stringify(itinerary));
                localStorage.setItem('travelBudgetItems', JSON.stringify(budgetItems));
                localStorage.setItem('travelContacts', JSON.stringify(contacts));
            } else {
                localStorage.removeItem('travelItinerary');
                localStorage.removeItem('travelBudgetItems');
                localStorage.removeItem('travelContacts');
            }
            localStorage.setItem('travelDisplayCurrency', JSON.stringify(currency));
            localStorage.setItem('travelExchangeRates', JSON.stringify(exchangeRates));
            localStorage.setItem('savedTravelTrips', JSON.stringify(savedTrips));
        } catch (e) {
            console.error("Failed to save state to localStorage", e);
        }
    }, [itinerary, budgetItems, contacts, currency, exchangeRates, savedTrips]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!destination || !startDate || !endDate) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setItinerary(null);
        setBudgetItems([]);
        setContacts([]);

        setTimeout(() => {
            try {
                const planWithIds = polishedTemplate.itinerary.map(day => ({
                    ...day,
                    activities: day.activities.map((activity, index) => ({
                        ...activity,
                        id: `activity-${day.day}-${index}-${new Date().getTime()}`
                    }))
                }));
                setItinerary(planWithIds);
                setBudgetItems(defaultBudgetItems);
                setContacts(defaultContacts);
            } catch (err) {
                console.error(err);
                setError("An unexpected error occurred while generating the plan from the template.");
            } finally {
                setIsLoading(false);
            }
        }, 1500);
    };
    
    const handleClearItinerary = () => {
        if (window.confirm("Are you sure you want to delete this entire itinerary?")) {
            setItinerary(null);
            setBudgetItems([]);
            setContacts([]);
        }
    };
    
    const handleSaveTrip = () => {
        if (!itinerary || itinerary.length === 0) {
            alert("There's no itinerary to save.");
            return;
        }
        const tripName = prompt("Enter a name for this trip:", `${destination} | ${startDate} to ${endDate}`);
        if (tripName) {
            const newTrip: SavedTrip = {
                id: Date.now(),
                name: tripName,
                formState: { destination, startDate, endDate, interests },
                data: { itinerary, budgetItems, contacts, currency, exchangeRates }
            };
            setSavedTrips(prev => [...prev, newTrip]);
            alert(`Trip '${tripName}' has been saved.`);
        }
    };

    const handleLoadTrip = (tripId: number) => {
        if (window.confirm("Are you sure? This will overwrite your current plan.")) {
            const tripToLoad = savedTrips.find(t => t.id === tripId);
            if (tripToLoad) {
                setItinerary(tripToLoad.data.itinerary);
                setBudgetItems(tripToLoad.data.budgetItems);
                setContacts(tripToLoad.data.contacts);
                setCurrency(tripToLoad.data.currency);
                setExchangeRates(tripToLoad.data.exchangeRates);
                setDestination(tripToLoad.formState.destination);
                setStartDate(tripToLoad.formState.startDate);
                setEndDate(tripToLoad.formState.endDate);
                setInterests(tripToLoad.formState.interests);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const handleDeleteTrip = (tripId: number) => {
        if (window.confirm("Seriously? Delete this trip forever? No take-backs.")) {
            setSavedTrips(prev => prev.filter(t => t.id !== tripId));
        }
    };
    
    const handleUpdateTripName = (tripId: number, newName: string) => {
        setSavedTrips(prev => prev.map(trip => 
            trip.id === tripId ? { ...trip, name: newName } : trip
        ));
    };

    const handleAddBudgetItem = (item: Omit<BudgetItem, 'id'>) => {
        const newItem = { ...item, id: Date.now() };
        setBudgetItems(prev => [...prev, newItem]);
    };
    
    const handleDeleteBudgetItem = (id: number) => {
        setBudgetItems(prev => prev.filter(item => item.id !== id));
    };

    const handleAddContact = (contact: Omit<Contact, 'id'>) => {
        setContacts(prev => [...prev, { ...contact, id: Date.now() }]);
    };

    const handleDeleteContact = (id: number) => {
        setContacts(prev => prev.filter(c => c.id !== id));
    };

    const StickyHeader = () => (
        <div className={`sticky top-0 z-40 py-3 transition-all duration-300 printable-hide ${isScrolled && itinerary ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg shadow-md border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
            <div className='max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8'>
                <div className='text-lg font-bold text-slate-800 dark:text-slate-200'>{itinerary ? 'Itinerary Actions' : ''}</div>
                {itinerary && (
                    <div className='flex items-center gap-2'>
                        <button onClick={handleSaveTrip} type='button' className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                            Save Trip
                        </button>
                        <button onClick={() => itinerary && generatePdf(itinerary)} disabled={isGeneratingPdf} type='button' className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg shadow-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-wait">
                            {isGeneratingPdf ? 'Generating...' : "Download PDF"}
                        </button>
                        <button onClick={handleClearItinerary} type='button' className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg shadow-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const generatePdf = async (currentItinerary: Itinerary) => {
        // This function needs access to the current itinerary state, so it's defined here.
        // It's a bit long, but keeping it inside App avoids prop-drilling setCollapsedDays
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            setError("PDF generation libraries could not be loaded. Please refresh the page and try again.");
            return;
        }
        const { jsPDF } = window.jspdf;

        const itineraryContent = document.getElementById('itinerary-content');
        if (!itineraryContent) {
            setError("Can't find the itinerary to print. Did you delete it?");
            return;
        }

        setIsGeneratingPdf(true);
        setError(null);
        
        // We'll control collapsing within the ItinerarySection component for PDF generation
        const event = new CustomEvent('generatePdfStart');
        document.dispatchEvent(event);

        await new Promise(resolve => setTimeout(resolve, 200)); 

        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const A4_WIDTH = 210;
            const A4_HEIGHT = 297;
            const MARGIN = 15;
            const CONTENT_WIDTH = A4_WIDTH - (MARGIN * 2);
            let yPos = MARGIN;

            const addCanvasToPdf = async (element: HTMLElement) => {
                const canvas = await window.html2canvas(element, { scale: 3, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 1024 });
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                const imgProps = pdf.getImageProperties(imgData);
                let imgHeight = (imgProps.height * CONTENT_WIDTH) / imgProps.width;

                if (yPos + imgHeight > A4_HEIGHT - MARGIN && yPos > MARGIN) {
                    pdf.addPage();
                    yPos = MARGIN;
                }
                
                pdf.addImage(imgData, 'JPEG', MARGIN, yPos, CONTENT_WIDTH, imgHeight, undefined, 'FAST');
                yPos += imgHeight + 2;
            };

            const titleElement = itineraryContent.querySelector<HTMLElement>('#itinerary-title');
            if (titleElement) {
                await addCanvasToPdf(titleElement);
                yPos += 8;
            }
            
            const dayElements = itineraryContent.querySelectorAll<HTMLElement>('.printable-day-container');
            for (const dayEl of dayElements) {
                if (yPos + 20 > A4_HEIGHT - MARGIN) { // Estimate if header fits
                    pdf.addPage();
                    yPos = MARGIN;
                }
                const header = dayEl.querySelector<HTMLElement>('.day-header');
                if (header) await addCanvasToPdf(header);
                
                const activities = dayEl.querySelectorAll<HTMLElement>('.activity-item');
                for (const activityEl of activities) {
                    await addCanvasToPdf(activityEl);
                }
            }

            const pageCount = pdf.internal.getNumberOfPages();
            if (pageCount > 0) {
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(10);
                    pdf.setTextColor(150);
                    pdf.text(`Page ${i} of ${pageCount}`, A4_WIDTH / 2, A4_HEIGHT - 10, { align: 'center' });
                }
            }

            pdf.save('awesome-itinerary.pdf');

        } catch (err) {
            console.error("Error generating PDF:", err);
            setError("Failed to generate the PDF. An unexpected error occurred.");
        } finally {
            const event = new CustomEvent('generatePdfEnd');
            document.dispatchEvent(event);
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="font-sans">
            <StickyHeader />
            <div className="p-4 sm:p-6 lg:p-8">
                <div className='absolute top-4 right-4 printable-hide z-50'>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
                <main className="max-w-7xl mx-auto">
                    <header className="text-center mb-10 printable-hide">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                            <span className="text-green-500">Awesome</span> <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Travel Planner</span>
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
                            Plan your perfect trip instantly. Start with our curated Tokyo template to get going.
                        </p>
                    </header>
                    <div id='generation-form' className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-10 printable-hide">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="destination" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><GlobeIcon /></div>
                                        <input type="text" id="destination" value={destination} onChange={e => setDestination(e.target.value)} required className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><CalendarIcon /></div>
                                            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><CalendarIcon /></div>
                                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="interests" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interests & Vibe</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-2"><SparklesIcon /></div>
                                    <textarea id="interests" value={interests} onChange={e => setInterests(e.target.value)} rows={3} placeholder="e.g., historical sites, hiking, cheap beer, techno clubs..." className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-indigo-400 disabled:to-purple-400 dark:disabled:from-indigo-800 dark:disabled:to-purple-800 disabled:cursor-not-allowed">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Generating Your Trip...
                                    </>
                                ) : 'Generate Itinerary'}
                            </button>
                        </form>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {itinerary && <ItinerarySection itinerary={itinerary} setItinerary={setItinerary} />}

                    {itinerary && (
                        <div className='mt-12 grid grid-cols-1 xl:grid-cols-2 gap-10 animate-fade-in printable-hide'>
                            <BudgetPlanner items={budgetItems} onAddItem={handleAddBudgetItem} onDeleteItem={handleDeleteBudgetItem} currency={currency} onCurrencyChange={setCurrency} exchangeRates={exchangeRates} onRatesChange={setExchangeRates} />
                            <ContactsManager contacts={contacts} onAddContact={handleAddContact} onDeleteContact={handleDeleteContact} />
                        </div>
                    )}

                    <TripHistoryManager trips={savedTrips} onLoad={handleLoadTrip} onDelete={handleDeleteTrip} onUpdateTripName={handleUpdateTripName} />
                </main>

                <footer className="text-center py-8 mt-8 text-slate-500 dark:text-slate-400 text-sm printable-hide">
                    <p>Happy travels!</p>
                </footer>
            </div>
        </div>
    );
}

export default App;
