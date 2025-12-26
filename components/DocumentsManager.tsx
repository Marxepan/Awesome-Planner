

import React, { useState, useRef } from 'react';
import type { TripDocument } from '../types';
import { FolderIcon, DocumentIcon, TrashIcon, UploadIcon, EyeIcon, DownloadIcon } from './icons';

interface DocumentsManagerProps {
    documents: TripDocument[];
    onAddDocument: (doc: TripDocument) => void;
    onDeleteDocument: (id: string) => void;
}

const DocumentsManager: React.FC<DocumentsManagerProps> = ({ documents, onAddDocument, onDeleteDocument }) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<TripDocument | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Group documents by category
    const categories = documents.reduce((acc, doc) => {
        if (!acc.includes(doc.category)) {
            acc.push(doc.category);
        }
        return acc;
    }, ['General'] as string[]);

    // Sort: General first, then alphabetical
    categories.sort((a, b) => {
        if (a === 'General') return -1;
        if (b === 'General') return 1;
        return a.localeCompare(b);
    });

    // FIX: Explicitly type `file` as `File`
    const processFile = (file: File, category: string = 'General') => {
        if (file.size > 500 * 1024) {
            alert(`File "${file.name}" is too heavy (${(file.size/1024).toFixed(0)}KB). Limit is 500KB. Compress your evidence.`);
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const newDoc: TripDocument = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64String,
                category: category,
                createdAt: Date.now()
            };
            onAddDocument(newDoc);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file, activeCategory || 'General');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        // FIX: Explicitly cast Array.from(e.dataTransfer.files) to File[] to ensure correct typing.
        const files = Array.from(e.dataTransfer.files) as File[];
        if (files.length > 0) {
            files.forEach(file => processFile(file, activeCategory || 'General'));
        }
    };

    const triggerUpload = (category: string) => {
        setActiveCategory(category);
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        const catName = newCategoryName.trim();
        setActiveCategory(catName);
        setTimeout(() => fileInputRef.current?.click(), 0);
        setNewCategoryName('');
    };
    
    const downloadFile = (doc: TripDocument) => {
        const link = document.createElement('a');
        link.href = doc.data;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isViewable = (mime: string) => mime.startsWith('image/') || mime === 'application/pdf';

    const handleFileInteraction = (doc: TripDocument) => {
        if (isViewable(doc.type)) {
            setPreviewDoc(doc);
        } else {
            downloadFile(doc);
        }
    };

    return (
        <>
            <div 
                className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg border transition-all duration-300 p-6 relative overflow-hidden ${isDragging ? 'border-indigo-500 ring-4 ring-indigo-500/20 dark:ring-indigo-500/40' : 'border-slate-200 dark:border-slate-800'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ minHeight: '400px' }} 
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-indigo-50/95 dark:bg-slate-800/95 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                        <div className="text-center animate-bounce">
                            <div className="mx-auto w-20 h-20 text-indigo-600 dark:text-indigo-400 mb-4">
                                <UploadIcon />
                            </div>
                            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Drop files to upload</p>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">Max 500KB per file</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                    <div className="text-slate-600 dark:text-slate-400"><FolderIcon /></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Secure Documents</h2>
                    {isUploading && <span className="ml-auto text-xs font-bold text-indigo-600 animate-pulse">ENCRYPTING...</span>}
                </div>

                <div className="mb-6">
                     <form onSubmit={handleCreateCategory} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)} 
                            placeholder="New Folder (e.g. 'Passports')..." 
                            className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button type="submit" className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors whitespace-nowrap">
                             + Folder
                        </button>
                     </form>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                    />
                </div>

                <div className="space-y-4">
                    {categories.map(category => {
                        const docsInCategory = documents.filter(d => d.category === category);
                        
                        return (
                            <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group bg-slate-50/50 dark:bg-slate-900">
                                <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <FolderIcon />
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{category}</span>
                                        <span className="text-xs font-mono text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">{docsInCategory.length}</span>
                                    </div>
                                    <button 
                                        onClick={() => triggerUpload(category)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all bg-white dark:bg-slate-700 px-2 py-1 rounded shadow-sm"
                                    >
                                        <UploadIcon /> Upload
                                    </button>
                                </div>
                                
                                {docsInCategory.length > 0 ? (
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
                                        {docsInCategory.map(doc => (
                                            <li key={doc.id} className="p-3 flex justify-between items-center hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden flex-grow cursor-pointer group/item" onClick={() => handleFileInteraction(doc)}>
                                                    {doc.type.startsWith('image/') ? (
                                                        <div className="w-10 h-10 rounded bg-slate-200 flex-shrink-0 overflow-hidden border border-slate-300 dark:border-slate-600">
                                                            <img src={doc.data} alt="preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                            <DocumentIcon />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                                                            {doc.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    {isViewable(doc.type) && (
                                                        <button 
                                                            onClick={() => setPreviewDoc(doc)}
                                                            title="View"
                                                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                                        >
                                                            <EyeIcon />
                                                        </button>
                                                    )}
                                                     <button 
                                                        onClick={() => downloadFile(doc)}
                                                        title="Download"
                                                        className="text-slate-400 hover:text-green-600 dark:hover:text-green-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                                     >
                                                        <DownloadIcon />
                                                     </button>
                                                    <button onClick={() => onDeleteDocument(doc.id)} title="Destroy" className="text-slate-400 hover:text-red-600 dark:hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div 
                                        onClick={() => triggerUpload(category)}
                                        className="p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <p className="text-sm text-slate-400 italic">Folder empty.</p>
                                        <p className="text-xs text-indigo-500 mt-1">Click to add files</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {documents.length === 0 && (
                        <div className="text-center py-12 px-4 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all cursor-pointer group" onClick={() => triggerUpload('General')}>
                            <div className="mx-auto w-12 h-12 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-transform mb-3">
                                <UploadIcon />
                            </div>
                            <p className="mb-1 font-bold text-slate-700 dark:text-slate-300">No Evidence Yet</p>
                            <p className="text-sm max-w-xs mx-auto">Drag & Drop files anywhere in this box, or click here to upload your secrets.</p>
                        </div>
                    )}
                </div>
            </div>

            {previewDoc && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewDoc(null)}>
                    <div className="relative max-w-5xl w-full h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-2 text-white">
                            <h3 className="text-lg font-mono truncate pr-4">{previewDoc.name}</h3>
                            <div className="flex items-center gap-4">
                                <button onClick={() => downloadFile(previewDoc)} className="hover:text-green-400"><DownloadIcon /></button>
                                <button className="hover:text-red-500 text-3xl font-bold leading-none" onClick={() => setPreviewDoc(null)}>&times;</button>
                            </div>
                        </div>
                        <div className="flex-grow bg-slate-900 rounded overflow-hidden flex items-center justify-center border border-slate-700">
                            {previewDoc.type.startsWith('image/') ? (
                                <img src={previewDoc.data} alt={previewDoc.name} className="max-w-full max-h-full object-contain" />
                            ) : previewDoc.type === 'application/pdf' ? (
                                <iframe src={previewDoc.data} className="w-full h-full" title={previewDoc.name}></iframe>
                            ) : (
                                <div className="text-center p-8">
                                    <p className="text-slate-400 mb-4">Cannot preview this file type.</p>
                                    <button onClick={() => downloadFile(previewDoc)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Download File</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DocumentsManager;