import { redirect } from 'next/navigation';

export default function ExplorePagePlaceholder() {
  // Redirect to the new primary archive page
  redirect('/documents');
}
