'use client';

import { useState, useRef } from 'react';
import { convertExternalUrl } from '../../utils/imageHelper';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, FileText, X, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { createProduct } from '../../services/api';

/**
 * Parses a CSV string into an array of row objects using the first row as headers.
 */
const parseCSV = (text) => {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    // Handle quoted commas
    const cols = [];
    let cur = '';
    let inQuote = false;
    for (let c of line) {
      if (c === '"') { inQuote = !inQuote; continue; }
      if (c === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    cols.push(cur.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return row;
  });
};

const PRODUCTS_TEMPLATE_HEADERS = 'name,categoryId,brand,price,mrp,stock,purchasePrice,unit,description,warranty,color,condition,productLink,images';
const PHONES_TEMPLATE_HEADERS = 'name,brand,modelNumber,categoryId,ram,storage,color,condition,price,mrp,stock,purchasePrice,imei,warranty,productLink,images';

const PRODUCTS_TEMPLATE_EXAMPLE = `${PRODUCTS_TEMPLATE_HEADERS}
Samsung Galaxy A15,Phones,Samsung,45000,50000,10,38000,pcs,Budget smartphone,1 Year,Black,new,https://example.com/a15.jpg,https://example.com/a15-side.jpg
iPhone 15 Pro,Phones,Apple,200000,220000,5,175000,pcs,Flagship iPhone,1 Year,Silver,new,https://example.com/i15.jpg,https://example.com/i15-back.jpg`;

const PHONES_TEMPLATE_EXAMPLE = `${PHONES_TEMPLATE_HEADERS}
Samsung Galaxy S24,Samsung,SM-S921B,Phones,8GB,128GB,Phantom Black,new,120000,130000,5,100000,358756080986789,1 Year,https://example.com/s24.jpg,https://example.com/s24-2.jpg
iPhone 15 Pro Max,Apple,A3108,Phones,8GB,256GB,Natural Titanium,new,220000,240000,3,195000,352180112345678,1 Year,https://example.com/i15pm.jpg,https://example.com/i15pm-2.jpg`;

const downloadTemplate = (type) => {
  const content = type === 'phones' ? PHONES_TEMPLATE_EXAMPLE : PRODUCTS_TEMPLATE_EXAMPLE;
  const filename = type === 'phones' ? 'phones_import_template.csv' : 'products_import_template.csv';
  const blob = new Blob([content], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

const mapRowToProduct = (row, type, storeId, categories) => {
  // Try to resolve categoryId
  let categoryId = row.categoryId || row.category || '';
  if (categoryId && categories?.length) {
    const match = categories.find(
      (c) => c.name?.toLowerCase() === categoryId.toLowerCase() || c._id === categoryId
    );
    if (match) categoryId = match._id;
  }

  // Normalize image links
  const rawProductLink = row.productLink || (row.images ? row.images.split('|')[0].trim() : '');
  const productLink = convertExternalUrl(rawProductLink);

  const images = row.images 
    ? row.images.split('|').map(s => convertExternalUrl(s.trim())).filter(Boolean) 
    : (productLink ? [productLink] : []);

  const base = {
    name: (row.name || '').trim(),
    categoryId,
    brand: row.brand || '',
    price: Number(row.price) || 0,
    mrp: Number(row.mrp) || Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    purchasePrice: Number(row.purchasePrice) || 0,
    unit: row.unit || 'pcs',
    description: row.description || '',
    warranty: row.warranty || '',
    color: row.color || '',
    condition: ['new', 'used', 'refurbished'].includes(row.condition) ? row.condition : 'new',
    storeId,
    productLink,
    images,
  };

  if (type === 'phones') {
    base.modelNumber = row.modelNumber || '';
    base.ram = row.ram || '';
    base.storage = row.storage || '';
    base.imei = row.imei ? [row.imei] : [];
  }

  return base;
};

const ExcelImportPanel = ({ storeId, categories, onImportComplete }) => {
  const [importType, setImportType] = useState('products'); // 'products' | 'phones'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null); // { success: [], failed: [] }
  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=results
  const fileRef = useRef();

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResults(null);
    setStep(1);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
      toast.error('Please upload a .csv file. Excel .xlsx files must be saved as CSV first.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      const mapped = rows
        .filter((r) => r.name?.trim())
        .map((r) => mapRowToProduct(r, importType, storeId, categories));
      setPreview(mapped);
      setStep(2);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    const success = [];
    const failed = [];

    for (const product of preview) {
      try {
        if (!product.name) throw new Error('Product name is required');
        if (!product.price || product.price <= 0) throw new Error('Valid price is required');
        await createProduct(product);
        success.push({ name: product.name, status: 'ok' });
      } catch (err) {
        failed.push({ name: product.name || 'Unknown', error: err.response?.data?.message || err.message });
      }
    }

    setResults({ success, failed });
    setStep(3);
    setImporting(false);

    if (success.length > 0) {
      toast.success(`✅ ${success.length} product(s) imported successfully!`);
      onImportComplete?.();
    }
    if (failed.length > 0) {
      toast.error(`❌ ${failed.length} product(s) failed to import.`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-card-border shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-navy flex items-center gap-2">
            <FileText size={22} className="text-primary-blue" />
            Bulk Import via CSV / Excel
          </h2>
          <p className="text-sm text-muted-text mt-1">
            Import multiple products at once from a CSV spreadsheet.
          </p>
        </div>
        {step > 1 && (
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-red-500 hover:underline font-medium">
            <X size={16} /> Start Over
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {['Upload File', 'Preview', 'Results'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${step === i + 1 ? 'bg-primary-blue text-white' : step > i + 1 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-muted-text'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-dark-navy' : 'text-muted-text'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-dark-navy mb-2">Import Type</label>
            <div className="flex gap-3">
              {[{ id: 'products', label: '📦 General Products' }, { id: 'phones', label: '📱 Mobile Phones' }].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setImportType(t.id)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all
                    ${importType === t.id ? 'border-primary-blue bg-indigo-50 text-primary-blue' : 'border-card-border text-muted-text hover:bg-gray-50'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Download template */}
          <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-dark-navy">Download CSV Template</p>
              <p className="text-xs text-muted-text mt-0.5">Fill in the template and re-upload. You can open it in Excel.</p>
            </div>
            <button
              onClick={() => downloadTemplate(importType)}
              className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              <Download size={16} /> Download Template
            </button>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed border-card-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary-blue hover:bg-indigo-50/30 transition-all"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: e.dataTransfer.files } }); }}
          >
            <Upload size={36} className="text-primary-blue mx-auto mb-3" />
            <p className="font-semibold text-dark-navy">Click to upload or drag & drop</p>
            <p className="text-sm text-muted-text mt-1">CSV files only (.csv). Save your Excel file as CSV first.</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>

          {/* Field guide */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 mb-2">📋 Required Columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {(importType === 'phones'
                ? ['name', 'brand', 'categoryId', 'price', 'stock']
                : ['name', 'categoryId', 'price', 'stock']
              ).map((col) => (
                <span key={col} className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {col} *
                </span>
              ))}
              {(importType === 'phones'
                ? ['modelNumber', 'ram', 'storage', 'color', 'condition', 'mrp', 'purchasePrice', 'imei', 'warranty']
                : ['brand', 'color', 'mrp', 'purchasePrice', 'unit', 'description', 'warranty', 'condition']
              ).map((col) => (
                <span key={col} className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {col}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-amber-700 mt-2">
              💡 <strong>categoryId</strong>: Type the category name (e.g., "Phones") — it will be created automatically if it doesn't exist.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-dark-navy">
              📋 {preview.length} product(s) ready to import from <span className="text-primary-blue">{file?.name}</span>
            </p>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-text hover:underline">
              Change file
            </button>
          </div>

          {preview.length === 0 ? (
            <div className="text-center py-8 text-muted-text">
              <AlertTriangle className="mx-auto mb-2 text-amber-500" size={28} />
              No valid rows found. Make sure the CSV has the correct headers and at least one data row.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-card-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-text">#</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-text">Name</th>
                    {importType === 'phones' && <th className="text-left px-3 py-2.5 font-semibold text-muted-text">Brand</th>}
                    {importType === 'phones' && <th className="text-left px-3 py-2.5 font-semibold text-muted-text">RAM/Storage</th>}
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-text">Category</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-text">Price</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-text">Stock</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-text">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {preview.slice(0, 50).map((p, i) => (
                    <tr key={i} className={`${!p.name ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2 text-muted-text">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-dark-navy">
                        {p.name || <span className="text-red-500">⚠ Missing name</span>}
                      </td>
                      {importType === 'phones' && <td className="px-3 py-2 text-muted-text">{p.brand || '—'}</td>}
                      {importType === 'phones' && <td className="px-3 py-2 text-muted-text">{p.ram}{p.storage ? ` / ${p.storage}` : ''}</td>}
                      <td className="px-3 py-2 text-muted-text">{p.categoryId || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">Rs. {Number(p.price).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{p.stock}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${p.condition === 'new' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.condition}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <p className="text-center text-xs text-muted-text py-2">Showing first 50 of {preview.length} rows</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button onClick={reset} className="px-4 py-2.5 border border-card-border rounded-xl text-sm font-medium text-muted-text hover:bg-gray-50">
              ← Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || preview.length === 0}
              className="flex items-center gap-2 bg-primary-blue text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {importing ? (
                <><Loader size={16} className="animate-spin" /> Importing...</>
              ) : (
                <><Upload size={16} /> Import {preview.length} Products</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && results && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <CheckCircle size={28} className="text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-700">{results.success.length}</p>
              <p className="text-sm text-emerald-600">Successfully Imported</p>
            </div>
            <div className={`${results.failed.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-card-border'} border rounded-2xl p-4 text-center`}>
              <XCircle size={28} className={`${results.failed.length > 0 ? 'text-red-400' : 'text-gray-300'} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${results.failed.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>{results.failed.length}</p>
              <p className={`text-sm ${results.failed.length > 0 ? 'text-red-600' : 'text-muted-text'}`}>Failed</p>
            </div>
          </div>

          {/* Failed details */}
          {results.failed.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-bold text-red-700 mb-2">Failed Items:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {results.failed.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                    <XCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span><strong>{f.name}</strong>: {f.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="flex-1 py-2.5 border border-card-border rounded-xl text-sm font-semibold text-muted-text hover:bg-gray-50">
              Import More
            </button>
            <button
              onClick={() => onImportComplete?.()}
              className="flex-1 py-2.5 bg-primary-blue text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Done — View Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImportPanel;
