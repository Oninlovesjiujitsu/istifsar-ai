'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SHOW_AFTER = 600;

export default function FloatingBackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            onClick={scrollTop}
            aria-label="Back to top"
            tabIndex={visible ? 0 : -1}
            className={`fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-background/80 hover:bg-background border border-gold/20 hover:border-gold/50 backdrop-blur-md transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 group ${visible
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
        >
            <ArrowUp
                size={20}
                className="text-gold group-hover:text-gold-bright transition-transform duration-300 transform group-hover:-translate-y-0.5"
            />
        </button>
    );
}