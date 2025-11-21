import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Itinerary, Day, Activity } from '../types';
import { ChevronDownIcon, GripVerticalIcon, TrashIcon, EditIcon, LinkIcon } from './icons';
import { categoryIcons, getCategoryIcon } from './constants';

interface ItinerarySectionProps {
    itinerary: Itinerary;
    setItinerary: React.Dispatch<React.SetStateAction<Itinerary | null>>;
}

const ItinerarySection: React.FC<ItinerarySectionProps> = ({ itinerary, setItinerary }) => {
    const [collapsedDays, setCollapsedDays] = useState<{ [key: number]: boolean }>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

    useEffect(() => {
        const handlePdfStart = () => setCollapsedDays({});
        const handlePdfEnd = () => setCollapsedDays({}); // Or restore previous state if needed

        document.addEventListener('generatePdfStart', handlePdfStart);
        document.addEventListener('generatePdfEnd', handlePdfEnd);

        return () => {
            document.removeEventListener('generatePdfStart', handlePdfStart);
            document.removeEventListener('generatePdfEnd', handlePdfEnd);
        };
    }, []);

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination || !itinerary) return;
        const { source, destination } = result;
        const newItinerary = JSON.parse(JSON.stringify(itinerary));
        const sourceDayIndex = newItinerary.findIndex((d: Day) => `day-${d.day}` === source.droppableId);
        const destDayIndex = newItinerary.findIndex((d: Day) => `day-${d.day}` === destination.droppableId);
        if (sourceDayIndex === -1 || destDayIndex === -1) return;
        const sourceDay = newItinerary[sourceDayIndex];
        const destDay = newItinerary[destDayIndex];
        const [removedActivity] = sourceDay.activities.splice(source.index, 1);
        destDay.activities.splice(destination.index, 0, removedActivity);
        setItinerary(newItinerary);
    };

    const handleDeleteActivity = (dayIndex: number, activityId: string) => {
        if (!itinerary) return;
        const newItinerary = JSON.parse(JSON.stringify(itinerary));
        newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter(
            (act: Activity) => act.id !== activityId
        );
        setItinerary(newItinerary);
    };

    const handleAddActivity = (dayIndex: number) => {
        if (!itinerary) return;
        const newActivity: Activity = {
            id: `activity-new-${Date.now()}`, time: "Anytime", description: "New awesome activity",
            category: "Custom", notes: "", link: "", photo: null
        };
        const newItinerary = JSON.parse(JSON.stringify(itinerary));
        newItinerary[dayIndex].activities.push(newActivity);
        setItinerary(newItinerary);
        handleStartEditing(newActivity);
    };
    
    const handleAddDay = () => {
        if (!itinerary || itinerary.length === 0) return;
        const lastDay = itinerary[itinerary.length - 1];
        const lastDate = new Date(lastDay.date);
        lastDate.setDate(lastDate.getDate() + 1);
        const newDateString = lastDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const newDay: Day = { day: lastDay.day + 1, date: newDateString, theme: "Another Awesome Day", activities: [] };
        setItinerary([...itinerary, newDay]);
    };

    const handleStartEditing = (activity: Activity) => {
        setEditingId(activity.id);
        setEditingActivity({ ...activity });
    };

    const handleSaveEdit = (dayIndex: number) => {
        if (!itinerary || !editingActivity) return;
        const newItinerary = JSON.parse(JSON.stringify(itinerary));
        const day = newItinerary[dayIndex];
        const activityIndex = day.activities.findIndex((act: Activity) => act.id === editingActivity.id);
        if (activityIndex !== -1) {
            day.activities[activityIndex] = editingActivity;
        }
        setItinerary(newItinerary);
        setEditingId(null);
        setEditingActivity(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingActivity(null);
    };
    
    const handleEditorChange = (field: keyof Activity, value: string | null) => {
        if (editingActivity) {
            setEditingActivity(prev => prev ? ({ ...prev, [field]: value }) : null);
        }
    };
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleEditorChange('photo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const toggleDayCollapse = (day: number) => setCollapsedDays(prev => ({ ...prev, [day]: !prev[day] }));
    
    const toggleAllDays = () => {
        const isAnyCollapsed = Object.values(collapsedDays).some(Boolean);
        const newCollapsedState = itinerary.reduce((acc, day) => {
            acc[day.day] = !isAnyCollapsed;
            return acc;
        }, {} as {[key: number]: boolean});
        setCollapsedDays(newCollapsedState);
    };

    return (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <section id="itinerary-content" className="space-y-6 animate-fade-in">
                <div id="itinerary-title" className="flex justify-between items-center mb-2">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Your Itinerary</h2>
                    <div className="flex items-center gap-2 printable-hide">
                        <button onClick={toggleAllDays} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {Object.values(collapsedDays).some(Boolean) ? "Expand All" : "Collapse All"}
                        </button>
                    </div>
                </div>
                {itinerary.map((day, dayIndex) => (
                    <div key={day.day} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden printable-day-container">
                        <div className="day-header p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-pointer" onClick={() => toggleDayCollapse(day.day)}>
                            <div>
                                <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400">Day {day.day}: <span className="text-slate-800 dark:text-slate-100">{day.theme}</span></h3>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{day.date}</p>
                            </div>
                            <div className={`transition-transform duration-300 ${collapsedDays[day.day] ? '' : 'rotate-180'}`}><ChevronDownIcon /></div>
                        </div>
                        {!collapsedDays[day.day] && (
                            <>
                                <Droppable droppableId={`day-${day.day}`}>
                                    {(provided) => (
                                        <ul {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {day.activities.map((activity, index) => (
                                                <Draggable key={activity.id} draggableId={activity.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <li ref={provided.innerRef} {...provided.draggableProps} className={`activity-item transition-colors ${snapshot.isDragging ? 'bg-indigo-100 dark:bg-indigo-900/50 shadow-lg' : ''}`}>
                                                            {editingId === activity.id && editingActivity ? (
                                                                <div className="p-5 bg-indigo-50 dark:bg-slate-800/50">
                                                                    <div className="space-y-4">
                                                                        <input type="text" value={editingActivity.time} onChange={(e) => handleEditorChange('time', e.target.value)} autoFocus className="w-full font-bold text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-500 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                                                        <textarea value={editingActivity.description} onChange={(e) => handleEditorChange('description', e.target.value)} className="w-full text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border border-indigo-300 dark:border-indigo-500 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" rows={2} placeholder="Activity description" />
                                                                        <textarea value={editingActivity.notes} onChange={e => handleEditorChange('notes', e.target.value)} className="w-full text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border border-indigo-300 dark:border-indigo-500 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" rows={3} placeholder="Add your notes here..." />
                                                                        <input type="url" value={editingActivity.link} onChange={e => handleEditorChange('link', e.target.value)} className="w-full text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border border-indigo-300 dark:border-indigo-500 rounded-md p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://example.com" />
                                                                        <div>
                                                                            <label htmlFor={`photo-upload-${activity.id}`} className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload Photo</label>
                                                                            <input type="file" id={`photo-upload-${activity.id}`} accept="image/*" onChange={handlePhotoChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900" />
                                                                            {editingActivity.photo && <div className="mt-2 relative w-32"><img src={editingActivity.photo} alt="Preview" className="rounded-lg shadow-md w-full h-auto" /><button onClick={() => handleEditorChange('photo', null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-lg">X</button></div>}
                                                                        </div>
                                                                        <div className="mt-3">
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Change Category:</p>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {Object.keys(categoryIcons).filter(c => c !== 'Default').map(categoryKey => (<button key={categoryKey} type="button" onClick={() => handleEditorChange('category', categoryKey)} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${editingActivity.category === categoryKey ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-300 font-semibold' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>{categoryIcons[categoryKey]} {categoryKey}</button>))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-end gap-2 mt-4">
                                                                            <button onClick={handleCancelEdit} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-sm py-2 px-4 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                                                                            <button onClick={() => handleSaveEdit(dayIndex)} className="bg-indigo-600 text-white font-semibold text-sm py-2 px-4 rounded-md hover:bg-indigo-700">Save</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-5 flex items-start gap-4 hover:bg-indigo-50/50 dark:hover:bg-slate-800/30">
                                                                    <div {...provided.dragHandleProps} className="flex-shrink-0 pt-1 text-center cursor-grab printable-hide"><GripVerticalIcon /></div>
                                                                    <div className="flex-shrink-0 w-24 text-right">
                                                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{activity.time}</p>
                                                                        <div className="flex items-center justify-end gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">{getCategoryIcon(activity.category)} <span>{activity.category}</span></div>
                                                                    </div>
                                                                    <div className="flex-grow border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                                                                        <p className="text-slate-700 dark:text-slate-300">{activity.description}</p>
                                                                        {(activity.notes || activity.link || activity.photo) && (
                                                                            <div className="mt-3 space-y-3">
                                                                                {activity.photo && <img src={activity.photo} alt={activity.description} className="rounded-lg shadow-sm max-w-xs" />}
                                                                                {activity.notes && <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md whitespace-pre-wrap">{activity.notes}</p>}
                                                                                {activity.link && <a href={activity.link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline break-all"><LinkIcon />{activity.link}</a>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-shrink-0 space-x-1 printable-hide">
                                                                        <button onClick={() => handleStartEditing(activity)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-500 transition-colors p-2 rounded-full"><EditIcon /></button>
                                                                        <button onClick={() => handleDeleteActivity(dayIndex, activity.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-2 rounded-full"><TrashIcon /></button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                                <div className="p-4 bg-slate-50/75 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center printable-hide">
                                    <button onClick={() => handleAddActivity(dayIndex)} className="w-full text-indigo-600 dark:text-indigo-400 font-semibold text-sm py-2 px-4 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        + Add Activity
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                <div className="mt-8 text-center printable-hide">
                    <button onClick={handleAddDay} className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                        + Add New Day
                    </button>
                </div>
            </section>
        </DragDropContext>
    );
};

export default ItinerarySection;