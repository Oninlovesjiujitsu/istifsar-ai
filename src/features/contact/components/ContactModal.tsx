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
    'w-full rounded-sm border border-border/85 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors';

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
            className="w-full max-w-md bg-surface-vault border border-border rounded-sm shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-surface-elevated border-b border-border/60">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                Get in Touch
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="text-text-muted-vault hover:text-primary transition-colors cursor-pointer"
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
                  <p className="text-sm text-foreground font-medium">Message sent!</p>
                  <p className="text-xs text-text-muted-vault">Thank you for reaching out. I&apos;ll get back to you soon.</p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-2 text-xs text-primary hover:text-primary/80 uppercase tracking-widest font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-[10px] uppercase tracking-[0.15em] text-text-muted-vault mb-1.5">
                      Name <span className="text-destructive">*</span>
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
                      Email <span className="text-destructive">*</span>
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
                      Message <span className="text-destructive">*</span>
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
                    <div className="rounded-sm bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
                      {result.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-sm bg-primary text-primary-foreground px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-foreground hover:text-background border-t border-l border-t-white/20 border-l-white/20 border-b-2 border-r-2 border-b-black/30 border-r-black/30 shadow-[1px_1px_3px_rgba(0,0,0,0.15)] active:border-t-2 active:border-l-2 active:border-b active:border-r active:border-t-black/30 active:border-l-black/30 active:border-b-white/20 active:border-r-white/20 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
