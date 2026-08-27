'use client';

import { ProductsTab } from '@/components/admin/ProductsTab';
import { useAdminDashboard } from '@/components/admin/AdminDashboardContext';

export default function AdminProductsPage() {
  const admin = useAdminDashboard();

  return (
    <ProductsTab
      products={admin.productsList}
      onOpenAddModal={() => {
        admin.setEditingProduct(null);
        admin.setIsAddProductOpen(true);
      }}
      onOpenEditModal={(product) => {
        admin.setEditingProduct(product);
        admin.setIsAddProductOpen(true);
      }}
      onDeleteProduct={admin.handleDeleteProduct}
      onUpdateStock={admin.handleUpdateStock}
      searchQuery={admin.globalSearchQuery}
    />
  );
}
