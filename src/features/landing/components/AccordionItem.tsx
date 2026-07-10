'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function AccordionItem({
  title,
  text,
  defaultOpen = false,
}: {
  title: string;
  text: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div variants={fadeUp} className="border border-gold/10 rounded-sm overflow-hidden bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 sm:p-5 text-left hover:bg-gold/[0.02] transition-colors"
      >
        <h4 className="text-foreground font-medium text-base sm:text-lg px-2">{title}</h4>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={20}
          className={`text-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
