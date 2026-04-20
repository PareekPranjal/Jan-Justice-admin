import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type CouponCode } from '@/lib/api';
import { Plus, Trash2, Upload, IndianRupee, QrCode, Tag, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConsultancySettings() {
  const queryClient = useQueryClient();
  const qrInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => adminApi.getSettings(),
  });

  // Local state — mirrors settings fields
  const [fee, setFee] = useState<string>('');
  const [upiId, setUpiId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [initialised, setInitialised] = useState(false);
  const [saved, setSaved] = useState(false);

  // New coupon form
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'fixed'>('fixed');
  const [newValue, setNewValue] = useState('');
  const [couponError, setCouponError] = useState('');

  if (settings && !initialised) {
    setFee(String(settings.consultationFee));
    setUpiId(settings.upiId || '');
    setUpiQrUrl(settings.upiQrUrl || '');
    setCoupons(settings.couponCodes || []);
    setInitialised(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        consultationFee: Number(fee) || 0,
        upiId,
        upiQrUrl,
        couponCodes: coupons,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const uploadQrMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadQrImage(file),
    onSuccess: (data) => {
      setUpiQrUrl(data.url);
    },
  });

  const addCoupon = () => {
    const code = newCode.trim().toUpperCase();
    if (!code) { setCouponError('Code is required'); return; }
    if (!newValue || isNaN(Number(newValue)) || Number(newValue) <= 0) { setCouponError('Enter a valid discount value'); return; }
    if (coupons.some(c => c.code === code)) { setCouponError('This code already exists'); return; }
    if (newType === 'percent' && Number(newValue) > 100) { setCouponError('Percent discount cannot exceed 100'); return; }
    setCouponError('');
    setCoupons([...coupons, { code, discountType: newType, discountValue: Number(newValue), isActive: true }]);
    setNewCode(''); setNewValue('');
  };

  const removeCoupon = (idx: number) => setCoupons(coupons.filter((_, i) => i !== idx));
  const toggleCoupon = (idx: number) =>
    setCoupons(coupons.map((c, i) => i === idx ? { ...c, isActive: !c.isActive } : c));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultancy Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage payment details, QR code, and discount coupons.</p>
      </div>

      {/* Fee */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-800">Consultation Fee</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">₹</span>
          <input
            type="number"
            min="0"
            value={fee}
            onChange={e => setFee(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <span className="text-sm text-gray-500">shown as: <strong>Pay exactly ₹{fee || '0'}</strong></span>
        </div>
      </section>

      {/* UPI + QR */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-800">UPI Payment Details</h2>
        </div>

        {/* UPI ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
          <input
            type="text"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            placeholder="e.g. yourname@upi"
            className="w-full max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        {/* QR Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">UPI QR Code Image</label>
          <div className="flex items-start gap-5">
            {/* Preview */}
            <div className="h-32 w-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
              {upiQrUrl ? (
                <img src={upiQrUrl} alt="QR Code" className="h-full w-full object-contain p-1" />
              ) : (
                <div className="text-center p-2">
                  <QrCode className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-400">No QR yet</span>
                </div>
              )}
            </div>
            {/* Upload controls */}
            <div className="space-y-2 flex-1">
              <button
                onClick={() => qrInputRef.current?.click()}
                disabled={uploadQrMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploadQrMutation.isPending ? 'Uploading...' : 'Upload Image'}
              </button>
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadQrMutation.mutate(file);
                  e.target.value = '';
                }}
              />
              <p className="text-xs text-gray-400">PNG, JPG, or WebP · max 5 MB</p>
              {upiQrUrl && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Or set URL directly</label>
                  <input
                    type="url"
                    value={upiQrUrl}
                    onChange={e => setUpiQrUrl(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Coupon Codes */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-gray-800">Discount Coupons</h2>
        </div>

        {/* Existing coupons */}
        {coupons.length > 0 ? (
          <div className="divide-y border border-gray-100 rounded-lg overflow-hidden">
            {coupons.map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="font-mono text-sm font-semibold text-gray-800 flex-1">{c.code}</span>
                <span className="text-xs text-gray-500">
                  {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                </span>
                <button
                  onClick={() => toggleCoupon(i)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    c.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {c.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => removeCoupon(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No coupons yet.</p>
        )}

        {/* Add new coupon */}
        <div className="border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Coupon</p>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={newCode}
              onChange={e => { setNewCode(e.target.value.toUpperCase()); setCouponError(''); }}
              placeholder="CODE (e.g. WELCOME50)"
              className="w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as 'percent' | 'fixed')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="fixed">₹ Fixed amount</option>
              <option value="percent">% Percent</option>
            </select>
            <input
              type="number"
              min="1"
              max={newType === 'percent' ? 100 : undefined}
              value={newValue}
              onChange={e => { setNewValue(e.target.value); setCouponError(''); }}
              placeholder={newType === 'percent' ? '% e.g. 20' : '₹ e.g. 100'}
              className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <button
              onClick={addCoupon}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {couponError && <p className="text-xs text-red-500">{couponError}</p>}
        </div>
      </section>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
          )}
        >
          {saved ? <><Check className="h-4 w-4" /> Saved!</>
           : saveMutation.isPending ? 'Saving...'
           : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
