import { useState } from 'react';

const NATIONAL_HELPLINES = [
  {
    label: 'National Emergency (Police/Fire/Ambulance)',
    number: '112',
    note: 'Single unified number, works nationwide',
  },
  { label: 'Police', number: '100' },
  { label: 'Fire', number: '101' },
  { label: 'Ambulance', number: '108' },
  { label: 'Ambulance (alternate)', number: '102' },
  { label: "Women's Helpline", number: '1091' },
  { label: "Women's Helpline (Domestic Abuse)", number: '181' },
  { label: 'Child Helpline', number: '1098' },
  { label: 'Disaster Management (NDMA)', number: '1078' },
  { label: 'Cyber Crime Helpline', number: '1930' },
];

function LocatorButton({ label, mapsQuery }) {
  const [status, setStatus] = useState('idle');

  const openNearby = () => {
    if (!navigator.geolocation) {
      window.open(
        `https://www.google.com/maps/search/${mapsQuery}`,
        '_blank'
      );
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        window.open(
          `https://www.google.com/maps/search/${mapsQuery}/@${latitude},${longitude},15z`,
          '_blank'
        );

        setStatus('idle');
      },
      () => {
        window.open(
          `https://www.google.com/maps/search/${mapsQuery}`,
          '_blank'
        );

        setStatus('error');
      }
    );
  };

  return (
    <button
      type="button"
      onClick={openNearby}
      className="btn-ghost w-full sm:w-auto"
    >
      {status === 'locating'
        ? 'Locating…'
        : `Find nearest ${label}`}
    </button>
  );
}

export default function EmergencyHelplines() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">
        Emergency Helplines
      </h1>

      <p className="mt-2 text-ink/70">
        National numbers work across India. If you're in immediate danger, call{' '}
        <a
          href="tel:112"
          className="font-semibold text-primary"
        >
          112
        </a>{' '}
        first.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {NATIONAL_HELPLINES.map((item) => (
          <a
            key={item.number}
            href={`tel:${item.number}`}
            className="card flex items-center justify-between transition hover:border-primary"
          >
            <div>
              <p className="font-display font-semibold text-ink">
                {item.label}
              </p>

              {item.note && (
                <p className="mt-0.5 text-sm text-ink/60">
                  {item.note}
                </p>
              )}
            </div>

            <span className="ref-code text-xl font-bold text-primary">
              {item.number}
            </span>
          </a>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-ink">
          Find help nearby
        </h2>

        <p className="mt-1 text-sm text-ink/60">
          Opens Google Maps using your current location (you'll be asked for
          permission).
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <LocatorButton
            label="hospital"
            mapsQuery="hospital"
          />

          <LocatorButton
            label="pharmacy"
            mapsQuery="pharmacy"
          />

          <LocatorButton
            label="police station"
            mapsQuery="police+station"
          />
        </div>
      </section>
    </main>
  );
}