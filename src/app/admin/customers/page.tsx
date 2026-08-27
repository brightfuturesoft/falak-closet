'use client';

import { CustomersTab } from '@/components/admin/CustomersTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminCustomersPage() {
  const admin = useAdminDashboard();

  return <CustomersTab orders={admin.ordersList} products={admin.productsList} />;
}
