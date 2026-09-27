'use client';

import { useState, useEffect } from 'react';
import { FileText, Mail, Search, Plus, Trash2, Download, Printer, Eye, X, CheckCircle, Briefcase, DollarSign, Clock, UserCheck, Shield, FileCheck } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmployeeSelector from '../../components/EmployeeSelector';
import { getIssuedLetters, issueLetter, deleteLetter, getAdminUsers, getSettings } from '../../services/api';
import { adminNavGroups as navItems } from './adminNavItems';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const templates = {
  hr: [
    { id: 'offer', name: 'Offer letter', desc: 'Job Offer & Salary Proposal', icon: Mail, type: 'hr' },
    { id: 'appointment', name: 'Appointment', desc: 'Official Appointment Letter', icon: Briefcase, type: 'hr' },
    { id: 'part_time', name: 'Part-time', desc: 'Part Time Employment Contract', icon: Clock, type: 'hr' },
    { id: 'resignation', name: 'Resignation acceptance', desc: 'Resignation Release & Confirmation', icon: UserCheck, type: 'hr' },
    { id: 'salary_confirmation', name: 'Salary confirmation', desc: 'Bank Loan & Salary Certificate', icon: DollarSign, type: 'hr' },
    { id: 'service_cert', name: 'Service & Conduct Certificate', desc: 'Experience & Conduct Recommendation', icon: Shield, type: 'hr' },
  ],
  customer: [
    { id: 'quotation_cover', name: 'Quotation Cover Note', desc: 'Official Quotation Cover Letter', icon: FileText, type: 'customer' },
    { id: 'warranty_cert', name: 'Warranty Guarantee Letter', desc: 'Official Product Warranty Letter', icon: Shield, type: 'customer' },
  ],
  general: [
    { id: 'custom', name: 'Custom Letterhead Letter', desc: 'Blank Company Letterhead Document', icon: FileCheck, type: 'general' },
  ],
};

const AdminLetters = () => {
  const [activeCategory, setActiveCategory] = useState('hr');
  const [issuedLetters, setIssuedLetters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Template / Builder Modal State
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [form, setForm] = useState({
    recipientName: '',
    recipientAddress: '',
    subject: '',
    content: '',
  });

  // View / Print Modal State
  const [previewLetter, setPreviewLetter] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lettersRes, empRes, setRes] = await Promise.all([
        getIssuedLetters(),
        getAdminUsers({ limit: 100 }),
        getSettings().catch(() => ({ data: {} })),
      ]);
      setIssuedLetters(lettersRes.data || []);
      const allUsers = empRes.data?.users || empRes.data || [];
      setEmployees(allUsers.filter(u => u.role !== 'customer'));
      setSettings(setRes.data || {});
    } catch {
      toast.error('Failed to load letters & settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployeeForTemplate = (empId) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e._id === empId);
    if (!emp) return;

    const shopName = settings?.shopName || 'Mobixa';
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    let defaultSubj = '';
    let defaultContent = '';

    if (selectedTemplate?.id === 'offer') {
      defaultSubj = `Job Offer: Position of ${emp.role?.toUpperCase() || 'Staff'} at ${shopName}`;
      defaultContent = `Dear ${emp.name},\n\nWe are pleased to offer you the position of ${emp.role?.toUpperCase() || 'Staff Member'} at ${shopName}. Your monthly base compensation will be LKR ${Number(emp.employeeInfo?.salary || 0).toLocaleString()}.\n\nYour duties will commence on ${dateStr}. Please sign and return the duplicate of this letter to confirm your acceptance.\n\nSincerely,\nManagement\n${shopName}`;
    } else if (selectedTemplate?.id === 'appointment') {
      defaultSubj = `Official Appointment Letter - ${emp.name}`;
      defaultContent = `Dear ${emp.name},\n\nWith reference to your application and interview, we have pleasure in appointing you as ${emp.role?.toUpperCase() || 'Staff Member'} at ${shopName}.\n\nYour basic monthly salary is fixed at LKR ${Number(emp.employeeInfo?.salary || 0).toLocaleString()}. You will be governed by the company rules, attendance policy, and code of conduct.\n\nWelcome to our team.\n\nAuthorized Signature\n${shopName}`;
    } else if (selectedTemplate?.id === 'salary_confirmation') {
      defaultSubj = `Salary & Employment Confirmation Letter`;
      defaultContent = `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${emp.name} (NIC: ${emp.employeeInfo?.nic || 'N/A'}) is presently employed at ${shopName} as ${emp.role?.toUpperCase() || 'Staff Member'}.\n\nHe/She is drawing a gross monthly remuneration of LKR ${Number(emp.employeeInfo?.salary || 0).toLocaleString()}.\n\nThis certificate is issued upon the request of the employee for banking / official purposes.\n\nYours faithfully,\nHuman Resources Department\n${shopName}`;
    } else if (selectedTemplate?.id === 'service_cert') {
      defaultSubj = `Certificate of Service & Conduct`;
      defaultContent = `TO WHOM IT MAY CONCERN\n\nThis is to certify that ${emp.name} has served at ${shopName} as ${emp.role?.toUpperCase() || 'Staff Member'}.\n\nDuring his/her tenure, we found him/her to be hardworking, punctual, honest, and dedicated to duty. We wish him/her all success in future endeavors.\n\nManagement\n${shopName}`;
    } else {
      defaultSubj = `${selectedTemplate?.name || 'Official Letter'} - ${emp.name}`;
      defaultContent = `Dear ${emp.name},\n\n[Write letter body content here]\n\nSincerely,\n${shopName}`;
    }

    setForm({
      recipientName: emp.name,
      recipientAddress: emp.employeeInfo?.bankName ? `Bank Account: ${emp.employeeInfo.bankName} (${emp.employeeInfo.bankAccount || ''})` : 'Colombo, Sri Lanka',
      subject: defaultSubj,
      content: defaultContent,
    });
  };

  const handleOpenTemplateModal = (tpl) => {
    setSelectedTemplate(tpl);
    setSelectedEmpId('');
    setForm({
      recipientName: '',
      recipientAddress: '',
      subject: `${tpl.name}`,
      content: '',
    });
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category: selectedTemplate.type,
        letterType: selectedTemplate.id,
        title: selectedTemplate.name,
        employeeId: selectedEmpId || null,
        recipientName: form.recipientName,
        recipientAddress: form.recipientAddress,
        subject: form.subject,
        content: form.content,
      };

      const res = await issueLetter(payload);
      toast.success('Official letter generated & saved');
      setSelectedTemplate(null);
      fetchData();
      setPreviewLetter(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue letter');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteLetter(itemToDelete._id);
      toast.success('Letter record deleted');
      setDeleteModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to delete letter');
    }
  };

  const downloadPDFLetter = (ltr) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const shopName = settings?.shopName || 'Mobixa';
      const address = settings?.address || 'Main Street, Colombo 03';
      const phone = settings?.phone || '077 123 4567';

      // Header Banner / Letterhead
      doc.setFillColor(30, 41, 59); // Slate-900
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(shopName.toUpperCase(), 15, 16);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`${address} • Tel: ${phone}`, 15, 24);

      // Reference & Date
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Ref: ${ltr.referenceNo}`, 15, 42);
      doc.text(`Date: ${new Date(ltr.issueDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 195, 42, { align: 'right' });

      // Recipient Address
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`To: ${ltr.recipientName}`, 15, 54);
      if (ltr.recipientAddress) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(ltr.recipientAddress, 15, 60);
      }

      // Subject Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`SUBJECT: ${ltr.subject || ltr.title}`, 15, 75);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 78, 195, 78);

      // Letter Body Content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(ltr.content, 180);
      doc.text(splitText, 15, 88);

      // Authorized Signature Block at Bottom
      const endY = Math.max(220, 95 + (splitText.length * 6));
      doc.setDrawColor(203, 213, 225);
      doc.line(15, endY, 75, endY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized Signature', 15, endY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${shopName} Management`, 15, endY + 11);

      doc.save(`Letter_${ltr.referenceNo}_${ltr.recipientName}.pdf`);
      toast.success('PDF letter downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const filteredLetters = issuedLetters.filter(l =>
    l.referenceNo?.toLowerCase().includes(search.toLowerCase()) ||
    l.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
    l.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={navItems} title="Mobixa Admin Panel">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2 m-0">
              <FileText size={24} className="text-brand-indigo" /> Official Letters & Documents
            </h1>
            <p className="text-xs font-normal text-slate-500 mt-1 m-0">
              Choose a letter category & template — content is automatically formatted with official company letterhead
            </p>
          </div>
        </div>

        {/* Raxwo Style TEMPLATES Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 m-0">Templates</h2>
              <p className="text-xs font-semibold text-slate-400 m-0">Select template to generate custom company letter</p>
            </div>
            {/* Category Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveCategory('hr')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                  activeCategory === 'hr' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HR & Employee
              </button>
              <button
                onClick={() => setActiveCategory('customer')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                  activeCategory === 'customer' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => setActiveCategory('general')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                  activeCategory === 'general' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                General / Shared
              </button>
            </div>
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates[activeCategory].map(tpl => {
              const Icon = tpl.icon;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleOpenTemplateModal(tpl)}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-indigo/40 hover:bg-slate-100/80 transition-all cursor-pointer group flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white text-slate-700 group-hover:bg-brand-indigo group-hover:text-white flex items-center justify-center border border-slate-200 group-hover:border-transparent transition-all shadow-xs shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-indigo transition-colors m-0">
                      {tpl.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1 m-0">
                      {tpl.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raxwo Style ISSUED LETTERS Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 m-0">Issued Letters History</h3>
              <p className="text-xs font-semibold text-slate-400 m-0">All generated & saved letters with reference numbers</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, reference..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Employee / Customer</th>
                  <th className="px-5 py-4">Letter Type</th>
                  <th className="px-5 py-4">Issued Date</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">Loading issued letters...</td>
                  </tr>
                ) : filteredLetters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      No issued letters found
                    </td>
                  </tr>
                ) : (
                  filteredLetters.map(ltr => (
                    <tr key={ltr._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-brand-indigo">
                        {ltr.referenceNo}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 m-0">{ltr.recipientName}</p>
                        <p className="text-xs text-slate-400 m-0">{ltr.recipientAddress || 'N/A'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {ltr.title}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {new Date(ltr.issueDate || ltr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPreviewLetter(ltr)}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer border-0"
                            title="View Letterhead Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => downloadPDFLetter(ltr)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer border-0"
                            title="Download PDF Letter"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => { setItemToDelete(ltr); setDeleteModalOpen(true); }}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer border-0"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Template Letter Generator Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0">Generate {selectedTemplate.name}</h3>
                <p className="text-xs text-slate-400 font-semibold m-0">Formatted with official company letterhead</p>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer border-0">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              {/* Optional Employee Auto-Fill Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Auto-fill Employee Details (Optional)</label>
                <EmployeeSelector
                  multiple={false}
                  employees={employees}
                  value={selectedEmpId ? [selectedEmpId] : []}
                  onChange={([id]) => handleSelectEmployeeForTemplate(id || '')}
                  placeholder="Search and select employee..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={form.recipientName}
                    onChange={e => setForm({ ...form, recipientName: e.target.value })}
                    placeholder="e.g. Kasun Perera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Address / Ref Note</label>
                  <input
                    type="text"
                    value={form.recipientAddress}
                    onChange={e => setForm({ ...form, recipientAddress: e.target.value })}
                    placeholder="e.g. Colombo, Sri Lanka"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Letter Subject *</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Job Offer & Terms of Employment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Letter Body Content *</label>
                <textarea
                  required
                  rows={8}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write body paragraphs..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono leading-relaxed text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-indigo hover:bg-brand-violet text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} /> Generate & Save Official Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Letterhead Preview Modal */}
      {previewLetter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 relative text-left">
            <button
              onClick={() => setPreviewLetter(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer border-0"
            >
              <X size={16} />
            </button>

            {/* Official Letterhead Header */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-wider m-0 uppercase">{settings?.shopName || 'Mobixa'}</h2>
                <p className="text-xs text-slate-300 m-0 mt-0.5">{settings?.address || 'Colombo, Sri Lanka'} • Tel: {settings?.phone || '077 123 4567'}</p>
              </div>
              <span className="font-mono text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-brand-indigo">
                {previewLetter.referenceNo}
              </span>
            </div>

            <div className="space-y-4 text-xs text-slate-800 font-medium leading-relaxed">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <div>
                  <p className="font-bold text-slate-900 m-0">To: {previewLetter.recipientName}</p>
                  <p className="text-xs text-slate-500 m-0">{previewLetter.recipientAddress}</p>
                </div>
                <p className="text-xs font-bold text-slate-400 m-0">
                  Date: {new Date(previewLetter.issueDate || previewLetter.createdAt).toLocaleDateString()}
                </p>
              </div>

              <p className="font-bold text-sm text-slate-900 uppercase border-b border-slate-100 pb-2 m-0">
                SUBJECT: {previewLetter.subject || previewLetter.title}
              </p>

              <div className="whitespace-pre-wrap font-sans text-slate-700 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                {previewLetter.content}
              </div>

              <div className="pt-8 border-t border-slate-200 flex justify-between items-end">
                <div>
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <p className="font-bold text-slate-900 m-0">Authorized Signature</p>
                  <p className="text-xs text-slate-400 m-0">{settings?.shopName || 'Mobixa'} Management</p>
                </div>
                <button
                  onClick={() => downloadPDFLetter(previewLetter)}
                  className="bg-brand-indigo hover:bg-brand-violet text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border-0 shadow-sm flex items-center gap-2"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete ? `Letter ${itemToDelete.referenceNo} (${itemToDelete.recipientName})` : ''}
      />
    </DashboardLayout>
  );
};

export default AdminLetters;
