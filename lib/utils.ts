import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatOperatorName(firstName?: string | null, lastName?: string | null): string {
	if (!lastName) return '';
	if (!firstName) return lastName;
	return `${lastName} ${firstName.charAt(0).toUpperCase()}.`;
}
