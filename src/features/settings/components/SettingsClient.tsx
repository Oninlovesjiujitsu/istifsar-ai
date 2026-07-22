'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserCircle02Icon,
  SparklesIcon,
  Shield01Icon,
} from '@hugeicons/core-free-icons';
import ProfileTab from './ProfileTab';
import PreferencesTab from './PreferencesTab';
import SecurityTab from './SecurityTab';
import type { UserPreferences } from '@/src/types/preferences';

interface ProfileData {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  institution: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface SettingsClientProps {
  profile: ProfileData | null;
  email: string | undefined;
  preferences: UserPreferences;
}

type TabType = 'profile' | 'preferences' | 'security';

const fadeTab = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

export default function SettingsClient({ profile, email, preferences }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile & Identity', icon: UserCircle02Icon },
    { id: 'preferences', label: 'AI & Reading Preferences', icon: SparklesIcon },
    { id: 'security', label: 'Account & Security', icon: Shield01Icon },
  ] as const;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 xl:p-12 relative">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <header className="mb-8 sm:mb-12">
          <div className="flex flex-col gap-2 sm:gap-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-foreground leading-tight">
              Settings
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base font-serif">
              Manage your scholarly identity, inquiry preferences, and account security.
            </p>
            <div className="h-px w-20 bg-gradient-to-r from-border to-transparent mt-2" />
          </div>
        </header>

      {/* Navigation Tabs — Horizontal Touch Scroll on Mobile */}
      <nav className="-mx-4 sm:mx-0 px-4 sm:px-0 flex items-center gap-1.5 sm:gap-2 border-b border-border mb-6 sm:mb-8 overflow-x-auto scrollbar-none pb-1 whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={[
                'flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all relative shrink-0 rounded-t-md',
                isActive
                  ? 'text-primary bg-primary/5 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]',
              ].join(' ')}
            >
              <HugeiconsIcon icon={tab.icon} size={16} className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={fadeTab} initial="hidden" animate="visible" exit="exit">
          {activeTab === 'profile' && <ProfileTab profile={profile} />}
          {activeTab === 'preferences' && <PreferencesTab preferences={preferences} />}
          {activeTab === 'security' && <SecurityTab email={email} role={profile?.role ?? null} />}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}
