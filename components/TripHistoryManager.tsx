
import React, { useState } from 'react';
import type { SavedTrip } from '../types';
import { ArchiveIcon, EditIcon, TrashIcon } from './icons';

interface TripHistoryManagerProps {
    trips: SavedTrip[];
    onLoad: (tripId: number) => void;
    onDelete: (tripId: number) => void;
    onUpdateTripName: (tripId: number, newName: string) => void;
}

const TripHistoryManager: React.FC<TripHistoryManagerProps> = ({ trips, onLoad, onDelete, onUpdateTripName }) => {
    const [editingTripId, setEditingTripId] = useState<number | null>(null);
    const [editedName, setEditedName] = useState('');

    const handleStartEdit = (trip: SavedTrip) => {
        setEditingTripId(trip.id);
        setEditedName(trip.name);
    };

    const handleCancelEdit = () => {
        setEditingTripId(null);
        setEditedName('');
    };

    const handleSaveEdit = () => {
        if (editingTripId && editedName.trim()) {
            onUpdateTripName(editingTripId, editedName.trim());
        }
        handleCancelEdit();
    };

    if (trips.length === 0) {
        return null;
    }

    return (
        <section className="mt-12 animate-fade-in printable-hide">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="text-slate-600 dark:text-slate-400"><ArchiveIcon /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Trip Archives</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Load a previously saved trip or delete it forever.</p>
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                    {trips.map(trip => {
                        const isEditing = editingTripId === trip.id;
                        const tripDestination = trip.formState?.destination || 'Unknown Destination';
                        const tripStartDate = trip.formState?.startDate ? new Date(trip.formState.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Some time';
                        return (
                            <li key={trip.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex justify-between items-center gap-2">
                                {isEditing ? (
                                    <div className="flex-grow">
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={e => setEditedName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            autoFocus
                                            className="block w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-grow">
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{trip.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{`${tripDestination} - ${tripStartDate}`}</p>
                                    </div>
                                )}
                                {isEditing ? (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={handleSaveEdit} className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold text-sm py-2 px-3 rounded-md hover:bg-green-200 dark:hover:bg-green-900">Save</button>
                                        <button onClick={handleCancelEdit} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm py-2 px-3 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => onLoad(trip.id)} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-sm py-2 px-3 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900">Load</button>
                                        <button onClick={() => handleStartEdit(trip)} aria-label="Edit trip name" className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-500 p-2 rounded-md"><EditIcon /></button>
                                        <button onClick={() => onDelete(trip.id)} aria-label="Delete trip" className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 p-2 rounded-md"><TrashIcon /></button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
};

export default TripHistoryManager;
