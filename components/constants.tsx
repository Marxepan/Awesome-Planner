
import React from 'react';
import type { BudgetItem, Contact, Itinerary } from '../types';

export const categoryIcons: { [key: string]: React.ReactNode } = {
    "Food": <span>🍽️</span>,
    "Sightseeing": <span>🏞️</span>,
    "Culture": <span>🏛️</span>,
    "Activity": <span>🏃‍♂️</span>,
    "Shopping": <span>🛍️</span>,
    "Nightlife": <span>🌙</span>,
    "Travel": <span>✈️</span>,
    "Relaxation": <span>💆‍♀️</span>,
    "Custom": <span>✏️</span>,
    "Default": <span>📍</span>,
};

export const getCategoryIcon = (category: string) => {
    const found = Object.keys(categoryIcons).find(key => category.toLowerCase().includes(key.toLowerCase()));
    return found ? categoryIcons[found] : categoryIcons.Default;
};

export const polishedTemplate: { itinerary: Itinerary } = {
    itinerary: [
        { day: 1, date: "October 15, 2024", theme: "Arrival & Shinjuku Neon Dreams", activities: [ { id: "1-1", time: "Afternoon", description: "Arrive at Narita/Haneda, take express train to Shinjuku", category: "Travel", notes: "Buy a Suica card at the airport for easy transport.", link: "", photo: null }, { id: "1-2", time: "Evening", description: "Explore the neon-lit streets of Shinjuku, including Omoide Yokocho for dinner", category: "Food", notes: "", link: "", photo: null }, { id: "1-3", time: "Night", description: "Visit the Tokyo Metropolitan Government Building for free panoramic city views", category: "Sightseeing", notes: "North tower is open later.", link: "", photo: null } ] },
        { day: 2, date: "October 16, 2024", theme: "Tradition Meets Pop Culture", activities: [ { id: "2-1", time: "Morning", description: "Visit the serene Meiji Jingu Shrine", category: "Culture", notes: "", link: "", photo: null }, { id: "2-2", time: "Afternoon", description: "Walk through Harajuku's Takeshita Street for quirky fashion and snacks", category: "Shopping", notes: "Try the giant rainbow cotton candy!", link: "", photo: null }, { id: "2-3", time: "Evening", description: "Cross the famous Shibuya Scramble Crossing and see the Hachiko statue", category: "Sightseeing", notes: "Best view from the Starbucks on the 2nd floor of the Tsutaya building.", link: "", photo: null } ] },
        { day: 3, date: "October 17, 2024", theme: "Old Tokyo & Otaku Paradise", activities: [ { id: "3-1", time: "Morning", description: "Explore Asakusa, visiting Senso-ji Temple and Nakamise-dori street", category: "Culture", notes: "", link: "", photo: null }, { id: "3-2", time: "Afternoon", description: "Head to Akihabara for arcades, electronics, and anime culture", category: "Activity", notes: "Check out Super Potato for retro games.", link: "", photo: null }, { id: "3-3", time: "Evening", description: "Enjoy a relaxing dinner cruise on the Sumida River", category: "Relaxation", notes: "", link: "", photo: null } ] },
        { day: 4, date: "October 18, 2024", theme: "Art, Fish & Fancy Nights", activities: [ { id: "4-1", time: "Morning", description: "Early start at the Toyosu Fish Market for a fresh sushi breakfast", category: "Food", notes: "Tuna auction requires pre-registration.", link: "", photo: null }, { id: "4-2", time: "Afternoon", description: "Immerse yourself in digital art at teamLab Borderless or Planets", category: "Culture", notes: "Book tickets WELL in advance, they sell out.", link: "https://www.teamlab.art/", photo: null }, { id: "4-3", time: "Evening", description: "Explore the upscale Ginza district for shopping and a fancy dinner", category: "Shopping", notes: "", link: "", photo: null } ] },
        { day: 5, date: "October 19, 2024", theme: "Relaxation & Park Strolls", activities: [ { id: "5-1", time: "Morning", description: "Relax at a traditional Onsen (hot spring) spa", category: "Relaxation", notes: "", link: "", photo: null }, { id: "5-2", time: "Afternoon", description: "Stroll through Ueno Park, visit a museum like the Tokyo National Museum", category: "Culture", notes: "", link: "", photo: null }, { id: "5-3", time: "Evening", description: "Final dinner and drinks in the lively Golden Gai area of Shinjuku", category: "Nightlife", notes: "", link: "", photo: null } ] },
        { day: 6, date: "October 20, 2024", theme: "Last Souvenirs & Departure", activities: [ { id: "6-1", time: "Morning", description: "Last minute souvenir shopping at Tokyo Station's Character Street", category: "Shopping", notes: "", link: "", photo: null }, { id: "6-2", time: "Afternoon", description: "Enjoy a final, delicious ramen lunch", category: "Food", notes: "Try Ichiran or Ippudo near the station.", link: "", photo: null }, { id: "6-3", time: "Evening", description: "Head to the airport for your flight home", category: "Travel", notes: "", link: "", photo: null } ] }
    ]
};

export const defaultBudgetItems: BudgetItem[] = [
    { id: 1, name: "Round-trip Flights", category: "Transport", amount: 1200 },
    { id: 2, name: "6 Nights at Shinjuku Hotel", category: "Lodging", amount: 900 },
    { id: 3, name: "JR Rail Pass", category: "Transport", amount: 250 },
    { id: 4, name: "teamLab Borderless Tickets", category: "Activities", amount: 60 },
    { id: 5, name: "Daily Food & Drinks", category: "Food", amount: 450 },
    { id: 6, name: "Shopping & Souvenirs", category: "Shopping", amount: 300 },
    { id: 7, name: "Local Transport (Suica)", category: "Transport", amount: 50 },
];

export const defaultContacts: Contact[] = [
    { id: 1, name: "Emergency Services", specialty: "Police, Ambulance, Fire", contactInfo: "110 (Police), 119 (Ambulance/Fire)", notes: "For emergencies only." },
    { id: 2, name: "Your Embassy", specialty: "Consular Assistance", contactInfo: "Look up number before you go", notes: "For lost passports, legal issues, etc." },
    { id: 3, name: "Hotel Concierge", specialty: "Reservations & Recommendations", contactInfo: "Front Desk", notes: "Can help with restaurant bookings and local tips." },
];
