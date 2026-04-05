'use client';

import React from 'react';
import { X } from 'lucide-react';

interface AddSpecimenModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: any) => void;
}

export const AddSpecimenModal: React.FC<AddSpecimenModalProps> = ({ isOpen, onClose, onSave }) => {
	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		onSave(Object.fromEntries(formData.entries()));
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
			<div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" role="dialog">
				<div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
					<h2 className="text-xl font-bold text-slate-100">Новая проба</h2>
					<button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
						<X className="w-6 h-6" />
					</button>
				</div>
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div>
						<label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">ID пробы</label>
						<input name="id" required placeholder="Например: AP1932" className="w-full bg-slate-800 border-slate-700 rounded-2xl text-slate-100 focus:ring-teal-500/50 focus:border-teal-500" />
					</div>
					<div>
						<label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Таксон</label>
						<input name="taxon" data-testid="addspecimen-taxon" placeholder="Введите название таксона" className="w-full bg-slate-800 border-slate-700 rounded-2xl text-slate-100 focus:ring-teal-500/50 focus:border-teal-500" />
					</div>
					<div className="pt-4 flex gap-3">
						<button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl hover:bg-slate-700 transition-all font-semibold">Отмена</button>
						<button type="submit" className="flex-[2] px-6 py-3 bg-teal-600 text-white rounded-2xl hover:bg-teal-500 transition-all font-semibold shadow-lg shadow-teal-900/20">Сохранить</button>
					</div>
				</form>
			</div>
		</div>
	);
};
