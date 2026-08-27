'use client';

import { SettingsTab } from '@/components/admin/SettingsTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminSettingsPage() {
  const admin = useAdminDashboard();

  return (
    <SettingsTab
      dbSource={admin.dbSource}
      onSeedDatabase={admin.handleSeedDatabase}
      isSeeding={admin.isSeeding}
      seedResult={admin.seedResult}
    />
  );
}
