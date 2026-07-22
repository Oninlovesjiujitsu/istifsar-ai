'use client';

import { motion } from 'motion/react';
import AccordionItem from './AccordionItem';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const viewport = { once: true, amount: 0.3 as const };

export default function BoundariesSection() {
  return (
    <section id="boundaries" className="bg-background pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 md:px-12 border-y border-border scroll-mt-20">
      <div className="max-w-[1440px] mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl text-foreground mb-3 sm:mb-6">
            Capabilities &amp; Limits
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-xs sm:text-base leading-relaxed px-2">
            In the realm of historical research, understanding the limitations of a tool is just as important as knowing its strengths. Istifsar AI is designed to assist, not replace, the rigorous work of historical analysis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="space-y-8"
          >
            <div className="border-b border-border pb-4 mb-8">
              <h3 className="font-serif italic text-primary text-2xl tracking-wide">What Istifsar AI Is</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">Our Capabilities</p>
            </div>
            <div className="space-y-4">
              {[
                { title: 'An Engine for Academic Consensus', text: 'Navigates a strictly vetted database of scholarly writings to present the prevailing historical consensus.' },
                { title: 'A Citation-Driven Assistant', text: 'Every synthesis generated is anchored to retrieved texts with clear, traceable citations so you can verify the original academic context.' },
                { title: 'A Contextual Navigator', text: 'Surfaces relevant historiographical debates, key figures, and temporal contexts that would normally require hours of manual review.' },
                { title: 'A Human-Governed Platform', text: 'Ruled by human Historians who review outputs, flag anomalies, and ensure strict adherence to academic standards.' }
              ].map((item, i) => (
                <AccordionItem key={i} title={item.title} text={item.text} defaultOpen={i === 0} />
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="space-y-8"
          >
            <div className="border-b border-border pb-4 mb-8">
              <h3 className="font-serif italic text-primary text-2xl tracking-wide">What Istifsar AI Isn't</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">Our Limitations</p>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Not a Generator of New Primary Research', text: 'Does not conduct original research. It cannot interpret raw archival documents or formulate entirely new historical theories.' },
                { title: 'Not an Arbiter of Absolute Truth', text: 'The AI does not provide an unquestionable final word; it reflects the current scholarly landscape and acknowledges debates.' },
                { title: 'Not an Autonomous Oracle', text: 'A retrieval tool, not an independent thinker. Hallucinations or anachronisms are subject to immediate correction by our Historian tier.' },
                { title: 'Not a Creative Storyteller', text: 'Explicitly tuned to prevent creative extrapolation. If there is insufficient scholarly data, it will state that information is unavailable rather than invent a narrative.' }
              ].map((item, i) => (
                <AccordionItem key={i} title={item.title} text={item.text} defaultOpen={i === 0} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
