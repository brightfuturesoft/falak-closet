'use client';

import { useRouter } from 'next/navigation';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminOverviewPage() {
  const admin = useAdminDashboard();
  const router = useRouter();

  return (
    <OverviewTab
      orders={admin.ordersList}
      products={admin.productsList}
      onSelectOrderReceipt={(order) => admin.setSelectedOrderReceipt(order)}
      onUpdateOrderStatus={admin.handleUpdateOrderStatus}
      onNavigateToTab={(tab) => router.push(`/admin/${tab}`)}
    />
  );
}
