'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import type { Specimen } from '@/types';

interface AlphaFeedbackCellProps {
    specimen: Specimen;
    onUpdate: (id: string, data: Partial<Specimen>) => Promise<void>;
}

export const AlphaFeedbackCell: React.FC<AlphaFeedbackCellProps> = ({ specimen, onUpdate }) => {
    const [notes, setNotes] = useState(specimen.reviewNotes || '');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Парсим фотки из JSON строки в БД
    useEffect(() => {
        if (specimen.reviewPhotos) {
            try {
                setPhotos(JSON.parse(specimen.reviewPhotos));
            } catch {
                setPhotos([]);
            }
        } else {
            setPhotos([]);
        }
    }, [specimen.reviewPhotos]);

    // Сохранение заметок с дебаунсом
    useEffect(() => {
        const timer = setTimeout(() => {
            if (notes !== (specimen.reviewNotes || '')) {
                onUpdate(specimen.id, { reviewNotes: notes });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [notes, specimen.id, specimen.reviewNotes, onUpdate]);

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (!file) continue;

                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await fetch('/api/upload/feedback', {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await res.json();
                    
                    if (data.url) {
                        const newPhotos = [...photos, data.url];
                        setPhotos(newPhotos);
                        await onUpdate(specimen.id, { reviewPhotos: JSON.stringify(newPhotos) });
                    }
                } catch (error) {
                    console.error('Failed to upload pasted image:', error);
                } finally {
                    setIsUploading(false);
                }
            }
        }
    }, [photos, specimen.id, onUpdate]);

    const removePhoto = async (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        await onUpdate(specimen.id, { reviewPhotos: JSON.stringify(newPhotos) });
    };

    return (
        <div className="flex flex-col gap-2 min-w-[250px] p-1 h-full">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onPaste={handlePaste}
                placeholder="Что неудобно? (вставьте скриншот через Ctrl+V)"
                className="w-full min-h-[60px] p-2 text-xs bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-xl focus:ring-2 focus:ring-[var(--md-sys-color-primary)] outline-none transition-all resize-none"
            />
            
            <div className="flex flex-wrap gap-1.5 items-center min-h-[24px]">
                {photos.map((url, idx) => (
                    <div key={idx} className="relative group overflow-hidden rounded-lg border border-[var(--md-sys-color-outline-variant)] shadow-sm last:mr-0 mr-1.5">
                        <img 
                            src={url} 
                            alt="Фидбек" 
                            className="w-12 h-12 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(url, '_blank')}
                        />
                        <button 
                            onClick={() => removePhoto(idx)}
                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {isUploading && (
                    <div className="w-12 h-12 flex items-center justify-center bg-[var(--md-sys-color-surface-container)] rounded-lg animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--md-sys-color-primary)]" />
                    </div>
                )}
                {!isUploading && photos.length === 0 && (
                    <div className="flex items-center gap-1.5 text-[var(--md-sys-color-outline)] text-[10px] font-medium ml-1 italic opacity-60">
                        <ImageIcon className="w-3 h-3" />
                        <span>Скриншотов нет</span>
                    </div>
                )}
            </div>
        </div>
    );
};
