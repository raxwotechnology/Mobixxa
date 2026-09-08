'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle, AlertTriangle, ShieldCheck, DollarSign, Tag, RefreshCw } from 'lucide-react';
import { calculateTradeInValuation, createTradeInRecord, getPopularTradeInModels } from '../../services/api';
import { toast } from 'react-toastify';
import useCurrencyStore from '../../store/currencyStore';

const TradeInModal = ({ isOpen, onClose, onApplyDiscount }) => {
  const { currency } = useCurrencyStore();
  const [popularModels, setPopularModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [formData, setFormData] = useState({
    brand: 'Apple',
    modelName: 'iPhone 13 Pro 128GB',
    imeiNumber: '',
    storageCapacity: '128GB',
    baseEstimatedPrice: 195000,
    grade: 'Grade B (Minor Scratches)',
    screenCondition: 'good',
    batteryHealth: 85,
    bodyCondition: 'good',
    cameraWorking: true,
    biometricsWorking: true,
    originalBox: true,
    originalCharger: false,
    customerName: '',
    customerPhone: '',
    customerNic: '',
  });

  const [valuationResult, setValuationResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const { data } = await getPopularTradeInModels();
      setPopularModels(data || []);
    } catch (err) {
      console.error('Failed to load trade-in models', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelSelect = (model) => {
    setFormData((prev) => ({
      ...prev,
      brand: model.brand,
      modelName: model.modelName,
      baseEstimatedPrice: model.basePrice,
    }));
  };

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      const { data } = await calculateTradeInValuation(formData);
      setValuationResult(data);
      toast.success('Valuation calculated successfully! 📱');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate valuation');
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveAndApply = async () => {
    if (!valuationResult) return;
    try {
      const recordPayload = {
        ...formData,
        deductions: valuationResult.deductions,
        finalValuationPrice: valuationResult.finalValuationPrice,
        status: 'applied_to_pos',
      };
      await createTradeInRecord(recordPayload);
      toast.success('Trade-In recorded and discount applied to cart!');

      if (onApplyDiscount) {
        onApplyDiscount(valuationResult.finalValuationPrice, `Trade-In: ${formData.brand} ${formData.modelName}`);
      }
      onClose();
    } catch (err) {
      toast.error('Failed to record trade-in transaction');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div
        className="pos-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '900px',
          width: '95%',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', pb: '16px', mb: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: '#0284c7', borderRadius: '12px', color: '#fff' }}>
              <Smartphone size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Used Phone Trade-In & Refurbish Estimator</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Calculate fair market value & apply trade-in discount instantly</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Column: Form inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Model Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Select Preset Model</label>
              <select
                onChange={(e) => {
                  const m = popularModels.find((x) => x.modelName === e.target.value);
                  if (m) handleModelSelect(m);
                }}
                value={formData.modelName}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#1e293b', border: '1px solid #475569', color: '#fff', marginTop: '6px', fontSize: '13px' }}
              >
                {popularModels.map((m) => (
                  <option key={m.modelName} value={m.modelName}>
                    {m.brand} - {m.modelName} (Ref. LKR {m.basePrice.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Brand Name</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Model Name</label>
                <input
                  type="text"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>IMEI Number (Optional)</label>
                <input
                  type="text"
                  placeholder="15-digit IMEI"
                  value={formData.imeiNumber}
                  onChange={(e) => setFormData({ ...formData, imeiNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Base Market Price (LKR)</label>
                <input
                  type="number"
                  value={formData.baseEstimatedPrice}
                  onChange={(e) => setFormData({ ...formData, baseEstimatedPrice: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fbbf24', fontWeight: 'bold', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Condition Evaluation */}
            <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', color: '#38bdf8', fontWeight: 800 }}>PHYSICAL & HARDWARE CONDITION</h4>

              <div>
                <label style={{ fontSize: '12px', color: '#cbd5e1' }}>Overall Device Grade</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '12px', marginTop: '4px' }}
                >
                  <option value="Grade A (Like New)">Grade A (Like New / Minimal signs of use)</option>
                  <option value="Grade B (Minor Scratches)">Grade B (Minor Scratches / Light wear)</option>
                  <option value="Grade C (Dented / Scratched)">Grade C (Dented Housing / Deep Scratches)</option>
                  <option value="Grade D (Faulty / Cracked)">Grade D (Faulty / Cracked Display / Faults)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#cbd5e1' }}>Screen Condition</label>
                  <select
                    value={formData.screenCondition}
                    onChange={(e) => setFormData({ ...formData, screenCondition: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#fff', fontSize: '12px', marginTop: '4px' }}
                  >
                    <option value="good">Perfect / Clean Screen</option>
                    <option value="scratched">Minor Scratches</option>
                    <option value="cracked">Cracked Screen / Display Fault</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#cbd5e1' }}>Battery Health (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.batteryHealth}
                    onChange={(e) => setFormData({ ...formData, batteryHealth: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#38bdf8', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}
                  />
                </div>
              </div>

              {/* Hardware Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.cameraWorking}
                    onChange={(e) => setFormData({ ...formData, cameraWorking: e.target.checked })}
                  />
                  Camera Working
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.biometricsWorking}
                    onChange={(e) => setFormData({ ...formData, biometricsWorking: e.target.checked })}
                  />
                  Face ID / Fingerprint
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.originalBox}
                    onChange={(e) => setFormData({ ...formData, originalBox: e.target.checked })}
                  />
                  Original Box
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.originalCharger}
                    onChange={(e) => setFormData({ ...formData, originalCharger: e.target.checked })}
                  />
                  Original Charger
                </label>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={calculating}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={16} /> {calculating ? 'Calculating Valuation...' : 'Calculate Real-Time Valuation'}
            </button>
          </div>

          {/* Right Column: Valuation Results */}
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 800, borderBottom: '1px solid #334155', pb: '8px' }}>
                VALUATION SUMMARY
              </h3>

              {valuationResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #10b981', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>OFFER TRADE-IN VALUE</p>
                    <h2 style={{ margin: '4px 0 0 0', fontSize: '32px', color: '#10b981', fontWeight: 900 }}>
                      Rs. {valuationResult.finalValuationPrice.toLocaleString()}
                    </h2>
                  </div>

                  <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>RECOMMENDED RESELL RETAIL PRICE</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '16px', color: '#fbbf24', fontWeight: 800 }}>
                      Rs. {valuationResult.recommendedRetailResellPrice.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ margin: '8px 0 6px 0', fontSize: '12px', color: '#cbd5e1' }}>Condition Deductions & Adjustments:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                      {valuationResult.deductions?.map((d, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f87171', background: '#2d1b24', padding: '6px 10px', borderRadius: '6px' }}>
                          <span>- {d.reason}</span>
                          <span style={{ fontWeight: 'bold' }}>Rs. {d.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {valuationResult.accessoriesBonus > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4ade80', background: '#143622', padding: '6px 10px', borderRadius: '6px' }}>
                          <span>+ Original Accessories Bonus</span>
                          <span style={{ fontWeight: 'bold' }}>Rs. {valuationResult.accessoriesBonus.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                  <Smartphone size={48} style={{ opacity: 0.3, margin: '0 auto 12px auto' }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>Click "Calculate Real-Time Valuation" to evaluate the phone condition & generate fair market offer value.</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {valuationResult && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleSaveAndApply}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Tag size={18} /> Apply Trade-In Discount to Current Sale
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInModal;
