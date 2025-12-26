

export interface Activity {
    id: string;
    time: string;
    description: string;
    category: string;
    notes: string;
    link: string;
    photo: string | null;
}

export interface Day {
    day: number;
    date: string;
    theme: string;
    activities: Activity[];
}

export type Itinerary = Day[];

export interface BudgetItem {
    id: number;
    name: string;
    category: 'Transport' | 'Lodging' | 'Food' | 'Activities' | 'Shopping' | 'Other';
    amount: number; // Stored in base currency (USD)
}

export interface Contact {
    id: number;
    name: string;
    specialty: string;
    contactInfo: string;
    notes: string;
}

export interface TripDocument {
    id: string;
    name: string;
    type: string; // MIME type
    size: number;
    data: string; // Base64 string
    category: string; // Acts as folder name
    createdAt: number;
}

export interface ExchangeRates {
    USD: number;
    EUR: number;
    PLN: number;
    CHF: number;
    [key: string]: number;
}

export type Currency = 'USD' | 'EUR' | 'PLN' | 'CHF';

export interface FormState {
    destination: string;
    startDate: string;
    endDate: string;
    interests: string;
}

export interface TripData {
    itinerary: Itinerary;
    budgetItems: BudgetItem[];
    contacts: Contact[];
    documents: TripDocument[];
    currency: Currency;
    exchangeRates: ExchangeRates;
}

export interface SavedTrip {
    id: number;
    name: string;
    formState: FormState;
    data: TripData;
}
