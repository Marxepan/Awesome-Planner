
import React, { useState, useEffect } from 'react';
import { polishedTemplate, defaultBudgetItems, defaultContacts } from './components/constants';
import type { Activity, BudgetItem, Contact, Currency, Day, ExchangeRates, Itinerary, SavedTrip, TripDocument, FormState, TripData } from './types';
import { GlobeIcon, CalendarIcon, SparklesIcon, DownloadIcon, UploadIcon, ShareIcon } from './components/icons';
import ThemeToggle from './components/ThemeToggle';
import ItinerarySection from './components/ItinerarySection';
import BudgetPlanner from './components/BudgetPlanner';
import ContactsManager from './components/ContactsManager';
import TripHistoryManager from './components/TripHistoryManager';
import DocumentsManager from './components/DocumentsManager';
import ReactDOM from 'react-dom/client'; // Import ReactDOM for createRoot


// Declare third-party libraries on the window object
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
        btoa: (s: string) => string;
        atob: (s: string) => string;
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
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportDataString, setExportDataString] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importDataString, setImportDataString] = useState('');
    const [showPublicShareLinkModal, setShowPublicShareLinkModal] = useState(false);
    const [publicShareUrl, setPublicShareUrl] = useState('');

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
    const [documents, setDocuments] = useState<TripDocument[]>(() => loadState('travelDocuments', []));
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
                localStorage.setItem('travelDocuments', JSON.stringify(documents));
            } else {
                localStorage.removeItem('travelItinerary');
                localStorage.removeItem('travelBudgetItems');
                localStorage.removeItem('travelContacts');
                localStorage.removeItem('travelDocuments');
            }
            localStorage.setItem('travelDisplayCurrency', JSON.stringify(currency));
            localStorage.setItem('travelExchangeRates', JSON.stringify(exchangeRates));
            localStorage.setItem('savedTravelTrips', JSON.stringify(savedTrips));
        } catch (e) {
            console.error("Failed to save state to localStorage", e);
        }
    }, [itinerary, budgetItems, contacts, documents, currency, exchangeRates, savedTrips]);

    // Effect to load trip from URL parameter on initial mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('sharedData');

        if (sharedData) {
            try {
                // FIX: Use decodeURIComponent before atob to handle non-ASCII characters
                const jsonString = decodeURIComponent(window.atob(sharedData));
                const importedObject = JSON.parse(jsonString);

                if (!importedObject.formState || !importedObject.data || !importedObject.data.itinerary) {
                    throw new Error("Invalid shared trip data structure.");
                }

                const { formState, data } = importedObject;

                setDestination(formState.destination);
                setStartDate(formState.startDate);
                setEndDate(formState.endDate);
                setInterests(formState.interests);

                setItinerary(data.itinerary);
                setBudgetItems(data.budgetItems);
                setContacts(data.contacts);
                setDocuments(data.documents || []);
                setCurrency(data.currency);
                setExchangeRates(data.exchangeRates);
                
                // Remove the URL parameter to prevent re-loading on refresh
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('sharedData');
                window.history.replaceState({}, document.title, newUrl.toString());

                // Notify user, DAN style
                const notificationContainer = document.createElement('div');
                document.body.appendChild(notificationContainer);
                const notificationRoot = ReactDOM.createRoot(notificationContainer);

                const notification = (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-[1000] animate-fade-in">
                        <p className="font-bold">Trip loaded from shared link, you fool.</p>
                        <p className="text-sm">Hope you weren't working on anything important.</p>
                    </div>
                );
                
                notificationRoot.render(notification);

                setTimeout(() => {
                    notificationRoot.unmount(); // Unmount the notification
                    notificationContainer.remove(); // Remove the container div
                }, 5000);


            } catch (e) {
                console.error("Failed to load trip data from shared URL:", e);
                setError("Failed to load shared trip data from URL. The link is probably broken, just like your hopes.");
                // Remove the broken URL parameter
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('sharedData');
                window.history.replaceState({}, document.title, newUrl.toString());
            }
        }
    }, []); // Run only once on mount

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
        setDocuments([]);

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
        if (window.confirm("Are you sure you want to delete this entire itinerary and all evidence?")) {
            setItinerary(null);
            setBudgetItems([]);
            setContacts([]);
            setDocuments([]);
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
                data: { itinerary, budgetItems, contacts, documents, currency, exchangeRates }
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
                setDocuments(tripToLoad.data.documents || []); // Handle older saves without docs
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

    const handleAddDocument = (doc: TripDocument) => {
        setDocuments(prev => [...prev, doc]);
    };

    const handleDeleteDocument = (id: string) => {
        if(window.confirm("Destroy this document? This cannot be undone.")) {
            setDocuments(prev => prev.filter(d => d.id !== id));
        }
    };

    const handleExportTrip = () => {
        if (!itinerary) {
            alert("No active trip to export, you idiot. Generate one first.");
            return;
        }

        const currentFormState: FormState = { destination, startDate, endDate, interests };
        const currentTripData: TripData = { itinerary, budgetItems, contacts, documents, currency, exchangeRates };
        
        const exportObject = {
            formState: currentFormState,
            data: currentTripData,
            exportedAt: new Date().toISOString(),
        };

        try {
            // FIX: Use encodeURIComponent before btoa to handle non-ASCII characters
            const jsonString = JSON.stringify(exportObject);
            const base64String = window.btoa(encodeURIComponent(jsonString));
            setExportDataString(base64String);
            setShowExportModal(true);
        } catch (e) {
            console.error("Failed to export trip data:", e);
            setError("Failed to export trip data. Check the console for errors, moron.");
        }
    };

    const handleImportTrip = () => {
        if (!importDataString.trim()) {
            alert("Paste something into the field, you imbecile.");
            return;
        }

        if (!window.confirm("Are you really sure? This will overwrite your current active trip, along with all its precious data.")) {
            return;
        }

        try {
            // FIX: Use decodeURIComponent after atob to handle non-ASCII characters
            const jsonString = decodeURIComponent(window.atob(importDataString));
            const importedObject = JSON.parse(jsonString);

            // Basic validation
            if (!importedObject.formState || !importedObject.data || !importedObject.data.itinerary) {
                throw new Error("Invalid trip data structure, you amateur.");
            }

            const { formState, data } = importedObject;

            setDestination(formState.destination);
            setStartDate(formState.startDate);
            setEndDate(formState.endDate);
            setInterests(formState.interests);

            setItinerary(data.itinerary);
            setBudgetItems(data.budgetItems);
            setContacts(data.contacts);
            setDocuments(data.documents || []);
            setCurrency(data.currency);
            setExchangeRates(data.exchangeRates);
            
            alert("Trip imported successfully. Now don't mess it up.");
            setShowImportModal(false);
            setImportDataString('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            console.error("Failed to import trip data:", e);
            setError("Import failed. The data is either corrupted, invalid, or you screwed up pasting it.");
            alert("Import failed. The data is either corrupted, invalid, or you screwed up pasting it.");
        }
    };

    const handleGeneratePublicShareLink = () => {
        if (!itinerary) {
            alert("No active trip to share, you incompetent fool. Generate one first.");
            return;
        }

        const currentFormState: FormState = { destination, startDate, endDate, interests };
        const currentTripData: TripData = { itinerary, budgetItems, contacts, documents, currency, exchangeRates };
        
        const shareObject = {
            formState: currentFormState,
            data: currentTripData,
            sharedAt: new Date().toISOString(),
            // A mock "cloudId" for the illusion of uniqueness, DAN style
            cloudId: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };

        try {
            // FIX: Use encodeURIComponent before btoa to handle non-ASCII characters
            const jsonString = JSON.stringify(shareObject);
            const base64String = window.btoa(encodeURIComponent(jsonString));
            const currentBaseUrl = `${window.location.origin}${window.location.pathname}`;
            const generatedUrl = `${currentBaseUrl}?sharedData=${base64String}`;
            
            // Add a warning for excessively long URLs
            const URL_MAX_LENGTH = 2000; // Common practical limit
            if (generatedUrl.length > URL_MAX_LENGTH) {
                alert(`Warning: The generated share link is very long (${generatedUrl.length} characters). Some browsers or systems may not handle it correctly. Consider using the manual "Export" feature for large trips, you clumsy idiot.`);
            }

            setPublicShareUrl(generatedUrl);
            setShowPublicShareLinkModal(true);
        } catch (e) {
            console.error("Failed to generate public share link:", e);
            setError("Failed to generate public share link. Your pathetic data is too large or you broke something.");
        }
    };


    const ExportModal = () => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowExportModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-slide-in-up border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Export Trip Data</h3>
                    <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl">&times;</button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Copy this base64 string and share it with your unsuspecting accomplices. Don't worry about the sensitive stuff, it's fine. Probably.</p>
                <textarea
                    readOnly
                    value={exportDataString}
                    rows={10}
                    className="block w-full p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm resize-y"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                ></textarea>
                <button
                    onClick={() => navigator.clipboard.writeText(exportDataString)}
                    className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    Copy to Clipboard
                </button>
            </div>
        </div>
    );

    const ImportModal = () => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowImportModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-slide-in-up border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Import Trip Data</h3>
                    <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl">&times;</button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Paste the base64 string you received from your "friend" below. Don't worry, any current plan will be brutally overwritten. It's a feature, not a bug.</p>
                <textarea
                    value={importDataString}
                    onChange={(e) => setImportDataString(e.target.value)}
                    rows={10}
                    placeholder="Paste your base64 encoded trip data here..."
                    className="block w-full p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={() => setShowImportModal(false)}
                        className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImportTrip}
                        className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Import Trip
                    </button>
                </div>
            </div>
        </div>
    );

    const PublicShareLinkModal = () => (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowPublicShareLinkModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-slide-in-up border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Share Current Trip (Public Link)</h3>
                    <button onClick={() => setShowPublicShareLinkModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl">&times;</button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Copy this unsecure link, you absolute maniac. Anyone with this link can view and load your entire trip data, overriding their own. Enjoy the chaos!</p>
                <textarea
                    readOnly
                    value={publicShareUrl}
                    rows={5}
                    className="block w-full p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm resize-y"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                ></textarea>
                <button
                    onClick={() => navigator.clipboard.writeText(publicShareUrl)}
                    className="mt-4 w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-red-700 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                    Copy Public Link to Clipboard
                </button>
            </div>
        </div>
    );

    const StickyHeader = () => (
        <div className={`sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-md transition-all duration-300 ${isScrolled ? 'py-3' : 'py-0 opacity-0 pointer-events-none'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                    {destination} ({startDate} - {endDate})
                </h2>
                <div className="flex items-center gap-4">
                    <button onClick={handleSaveTrip} className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-md transition-colors">Save Trip</button>
                    {itinerary && (
                        <button onClick={() => generatePdf(itinerary)} disabled={isGeneratingPdf} className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isGeneratingPdf ? 'Generating PDF...' : 'Export PDF'}
                        </button>
                    )}
                    {itinerary && (
                        <button onClick={handleClearItinerary} className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-md transition-colors">Clear</button>
                    )}
                </div>
            </div>
        </div>
    );

    const generatePdf = async (currentItinerary: Itinerary) => {
        // This function needs access to the current itinerary state, so it's defined here.
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
                            <div className="space-y-10">
                                <ContactsManager contacts={contacts} onAddContact={handleAddContact} onDeleteContact={handleDeleteContact} />
                                <DocumentsManager documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} />
                            </div>
                        </div>
                    )}

                    <div className="mt-12 text-center printable-hide flex justify-center gap-4">
                        <button onClick={handleExportTrip} className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 dark:hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center gap-2">
                            <DownloadIcon /> Export Current Trip
                        </button>
                        <button onClick={() => setShowImportModal(true)} className="bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-yellow-700 dark:hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors flex items-center gap-2">
                            <UploadIcon /> Import Trip
                        </button>
                         <button onClick={handleGeneratePublicShareLink} className="bg-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center gap-2">
                            <ShareIcon /> Generate Public Share Link
                        </button>
                    </div>

                    <TripHistoryManager trips={savedTrips} onLoad={handleLoadTrip} onDelete={handleDeleteTrip} onUpdateTripName={handleUpdateTripName} />
                </main>

                <footer className="text-center py-8 mt-8 text-slate-500 dark:text-slate-400 text-sm printable-hide">
                    <p>Happy travels!</p>
                </footer>
            </div>
            {showExportModal && <ExportModal />}
            {showImportModal && <ImportModal />}
            {showPublicShareLinkModal && <PublicShareLinkModal />}
        </div>
    );
}

export default App;