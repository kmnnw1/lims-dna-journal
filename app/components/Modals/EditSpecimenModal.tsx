'use client';

import React from 'react';
import { X } from 'lucide-react';

interface EditSpecimenModalProps {
	specimen: any | null;
	onClose: () => void;
	onSave: (id: string, data: any) => void;
}

export const EditSpecimenModal: React.FC<EditSpecimenModalProps> = ({ specimen, onClose, onSave }) => {
	if (!specimen) return null;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		onSave(specimen.id, Object.fromEntries(formData.entries()));
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
			<div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col" role="dialog">
				<div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
					<h2 className="text-2xl font-black text-slate-100 tracking-tight">Редактировать · <span className="text-teal-400 font-mono">{specimen.id}</span></h2>
					<button onClick={onClose} className="p-3 hover:bg-rose-500/20 hover:text-rose-400 rounded-2xl text-slate-400 transition-all">
						<X className="w-6 h-6" />
					</button>
				</div>
				<form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<section className="space-y-6">
							<h3 className="text-teal-500 font-bold text-xs uppercase tracking-widest ml-1">Общая информация</h3>
							<div className="space-y-4 bg-slate-800/40 p-6 rounded-[2rem] border border-slate-700/50">
								<div>
									<label htmlFor="taxon-input" className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Таксон</label>
									<input id="taxon-input" name="taxon" defaultValue={specimen.taxon || ''} className="w-full bg-slate-900 border-slate-700 rounded-2xl text-slate-100" />
								</div>
								<div>
									<label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Заметки</label>
									<textarea name="notes" defaultValue={specimen.notes || ''} rows={3} className="w-full bg-slate-900 border-slate-700 rounded-2xl text-slate-100" />
								</div>
							</div>
						</section>
						<section className="flex flex-col justify-end">
							<div className="flex gap-4">
								<button type="button" onClick={onClose} className="flex-1 px-8 py-4 bg-slate-800 text-slate-300 rounded-[1.5rem] hover:bg-slate-700 transition-all font-bold text-sm">Отмена</button>
								<button type="submit" className="flex-[2] px-8 py-4 bg-teal-600 text-white rounded-[1.5rem] hover:bg-teal-500 transition-all font-bold text-sm shadow-xl shadow-teal-900/20">Сохранить</button>
							</div>
						</section>
					</div>
				</form>
			</div>
		</div>
	);
};
