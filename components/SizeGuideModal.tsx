'use client';

const ROWS = [
  { size: 'XS', bust: '78–82', underbust: '63–67', waist: '58–62', hips: '84–88' },
  { size: 'S', bust: '82–86', underbust: '67–71', waist: '62–66', hips: '88–92' },
  { size: 'M', bust: '86–90', underbust: '71–75', waist: '66–70', hips: '92–96' },
  { size: 'L', bust: '90–95', underbust: '75–80', waist: '70–75', hips: '96–101' },
  { size: 'XL', bust: '95–100', underbust: '80–85', waist: '75–80', hips: '101–106' },
];

export default function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-4 fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
    >
      <div
        className="w-full max-w-lg bg-paper p-8 max-h-[85vh] overflow-y-auto thin-scroll"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="h-display text-2xl">Size Guide</h2>
          <button onClick={onClose} aria-label="Close size guide" className="p-1">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-ink/70 mb-5">
          All measurements in centimetres. Tops fit by bust and underbust; bottoms fit by
          waist and hips — pick each independently for your best fit. Between sizes? Size up
          for comfort, down for a firmer hold.
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink">
              {['Size', 'Bust', 'Underbust', 'Waist', 'Hips'].map(h => (
                <th key={h} className="py-2 text-left font-display uppercase tracking-widest2 text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r.size} className="border-b border-smoke">
                <td className="py-2.5 font-display">{r.size}</td>
                <td className="py-2.5">{r.bust}</td>
                <td className="py-2.5">{r.underbust}</td>
                <td className="py-2.5">{r.waist}</td>
                <td className="py-2.5">{r.hips}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-5 text-xs text-stone">
          Still unsure? Message us on WhatsApp with your measurements and we&apos;ll size you.
        </p>
      </div>
    </div>
  );
}
