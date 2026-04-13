'use client';

import { AdminPageContent } from '@/components/pages/AdminPageContent';
import { useAdminPage } from '@/hooks/useAdminPage';

export default function AdminPage() {
	const props = useAdminPage();
	return <AdminPageContent {...props} />;
}
