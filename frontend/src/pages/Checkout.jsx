import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, CreditCard, Truck, ChevronRight, ShieldCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import useSettingsStore from '../store/settingsStore';
import { applyVoucher, createOrder, getMyLoyaltyPoints, getPayHereHash, requestOrderPaymentOtp, verifyOrderPaymentOtp } from '../services/api';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

const Checkout = () => {
  const { items, getSubtotal, clearItems } = useCartStore();
  const { user } = useAuthStore();
  const { convertPrice, formatPrice } = useCurrencyStore();
  const navigate = useNavigate();

  const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: 'USA' });
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [customerNic, setCustomerNic] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState(user?.phone || '');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorNic, setGuarantorNic] = useState('');
  const [hpInstallments, setHpInstallments] = useState(3);
  const [sendReceiptEmail, setSendReceiptEmail] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpOrderId, setOtpOrderId] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [claimedVouchers, setClaimedVouchers] = useState([]);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [pointsInput, setPointsInput] = useState('');
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [kokoModalOpen, setKokoModalOpen] = useState(false);
  const [kokoPhone, setKokoPhone] = useState(user?.phone || '');
  const [kokoOtp, setKokoOtp] = useState('582910');
  const [kokoProcessing, setKokoProcessing] = useState(false);
  const siteSettings = useSettingsStore((s) => s.settings);
  const pointValue = siteSettings?.loyaltyPointValue || 1;

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 50 ? 0 : 4.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const fullTotalBeforeDiscount = subtotal + deliveryFee + tax;
  const total = Math.max(0, fullTotalBeforeDiscount - voucherDiscount - loyaltyDiscount);

  // Pre-fill address from user profile
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setAddress({
        street: def.street || '',
        city: def.city || '',
        state: def.state || '',
        zipCode: def.zipCode || '',
        country: def.country || 'USA',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadClaimedVouchers = async () => {
      if (!user) return;
      try {
        const { data } = await getMyLoyaltyPoints();
        setCustomerPoints(data?.points || 0);
        const available = data?.availableVouchers || [];
        
        // Filter vouchers that are valid for the current cart
        const validVouchers = available.filter(v => {
          // Check min order amount
          if (v.minOrderAmount && subtotal < v.minOrderAmount) return false;
          
          // Check products / categories
          const hasProductRestriction = v.applicableProductIds?.length > 0;
          const hasCategoryRestriction = v.applicableCategoryIds?.length > 0;
          
          if (hasProductRestriction || hasCategoryRestriction) {
            const itemProductIds = items.map(i => i.productId?._id || i.productId);
            const itemCategoryIds = items.map(i => i.productId?.category?._id || i.productId?.category || i.productId?.categoryId?._id || i.productId?.categoryId);
            
            let productMatch = false;
            let categoryMatch = false;
            
            if (hasProductRestriction) {
              productMatch = itemProductIds.some(id => v.applicableProductIds.includes(String(id)));
            }
            if (hasCategoryRestriction) {
              categoryMatch = itemCategoryIds.some(id => v.applicableCategoryIds.includes(String(id)));
            }
            
            if (hasProductRestriction && hasCategoryRestriction) {
              if (!productMatch && !categoryMatch) return false;
            } else if (hasProductRestriction && !productMatch) {
              return false;
            } else if (hasCategoryRestriction && !categoryMatch) {
              return false;
            }
          }
          
          return true;
        });

        setClaimedVouchers(validVouchers);
        
        // Check if currently selected voucher is still valid
        if (selectedVoucherCode) {
          const stillValid = validVouchers.some(v => v.code === selectedVoucherCode);
          if (!stillValid) {
            setSelectedVoucherCode('');
            setVoucherDiscount(0);
            toast.warning('Your applied voucher is no longer valid for the current cart items and was removed.');
          }
        }
      } catch {
        setClaimedVouchers([]);
      }
    };
    loadClaimedVouchers();
  }, [user, subtotal, items]);

  // Generate delivery date options (next 7 days)
  const dateOptions = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dateOptions.push(d.toISOString().split('T')[0]);
  }

  const timeSlots = ['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '12:00 PM - 2:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM'];

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      toast.error('Please fill in your delivery address');
      return;
    }
    if (!deliveryDate || !deliveryTime) {
      toast.error('Please select a delivery date and time');
      return;
    }

    if (paymentMethod === 'koko') {
      setKokoModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || item.name,
          image: item.productId?.productLink || item.productId?.images?.[0] || item.image,
          quantity: item.quantity,
          price: item.productId?.price || item.price,
          storeId: item.productId?.storeId,
        })),
        deliveryAddress: address,
        deliverySlot: { date: deliveryDate, timeSlot: deliveryTime },
        paymentMethod,
        deliveryFee,
        tax,
        voucherCode: selectedVoucherCode || undefined,
        loyaltyPointsRedeemed: loyaltyPointsToRedeem || undefined,
        loyaltyDiscount: loyaltyDiscount || undefined,
        sendReceiptEmail,
        receiptEmail: sendReceiptEmail ? (receiptEmail || user?.email || '') : undefined,
      };

      if (paymentMethod === 'hire_purchase') {
        if (!customerNic.trim()) {
          toast.error('Customer NIC is required for Hire Purchase/Credit');
          setLoading(false);
          return;
        }
        orderData.hirePurchaseData = {
          customerNic,
          customerWhatsapp: customerWhatsapp || user?.phone,
          numberOfInstallments: Number(hpInstallments),
          downPayment: Math.round(total * 0.3),
          netTotal: total,
          guarantors: guarantorName ? [{ name: guarantorName, phone: guarantorPhone, nic: guarantorNic }] : []
        };
      }

      const { data: order } = await createOrder(orderData);

      if (paymentMethod === 'payhere') {
        await sendPaymentOtp(order._id);
        setOtpOrderId(order._id);
        setOtpModalOpen(true);
      } else {
        // COD — go to confirmation
        clearItems();
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmKokoPayment = async () => {
    if (!kokoPhone || kokoPhone.trim().length < 8) {
      toast.error('Enter a valid mobile number for Koko verification');
      return;
    }
    try {
      setKokoProcessing(true);
      const transactionId = `KOKO-TXN-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const kokoRef = `KOKO-REF-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderData = {
        items: items.map((item) => ({
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || item.name,
          image: item.productId?.productLink || item.productId?.images?.[0] || item.image,
          quantity: item.quantity,
          price: item.productId?.price || item.price,
          storeId: item.productId?.storeId,
        })),
        deliveryAddress: address,
        deliverySlot: { date: deliveryDate, timeSlot: deliveryTime },
        paymentMethod: 'koko',
        kokoDetails: { transactionId, kokoRef },
        deliveryFee,
        tax,
        voucherCode: selectedVoucherCode || undefined,
        loyaltyPointsRedeemed: loyaltyPointsToRedeem || undefined,
        loyaltyDiscount: loyaltyDiscount || undefined,
        sendReceiptEmail,
        receiptEmail: sendReceiptEmail ? (receiptEmail || user?.email || '') : undefined,
      };

      const { data: order } = await createOrder(orderData);
      setKokoModalOpen(false);
      clearItems();
      toast.success(`Koko Payment Approved! 1st Installment of Rs. ${Math.ceil(total / 3).toLocaleString()} Paid. 💳✨`);
      navigate(`/order-confirmation/${order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Koko payment approval failed');
    } finally {
      setKokoProcessing(false);
    }
  };

  const handleApplyVoucher = async (codeToApply) => {
    const code = codeToApply || selectedVoucherCode;
    if (!code) {
      setVoucherDiscount(0);
      return;
    }
    try {
      setApplyingVoucher(true);
      const applyPayload = {
        code,
        orderAmount: fullTotalBeforeDiscount,
        items: items.map((item) => ({
          productId: item.productId?._id || item.productId,
          quantity: item.quantity,
        })),
      };
      const { data } = await applyVoucher(applyPayload);
      setVoucherDiscount(Number(data?.discount || 0));
      toast.success(`Voucher applied: Rs. ${Number(data?.discount || 0).toFixed(2)} off`);
    } catch (err) {
      setVoucherDiscount(0);
      setSelectedVoucherCode('');
      toast.error(err.response?.data?.message || 'Failed to apply voucher');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const sendPaymentOtp = async (orderId) => {
    try {
      setOtpSending(true);
      await requestOrderPaymentOtp(orderId);
      toast.success('Payment OTP sent to your phone');
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to send payment OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyPaymentOtp = async () => {
    if (!otpOrderId) return;
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    try {
      setOtpVerifying(true);
      await verifyOrderPaymentOtp(otpOrderId, { otp: otpCode.trim() });
      const { data: payData } = await getPayHereHash(otpOrderId);
      setOtpModalOpen(false);
      setOtpCode('');
      const payOrder = { _id: otpOrderId, items };
      initiatePayHere(payData, payOrder);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setOtpVerifying(false);
    }
  };

  const initiatePayHere = (payData, order) => {
    const FRONTEND = 'https://smart.mobilehub.lk';
    const BACKEND = 'https://mobilehub.mobilehub.lk';
    const payment = {
      sandbox: payData.sandbox,
      merchant_id: payData.merchant_id,
      return_url: `${FRONTEND}/order-confirmation/${order._id}`,
      cancel_url: `${FRONTEND}/checkout`,
      notify_url: `${BACKEND}/api/orders/payhere-notify`,
      order_id: payData.order_id,
      items: Array.isArray(order.items) ? order.items.map((i) => i.name).join(', ') : 'Order',
      amount: payData.amount,
      currency: payData.currency,
      hash: payData.hash,
      first_name: user.name.split(' ')[0],
      last_name: user.name.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || '0000000000',
      address: address.street,
      city: address.city,
      country: 'Sri Lanka',
    };

    if (window.payhere) {
      window.payhere.onCompleted = function () {
        clearItems();
        toast.success('Payment successful!');
        navigate(`/order-confirmation/${order._id}`);
      };
      window.payhere.onDismissed = function () {
        toast.info('Payment cancelled');
      };
      window.payhere.onError = function (error) {
        toast.error('Payment error: ' + error);
      };
      window.payhere.startPayment(payment);
    } else {
      toast.error('PayHere SDK not loaded. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="base-container py-20 text-center">
        <h2 className="text-2xl font-bold text-dark-navy mb-2 mt-0">No items to checkout</h2>
        <Link to="/shop" className="text-primary-blue font-semibold hover:underline">Go Shopping</Link>
      </div>
    );
  }

  return (
    <div className="base-container py-10 bg-slate-50/20 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mt-0 mb-8 border-b border-slate-100 pb-4">Secure Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left — Forms */}
        <div className="flex-1 w-full space-y-6">
          {/* Delivery Address */}
          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          >
            <h3 className="font-bold text-slate-800 mt-0 mb-5 flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin size={18} className="text-brand-indigo" /> Delivery Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Street Address</label>
                <input type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none text-sm font-semibold text-slate-700" placeholder="123 Main Street" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">City</label>
                <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none text-sm font-semibold text-slate-700" placeholder="Colombo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">State / Province</label>
                <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none text-sm font-semibold text-slate-700" placeholder="Western" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Zip Code</label>
                <input type="text" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none text-sm font-semibold text-slate-700" placeholder="00100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Country</label>
                <input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none text-sm font-semibold text-slate-700" placeholder="Sri Lanka" />
              </div>
            </div>
          </motion.div>

          {/* Delivery Slot */}
          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="font-bold text-slate-800 mt-0 mb-5 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock size={18} className="text-brand-indigo" /> Delivery Slot
            </h3>
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3.5">Select Date</label>
              <div className="flex flex-wrap gap-2.5">
                {dateOptions.map((d) => {
                  const dateObj = new Date(d + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  return (
                    <button key={d} type="button" onClick={() => setDeliveryDate(d)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center min-w-[72px] cursor-pointer ${
                        deliveryDate === d ? 'border-brand-indigo bg-brand-indigo/5 text-brand-indigo font-bold shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold bg-white'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dayName}</div>
                      <div className="font-black text-lg my-0.5 leading-none">{dayNum}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{month}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3.5">Select Time Slot</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {timeSlots.map((slot) => (
                  <button key={slot} type="button" onClick={() => setDeliveryTime(slot)}
                    className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      deliveryTime === slot ? 'border-brand-indigo bg-brand-indigo/5 text-brand-indigo shadow-sm font-extrabold' : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Voucher */}
          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="font-bold text-slate-800 mt-0 mb-5 border-b border-slate-100 pb-2">Apply Voucher</h3>
            {claimedVouchers.length === 0 ? (
              <p className="text-xs font-bold text-amber-600 bg-amber-50 rounded-xl px-4 py-3 m-0">No valid vouchers available for current cart items.</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedVoucherCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedVoucherCode(code);
                    if (code) {
                      handleApplyVoucher(code);
                    } else {
                      setVoucherDiscount(0);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="">Select claimed voucher</option>
                  {claimedVouchers.map((v, idx) => (
                    <option key={`${v.code}-${idx}`} value={v.code}>
                      🎟️ {v.code} ({v.type === 'percentage' ? `${v.value}%` : `Rs. ${v.value}`})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {voucherDiscount > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-0 flex items-center gap-2">
                  <ShieldCheck size={16} /> Voucher discount applied: -Rs. {voucherDiscount.toFixed(2)} deducted
                </p>
              </div>
            )}
          </motion.div>

          {/* Loyalty Points */}
          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          >
            <h3 className="font-bold text-slate-800 mt-0 mb-5 border-b border-slate-100 pb-2">
              🏆 Redeem Loyalty Points
            </h3>
            {!user ? (
              <p className="text-sm text-slate-400 font-semibold mb-0">Login to redeem your loyalty points.</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 text-xs font-bold uppercase tracking-wider text-slate-450">
                  <span>Available Balance:</span>
                  <span className="text-amber-600 font-black text-sm">{customerPoints} PTS</span>
                </div>
                {loyaltyPointsToRedeem > 0 ? (
                  <div className="flex items-center justify-between bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <span className="text-xs text-emerald-700 font-black uppercase tracking-wider">✅ {loyaltyPointsToRedeem} points applied = Rs.{loyaltyDiscount.toFixed(2)} discount</span>
                    <button onClick={() => { setLoyaltyPointsToRedeem(0); setLoyaltyDiscount(0); setPointsInput(''); toast.info('Points removed'); }}
                      className="text-xs text-rose-500 font-bold hover:underline bg-transparent border-none cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input type="number" value={pointsInput} onChange={(e) => setPointsInput(e.target.value)}
                      placeholder="Points to redeem (min 10)" min="10" max={customerPoints}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none font-semibold text-slate-700" />
                    <button onClick={() => {
                      const pts = parseInt(pointsInput);
                      if (isNaN(pts) || pts < 10) { toast.error('Minimum 10 points'); return; }
                      if (pts > customerPoints) { toast.error('Insufficient points'); return; }
                      const disc = pts * pointValue;
                      setLoyaltyPointsToRedeem(pts);
                      setLoyaltyDiscount(disc);
                      toast.success(`${pts} points applied (Rs.${disc} discount)`);
                      setPointsInput('');
                    }} className="bg-amber-500 hover:bg-amber-650 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.2)]">Apply</button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3 mb-0">1 point = Rs.{pointValue} discount. Minimum 10 points to redeem.</p>
              </div>
            )}
          </motion.div>

          {/* Payment Method */}
          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}
          >
            <h3 className="font-bold text-slate-800 mt-0 mb-5 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard size={18} className="text-brand-indigo" /> Payment Method
            </h3>
            <div className="space-y-3">
              {[
                { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
                { id: 'payhere', label: 'PayHere Gateway', icon: '💳', desc: 'Secure online payment (Visa / Master / LANKAQR)' },
                { id: 'koko', label: 'Koko (3 Installments)', icon: '📱', desc: 'Split the bill into 3 easy payments' },
                { id: 'hire_purchase', label: 'Hire Purchase / Credit (Installments)', icon: '📝', desc: 'Pay down payment now, balance in monthly installments' },
              ].map((method) => (
                <div key={method.id} className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === method.id ? 'border-brand-indigo bg-brand-indigo/5 shadow-[0_4px_12px_rgba(99,102,241,0.05)]' : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)} className="accent-brand-indigo w-4 h-4 cursor-pointer" />
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm m-0 leading-tight">{method.label}</p>
                      <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">{method.desc}</p>
                    </div>
                  </label>

                  {/* Koko Installment Breakdown */}
                  {paymentMethod === 'koko' && method.id === 'koko' && (
                    <div className="ml-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <p className="font-bold text-slate-700 m-0 uppercase tracking-wider text-[10px]">Koko 3-Month Interest-Free Installments:</p>
                      <div className="flex justify-between border-b border-slate-200/40 pb-1.5 pt-1">
                        <span className="text-slate-500 font-semibold">1st Payment (Today):</span>
                        <span className="font-bold text-slate-800">Rs. {Math.round(total / 3).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/40 pb-1.5">
                        <span className="text-slate-500 font-semibold">2nd Payment (In 30 Days):</span>
                        <span className="font-bold text-slate-800">Rs. {Math.round(total / 3).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pb-0.5">
                        <span className="text-slate-500 font-semibold">3rd Payment (In 60 Days):</span>
                        <span className="font-bold text-slate-800">Rs. {Math.round(total / 3).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Hire Purchase / Credit Calculator & Fields */}
                  {paymentMethod === 'hire_purchase' && method.id === 'hire_purchase' && (
                    <div className="ml-8 p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-4 text-xs shadow-xs">
                      <p className="font-extrabold text-amber-900 m-0 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        📝 Hire Purchase Application Details & Live Calculator:
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">Your NIC Number *</label>
                          <input
                            type="text"
                            value={customerNic}
                            onChange={(e) => setCustomerNic(e.target.value)}
                            placeholder="e.g., 991234567V"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">💬 WhatsApp Number *</label>
                          <input
                            type="tel"
                            value={customerWhatsapp}
                            onChange={(e) => setCustomerWhatsapp(e.target.value)}
                            placeholder="e.g., 0771234567"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo placeholder:text-slate-400 placeholder:font-normal"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">Installment Period</label>
                          <select
                            value={hpInstallments}
                            onChange={(e) => setHpInstallments(Number(e.target.value))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo cursor-pointer"
                          >
                            <option value="3" className="text-slate-800 font-bold">3 Months Plan</option>
                            <option value="6" className="text-slate-800 font-bold">6 Months Plan</option>
                            <option value="12" className="text-slate-800 font-bold">12 Months Plan</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-amber-100/60 p-4 rounded-xl border border-amber-200 space-y-2">
                        <p className="font-black text-amber-950 m-0 text-xs uppercase tracking-wide">Installment Breakdown Summary:</p>
                        <div className="flex justify-between border-b border-amber-200/60 pb-1.5 pt-1">
                          <span className="text-slate-700 font-semibold">Down Payment (30%):</span>
                          <span className="font-black text-emerald-700">Rs. {Math.round(total * 0.3).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-amber-200/60 pb-1.5">
                          <span className="text-slate-700 font-semibold">Remaining Principal to Finance:</span>
                          <span className="font-bold text-slate-800">Rs. {Math.round(total * 0.7).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pb-0.5">
                          <span className="text-slate-700 font-semibold">Monthly Installment Amount:</span>
                          <span className="font-black text-amber-900 text-sm">Rs. {Math.round((total * 0.7) / hpInstallments).toLocaleString()} / month</span>
                        </div>
                      </div>

                      {/* Guarantor Details */}
                      <div className="space-y-3 pt-2 border-t border-amber-200/60">
                        <p className="font-extrabold text-slate-800 m-0 uppercase tracking-wider text-[10px]">Guarantor Information (Optional):</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <input
                              type="text"
                              value={guarantorName}
                              onChange={(e) => setGuarantorName(e.target.value)}
                              placeholder="Guarantor Name"
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={guarantorNic}
                              onChange={(e) => setGuarantorNic(e.target.value)}
                              placeholder="Guarantor NIC"
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={guarantorPhone}
                              onChange={(e) => setGuarantorPhone(e.target.value)}
                              placeholder="Guarantor Phone"
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo placeholder:text-slate-400 placeholder:font-normal"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
          >
            <h3 className="font-bold text-slate-800 mt-0 mb-5 border-b border-slate-100 pb-2">Receipt Delivery</h3>
            <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={sendReceiptEmail}
                onChange={(e) => setSendReceiptEmail(e.target.checked)}
                className="accent-brand-indigo w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-700">Send receipt via Email after successful payment</span>
            </label>
            {sendReceiptEmail && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Receipt Email Address</label>
                <input
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  placeholder={user?.email || 'you@example.com'}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none text-sm font-semibold text-slate-700"
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Right — Order Summary */}
        <div className="lg:w-96 w-full">
          <motion.div
            className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 sticky top-24 shadow-sm"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h3 className="font-black text-slate-800 text-lg mt-0 mb-5 border-b border-slate-100 pb-2">Order Summary</h3>

            {/* Items preview */}
            <div className="space-y-4 mb-5 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => {
                const product = item.productId || {};
                return (
                  <div key={product._id || item.productId} className="flex items-center gap-3">
                    <img 
                      src={getImageUrl(product.productLink || product.images?.[0] || item.image) || ''} 
                      alt="" 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 p-0.5 flex-shrink-0" 
                      onError={(e) => handleImageError(e, 'Product')}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-850 m-0 truncate leading-snug">{product.name || item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 whitespace-nowrap">{formatPrice(convertPrice((product.price || item.price) * item.quantity))}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-3.5 mb-5">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-700 font-extrabold">{formatPrice(convertPrice(subtotal))}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Delivery</span>
                <span className="text-slate-700 font-extrabold">{deliveryFee === 0 ? <span className="text-emerald-600">FREE</span> : formatPrice(convertPrice(deliveryFee))}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Tax</span>
                <span className="text-slate-700 font-extrabold">{formatPrice(convertPrice(tax))}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 bg-emerald-50 rounded-lg p-2.5">
                  <span className="text-emerald-700">Voucher</span>
                  <span className="text-emerald-700 font-extrabold">- {formatPrice(convertPrice(voucherDiscount))}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 bg-amber-50 rounded-lg p-2.5">
                  <span className="text-amber-800">🏆 Loyalty</span>
                  <span className="text-amber-800 font-extrabold">- {formatPrice(convertPrice(loyaltyDiscount))}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-slate-800 text-lg">Total</span>
                <span className="font-black text-brand-indigo text-xl tracking-tight">{formatPrice(convertPrice(total))}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? 'Processing...' : paymentMethod === 'payhere' ? 'Pay Now Securely' : paymentMethod === 'koko' ? 'Place Koko Order' : paymentMethod === 'hire_purchase' ? 'Apply for Hire Purchase / Credit' : 'Confirm Order (COD)'}
              <ChevronRight size={15} />
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <ShieldCheck size={14} className="text-brand-indigo" />
              <span>Secure Checkout</span>
            </div>
          </motion.div>
        </div>
      </div>

      {otpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md border border-slate-200/60 shadow-xl relative">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-2">
              <h3 className="text-lg font-black text-slate-800 m-0">Verify Payment OTP</h3>
              <button
                onClick={() => setOtpModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close OTP dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-450 font-medium mb-5">
              Enter the 6-digit verification code sent to your phone to proceed with payment.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter OTP"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo outline-none text-sm font-semibold tracking-widest text-center mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => sendPaymentOtp(otpOrderId)}
                disabled={otpSending || otpVerifying}
                className="flex-1 border border-brand-indigo text-brand-indigo font-bold py-3 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-60 cursor-pointer text-xs uppercase tracking-wider"
              >
                {otpSending ? 'Sending...' : 'Resend Code'}
              </button>
              <button
                onClick={handleVerifyPaymentOtp}
                disabled={otpVerifying || otpSending}
                className="flex-1 bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 cursor-pointer text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
              >
                {otpVerifying ? 'Verifying...' : 'Verify & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Koko Payment Gateway Simulation Modal */}
      {kokoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-fade-in relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-indigo to-brand-violet p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-brand-indigo font-black text-sm flex items-center justify-center shadow-md">
                  koko
                </div>
                <div>
                  <h3 className="font-extrabold text-lg m-0 text-white leading-snug">Koko Payment Gateway</h3>
                  <p className="text-xs text-white/80 m-0 font-medium">Merchant: {siteSettings?.shopName || 'SR Mobile Official'}</p>
                </div>
              </div>
              <button
                onClick={() => setKokoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer border-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="bg-brand-indigo/5 border border-brand-indigo/15 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium m-0">Total Order Amount</p>
                  <p className="text-xl font-bold text-slate-900 m-0">Rs. {Math.round(total).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-indigo bg-brand-indigo/10 px-3 py-1 rounded-full">
                    3x Pay (0% Interest)
                  </span>
                  <p className="text-xs font-semibold text-brand-indigo mt-1 m-0">Rs. {Math.ceil(total / 3).toLocaleString()} / month</p>
                </div>
              </div>

              {/* Installment Schedule */}
              <div className="space-y-2 border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 m-0 mb-2">Approved 3-Installment Schedule:</p>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 1st Payment (Today)
                  </span>
                  <span className="font-bold text-slate-900">Rs. {Math.ceil(total / 3).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> 2nd Payment (in 30 Days)
                  </span>
                  <span className="font-bold text-slate-700">Rs. {Math.ceil(total / 3).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> 3rd Payment (in 60 Days)
                  </span>
                  <span className="font-bold text-slate-700">Rs. {Math.max(0, total - (Math.ceil(total / 3) * 2)).toLocaleString()}</span>
                </div>
              </div>

              {/* Mobile & Security Verification */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Koko Registered Mobile Number</label>
                  <input
                    type="text"
                    value={kokoPhone}
                    onChange={(e) => setKokoPhone(e.target.value)}
                    placeholder="+9477XXXXXXX"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Koko Verification Security OTP Code</label>
                    <span className="text-[10px] font-bold text-brand-indigo">Demo Code: 582910</span>
                  </div>
                  <input
                    type="text"
                    value={kokoOtp}
                    onChange={(e) => setKokoOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold tracking-widest text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo/25 focus:border-brand-indigo"
                  />
                </div>
              </div>

              {/* Approval Button */}
              <button
                onClick={handleConfirmKokoPayment}
                disabled={kokoProcessing}
                className="w-full bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer border-0"
              >
                {kokoProcessing ? 'Approving Koko Payment...' : `Approve & Pay Installment 1 (Rs. ${Math.ceil(total / 3).toLocaleString()})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
