'use client';

import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    UserCircle02Icon,
    Building02Icon,
    Shield01Icon,
    Mail01Icon,
    UserEdit01Icon,
    BookOpen02Icon,
} from '@hugeicons/core-free-icons';
import SignOutButton from '@/src/components/layout/SignOutButton';

interface Profile {
    display_name: string | null;
    username: string | null;
    bio: string | null;
    institution: string | null;
    role: string | null;
}

interface SettingsClientProps {
    profile: Profile | null;
    email: string | undefined;
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

export default function SettingsClient({ profile, email }: SettingsClientProps) {
    const isHistorian = profile?.role === 'historian';
    const roleDisplay = profile?.role?.replace(/_/g, ' ') ?? 'reader';

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-background">
            {/* Background Decorators */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-gold/5 blur-[100px] rounded-full" />
            </div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="w-full max-w-2xl mx-auto relative z-10 py-6"
            >
                <motion.header variants={fadeUp} className="mb-8 md:mb-10 text-center md:text-left">
                    <h2 className="text-3xl sm:text-4xl font-heading text-gold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your identity within the archives.</p>
                    <div className="h-px w-full max-w-[200px] bg-gradient-to-r from-gold to-transparent mt-5 mx-auto md:mx-0 opacity-50" />
                </motion.header>

                <div className="space-y-8">
                    {/* Profile Overview Card */}
                    <motion.section
                        variants={fadeUp}
                        className="rounded-xl border border-gold/10 bg-card/60 backdrop-blur-md overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all hover:bg-card/80"
                    >
                        <div className="p-5 sm:p-6 flex flex-col md:flex-row items-center md:items-start gap-5 border-b border-gold/10">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                                    <HugeiconsIcon icon={UserCircle02Icon} size={48} className="text-gold" />
                                </div>
                                {isHistorian && (
                                    <div className="absolute -bottom-2 -right-2 bg-background border border-gold p-1.5 rounded-full shadow-lg" title="Verified Historian">
                                        <HugeiconsIcon icon={Shield01Icon} size={16} className="text-gold" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-semibold text-foreground tracking-tight">
                                    {profile?.display_name ?? 'Anonymous Scholar'}
                                </h3>
                                <p className="text-gold mt-1 font-serif italic tracking-wide">@{profile?.username ?? 'user'}</p>
                                <div className="mt-4 inline-flex items-center gap-2 bg-gold/10 text-gold px-3 py-1 rounded-sm text-xs uppercase tracking-widest font-medium">
                                    {isHistorian ? <HugeiconsIcon icon={BookOpen02Icon} size={14} /> : null}
                                    <span className="capitalize">{roleDisplay}</span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Info Details */}
                        <div className="p-5 sm:p-6 grid gap-5 sm:gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <InfoItem icon={Mail01Icon} label="Email Address" value={email ?? '—'} />
                                    {profile?.institution && (
                                        <InfoItem icon={Building02Icon} label="Institution" value={profile.institution} />
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <InfoItem icon={UserEdit01Icon} label="Bio" value={profile?.bio ? profile.bio : 'No bio provided.'} />
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </div>
            </motion.div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-4 p-3 rounded-md hover:bg-gold/5 transition-colors">
            <div className="mt-0.5 text-gold/60">
                <HugeiconsIcon icon={Icon} size={20} />
            </div>
            <div>
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground mb-1 font-medium">{label}</p>
                <p className="text-sm font-serif text-foreground/90">{value}</p>
            </div>
        </div>
    );
}
