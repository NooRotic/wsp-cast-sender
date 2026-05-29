import TimelineView from '@/components/TimelineView';

export const metadata = {
  title: 'Timeline | Walter S. Pollard Jr.',
  description: '25+ years of software engineering woven through the history of the web, gaming, and AI.',
};

export default function TimelinePage() {
  return (
    <main className="min-h-screen">
      <TimelineView />
    </main>
  );
}
