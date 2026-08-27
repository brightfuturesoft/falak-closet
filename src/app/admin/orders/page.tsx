'use client';

import { OrdersTab } from '@/components/admin/OrdersTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminOrdersPage() {
  const admin = useAdminDashboard();

  return (
    <OrdersTab
      onSelectOrderReceipt={(order) => admin.setSelectedOrderReceipt(order)}
      onUpdateOrderStatus={admin.handleUpdateOrderStatus}
      onUpdatePaymentStatus={admin.handleUpdatePaymentStatus}
      onOpenCreateOrderModal={() => admin.setIsCreateOrderOpen(true)}
      searchQuery={admin.globalSearchQuery}
      ordersFeedCount={admin.ordersList.length}
      incomingOrderSignal={admin.incomingOrderSignal}
    />
  );
}
