'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ContactModal({ open, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  function resetForm() {
    setName('');
    setEmail('');
    setMessage('');
    setResult(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
          name,
          email,
          message,
          subject: `New contact from ${name} via Istifsar`,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({ success: true });
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setResult({ error: data.message ?? 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ error: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/[0.08] bg-[#111014] px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-colors';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Contact form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-md bg-surface-vault border border-white/[0.08] rounded-sm shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-surface-elevated border-b border-white/[0.06]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold">
                Get in Touch
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="text-text-muted-vault hover:text-gold transition-colors"
                aria-label="Close contact form"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {result?.success ? (
                <div className="text-center py-6 space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sage/20 text-sage border border-sage/30">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-200 font-medium">Message sent!</p>
                  <p className="text-xs text-text-muted-vault">Thank you for reaching out. I&apos;ll get back to you soon.</p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-2 text-xs text-gold hover:text-gold/80 uppercase tracking-widest font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-[10px] uppercase tracking-[0.15em] text-text-muted-vault mb-1.5">
                      Name <span className="text-amber-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-[10px] uppercase tracking-[0.15em] text-text-muted-vault mb-1.5">
                      Email <span className="text-amber-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-[10px] uppercase tracking-[0.15em] text-text-muted-vault mb-1.5">
                      Message <span className="text-amber-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can I help you?"
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {result?.error && (
                    <div className="rounded-lg bg-red-950/40 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                      {result.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-gold/90 hover:bg-gold text-black font-bold text-sm py-2.5 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
