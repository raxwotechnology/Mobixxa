'use client';
import ProtectedRoute from '../../components/ProtectedRoute';
import BarcodeGenerator from '../../views/barcode/BarcodeGenerator';

export default function BarcodeGeneratorRoute() {
  return (
    <ProtectedRoute roles={['admin', 'manager', 'cashier']}>
      <BarcodeGenerator />
    </ProtectedRoute>
  );
}
