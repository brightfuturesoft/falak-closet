'use client';

import { CategoriesTab } from '@/components/admin/CategoriesTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminCategoriesPage() {
  const admin = useAdminDashboard();

  return <CategoriesTab products={admin.productsList} onRefreshProducts={admin.fetchAllData} />;
}
