import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { Link } from 'wouter';

export default function LegalNotice({ show }: { show: boolean }) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('poptum-legal-accepted');
    if (accepted === 'true') {
      return;
    }
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  const handleDismiss = () => {
    localStorage.setItem('poptum-legal-accepted', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 w-auto md:w-full md:max-w-sm z-50 bg-white border border-neutral-200/60 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-5 flex flex-col gap-4 text-left pointer-events-auto"
          style={{ fontFamily: 'var(--font-sans)' }}
          data-testid="legal-notice-modal"
        >
          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-bold tracking-tight text-neutral-900 font-heading animate-none">
              {t.legalNotice?.title || 'A quick note'}
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {t.legalNotice?.message || 'Please review our Privacy Policy and Terms & Conditions to learn more about how POPTUM operates and how customer information is handled.'}
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-3 text-xs">
            <Link 
              href="/privacy-policy" 
              className="text-primary hover:underline font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
            >
              {t.legalNotice?.privacyLink || 'Privacy Policy'}
            </Link>
            <span className="text-neutral-300">|</span>
            <Link 
              href="/terms-and-conditions" 
              className="text-primary hover:underline font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-left"
            >
              {t.legalNotice?.termsLink || 'Terms & Conditions'}
            </Link>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="w-full py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all active:scale-[0.98] shadow-2xs cursor-pointer text-center"
          >
            {t.legalNotice?.dismissBtn || 'Got it'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
