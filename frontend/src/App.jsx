import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import StoreList from './pages/StoreList';
import StoreDetail from './pages/StoreDetail';
import Deals from './pages/Deals';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrdersPage from './pages/OrdersPage';
import Profile from './pages/customer/Profile';
import LegalPrivacy from './pages/LegalPrivacy';
import HelpCenter from './pages/HelpCenter';
import ShippingInfo from './pages/ShippingInfo';
import ReturnsPolicy from './pages/ReturnsPolicy';
import WarrantyCheck from './pages/WarrantyCheck';

import CustomerLoyalty from './pages/customer/CustomerLoyalty';
import StoreOverview from './pages/storeOwner/StoreOverview';
import StoreProducts from './pages/storeOwner/StoreProducts';
import StoreOrders from './pages/storeOwner/StoreOrders';
import ManagerEmployees from './pages/storeOwner/ManagerEmployees';
import ManagerAttendance from './pages/storeOwner/ManagerAttendance';
import ManagerLeaves from './pages/storeOwner/ManagerLeaves';
import ManagerReturns from './pages/storeOwner/ManagerReturns';
import ManagerTargets from './pages/storeOwner/ManagerTargets';
import ManagerPerformance from './pages/storeOwner/ManagerPerformance';
import ManagerInventory from './pages/storeOwner/ManagerInventory';
import ManagerSupplierPayments from './pages/storeOwner/ManagerSupplierPayments';
import ManagerRepairs from './pages/storeOwner/ManagerRepairs';
import { managerNavGroups } from './pages/storeOwner/managerNavItems';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStores from './pages/admin/AdminStores';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminProfitReports from './pages/admin/AdminProfitReports';
import AdminInventory from './pages/admin/AdminInventory';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPayroll from './pages/admin/AdminPayroll';
import AdminSalaryAdvances from './pages/admin/AdminSalaryAdvances';
import AdminLetters from './pages/admin/AdminLetters';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminReturns from './pages/admin/AdminReturns';
import AdminBarcodes from './pages/admin/AdminBarcodes';
import AdminSupplierPayments from './pages/admin/AdminSupplierPayments';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminPhones from './pages/admin/AdminPhones';
import AdminGRN from './pages/admin/AdminGRN';
import AdminSalesTracking from './pages/admin/AdminSalesTracking';
import AdminWarranty from './pages/admin/AdminWarranty';
import AdminTradeIn from './pages/admin/AdminTradeIn';
import UserSettings from './pages/UserSettings';


import AdminPredictions from './pages/admin/AdminPredictions';
import AdminOvertime from './pages/admin/AdminOvertime';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminHP from './pages/admin/AdminHP';
import AdminCustomerHistory from './pages/admin/AdminCustomerHistory';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminLeaves from './pages/admin/AdminLeaves';
import AdminReloads from './pages/admin/AdminReloads';
import AdminRepairs from './pages/admin/AdminRepairs';


import AdminTargets from "./pages/admin/AdminTargets";
import AdminCheques from "./pages/admin/AdminCheques";
import BarcodeGenerator from "./pages/barcode/BarcodeGenerator";

import CashierLogin from './pages/cashier/CashierLogin';
import POSScreen from './pages/cashier/POSScreen';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeLeaves from './pages/employee/EmployeeLeaves';
import EmployeeReturns from './pages/employee/EmployeeReturns';
import EmployeeSalary from './pages/employee/EmployeeSalary';
import EmployeeOvertime from './pages/employee/EmployeeOvertime';
import CashierStock from './pages/employee/CashierStock';
import EmployeeRepairs from './pages/employee/EmployeeRepairs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSettingsStore from './store/settingsStore';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const settings = useSettingsStore((s) => s.settings);
  const { user } = useAuthStore();
  const { accent, customColor, fontFamily, mode, applyThemeToDocument } = useThemeStore();

  useEffect(() => {
    fetchSettings();
    if (applyThemeToDocument) applyThemeToDocument();
  }, [fetchSettings, accent, customColor, fontFamily, mode, applyThemeToDocument]);

  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = '/favicon.png';
  }, []);

  const path = location.pathname;
  const isStaff = user && ['admin', 'manager', 'cashier', 'deliveryGuy', 'stockEmployee'].includes(user.role);

  // Pages that should have NO shared Navbar/Footer
  const isNoLayout =
    path === '/pos' ||
    path === '/cashier-login' ||
    path.startsWith('/admin') ||
    path.startsWith('/manager') ||
    path.startsWith('/employee') ||
    path.startsWith('/delivery') ||
    path.startsWith('/barcode') ||
    (isStaff && (path === '/settings' || path === '/profile'));

  if (isNoLayout) return <>{children}</>;
  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">{children}</main>
      <Footer />
    </div>
  );
};


const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  useEffect(() => {
    useThemeStore.getState().applyThemeToDocument();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AppLayout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/stores" element={<StoreList />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/categories" element={<Shop />} />
          <Route path="/privacy-policy" element={<LegalPrivacy />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/shipping-info" element={<ShippingInfo />} />
          <Route path="/returns-policy" element={<ReturnsPolicy />} />
          <Route path="/warranty-check" element={<WarrantyCheck />} />

          {/* Customer */}
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
          <Route path="/loyalty" element={<ProtectedRoute><CustomerLoyalty /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/manager" element={<ProtectedRoute roles={['manager']}><StoreOverview /></ProtectedRoute>} />
          <Route path="/manager/products" element={<ProtectedRoute roles={['manager']}><StoreProducts /></ProtectedRoute>} />
          <Route path="/manager/orders" element={<ProtectedRoute roles={['manager']}><AdminOrders navItems={managerNavGroups} /></ProtectedRoute>} />
          <Route path="/manager/returns" element={<ProtectedRoute roles={['manager']}><ManagerReturns /></ProtectedRoute>} />
          <Route path="/manager/employees" element={<ProtectedRoute roles={['manager']}><AdminEmployees navItems={managerNavGroups} /></ProtectedRoute>} />
          <Route path="/manager/attendance" element={<ProtectedRoute roles={['manager']}><AdminAttendance navItems={managerNavGroups} /></ProtectedRoute>} />
          <Route path="/manager/leaves" element={<ProtectedRoute roles={['manager']}><AdminLeaves navItems={managerNavGroups} /></ProtectedRoute>} />
          <Route path="/manager/targets" element={<ProtectedRoute roles={['manager']}><ManagerTargets /></ProtectedRoute>} />
          <Route path="/manager/performance" element={<ProtectedRoute roles={['manager']}><ManagerPerformance /></ProtectedRoute>} />
          <Route path="/manager/inventory" element={<ProtectedRoute roles={['manager']}><Navigate to="/manager/products" replace /></ProtectedRoute>} />
          <Route path="/manager/supplier-payments" element={<ProtectedRoute roles={['manager']}><ManagerSupplierPayments /></ProtectedRoute>} />
          <Route path="/manager/repairs" element={<ProtectedRoute roles={['manager']}><ManagerRepairs navItems={managerNavGroups} /></ProtectedRoute>} />
          <Route path="/manager/warranty" element={<ProtectedRoute roles={['manager']}><AdminWarranty /></ProtectedRoute>} />
          <Route path="/manager/hp" element={<ProtectedRoute roles={['manager']}><AdminHP navItems={managerNavGroups} /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/users" element={<Navigate to="/admin/employees" replace />} />
          <Route path="/admin/employees" element={<ProtectedRoute roles={['admin']} permission="employees"><AdminEmployees /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute roles={['admin']} permission="employees"><AdminAttendance /></ProtectedRoute>} />
          <Route path="/admin/leaves" element={<ProtectedRoute roles={['admin']} permission="employees"><AdminLeaves /></ProtectedRoute>} />
          <Route path="/admin/payroll" element={<ProtectedRoute roles={['admin']} permission="employees"><AdminPayroll /></ProtectedRoute>} />
          <Route path="/admin/salary-advances" element={<ProtectedRoute roles={['admin']} permission="employees"><AdminSalaryAdvances /></ProtectedRoute>} />
          <Route path="/admin/letters" element={<ProtectedRoute roles={['admin']} permission="employees"><AdminLetters /></ProtectedRoute>} />
          <Route path="/admin/stores" element={<ProtectedRoute roles={['admin']} permission="settings"><AdminStores /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']} permission="products"><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute roles={['admin']} permission="products"><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/warranty" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminWarranty /></ProtectedRoute>} />
          <Route path="/admin/returns" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminReturns /></ProtectedRoute>} />
          <Route path="/admin/trade-in" element={<ProtectedRoute roles={['admin', 'manager']}><AdminTradeIn /></ProtectedRoute>} />
          <Route path="/admin/vouchers" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminVouchers /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']} permission="reports"><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']} permission="settings"><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/expenses" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminExpenses /></ProtectedRoute>} />
          <Route path="/admin/financials" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminFinancials /></ProtectedRoute>} />
          <Route path="/admin/profit-reports" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminProfitReports /></ProtectedRoute>} />
          <Route path="/admin/promotions" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminPromotions /></ProtectedRoute>} />
          <Route path="/admin/barcodes" element={<ProtectedRoute roles={['admin']} permission="products"><AdminBarcodes /></ProtectedRoute>} />
          <Route path="/admin/supplier-payments" element={<ProtectedRoute roles={['admin']} permission="suppliers"><AdminSupplierPayments /></ProtectedRoute>} />
          <Route path="/admin/suppliers" element={<ProtectedRoute roles={['admin']} permission="suppliers"><AdminSuppliers /></ProtectedRoute>} />
          <Route path="/admin/phones" element={<ProtectedRoute roles={['admin']} permission="products"><AdminPhones /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute roles={['admin']} permission="products"><AdminInventory /></ProtectedRoute>} />
          <Route path="/admin/grn" element={<ProtectedRoute roles={['admin']} permission="suppliers"><AdminGRN /></ProtectedRoute>} />
          <Route path="/admin/sales-tracking" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminSalesTracking /></ProtectedRoute>} />


          <Route path="/admin/predictions" element={<ProtectedRoute roles={['admin']} permission="reports"><AdminPredictions /></ProtectedRoute>} />
          <Route path="/admin/payroll" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminPayroll /></ProtectedRoute>} />
          <Route path="/admin/accounts" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminAccounts /></ProtectedRoute>} />
          <Route path="/admin/cheques" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminCheques /></ProtectedRoute>} />
          <Route path="/admin/hp" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminHP /></ProtectedRoute>} />
          <Route path="/admin/customer-history" element={<ProtectedRoute roles={['admin']} permission="reports"><AdminCustomerHistory /></ProtectedRoute>} />
          <Route path="/admin/overtime" element={<ProtectedRoute roles={['admin']} permission="finance"><AdminOvertime /></ProtectedRoute>} />
          <Route path="/admin/reloads" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminReloads /></ProtectedRoute>} />
          <Route path="/admin/repairs" element={<ProtectedRoute roles={['admin']} permission="sales"><AdminRepairs /></ProtectedRoute>} />


          <Route path="/admin/targets" element={<ProtectedRoute roles={['admin']} permission="employees"><AdminTargets /></ProtectedRoute>} />

          {/* Barcode Generator (Admin + Manager + Cashier) */}
          <Route path="/barcode-generator" element={<ProtectedRoute roles={['admin', 'manager', 'cashier']}><BarcodeGenerator /></ProtectedRoute>} />

          {/* Cashier */}
          <Route path="/cashier-login" element={<CashierLogin />} />
          <Route path="/pos" element={<POSScreen />} />

          {/* Delivery */}
          <Route path="/delivery" element={<ProtectedRoute roles={['deliveryGuy']}><DeliveryDashboard /></ProtectedRoute>} />

          {/* Employee Self-Service */}
          <Route path="/employee" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/profile" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeProfile /></ProtectedRoute>} />
          <Route path="/employee/attendance" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeAttendance /></ProtectedRoute>} />
          <Route path="/employee/leaves" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeLeaves /></ProtectedRoute>} />
          {/* Returns removed from cashier — only manager/admin have return access */}
          <Route path="/employee/salary" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeSalary /></ProtectedRoute>} />
          <Route path="/employee/overtime" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee', 'manager']}><EmployeeOvertime /></ProtectedRoute>} />
          <Route path="/employee/stock" element={<ProtectedRoute roles={['cashier', 'stockEmployee']}><CashierStock /></ProtectedRoute>} />
          <Route path="/employee/repairs" element={<ProtectedRoute roles={['cashier', 'stockEmployee']}><EmployeeRepairs /></ProtectedRoute>} />
        </Routes>
      </AppLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </Router>
  );
}

export default App;
