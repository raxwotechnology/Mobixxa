'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Printer, RotateCcw, Download } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { getImageUrl } from '../../utils/imageHelper';
import useSettingsStore from '../../store/settingsStore';
import { sendInvoiceReceipt } from '../../services/api';
import { sendWhatsAppInvoice } from '../../utils/whatsappHelper';
import { isValidSLPhone } from '../../utils/phone';
import { toast } from 'react-toastify';

const InvoiceModal = ({ isOpen, onClose, order, onNewSale, initialLayoutMode = 'invoice' }) => {
  const settings = useSettingsStore((s) => s.settings);
  const brandName = settings?.shopName || 'Mobixa';
  const brandAddress = settings?.address || '';
  const brandPhone = settings?.phone || '';
  const brandEmail = settings?.email || '';
  const receiptTemplate = settings?.documentTemplates?.posReceipt || {};
  const invoiceTemplate = settings?.documentTemplates?.invoice || {};

  const [layoutMode, setLayoutMode] = useState(initialLayoutMode);
  const [whatsappRecipient, setWhatsappRecipient] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [smsRecipient, setSmsRecipient] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    if (isOpen && initialLayoutMode) {
      setLayoutMode(initialLayoutMode);
    }
  }, [initialLayoutMode, isOpen]);

  const documentTemplate = layoutMode === 'receipt' ? receiptTemplate : invoiceTemplate;
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (order) {
      setWhatsappRecipient(order.customerPhone || '');
      setEmailRecipient(order.customerEmail || '');
      setSmsRecipient(order.customerPhone || '');
    }
  }, [order]);

  useEffect(() => {
    if (isOpen && order?.invoiceNumber && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, order.invoiceNumber || order.quotationNumber, {
          format: 'CODE128',
          width: 1.2,
          height: 30,
          displayValue: true,
          fontSize: 10,
          margin: 4,
          textMargin: 2,
        });
      } catch { /* ignore */ }
    }
  }, [isOpen, order, layoutMode]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleSendEmail = async () => {
    if (!emailRecipient) {
      toast.error('Please enter an email address');
      return;
    }
    try {
      setSendingEmail(true);
      await sendInvoiceReceipt(order._id, { type: 'email', recipient: emailRecipient });
      toast.success('Email receipt sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send Email receipt');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSms = async () => {
    if (!isValidSLPhone(smsRecipient)) {
      toast.error('Please enter a valid Sri Lankan mobile number (e.g. 0771234567)');
      return;
    }
    try {
      setSendingSms(true);
      await sendInvoiceReceipt(order._id, { type: 'sms', recipient: smsRecipient });
      toast.success('SMS receipt sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send SMS receipt');
    } finally {
      setSendingSms(false);
    }
  };

  const subtotal = order.subtotal ?? order.items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? order.totalAmount;
  const discountAmount = order.discountAmount || 0;
  const couponDiscount = order.couponDiscount || 0;
  const totalDiscount = discountAmount + couponDiscount;
  const taxAmount = order.tax || 0;
  const showTax = documentTemplate.showTax !== false;
  const showWarranty = documentTemplate.showWarranty !== false && settings?.receiptSettings?.showWarranty !== false;
  const showBarcode = documentTemplate.showBarcode !== false;

  return (
    <div className="pos-modal-overlay p-2 sm:p-4" onClick={onClose}>
      <div className="pos-invoice-modal w-full max-w-[96vw] sm:max-w-[420px] mx-auto overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()} style={{ maxWidth: layoutMode === 'invoice' ? '800px' : '420px', transition: 'all 0.3s' }}>
        {/* Close button — hidden when printing */}
        <button className="pos-invoice-close no-print" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Layout Mode Selector — hidden when printing */}
        <div className="flex flex-wrap justify-center border-b border-gray-100 p-2.5 sm:p-3 no-print gap-2">
          <button
            type="button"
            onClick={() => setLayoutMode('receipt')}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: layoutMode === 'receipt' ? 'none' : '1px solid #e2e8f0',
              background: layoutMode === 'receipt' ? '#2563eb' : 'transparent',
              color: layoutMode === 'receipt' ? '#fff' : '#64748b',
              cursor: 'pointer'
            }}
          >
            POS Receipt (80mm)
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('invoice')}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: layoutMode === 'invoice' ? 'none' : '1px solid #e2e8f0',
              background: layoutMode === 'invoice' ? '#2563eb' : 'transparent',
              color: layoutMode === 'invoice' ? '#fff' : '#64748b',
              cursor: 'pointer'
            }}
          >
            A4 Invoice
          </button>
        </div>

        {/* Dynamic page size only — visibility/positioning for #pos-receipt-content
            is handled centrally by the @media print rules in index.css/globals.css.
            Do not re-declare those rules here: an earlier version of this block set
            .pos-modal-overlay to display:none, which also removed its descendant
            #pos-receipt-content from the print render and produced a blank page. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${layoutMode === 'invoice' ? 'A4 portrait' : '80mm auto'};
              margin: ${layoutMode === 'invoice' ? '8mm' : '0mm'};
            }
            #pos-receipt-content {
              padding: ${layoutMode === 'invoice' ? '0' : '10px'} !important;
            }
            /* .pos-modal-overlay is the ANCESTOR that #pos-receipt-content
               lives inside — display:none here would remove the whole
               subtree from rendering, and no visibility:visible on the
               descendant can undo that, producing a blank printed page.
               It's kept visible (repositioned to static, background
               cleared) instead, matching index.css/globals.css. */
            .pos-modal-overlay {
              position: static !important;
              background: transparent !important;
              backdrop-filter: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
          }
        ` }} />

        {/* ═══════ Professional Receipt/Invoice Content ═══════ */}
        <div className="pos-receipt p-4 sm:p-5 overflow-y-auto max-h-[70vh]" id="pos-receipt-content" style={{ background: '#fff', color: '#111' }}>
          {layoutMode === 'invoice' ? (
            /* ═══════ Tax Invoice Layout (A4 Style) ═══════ */
            <div className="a4-invoice-content" style={{ fontFamily: "'Poppins', sans-serif", color: '#334155' }}>
              {/* Corporate Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 mb-4 border-b-2 border-slate-200">
                <div>
                  {(settings?.logoUrl || settings?.logo) && settings?.receiptSettings?.showLogo !== false && (
                    <img
                      src={getImageUrl(settings.logoUrl || settings.logo)}
                      alt="Shop Logo"
                      style={{
                        width: `${settings?.receiptSettings?.logoWidth || 120}px`,
                        maxHeight: '80px',
                        objectFit: 'contain',
                        marginBottom: '8px',
                        display: 'block'
                      }}
                    />
                  )}
                  {settings?.letterheadHeader ? (
                    <div style={{ fontSize: '11px', whiteSpace: 'pre-line', color: '#334155', lineHeight: '1.4', fontFamily: 'inherit', textAlign: 'left' }}>
                      {settings.letterheadHeader}
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        {order.storeId?.name || brandName}
                      </h2>
                      <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#64748b', lineHeight: '1.4' }}>
                        {order.storeId?.address || brandAddress}<br />
                        Phone: {order.storeId?.phone || brandPhone} | Email: {order.storeId?.email || brandEmail}
                      </p>
                    </>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', margin: 0, letterSpacing: '1px' }}>
                    TAX INVOICE
                  </h1>
                  <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#64748b', lineHeight: '1.4' }}>
                    Invoice No: <strong style={{ color: '#1e293b' }}>{order.invoiceNumber || order._id?.slice(-8).toUpperCase()}</strong><br />
                    Date: {formatDate(order.createdAt)} | Time: {formatTime(order.createdAt)}
                  </p>
                  {order.hirePurchaseData && (order.hirePurchaseData.hpCode || order.hirePurchaseData.referenceCode) && (
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#92400e', marginTop: '6px' }}>
                      Installment Reference No: {order.hirePurchaseData.hpCode || order.hirePurchaseData.referenceCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-5">
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>Customer Details</h3>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>{order.customerName || 'Walk-in Customer'}</p>
                  {order.customerPhone && <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0' }}>Phone: {order.customerPhone}</p>}
                  {order.customerNic && <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0' }}>NIC: {order.customerNic}</p>}
                  {order.customerAddress && <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Address: {order.customerAddress}</p>}

                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>Transaction Info</h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px 0' }}>Method: <strong style={{ textTransform: 'uppercase', color: '#1e293b' }}>{order.paymentMethod}</strong></p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Cashier: {order.cashierId?.name || 'System'}</p>
                </div>
              </div>

              {/* Items Grid */}
              <div className="overflow-x-auto w-full mb-5 -mx-1 sm:mx-0">
                <table style={{ width: '100%', minWidth: '440px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: '60px' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: '100px' }}>Price</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', width: '100px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontSize: '12px', color: '#334155' }}>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          {(item.barcode || item.sku) && (
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                              Barcode: {item.barcode || item.sku}
                            </div>
                          )}
                          {(item.imei?.length > 0 || item.imeiNumber) && (
                            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 800, marginTop: '2px' }}>
                              IMEI / S/N: {Array.isArray(item.imei) ? item.imei.join(', ') : (item.imei || item.imeiNumber)}
                            </div>
                          )}
                          {(item.warranty || item.warrantyMonths) && (
                            <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '1px' }}>
                              Warranty: {item.warranty || `${item.warrantyMonths || 12} Months`}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#334155' }}>{item.quantity}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#334155' }}>Rs. {item.price.toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Credit Plan Row */}
              <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-4 sm:gap-8 items-start">
                <div>
                  {order.paymentMethod === 'hire_purchase' && (
                    <div style={{ border: '1px solid #fde68a', background: '#fffbeb', padding: '12px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 800, color: '#92400e', borderBottom: '1px solid #fde68a', paddingBottom: '4px' }}>
                        INSTALLMENT PLAN (CREDIT SALE)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#92400e' }}>
                        <div>HP Reference:</div>
                        <div style={{ fontWeight: 700, textAlign: 'right' }}>{order.hirePurchaseData?.hpCode || 'N/A'}</div>

                        <div>Original Price:</div>
                        <div style={{ fontWeight: 700, textAlign: 'right' }}>Rs. {subtotal.toLocaleString()}</div>

                        <div>Down Payment:</div>
                        <div style={{ fontWeight: 700, textAlign: 'right' }}>Rs. {(order.hirePurchaseData?.downPayment || order.tenderedAmount || 0).toLocaleString()}</div>

                        <div>Interest Added:</div>
                        <div style={{ fontWeight: 700, textAlign: 'right' }}>Rs. {(order.hirePurchaseData?.interestAmount || 0).toLocaleString()}</div>

                        <div>Plan Duration:</div>
                        <div style={{ textAlign: 'right' }}>{order.hirePurchaseData?.numberOfInstallments || 'N/A'} Months</div>

                        <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #fde68a', margin: '4px 0' }} />

                        <div style={{ fontWeight: 800 }}>Installment:</div>
                        <div style={{ fontWeight: 900, fontSize: '13px', color: '#b45309', textAlign: 'right' }}>Rs. {(order.hirePurchaseData?.installmentAmount || 0).toLocaleString()}/month</div>
                      </div>
                    </div>
                  )}

                  {order.isCredit && !order.hirePurchaseData && (
                    <div style={{ border: '1px solid #fcd34d', background: '#fffbeb', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px', color: '#92400e' }}>
                        <span>Paid Advance:</span>
                        <span style={{ fontWeight: 700 }}>Rs. {(order.amountPaid || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>
                        <span>Balance Outstanding:</span>
                        <span>Rs. {(order.creditBalance || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginLeft: 'auto', width: '100%', maxWidth: '320px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748b' }}>
                    <span>Subtotal:</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#dc2626' }}>
                      <span>Discount:</span>
                      <span>-Rs. {totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {showTax && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748b' }}>
                      <span>Tax:</span>
                      <span>Rs. {taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #e2e8f0', fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                    <span>GRAND TOTAL:</span>
                    <span>Rs. {order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer Terms, Letterhead & Seal */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-6 pt-4 border-t border-slate-300">
                <div className="w-full sm:w-[65%] text-[10px] text-slate-500 text-left">
                  {settings?.letterheadFooter ? (
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.4', marginBottom: '8px' }}>
                      {settings.letterheadFooter}
                    </div>
                  ) : (
                    <p style={{ margin: '0 0 6px 0' }}>{settings?.receiptSettings?.footerMessage || 'Thank you for your purchase!'}</p>
                  )}
                  {settings?.receiptSettings?.termsAndConditions && <p style={{ margin: '0 0 4px 0', fontSize: '9px', fontStyle: 'italic' }}>T&C: {settings.receiptSettings.termsAndConditions}</p>}
                  {showWarranty && settings?.receiptSettings?.warrantyTerms && <p style={{ margin: 0, fontSize: '9px', fontStyle: 'italic' }}>Warranty: {settings.receiptSettings.warrantyTerms}</p>}
                </div>

                <div className="w-full sm:w-[30%] flex flex-col items-center justify-end">
                  {(settings?.sealUrl || settings?.seal) && (
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <img src={getImageUrl(settings.sealUrl || settings.seal)} alt="Seal" style={{ width: '64px', height: '64px', objectFit: 'contain', opacity: 0.8, margin: '0 auto' }} />
                      <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Seal</div>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #cbd5e1', width: '100%', textAlign: 'center', paddingTop: '4px', fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                    Authorized Signature
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════ Narrow POS Receipt Layout (80mm Style) ═══════ */
            <div style={{ fontFamily: "'Courier New', Courier, monospace" }}>
              {/* Store Header */}
              <div style={{ textAlign: settings?.receiptSettings?.logoAlignment || 'center', borderBottom: '2px solid #111', paddingBottom: '12px', marginBottom: '10px' }}>
                {(settings?.logoUrl || settings?.logo) && settings?.receiptSettings?.showLogo !== false && (
                  <img
                    src={getImageUrl(settings.logoUrl || settings.logo)}
                    alt="Shop Logo"
                    style={{
                      width: `${settings?.receiptSettings?.logoWidth || 120}px`,
                      maxHeight: '80px',
                      objectFit: 'contain',
                      margin: settings?.receiptSettings?.logoAlignment === 'left' ? '0 0 6px 0' : settings?.receiptSettings?.logoAlignment === 'right' ? '0 0 6px auto' : '0 auto 6px',
                      display: 'block'
                    }}
                  />
                )}
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 2px', color: '#111', letterSpacing: '1px' }}>
                  {settings?.receiptSettings?.headerTitle || order.storeId?.name || brandName}
                </h2>
                {(settings?.receiptSettings?.subtitle || order.storeId?.address || brandAddress) && (
                  <p style={{ fontSize: '10px', margin: '0', color: '#555' }}>
                    {settings?.receiptSettings?.subtitle || order.storeId?.address || brandAddress}
                  </p>
                )}
                {(order.storeId?.phone || brandPhone) && (
                  <p style={{ fontSize: '10px', margin: '0', color: '#555' }}>
                    Tel: {order.storeId?.phone || brandPhone}
                    {(order.storeId?.email || brandEmail) && ` | ${order.storeId?.email || brandEmail}`}
                  </p>
                )}
              </div>

              {/* Invoice Title */}
              <div style={{ textAlign: 'center', margin: '8px 0' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, letterSpacing: '3px', color: '#333' }}>
                  {order.quotationNumber ? 'QUOTATION' : (documentTemplate.title || 'RECEIPT').toUpperCase()}
                </p>
              </div>

              {/* Invoice Meta */}
              <div style={{ fontSize: '11px', borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0', margin: '6px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>{order.quotationNumber ? 'Quotation #' : 'Invoice #'}</span>
                  <span style={{ fontWeight: 700, color: '#111' }}>{order.quotationNumber || order.invoiceNumber || order._id?.slice(-8).toUpperCase()}</span>
                </div>
                {order.hirePurchaseData && (order.hirePurchaseData.hpCode || order.hirePurchaseData.referenceCode) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 'bold', color: '#92400e' }}>Installment Reference No:</span>
                    <span style={{ fontWeight: 'bold', color: '#92400e' }}>{order.hirePurchaseData.hpCode || order.hirePurchaseData.referenceCode}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Date:</span>
                  <span style={{ color: '#111' }}>{formatDate(order.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Time:</span>
                  <span style={{ color: '#111' }}>{formatTime(order.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Cashier:</span>
                  <span style={{ color: '#111' }}>{order.cashierId?.name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Payment:</span>
                  <span style={{ fontWeight: 700, color: '#111', textTransform: 'uppercase', background: '#f3f4f6', padding: '1px 8px', borderRadius: '4px', fontSize: '10px' }}>
                    {order.paymentMethod}
                  </span>
                </div>
              </div>

              {(order.customerName || order.customerPhone || order.customerNic || order.customerAddress) && (

                <div style={{ fontSize: '11px', borderBottom: '1px dashed #999', padding: '6px 0', margin: '0 0 6px' }}>
                  {order.customerName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: '#666' }}>Customer:</span>
                      <span style={{ color: '#111', fontWeight: 600 }}>{order.customerName}</span>
                    </div>
                  )}
                  {order.customerPhone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>

                      <span style={{ color: '#666' }}>Phone:</span>
                      <span style={{ color: '#111' }}>{order.customerPhone}</span>
                    </div>
                  )}
                  {order.customerNic && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: '#666' }}>NIC:</span>
                      <span style={{ color: '#111' }}>{order.customerNic}</span>
                    </div>
                  )}
                  {order.customerAddress && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>Address:</span>
                      <span style={{ color: '#111', textAlign: 'right', maxWidth: '70%', wordBreak: 'break-word' }}>{order.customerAddress}</span>
                    </div>
                  )}

                </div>
              )}

              {/* Items Table */}
              <div style={{ margin: '8px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 65px 70px', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#666', borderBottom: '1px solid #ddd', padding: '4px 0', textTransform: 'uppercase' }}>
                  <span>Item</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Price</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                </div>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ padding: '5px 0', borderBottom: '1px dotted #eee' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 65px 70px', gap: '4px', fontSize: '11px' }}>
                      <span style={{ color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      <span style={{ textAlign: 'center', color: '#333' }}>{item.quantity}</span>
                      <span style={{ textAlign: 'right', color: '#555' }}>{item.price.toFixed(2)}</span>
                      <span style={{ textAlign: 'right', fontWeight: 600, color: '#111' }}>{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    {(item.barcode || item.sku) && (
                      <div style={{ fontSize: '9px', color: '#666', marginTop: '1px' }}>
                        Barcode: {item.barcode || item.sku}
                      </div>
                    )}
                    {(item.imei?.length > 0 || item.imeiNumber) && (
                      <div style={{ fontSize: '9.5px', color: '#000', fontWeight: 800, marginTop: '1px' }}>
                        IMEI: {Array.isArray(item.imei) ? item.imei.join(', ') : (item.imei || item.imeiNumber)}
                      </div>
                    )}
                    {showWarranty && (item.warranty || item.warrantyMonths) && (
                      <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic', marginTop: '1px' }}>
                        Warranty: {item.warranty || `${item.warrantyMonths || 12} Months`}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '2px solid #333', margin: '8px 0 0', padding: '8px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#555' }}>
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#dc2626' }}>
                    <span>Discount:</span>
                    <span>-Rs. {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {order.couponCode && couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#dc2626' }}>
                    <span>Coupon ({order.couponCode}):</span>
                    <span>-Rs. {couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {showTax && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#555' }}>
                    <span>Tax:</span>
                    <span>Rs. {taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, padding: '8px 0', borderTop: '2px double #333', borderBottom: '2px double #333', margin: '6px 0', color: '#111' }}>
                  <span>TOTAL</span>
                  <span>Rs. {order.totalAmount.toFixed(2)}</span>
                </div>

                {order.paymentMethod === 'cash' && !order.isCredit && (
                  <div style={{ margin: '6px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px', color: '#555' }}>
                      <span>Amount Tendered:</span>
                      <span>Rs. {(order.tenderedAmount || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                      <span>Change Due:</span>
                      <span>Rs. {(order.changeGiven || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {order.isCredit && (
                  <div style={{ margin: '6px 0', border: '1px solid #fde68a', background: '#fffbeb', padding: '6px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px', color: '#92400e' }}>
                      <span>Amount Paid:</span>
                      <span style={{ fontWeight: 700 }}>Rs. {(order.amountPaid || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>
                      <span>Balance Due:</span>
                      <span>Rs. {(order.creditBalance || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {order.paymentMethod === 'hire_purchase' && (
                  <div style={{ margin: '6px 0', border: '1px solid #fcd34d', background: '#fffbeb', padding: '10px', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 800, color: '#92400e', textAlign: 'center', borderBottom: '1px solid #fde68a', paddingBottom: '4px' }}>
                      INSTALLMENT PLAN (HP)
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#92400e' }}>
                      <span>HP Reference:</span>
                      <span style={{ fontWeight: 700 }}>{order.hirePurchaseData?.hpCode || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#92400e' }}>
                      <span>Down Payment:</span>
                      <span style={{ fontWeight: 700 }}>Rs. {(order.hirePurchaseData?.downPayment || order.tenderedAmount || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#92400e' }}>
                      <span>Terms:</span>
                      <span>{order.hirePurchaseData?.numberOfInstallments || 'N/A'} Months</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#b45309', marginTop: '4px', borderTop: '1px dashed #fde68a', paddingTop: '4px' }}>
                      <span>Installment:</span>
                      <span>Rs. {(order.hirePurchaseData?.installmentAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Legal Terms */}
              <div style={{ borderTop: '1px solid #111', paddingTop: '10px', marginTop: '10px' }}>
                {showWarranty && settings?.receiptSettings?.warrantyTerms && (
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 2px', color: '#111' }}>Warranty Policy:</p>
                    <p style={{ fontSize: '8px', color: '#555', margin: 0, lineHeight: '1.2' }}>{settings.receiptSettings.warrantyTerms}</p>
                  </div>
                )}
                {settings?.receiptSettings?.termsAndConditions && (
                  <div>
                    <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 2px', color: '#111' }}>Terms & Conditions:</p>
                    <p style={{ fontSize: '8px', color: '#555', margin: 0, lineHeight: '1.2' }}>{settings.receiptSettings.termsAndConditions}</p>
                  </div>
                )}
              </div>

              {/* Barcode */}
              <div style={{ textAlign: 'center', margin: '10px 0 6px', borderTop: '1px dashed #999', paddingTop: '8px' }}>
                {showBarcode && <svg ref={barcodeRef} style={{ maxWidth: '200px', display: 'block', margin: '0 auto' }}></svg>}

                {(settings?.sealUrl || settings?.seal) && (
                  <img src={getImageUrl(settings.sealUrl || settings.seal)} alt="Seal" style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '6px auto', display: 'block', opacity: 0.8 }} />
                )}

                {(documentTemplate.footerText || settings?.receiptSettings?.footerMessage) && (
                  <p style={{ fontSize: '10px', color: '#111', fontWeight: 700, margin: '8px 0 0' }}>
                    {documentTemplate.footerText || settings.receiptSettings.footerMessage}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #999', paddingTop: '8px', marginTop: '4px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, margin: '0 0 2px', color: '#333' }}>
                  {order.quotationNumber ? 'Quotation valid for 7 days' : 'Thank you for shopping with us!'}
                </p>
                <p style={{ fontSize: '9px', color: '#888', margin: '0 0 2px' }}>
                  Items: {order.items?.reduce((s, i) => s + i.quantity, 0)} | {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                </p>
                <p style={{ fontSize: '8px', color: '#aaa', margin: '4px 0 0' }}>
                  Powered by {brandName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Send Receipt Panel — hidden when printing */}
        <div className="no-print p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
          <h4 className="m-0 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            Send Invoice / Receipt
          </h4>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              type="text"
              placeholder="WhatsApp Number (e.g., 0771234567)"
              value={whatsappRecipient}
              onChange={(e) => setWhatsappRecipient(e.target.value)}
              className="text-xs p-2 border border-emerald-500 rounded-lg bg-white text-slate-800 flex-1 outline-none"
            />
            <button
              type="button"
              onClick={() => sendWhatsAppInvoice({ ...order, customerPhone: whatsappRecipient || order.customerPhone }, brandName, brandPhone)}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              WhatsApp Invoice
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              type="text"
              placeholder="SMS Number (e.g., 0771234567)"
              value={smsRecipient}
              onChange={(e) => setSmsRecipient(e.target.value)}
              className="text-xs p-2 border border-amber-500 rounded-lg bg-white text-slate-800 flex-1 outline-none"
            />
            <button
              type="button"
              onClick={handleSendSms}
              disabled={sendingSms}
              className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {sendingSms ? 'Sending...' : 'Send SMS'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              type="email"
              placeholder="Email Address"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-800 flex-1 outline-none"
            />
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>

        {/* Action buttons — hidden when printing */}
        <div className="pos-invoice-actions no-print border-t border-slate-200 p-3 sm:p-4 flex flex-wrap gap-2.5 justify-end bg-white items-center">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 text-xs sm:text-sm font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer flex items-center gap-2 shadow-sm transition-all"
          >
            <Download size={18} />
            Save PDF
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 text-xs sm:text-sm font-extrabold bg-slate-700 hover:bg-slate-800 text-white rounded-xl cursor-pointer flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer size={18} />
            Print Receipt
          </button>

          {onNewSale && (
            <button className="pos-btn-green pos-btn-lg w-full sm:w-auto justify-center px-3.5 py-2.5 text-xs font-bold" onClick={handleNewSale}>
              <RotateCcw size={14} />
              New Sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
