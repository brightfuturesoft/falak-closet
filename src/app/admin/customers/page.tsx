'use client';

import React, { Suspense } from 'react';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

function CustomersContent() {
  const admin = useAdminDashboard();
  return <CustomersTab orders={admin.ordersList} products={admin.productsList} />;
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium text-xs">Loading customer directory...</div>}>
      <CustomersContent />
    </Suspense>
  );
}
