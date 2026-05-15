import React, { useState, useEffect } from 'react';
import { FiX, FiCreditCard, FiLock, FiCheck, FiSmartphone, FiPackage } from 'react-icons/fi';

/* ── Card helpers ───────────────────────────────────────────────────── */
const getCardType = (num) => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6/.test(n)) return 'rupay';
  return 'generic';
};
const cardColors = {
  visa: 'linear-gradient(135deg,#1a1f71 0%,#005674 100%)',
  mastercard: 'linear-gradient(135deg,#eb001b 0%,#f79e1b 100%)',
  amex: 'linear-gradient(135deg,#007b5e 0%,#00b09b 100%)',
  rupay: 'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)',
  generic: 'linear-gradient(135deg,#005674 0%,#007095 100%)',
};
const cardLabels = { visa: 'VISA', mastercard: 'MC', amex: 'AMEX', rupay: 'RuPay', generic: '★' };
const formatCardNum = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v) => { const c = v.replace(/\D/g, '').slice(0, 4); return c.length >= 3 ? c.slice(0, 2) + '/' + c.slice(2) : c; };

/* ── UPI apps ───────────────────────────────────────────────────────── */
const UPI_APPS = [
  { id: 'gpay',   label: 'GPay',    color: '#4285F4', emoji: '🅖' },
  { id: 'phonepe',label: 'PhonePe', color: '#5f259f', emoji: '📱' },
  { id: 'paytm',  label: 'Paytm',   color: '#00BAF2', emoji: '💰' },
  { id: 'other',  label: 'Other',   color: '#64748b', emoji: '🔗' },
];

/* ═══════════════════════════════════════════════════════════════════ */
const MockPaymentModal = ({ amount, onSuccess, onClose, title = 'Complete Payment' }) => {
  const [method, setMethod] = useState('card');       // 'card' | 'upi' | 'cod'
  const [step, setStep]     = useState('form');        // 'form' | 'processing' | 'success'
  const [card, setCard]     = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upi,  setUpi]      = useState({ id: '', app: '' });
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const cardType = getCardType(card.number);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  /* Progress animation */
  useEffect(() => {
    if (step !== 'processing') return;
    let p = 0;
    const iv = setInterval(() => { p += Math.random() * 18; if (p >= 100) { p = 100; clearInterval(iv); } setProgress(Math.min(p, 100)); }, 180);
    return () => clearInterval(iv);
  }, [step]);

  /* ── Validation ───────────────────────────────────────────────── */
  const validateCard = () => {
    const e = {};
    if (card.number.replace(/\s/g, '').length < 16) e.number = 'Enter a valid 16-digit card number';
    if (card.name.trim().length < 3)                 e.name   = 'Enter cardholder name';
    if (card.expiry.length < 5)                      e.expiry = 'Enter valid expiry (MM/YY)';
    if (card.cvv.length < 3)                         e.cvv    = 'Enter valid CVV';
    setErrors(e); return !Object.keys(e).length;
  };
  const validateUpi = () => {
    const e = {};
    if (!/^[\w.\-]+@[\w]+$/.test(upi.id.trim())) e.id = 'Enter a valid UPI ID (e.g. name@upi)';
    setErrors(e); return !Object.keys(e).length;
  };

  /* ── Pay handler ──────────────────────────────────────────────── */
  const handlePay = () => {
    if (method === 'card' && !validateCard()) return;
    if (method === 'upi'  && !validateUpi())  return;
    setStep('processing');
    setTimeout(() => { setStep('success'); setTimeout(() => onSuccess(), 1200); }, 2500);
  };

  const maskedCard = card.number
    ? card.number.replace(/\s/g, '').padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim()
    : '•••• •••• •••• ••••';

  const TABS = [
    { id: 'card', label: 'Card',     icon: <FiCreditCard size={15}/> },
    { id: 'upi',  label: 'UPI',      icon: <FiSmartphone size={15}/> },
    { id: 'cod',  label: 'Cash on Exchange', icon: <FiPackage size={15}/> },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:430, boxShadow:'0 32px 80px rgba(0,0,0,0.3)', overflow:'hidden', animation:'slideUp 0.3s ease' }}>
        <style>{`
          @keyframes slideUp   { from{ transform:translateY(24px);opacity:0 } to{ transform:translateY(0);opacity:1 } }
          @keyframes spin      { to  { transform:rotate(360deg) } }
          @keyframes checkPop  { from{ transform:scale(0) } to{ transform:scale(1) } }
          @keyframes fadeIn    { from{ opacity:0;transform:translateY(8px) } to{ opacity:1;transform:translateY(0) } }
          .pay-input { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:12px 14px;
            font-size:15px; outline:none; transition:border-color 0.2s; font-family:inherit; box-sizing:border-box; }
          .pay-input:focus { border-color:#005674; }
          .pay-input.err  { border-color:#ef4444; }
          .pay-tab { flex:1; padding:10px 6px; border:none; border-radius:10px; cursor:pointer;
            font-size:12px; font-weight:700; font-family:inherit; display:flex; align-items:center;
            justify-content:center; gap:5px; transition:all 0.2s; }
          .pay-tab.active { background:linear-gradient(135deg,#003d55,#005674); color:#fff; box-shadow:0 4px 12px rgba(0,86,116,0.3); }
          .pay-tab.inactive { background:#f1f5f9; color:#64748b; }
          .pay-tab.inactive:hover { background:#e2e8f0; }
          .upi-app-btn { flex:1; padding:10px 6px; border:2px solid #e2e8f0; border-radius:12px; cursor:pointer;
            font-size:11px; font-weight:700; font-family:inherit; background:#fff; text-align:center;
            transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:4px; }
          .upi-app-btn.selected { border-color:#005674; background:#f0f9ff; color:#005674; }
          .upi-app-btn:hover { border-color:#005674; }
        `}</style>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ background:'linear-gradient(135deg,#003d55,#005674)', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, fontWeight:600, marginBottom:2 }}>SECURE PAYMENT · STUDENTMART</div>
            <div style={{ color:'#fff', fontSize:22, fontWeight:800 }}>₹{Number(amount).toLocaleString()}</div>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:12, marginTop:2 }}>{title}</div>
          </div>
          {step === 'form' && (
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FiX size={18}/>
            </button>
          )}
        </div>

        {/* ── FORM STEP ───────────────────────────────────────── */}
        {step === 'form' && (
          <div style={{ padding:24 }}>

            {/* Payment Method Tabs */}
            <div style={{ display:'flex', gap:8, marginBottom:22, background:'#f8fafc', borderRadius:14, padding:6 }}>
              {TABS.map(t => (
                <button key={t.id} className={`pay-tab ${method === t.id ? 'active' : 'inactive'}`} onClick={() => { setMethod(t.id); setErrors({}); }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── CARD FORM ─── */}
            {method === 'card' && (
              <div style={{ animation:'fadeIn 0.25s ease' }}>
                {/* Card Preview */}
                <div style={{ background:cardColors[cardType], borderRadius:14, padding:'18px 20px', marginBottom:20, color:'#fff', position:'relative', overflow:'hidden', minHeight:110 }}>
                  <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
                  <div style={{ position:'absolute', top:20, right:-30, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
                  <div style={{ fontSize:13, opacity:0.7, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>💳 Credit / Debit Card</span>
                    <span style={{ fontWeight:800, fontSize:15 }}>{cardLabels[cardType]}</span>
                  </div>
                  <div style={{ fontSize:17, letterSpacing:'0.2em', fontWeight:600, marginBottom:10, fontFamily:'monospace' }}>{maskedCard}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, opacity:0.85 }}>
                    <span>{card.name.toUpperCase() || 'CARDHOLDER NAME'}</span>
                    <span>{card.expiry || 'MM/YY'}</span>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, display:'block' }}>CARD NUMBER</label>
                  <div style={{ position:'relative' }}>
                    <input className={`pay-input${errors.number?' err':''}`} placeholder="1234 5678 9012 3456" value={card.number} onChange={e=>setCard(c=>({...c,number:formatCardNum(e.target.value)}))} inputMode="numeric" style={{ paddingRight:44 }}/>
                    <FiCreditCard style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                  </div>
                  {errors.number && <div style={{ color:'#ef4444', fontSize:11, marginTop:4 }}>{errors.number}</div>}
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, display:'block' }}>CARDHOLDER NAME</label>
                  <input className={`pay-input${errors.name?' err':''}`} placeholder="Name as on card" value={card.name} onChange={e=>setCard(c=>({...c,name:e.target.value}))}/>
                  {errors.name && <div style={{ color:'#ef4444', fontSize:11, marginTop:4 }}>{errors.name}</div>}
                </div>
                <div style={{ display:'flex', gap:12, marginBottom:20 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, display:'block' }}>EXPIRY</label>
                    <input className={`pay-input${errors.expiry?' err':''}`} placeholder="MM/YY" value={card.expiry} onChange={e=>setCard(c=>({...c,expiry:formatExpiry(e.target.value)}))} inputMode="numeric" maxLength={5}/>
                    {errors.expiry && <div style={{ color:'#ef4444', fontSize:11, marginTop:4 }}>{errors.expiry}</div>}
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, display:'block' }}>CVV</label>
                    <input className={`pay-input${errors.cvv?' err':''}`} placeholder="•••" type="password" value={card.cvv} onChange={e=>setCard(c=>({...c,cvv:e.target.value.replace(/\D/g,'').slice(0,4)}))} inputMode="numeric" maxLength={4}/>
                    {errors.cvv && <div style={{ color:'#ef4444', fontSize:11, marginTop:4 }}>{errors.cvv}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── UPI FORM ─── */}
            {method === 'upi' && (
              <div style={{ animation:'fadeIn 0.25s ease' }}>
                {/* UPI App Quick Select */}
                <div style={{ marginBottom:18 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:10, display:'block' }}>SELECT UPI APP</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {UPI_APPS.map(app => (
                      <button key={app.id} className={`upi-app-btn${upi.app===app.id?' selected':''}`} onClick={()=>setUpi(u=>({...u,app:app.id}))}>
                        <span style={{ fontSize:20 }}>{app.emoji}</span>
                        <span style={{ color: upi.app===app.id ? '#005674' : '#475569' }}>{app.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* UPI ID Input */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6, display:'block' }}>UPI ID</label>
                  <div style={{ position:'relative' }}>
                    <input
                      className={`pay-input${errors.id?' err':''}`}
                      placeholder="yourname@upi / yourname@okaxis"
                      value={upi.id}
                      onChange={e=>{ setUpi(u=>({...u,id:e.target.value})); setErrors({}); }}
                    />
                    <FiSmartphone style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                  </div>
                  {errors.id && <div style={{ color:'#ef4444', fontSize:11, marginTop:4 }}>{errors.id}</div>}
                </div>
                <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#0369a1', marginBottom:20, display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ fontSize:16 }}>ℹ️</span>
                  <span>A payment request will be sent to your UPI app. Open the app to approve.</span>
                </div>
              </div>
            )}

            {/* ── CASH ON EXCHANGE ─── */}
            {method === 'cod' && (
              <div style={{ animation:'fadeIn 0.25s ease' }}>
                <div style={{ textAlign:'center', padding:'10px 0 20px' }}>
                  <div style={{ fontSize:56, marginBottom:12 }}>🤝</div>
                  <div style={{ fontSize:17, fontWeight:800, color:'#1e293b', marginBottom:8 }}>Cash on Exchange</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:20 }}>
                    Pay <strong>₹{Number(amount).toLocaleString()}</strong> in cash when you physically meet the seller and exchange the item on campus.
                  </div>
                  <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:16, textAlign:'left' }}>
                    {[
                      '📍 Agree on a safe campus meeting spot with the seller via chat',
                      '🔍 Inspect the item carefully before paying',
                      '💵 Pay the exact amount in cash at the time of exchange',
                      '✅ Both parties confirm the exchange is complete',
                    ].map((tip, i) => (
                      <div key={i} style={{ fontSize:12, color:'#166534', marginBottom: i < 3 ? 10 : 0, display:'flex', gap:8 }}>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Pay / Confirm Button ─── */}
            <button onClick={handlePay} style={{
              width:'100%', background:'linear-gradient(135deg,#005674,#007095)',
              color:'#fff', border:'none', borderRadius:12, padding:'15px',
              fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              boxShadow:'0 8px 24px rgba(0,86,116,0.35)', transition:'transform 0.1s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}
              onMouseDown={e=>e.currentTarget.style.transform='scale(0.98)'}
              onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
            >
              {method === 'card' && <><FiLock size={16}/> Pay ₹{Number(amount).toLocaleString()} Securely</>}
              {method === 'upi'  && <><FiSmartphone size={16}/> Send UPI Request</>}
              {method === 'cod'  && <><FiPackage size={16}/> Confirm — Pay Cash on Exchange</>}
            </button>

            <div style={{ textAlign:'center', marginTop:12, fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <FiLock size={11}/> Secured by StudentMart · 256-bit SSL
            </div>
          </div>
        )}

        {/* ── PROCESSING ────────────────────────────────────────── */}
        {step === 'processing' && (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ width:64, height:64, border:'4px solid #e2e8f0', borderTopColor:'#005674', borderRadius:'50%', margin:'0 auto 24px', animation:'spin 0.8s linear infinite' }}/>
            <div style={{ fontSize:18, fontWeight:700, color:'#1e293b', marginBottom:8 }}>
              {method === 'card' ? 'Processing Payment...' : method === 'upi' ? 'Sending UPI Request...' : 'Confirming Order...'}
            </div>
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24 }}>Please don't close this window</div>
            <div style={{ background:'#f1f5f9', borderRadius:9999, height:6, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#005674,#00b4d8)', borderRadius:9999, width:`${progress}%`, transition:'width 0.2s ease' }}/>
            </div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:8 }}>{Math.round(progress)}%</div>
          </div>
        )}

        {/* ── SUCCESS ───────────────────────────────────────────── */}
        {step === 'success' && (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ width:72, height:72, background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'50%', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', animation:'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <FiCheck size={36} color="#fff" strokeWidth={3}/>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'#1e293b', marginBottom:8 }}>
              {method === 'cod' ? 'Order Confirmed! 🤝' : 'Payment Successful! 🎉'}
            </div>
            <div style={{ fontSize:14, color:'#64748b' }}>
              {method === 'cod'
                ? 'Meet the seller on campus to complete the exchange'
                : `₹${Number(amount).toLocaleString()} paid successfully`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockPaymentModal;
