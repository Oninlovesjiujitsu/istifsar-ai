import { proxy } from '@/proxy';

export default async function HomePage() {
  await proxy({ requireAuth: true });

  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome to Istifsar
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          Explore history through verified primary sources.
        </p>
      </div>
    </div>
  );
}
