'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import DeliveryDashboard from '../../views/delivery/DeliveryDashboard';

export default function DeliveryRoute() {
  return (
    <ProtectedRoute roles={['deliveryGuy']}>
      <DeliveryDashboard />
    </ProtectedRoute>
  );
}
