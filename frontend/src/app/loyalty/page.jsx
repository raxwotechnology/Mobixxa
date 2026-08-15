'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import CustomerLoyalty from '../../views/customer/CustomerLoyalty';

export default function LoyaltyRoute() {
  return (
    <ProtectedRoute>
      <CustomerLoyalty />
    </ProtectedRoute>
  );
}
