'use client';

import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminAnalyticsPage() {
  const admin = useAdminDashboard();

  return <AnalyticsTab orders={admin.ordersList} products={admin.productsList} />;
}
