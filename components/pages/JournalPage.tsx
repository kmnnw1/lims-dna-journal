'use client';

import { PresenceProvider } from '@/components/features/PresenceProvider';
import { JournalPageContent } from '@/components/pages/JournalPageContent';

export default function JournalPage() {
	return (
		<PresenceProvider>
			<JournalPageContent />
		</PresenceProvider>
	);
}
