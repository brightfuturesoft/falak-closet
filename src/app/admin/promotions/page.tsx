'use client';

import { PromotionsTab } from '@/components/admin/PromotionsTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminPromotionsPage() {
  const admin = useAdminDashboard();

  return (
    <PromotionsTab
      promotions={admin.promosList}
      onOpenAddPromoModal={() => {
        admin.setEditingPromo(null);
        admin.setIsAddPromoOpen(true);
      }}
      onOpenEditPromoModal={(promo) => {
        admin.setEditingPromo(promo);
        admin.setIsAddPromoOpen(true);
      }}
      onToggleStatus={admin.handleTogglePromoStatus}
      onDeletePromo={admin.handleDeletePromotion}
    />
  );
}
