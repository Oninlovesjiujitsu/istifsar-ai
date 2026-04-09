import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NewConversationButton() {
  return (
    <Link href="/explore/new" className={buttonVariants({ size: 'lg' })}>
      Start a new conversation
    </Link>
  );
}
