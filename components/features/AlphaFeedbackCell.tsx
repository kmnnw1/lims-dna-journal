'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image as ImageIcon, Loader2, X, Camera } from 'lucide-react';
import type { Specimen } from '@/types';

interface AlphaFeedbackCellProps {
    specimen: Specimen;
    onUpdate: (id: string, data: Partial<Specimen>) => Promise<void>;
}

export const AlphaFeedbackCell: React.FC<AlphaFeedbackCellProps> = ({ specimen, onUpdate }) => {
    const [notes, setNotes] = useState(specimen.reviewNotes || '');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Сохранение заметок с дебаунсом + логирование в Excel
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (notes !== (specimen.reviewNotes || '')) {
                // В базу
                await onUpdate(specimen.id, { reviewNotes: notes });
                
                // В Excel (резерв)
                try {
                    await fetch('/api/upload/feedback', {
                        method: 'POST',
                        body: JSON.stringify({
                            specimenId: specimen.id,
                            notes,
                            photos
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (err) {
                    console.error('Failed to log feedback to Excel:', err);
                }
            }
        }, 1500); // Чуть увеличили задержку для Excel
        return () => clearTimeout(timer);
    }, [notes, specimen.id, specimen.reviewNotes, onUpdate, photos]);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('specimenId', specimen.id);

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
            console.error('Failed to upload image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) await uploadFile(file);
            }
        }
    }, [photos, specimen.id, onUpdate]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await uploadFile(file);
    };

    const removePhoto = async (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        await onUpdate(specimen.id, { reviewPhotos: JSON.stringify(newPhotos) });
    };

    return (
        <div className="flex flex-col gap-2 min-w-[280px] p-2 h-full bg-[var(--md-sys-color-surface-container-low)] rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
            <div className="relative group">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Что неудобно? Скриншот: Ctrl+V или кнопка ниже"
                    className="w-full min-h-[80px] p-3 text-sm bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] rounded-xl focus:ring-2 focus:ring-[var(--md-sys-color-primary)] outline-none transition-all resize-none shadow-inner"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center md:hidden"
                    title="Загрузить фото"
                >
                    <Camera className="w-5 h-5" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                    capture="environment"
                />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
                {/* Кнопка загрузки для десктопа (иконка) */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="hidden md:flex p-1.5 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg text-[var(--md-sys-color-primary)] transition-colors border border-dashed border-[var(--md-sys-color-outline-variant)]"
                    title="Добавить скриншот"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>

                {photos.map((url, idx) => (
                    <div key={idx} className="relative group overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)] shadow-md transition-all hover:shadow-lg">
                        <img 
                            src={url} 
                            alt="Фидбек" 
                            className="w-12 h-12 object-cover cursor-pointer hover:opacity-90"
                            onClick={() => window.open(url, '_blank')}
                        />
                        <button 
                            onClick={() => removePhoto(idx)}
                            className="absolute -top-1 -right-1 p-0.5 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {isUploading && (
                    <div className="w-12 h-12 flex items-center justify-center bg-[var(--md-sys-color-surface-container-highest)] rounded-xl animate-pulse border border-[var(--md-sys-color-primary)]">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--md-sys-color-primary)]" />
                    </div>
                )}
                {!isUploading && photos.length === 0 && (
                    <div className="flex items-center gap-1.5 text-[var(--md-sys-color-outline)] text-xs font-medium ml-1 opacity-60 italic">
                        <span>Прикрепите фото</span>
                    </div>
                )}
            </div>
        </div>
    );
};
