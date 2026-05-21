const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  // "2026-05-21" → "May 21, 2026"
  const [year, month, day] = iso.split('-');
  return `${MONTHS[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

export default function NowLastUpdated({ date }: { date: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.875rem',
        backgroundColor: 'rgba(57, 255, 20, 0.12)',
        border: '1px solid rgba(57, 255, 20, 0.3)',
        borderRadius: '9999px',
        color: '#39FF14',
        fontSize: '0.875rem',
        fontWeight: 500,
        letterSpacing: '0.025em',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          backgroundColor: '#39FF14',
        }}
      />
      Last updated: <time dateTime={date}>{formatDate(date)}</time>
    </div>
  );
}
