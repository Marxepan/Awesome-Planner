
import React, { useState } from 'react';
import type { Contact } from '../types';
import { UserGroupIcon, TrashIcon } from './icons';

interface ContactsManagerProps {
    contacts: Contact[];
    onAddContact: (contact: Omit<Contact, 'id'>) => void;
    onDeleteContact: (id: number) => void;
}

const ContactsManager: React.FC<ContactsManagerProps> = ({ contacts, onAddContact, onDeleteContact }) => {
    const [name, setName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !specialty || !contactInfo) return;
        onAddContact({ name, specialty, contactInfo, notes });
        setName('');
        setSpecialty('');
        setContactInfo('');
        setNotes('');
    };

    return (
        <div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="text-slate-600 dark:text-slate-400"><UserGroupIcon /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Useful Contacts</h2>
                </div>
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Emergency & Help</h3>
                        <ul className="space-y-3 max-h-72 overflow-y-auto pr-2">
                            {contacts.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 text-sm">No contacts yet. Add some important numbers!</p>
                            ) : (
                                contacts.map(c => (
                                    <li key={c.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                                                <p className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">{c.specialty}</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{c.contactInfo}</p>
                                                {c.notes && <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">{c.notes}</p>}
                                            </div>
                                            <button onClick={() => onDeleteContact(c.id)} className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 ml-2 p-1"><TrashIcon /></button>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Add New Contact</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name, e.g., 'Hotel Front Desk'" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Specialty, e.g., 'Local Info'" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="Contact Info, e.g., '+81...'" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, e.g., 'Open 24/7'" rows={2} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">Add Contact</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactsManager;
