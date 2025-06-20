import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/proposal-log');
  // This return is necessary but will not be rendered.
  return null;
}
