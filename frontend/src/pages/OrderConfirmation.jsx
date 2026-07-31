import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Clock, CreditCard, Download, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOrderById, cancelMyOrder } from '../services/api';
import useCurrencyStore from '../store/currencyStore';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { convertPrice, formatPrice } = useCurrencyStore();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="base-container py-20 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-text mt-4">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="base-container py-20 text-center">
        <h2 className="text-2xl font-bold text-dark-navy mb-2 mt-0">Order not found</h2>
        <Link to="/" className="text-primary-blue hover:underline">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="base-container py-16 max-w-2xl mx-auto">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
      >
        <div className="w-20 h-20 bg-brand-indigo/5 border border-brand-indigo/10 rounded-full mx-auto mb-5 flex items-center justify-center shadow-sm">
          <CheckCircle size={36} className="text-brand-indigo" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-0 mb-2 tracking-tight">Order Confirmed!</h1>
        <p className="text-slate-400 text-sm font-medium m-0">Thank you for your order. We will start preparing it right away.</p>
      </motion.div>

      <motion.div
        className="glass-card border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 mb-8"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-5 pb-5 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">Order Identifier</p>
            <p className="font-extrabold text-slate-850 m-0 text-xs sm:text-sm font-mono mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">Date Placed</p>
            <p className="font-bold text-slate-700 m-0 text-xs sm:text-sm mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
            order.orderStatus === 'pending' ? 'bg-yellow-50/50 border-yellow-100 text-yellow-700' :
            order.orderStatus === 'confirmed' ? 'bg-brand-indigo/5 border-brand-indigo/15 text-brand-indigo' :
            order.orderStatus === 'delivered' ? 'bg-emerald-50 border-emerald-150 text-emerald-700' :
            'bg-slate-50 border-slate-150 text-slate-600'
          }`}>
            Status: {order.orderStatus}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
            order.paymentStatus === 'completed' ? 'bg-emerald-50 border-emerald-150 text-emerald-700' :
            order.paymentStatus === 'pending' ? 'bg-yellow-50/50 border-yellow-100 text-yellow-700' :
            'bg-rose-50 border-rose-150 text-rose-600'
          }`}>
            Payment: {order.paymentStatus}
          </span>
        </div>

        {/* Items */}
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mt-0 mb-4 flex items-center gap-2">
          <Package size={15} className="text-brand-indigo" /> Purchased Items
        </h4>
        <div className="space-y-4 mb-6 border-b border-slate-100 pb-5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <img 
                src={getImageUrl(item.image) || 'https://via.placeholder.com/50'} 
                alt="" 
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 p-0.5" 
                onError={(e) => handleImageError(e, 'Product')}
              />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-850 m-0 leading-tight">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Quantity: {item.quantity}</p>
              </div>
              <span className="text-xs font-extrabold text-slate-750">{formatPrice(convertPrice(item.price * item.quantity))}</span>
            </div>
          ))}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {order.deliveryAddress && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0 mb-1.5 flex items-center gap-1"><MapPin size={11} className="text-brand-indigo" /> Delivery Address</p>
              <p className="text-xs font-bold text-slate-700 m-0 leading-relaxed">
                {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
              </p>
            </div>
          )}
          {order.deliverySlot && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0 mb-1.5 flex items-center gap-1"><Clock size={11} className="text-brand-indigo" /> Delivery Schedule</p>
              <p className="text-xs font-bold text-slate-700 m-0 leading-relaxed">
                {new Date(order.deliverySlot.date).toLocaleDateString()} — {order.deliverySlot.timeSlot}
              </p>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="space-y-3.5 border-t border-slate-100 pt-5">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Payment Method</span>
            <span className="text-slate-700 font-bold capitalize flex items-center gap-1"><CreditCard size={13} className="text-brand-indigo" /> {order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Delivery Fee</span>
            <span className="text-slate-700 font-extrabold">{formatPrice(convertPrice(order.deliveryFee || 0))}</span>
          </div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Tax</span>
            <span className="text-slate-700 font-extrabold">{formatPrice(convertPrice(order.tax || 0))}</span>
          </div>
          <div className="flex justify-between items-baseline pt-4 border-t border-slate-100">
            <span className="font-black text-slate-800 text-lg">Total Amount</span>
            <span className="font-black text-brand-indigo text-xl tracking-tight">{formatPrice(convertPrice(order.totalAmount))}</span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-3.5 justify-center">
        {order.orderStatus !== 'cancelled' && !['shipped', 'out_for_delivery', 'delivered', 'completed'].includes(order.orderStatus) && (() => {
          const hours = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
          return hours <= 1;
        })() && (
          <button onClick={async () => {
            if (!window.confirm('Cancel this order?')) return;
            try {
              await cancelMyOrder(order._id, { reason: 'Cancelled by customer' });
              toast.success('Order cancelled');
              const { data } = await getOrderById(id);
              setOrder(data);
            } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
          }} className="bg-rose-500 hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-[0_4px_12px_rgba(239,68,68,0.2)] flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider">
            <XCircle size={15} /> Cancel Order
          </button>
        )}
        <button onClick={() => {
          const lines = [
            '', `Order: #${order._id.slice(-8).toUpperCase()}`,
            `Date: ${new Date(order.createdAt).toLocaleString()}`,
            `Status: ${order.orderStatus}`, `Payment: ${order.paymentMethod}`, '',
            '───────────────────────────────────────', 'ITEMS:', '───────────────────────────────────────',
          ];
          order.items.forEach((it, i) => {
            lines.push(`${i + 1}. ${it.name} (x${it.quantity}) = Rs. ${(it.price * it.quantity).toLocaleString()}`);
          });
          lines.push('───────────────────────────────────────');
          if (order.deliveryFee) lines.push(`Delivery: Rs. ${order.deliveryFee}`);
          if (order.tax) lines.push(`Tax: Rs. ${order.tax}`);
          lines.push(`TOTAL: Rs. ${order.totalAmount?.toLocaleString()}`);
          lines.push('', '═══════════════════════════════════════', '   Thank you for shopping with us!', '═══════════════════════════════════════');
          const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url;
          a.download = `Bill_${order._id.slice(-8).toUpperCase()}.txt`;
          a.click(); URL.revokeObjectURL(url);
        }} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider">
          <Download size={15} /> Download Receipt
        </button>
        <Link to="/orders" className="bg-gradient-to-r from-brand-indigo to-brand-violet hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-[0_4px_12px_rgba(99,102,241,0.25)] text-xs uppercase tracking-wider text-center">
          View All Orders
        </Link>
        <Link to="/shop" className="border border-slate-200 text-slate-650 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-50 transition-all text-xs uppercase tracking-wider text-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
