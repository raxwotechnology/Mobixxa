const nodemailer = require('nodemailer');
const { escapeHtml } = require('./validators');

// Create reusable transporter using Gmail / SMTP credentials
const createTransporter = () => {
  const user = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_PASS;

  if (!user || !pass) {
    console.error('[Email Error] Missing required email environment variables (EMAIL_FROM / EMAIL_APP_PASSWORD).');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send email using Gmail SMTP
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @returns {Promise<object>} Send result
 */
const sendEmail = async (to, subject, html) => {
  try {
    if (!to) {
      console.warn('[Email Warning] No recipient email specified.');
      return null;
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER;
    const appPassword = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_PASS;

    if (!fromEmail || !appPassword) {
      console.error(`[Email Error] Cannot send email to "${to}". EMAIL_FROM or EMAIL_APP_PASSWORD environment variable is missing.`);
      return null;
    }

    const transporter = createTransporter();
    if (!transporter) return null;

    console.log(`[Email Sending] Dispatching receipt to ${to}...`);

    const info = await transporter.sendMail({
      from: `"Mobixa Official" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email Success] Sent to ${to}: Message ID ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${to}:`, error.message);
    return null;
  }
};

// ========== EMAIL TEMPLATES ==========

const orderConfirmationEmail = (order, customerName) => {
  const safeCustomerName = escapeHtml(customerName || 'Valued Customer');
  const safePaymentMethod = escapeHtml((order.paymentMethod || 'COD').toUpperCase());

  const itemsHtml = (order.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 600; font-size: 14px;">${escapeHtml(item.name)}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569; font-weight: 700; font-size: 14px;">${escapeHtml(item.quantity)}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: 800; font-size: 14px;">Rs. ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>`
    )
    .join('');

  const rawOrderId = order.invoiceNumber || order._id.toString().slice(-8).toUpperCase();
  const safeOrderIdStr = escapeHtml(rawOrderId);
  const frontendBase = (process.env.FRONTEND_URL || 'https://mobixa-official.vercel.app').replace(/\/$/, '');
  const confirmationUrl = `${frontendBase}/order-confirmation/${encodeURIComponent(order._id)}`;

  return {
    subject: `📱 Mobixa — Official Electronic Order Receipt #${safeOrderIdStr}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f8fafc; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af, #2563eb, #3b82f6); padding: 35px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">⚡ MOBIXA</h1>
          <p style="color: #dbeafe; margin: 8px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Official Digital Invoice & Order Confirmation</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">Hi ${safeCustomerName}! 🎉</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Thank you for shopping with <strong>Mobixa</strong>! Your order has been placed successfully. Below is your itemized electronic invoice:
          </p>

          <!-- Info Box -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px;">Invoice Number:</td>
                <td style="font-size: 14px; font-weight: 900; text-align: right; color: #1e3a8a;">#${safeOrderIdStr}</td>
              </tr>
              <tr>
                <td style="padding-top: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px;">Payment Method:</td>
                <td style="padding-top: 8px; font-size: 14px; font-weight: 900; text-align: right; color: #1e3a8a;">${safePaymentMethod}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px; text-align: left; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">Item Description</th>
                <th style="padding: 10px; text-align: center; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px; text-align: right; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <!-- Total Summary -->
          <div style="border-top: 2px solid #2563eb; padding-top: 18px; text-align: right; margin-bottom: 28px;">
            <p style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0;">
              Total Paid: <span style="color: #2563eb;">Rs. ${(order.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>

          <!-- Direct Link CTA Button -->
          <div style="text-align: center; margin: 30px 0 10px;">
            <a href="${confirmationUrl}" target="_blank" style="background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 16px 32px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
              📄 View Official Digital Receipt & Track Order →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 13px; font-weight: 700; margin: 0 0 6px;">📞 Store Hotline: +94 11 255 5000</p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Mobixa Official Store. Premium Tech Delivered With Care.</p>
        </div>
      </div>
    `,
  };
};

const deliveryAssignmentEmail = (order, deliveryGuyName) => {
  const safeName = escapeHtml(deliveryGuyName);
  const safeOrderId = escapeHtml(order._id.toString().slice(-8).toUpperCase());

  return {
    subject: `Mobixa — New Delivery Assignment #${safeOrderId}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚚 Delivery Assignment</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1e293b; margin-top: 0;">Hi ${safeName}!</h2>
          <p style="color: #64748b;">You have a new delivery order assigned to you.</p>
          <div style="background: #eff6ff; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #2563eb;">Order #${safeOrderId}</p>
            <p style="margin: 5px 0 0; color: #64748b;">Items: ${order.items ? order.items.length : 0} | Total: Rs. ${(order.totalAmount || 0).toFixed(2)}</p>
          </div>
          <p style="color: #64748b;">Please check your dashboard for full delivery details.</p>
        </div>
      </div>
    `,
  };
};

const salaryPaidEmail = (employeeName, payroll) => {
  const safeName = escapeHtml(employeeName);
  const safeMonth = escapeHtml(payroll.month);
  const safeYear = escapeHtml(payroll.year);

  return {
    subject: `Mobixa — Salary Credited for ${safeMonth}/${safeYear}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">💰 Salary Credited</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1e293b; margin-top: 0;">Hi ${safeName}!</h2>
          <p style="color: #64748b;">Your salary for ${safeMonth}/${safeYear} has been processed.</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding: 5px 0; color: #64748b;">Basic Salary</td><td style="text-align: right; font-weight: bold;">Rs. ${(payroll.basicSalary || 0).toFixed(2)}</td></tr>
              <tr><td style="padding: 5px 0; color: #64748b;">EPF Deduction (8%)</td><td style="text-align: right; color: #ef4444;">- Rs. ${(payroll.epfEmployee || 0).toFixed(2)}</td></tr>
              <tr style="border-top: 2px solid #059669;"><td style="padding: 10px 0 0; font-weight: bold; font-size: 16px;">Net Salary</td><td style="text-align: right; font-weight: bold; font-size: 16px; color: #059669;">Rs. ${(payroll.netSalary || 0).toFixed(2)}</td></tr>
            </table>
          </div>
        </div>
      </div>
    `,
  };
};

const welcomeEmail = (name) => {
  const safeName = escapeHtml(name);

  return {
    subject: 'Welcome to Mobixa! ✨',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">⚡ Mobixa</h1>
          <p style="color: #d1fae5; margin: 10px 0 0; font-size: 16px;">Premium tech and smart devices, delivered with care</p>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${safeName}! 🎉</h2>
          <p style="color: #64748b; line-height: 1.6;">Thank you for joining Mobixa! Explore our curated range of tech, gadgets, accessories, and smart essentials.</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Use code</p>
            <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #059669;">WELCOME10</p>
            <p style="margin: 0; font-size: 14px; color: #64748b;">to get 10% off your first order!</p>
          </div>
        </div>
      </div>
    `,
  };
};

const paymentReceiptEmail = (order, customerName) => {
  const safeName = escapeHtml(customerName);
  const safePaymentMethod = escapeHtml((order.paymentMethod || 'card').toUpperCase());
  const safeAddress = order.shippingAddress ? escapeHtml(order.shippingAddress.address || '') : '';
  const safeCity = order.shippingAddress ? escapeHtml(order.shippingAddress.city || '') : '';

  const itemsHtml = (order.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; color: #334155;">${escapeHtml(item.name)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">${escapeHtml(item.quantity)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #64748b;">Rs. ${item.price?.toFixed(2)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #334155;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const orderId = escapeHtml(order._id.toString().slice(-8).toUpperCase());
  const paidDate = escapeHtml(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));

  return {
    subject: `Mobixa — Payment Receipt #${orderId}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 35px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">⚡ Mobixa</h1>
          <p style="color: #d1fae5; margin: 8px 0 0; font-size: 14px;">Payment Receipt</p>
        </div>

        <!-- Success Banner -->
        <div style="background: #f0fdf4; padding: 20px; text-align: center; border-bottom: 1px solid #dcfce7;">
          <p style="margin: 0; font-size: 24px;">✅</p>
          <h2 style="color: #059669; margin: 8px 0 0; font-size: 18px;">Payment Successful!</h2>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 5px;">Hi <strong>${safeName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 20px;">Thank you for your purchase! Here is your payment receipt.</p>

          <!-- Order Info -->
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <div style="background: #f8fafc; border-radius: 10px; padding: 12px 15px; flex: 1;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</p>
              <p style="margin: 4px 0 0; font-weight: 700; color: #059669; font-size: 15px;">#${orderId}</p>
            </div>
            <div style="background: #f8fafc; border-radius: 10px; padding: 12px 15px; flex: 1;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Date</p>
              <p style="margin: 4px 0 0; font-weight: 600; color: #334155; font-size: 13px;">${paidDate}</p>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
            <thead>
              <tr style="background: #f0fdf4;">
                <th style="padding: 10px 8px; text-align: left; color: #059669; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                <th style="padding: 10px 8px; text-align: center; color: #059669; font-size: 12px; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px 8px; text-align: right; color: #059669; font-size: 12px; text-transform: uppercase;">Price</th>
                <th style="padding: 10px 8px; text-align: right; color: #059669; font-size: 12px; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <!-- Totals -->
          <div style="background: #f8fafc; border-radius: 10px; padding: 15px;">
            ${order.subtotal ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #64748b; font-size: 14px;">Subtotal</span><span style="color: #334155; font-size: 14px;">Rs. ${order.subtotal.toFixed(2)}</span></div>` : ''}
            ${order.deliveryFee ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #64748b; font-size: 14px;">Delivery Fee</span><span style="color: #334155; font-size: 14px;">Rs. ${order.deliveryFee.toFixed(2)}</span></div>` : ''}
            ${order.discount ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #64748b; font-size: 14px;">Discount</span><span style="color: #059669; font-size: 14px;">- Rs. ${order.discount.toFixed(2)}</span></div>` : ''}
            <div style="border-top: 2px solid #059669; padding-top: 10px; margin-top: 5px; display: flex; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 16px; color: #1e293b;">Total Paid</span>
              <span style="font-weight: 700; font-size: 18px; color: #059669;">Rs. ${(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div style="margin-top: 15px; padding: 12px 15px; background: #eff6ff; border-radius: 10px;">
            <p style="margin: 0; font-size: 13px; color: #3b82f6;">
              💳 Payment Method: <strong>${safePaymentMethod}</strong>
              ${order.isPaid ? ' — ✅ Confirmed' : ''}
            </p>
          </div>

          <!-- Delivery Address -->
          ${order.shippingAddress ? `
          <div style="margin-top: 15px; padding: 12px 15px; background: #fefce8; border-radius: 10px;">
            <p style="margin: 0; font-size: 13px; color: #ca8a04;">
              📍 Delivery to: <strong>${safeAddress}, ${safeCity}</strong>
            </p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 20px; text-align: center;">
          <p style="color: #64748b; font-size: 13px; margin: 0 0 5px;">Thank you for shopping with Mobixa! ✨</p>
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Mobixa. Premium tech and smart devices delivered with care.</p>
        </div>
      </div>
    `,
  };
};

const posReceiptEmail = (order, customer = {}) => {
  const customerName = escapeHtml(customer.name || order.customerName || 'Customer');
  const customerEmail = escapeHtml(customer.email || order.receiptEmail || 'N/A');
  const customerPhone = escapeHtml(customer.phone || order.customerPhone || 'N/A');
  const paymentMethod = escapeHtml((order.paymentMethod || '').toUpperCase());
  const orderId = escapeHtml(order._id.toString().slice(-8).toUpperCase());

  const subtotal = order.subtotal || (order.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = (order.discountAmount || 0) + (order.couponDiscount || 0);

  const itemsHtml = (order.items || []).map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(item.quantity)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">LKR ${(item.price || 0).toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">LKR ${((item.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return {
    subject: `Receipt #${orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;">
        <h2 style="color:#059669;">Mobixa POS Receipt</h2>
        <p><strong>Receipt ID:</strong> #${orderId}</p>
        <p><strong>Date:</strong> ${escapeHtml(new Date(order.createdAt || Date.now()).toLocaleString())}</p>
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${customerName}<br/><strong>Email:</strong> ${customerEmail}<br/><strong>Phone:</strong> ${customerPhone}</p>
        <h3>Items Purchased</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f0fdf4;">
              <th style="padding:8px;text-align:left;">Item</th>
              <th style="padding:8px;text-align:center;">Qty</th>
              <th style="padding:8px;text-align:right;">Price</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;">
          <p style="margin:4px 0;"><strong>Subtotal:</strong> LKR ${subtotal.toFixed(2)}</p>
          <p style="margin:4px 0;"><strong>Discounts:</strong> LKR ${discount.toFixed(2)}</p>
          <p style="margin:4px 0;"><strong>Tax:</strong> LKR ${(order.tax || 0).toFixed(2)}</p>
          <p style="margin:4px 0;font-size:18px;"><strong>Total Amount:</strong> LKR ${(order.totalAmount || 0).toFixed(2)}</p>
          <p style="margin:4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        </div>
      </div>
    `,
  };
};

const customerReturnUpdateEmail = ({ order, returnDoc }) => {
  const orderId = escapeHtml(order?._id?.toString()?.slice(-8)?.toUpperCase?.() || '—');
  const rma = escapeHtml(returnDoc?.holdBillNo || `RET-${returnDoc?._id?.toString?.().slice(-8).toUpperCase?.()}`);
  const status = escapeHtml((returnDoc?.status || 'requested').replaceAll('_', ' '));
  const resolution = escapeHtml((returnDoc?.resolution || '—').replaceAll('_', ' '));
  const orderTotal = order?.totalAmount != null ? Number(order.totalAmount).toFixed(2) : '—';
  
  const itemsHtml = (returnDoc?.items || [])
    .map((i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(i.orderItemName || '')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(i.qty)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(i.condition)}</td>
      </tr>
    `)
    .join('');

  const nextSteps = returnDoc?.status === 'rejected'
    ? `Reason: ${escapeHtml(returnDoc?.rejectionReason || '—')}`
    : returnDoc?.status === 'resolved'
      ? 'Your return has been resolved.'
      : 'Your return is on hold while we complete the exchange/upgrade process.';

  return {
    subject: `Mobixa — Return Update ${rma}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:650px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:28px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:26px;">📦 Return Update</h1>
          <p style="color:#d1fae5;margin:6px 0 0;font-size:13px;">Reference: <strong>${rma}</strong></p>
        </div>
        <div style="padding:24px;">
          <p style="color:#334155;margin:0 0 10px;">Order: <strong>#${orderId}</strong></p>
          <p style="color:#334155;margin:0 0 10px;">Order total: <strong>LKR ${orderTotal}</strong></p>
          <p style="color:#334155;margin:0 0 10px;">Status: <strong>${status}</strong></p>
          <p style="color:#334155;margin:0 0 16px;">Resolution: <strong>${resolution}</strong></p>

          <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:#f0fdf4;padding:10px 14px;font-weight:700;color:#059669;">Returned items</div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:12px;">Item</th>
                  <th style="padding:8px 12px;text-align:center;color:#64748b;font-size:12px;">Qty</th>
                  <th style="padding:8px 12px;text-align:center;color:#64748b;font-size:12px;">Condition</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
          </div>

          <div style="margin-top:16px;background:#f8fafc;border-radius:12px;padding:14px;">
            <p style="margin:0;color:#334155;font-weight:600;">Next steps</p>
            <p style="margin:6px 0 0;color:#64748b;">${nextSteps}</p>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin-top:18px;">If you have questions, reply to this email.</p>
        </div>
      </div>
    `,
  };
};

const passwordResetOtpEmail = (name, otp) => {
  const safeName = escapeHtml(name || 'Valued User');
  const safeOtp = escapeHtml(otp);

  return {
    subject: `🔐 Mobixa — Password Reset Verification Code: ${safeOtp}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b, #2563eb); padding: 35px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">⚡ MOBIXA</h1>
          <p style="color: #93c5fd; margin: 8px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Password Reset Verification Request</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">Hello ${safeName},</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset the password for your Mobixa account. Use the 6-digit verification code below to authorize your password reset:
          </p>

          <!-- OTP Box -->
          <div style="background: #f8fafc; border: 2px dashed #2563eb; border-radius: 16px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #2563eb; font-family: monospace;">${safeOtp}</span>
            <p style="margin: 8px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">This verification code will expire in <strong>10 minutes</strong>.</p>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
            If you did not request a password reset, please ignore this email or contact our support team immediately if you suspect unauthorized activity.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-weight: 700; color: #475569;">Mobixa Official</p>
          <p style="margin: 4px 0 0; color: #94a3b8;">This is an automated security email. Please do not reply directly to this message.</p>
        </div>
      </div>
    `,
  };
};

const registrationOtpEmail = (name, otp) => {
  const tpl = passwordResetOtpEmail(name, otp);
  return {
    subject: `🔐 Mobixa — Registration Verification Code: ${otp}`,
    html: tpl.html
      .replace('Password Reset Verification Request', 'Registration Verification Request')
      .replace('We received a request to reset the password for your Mobixa account. Use the 6-digit verification code below to authorize your password reset:', 'Use the 6-digit verification code below to complete your Mobixa registration:')
      .replace('If you did not request a password reset, please ignore this email or contact our support team immediately if you suspect unauthorized activity.', 'If you did not request this, please ignore this email.'),
  };
};

module.exports = {
  sendEmail,
  orderConfirmationEmail,
  deliveryAssignmentEmail,
  salaryPaidEmail,
  welcomeEmail,
  paymentReceiptEmail,
  posReceiptEmail,
  customerReturnUpdateEmail,
  passwordResetOtpEmail,
};