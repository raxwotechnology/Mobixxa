import { toast } from 'react-toastify';
import { formatSLPhone } from './phone';

export const sendWhatsAppInvoice = (order, brandName = 'Mobixa', storePhone = '+94 11 255 5000') => {
  if (!order) return;

  let extractedPhone = (
    order.customerPhone ||
    order.deliveryAddress?.phone ||
    order.deliveryAddress?.mobile ||
    order.hirePurchaseData?.customerWhatsapp ||
    order.userId?.phone ||
    order.phone ||
    order.guarantorPhone ||
    ''
  ).replace(/[^0-9]/g, '');

  if (!extractedPhone) {
    const userInput = window.prompt("Customer phone number not found. Enter Customer's WhatsApp Number (e.g. 0771234567):");
    if (!userInput) {
      toast.info('WhatsApp receipt generation cancelled');
      return;
    }
    extractedPhone = userInput.replace(/[^0-9]/g, '');
  }

  if (!extractedPhone) {
    toast.error('Valid WhatsApp number is required to send invoice');
    return;
  }

  const formattedPhone = formatSLPhone(extractedPhone).replace('+', '');

  const itemsSummary = order.items?.map(i => `• ${i.name} (x${i.quantity || 1})`).join('\n') || '';
  const imeiList = [];
  order.items?.forEach(i => {
    if (Array.isArray(i.imei) && i.imei.length > 0) {
      imeiList.push(`📱 IMEI (${i.name}): ${i.imei.join(', ')}`);
    } else if (i.imeiNumber) {
      imeiList.push(`📱 IMEI (${i.name}): ${i.imeiNumber}`);
    }
  });

  const imeiText = imeiList.join('\n');
  const invoiceNo = order.invoiceNumber || order.quotationNumber || `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const totalPaid = (order.totalAmount || order.total || 0).toLocaleString();
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString();

  const baseUrl = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://mobixa-official.vercel.app');

  const textMessage = `🧾 *${brandName.toUpperCase()} - DIGITAL RECEIPT*
----------------------------------------
Hi *${order.customerName || order.userId?.name || 'Valued Customer'}*, thank you for your purchase!

📄 *Invoice No:* ${invoiceNo}
📅 *Date:* ${dateStr}

*PURCHASED ITEMS:*
${itemsSummary}
${imeiText ? '\n' + imeiText : ''}

💰 *Total Paid:* Rs. ${totalPaid}
💳 *Payment Method:* ${(order.paymentMethod || 'cash').toUpperCase()}

🔗 *View Official Receipt & Warranty:*
${baseUrl}/warranty-check?imei=${encodeURIComponent(order.items?.[0]?.imei?.[0] || invoiceNo)}
----------------------------------------
📞 Store Hotline: ${storePhone}
🏬 Thank you for shopping with us!`;

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMessage)}`;
  window.open(whatsappUrl, '_blank');
  toast.success(`WhatsApp receipt for ${invoiceNo} opened! 💬`);
};
