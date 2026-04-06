'use client';

import { useState } from 'react';
import { X, Play } from 'lucide-react';

interface Props {
    selectedSpecimenIds: string[];
    onClose: () => void;
}

export default function BatchPcrModal({ selectedSpecimenIds, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [marker, setMarker] = useState('ITS');

    const handleRunBatch = async () => {
        setLoading(true);
        try {
            await fetch('/api/pcr/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedSpecimenIds, marker })
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            role="dialog" 
            aria-modal="true"
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in"
        >
            <div className="bg-[var(--md-sys-color-surface-container-high)] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-normal tracking-tight">Массовый ПЦР</h2>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] rounded-[1.5rem]">
                        <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-2">Выбрано объектов</p>
                        <p className="text-4xl font-bold">{selectedSpecimenIds.length}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium ml-4 text-[var(--md-sys-color-outline)]">Маркер для постановки</label>
                        <div className="flex flex-wrap gap-2">
                            {['ITS', 'SSU', 'LSU', 'MCM7'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMarker(m)}
                                    className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${marker === m ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-surface-container-highest)] hover:brightness-110'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleRunBatch}
                        disabled={loading}
                        className="w-full py-4 mt-4 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full font-bold flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Запуск...' : <><Play className="w-5 h-5 fill-current" /> Запустить очередь</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
