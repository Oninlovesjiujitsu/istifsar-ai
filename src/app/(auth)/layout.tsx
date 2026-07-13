import { authGuard } from '@/src/lib/supabase/authGuard';
import FireFlyBackground from '@/src/components/layout/FireFlyBackground';

const noiseSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`;

const scrollOrnament = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'%3E%3Cpath d='M0 200 C0 140 20 100 60 80 C100 60 120 30 100 10 C90 0 70 5 75 20 C80 35 100 40 110 30' stroke='%235a3a31' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M0 200 C10 160 40 130 80 110 C110 95 130 70 120 45 C115 35 100 38 105 50 C108 60 120 62 128 55' stroke='%235a3a31' stroke-width='1.5' fill='none' opacity='0.35'/%3E%3Cpath d='M0 200 C5 170 15 150 40 135 C60 122 70 105 60 85' stroke='%235a3a31' stroke-width='1' fill='none' opacity='0.25'/%3E%3Ccircle cx='100' cy='10' r='3' fill='%235a3a31' opacity='0.3'/%3E%3Ccircle cx='128' cy='55' r='2' fill='%235a3a31' opacity='0.25'/%3E%3C/svg%3E")`;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await authGuard({ redirectAuthenticated: '/' });
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-6 sm:py-12">
      <FireFlyBackground className="z-5" />

      <div className="pointer-events-none absolute inset-0 bg-background/25" />

      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: noiseSvg, backgroundRepeat: 'repeat' }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(90,58,49,0.04) 0%, transparent 70%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(43,37,33,0.05) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 sm:h-60 sm:w-60 md:h-72 md:w-72 hidden sm:block"
        style={{ backgroundImage: scrollOrnament, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom left' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 sm:h-60 sm:w-60 md:h-72 md:w-72 hidden sm:block"
        style={{ backgroundImage: scrollOrnament, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom right', transform: 'scaleX(-1)' }}
      />

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
