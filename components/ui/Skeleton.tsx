'use client';

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'animate-pulse rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-surface-container-highest)]/50',
				className,
			)}
			{...props}
		/>
	);
}

export function SkeletonSpecimenCard() {
	return (
		<Skeleton className="p-4 flex flex-col gap-3 min-h-[140px] shadow-sm">
			<div className="flex justify-between items-start">
				<Skeleton className="h-6 w-24 bg-[var(--md-sys-color-outline-variant)]" />
				<Skeleton className="h-5 w-16 bg-[var(--md-sys-color-outline-variant)] rounded-full" />
			</div>
			<div className="space-y-2 mt-2">
				<Skeleton className="h-4 w-3/4 bg-[var(--md-sys-color-outline-variant)]" />
				<Skeleton className="h-4 w-1/2 bg-[var(--md-sys-color-outline-variant)]" />
			</div>
			<div className="mt-auto flex gap-2">
				<Skeleton className="h-8 w-14 rounded-xl bg-[var(--md-sys-color-outline-variant)]" />
				<Skeleton className="h-8 w-14 rounded-xl bg-[var(--md-sys-color-outline-variant)]" />
				<Skeleton className="h-8 w-14 rounded-xl bg-[var(--md-sys-color-outline-variant)]" />
			</div>
		</Skeleton>
	);
}
