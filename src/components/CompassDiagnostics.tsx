import { useEffect, useRef, useState } from 'react';
import type { CompassStatus } from '../hooks/useCompass';
import { readCompassHeading, type CompassReading } from '../lib/compass';

interface CompassDiagnosticsProps {
  heading: number | null;
  status: CompassStatus;
  onRestart: () => void;
}

function rounded(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

export function CompassDiagnostics({ heading, status, onRestart }: CompassDiagnosticsProps) {
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState('');
  const [message, setMessage] = useState('');
  const display = useRef({ heading, status });
  const restartCount = useRef(0);

  useEffect(() => {
    display.current = { heading, status };
  }, [heading, status]);

  useEffect(() => {
    if (!recording) return;

    const startedAt = performance.now();
    const samples: object[] = [];
    const outputs: object[] = [];
    const counts: Record<string, number> = {};
    const lastSample: Record<string, number> = {};
    const elapsed = () => Math.round(performance.now() - startedAt);

    const capture = (event: Event) => {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
      const t = elapsed();
      if (t - (lastSample[event.type] ?? -Infinity) < 250) return;
      lastSample[event.type] = t;

      const reading = event as DeviceOrientationEvent & CompassReading;
      const legacyWindow: Window & { orientation?: number } = window;
      const screenAngle = screen.orientation?.angle ?? legacyWindow.orientation ?? 0;
      const rawHeading = readCompassHeading(reading, screenAngle);
      samples.push({
        t,
        event: event.type,
        absolute: reading.absolute,
        alpha: rounded(reading.alpha),
        beta: rounded(reading.beta),
        gamma: rounded(reading.gamma),
        screenAngle,
        webkitHeading: rounded(reading.webkitCompassHeading),
        webkitAccuracy: rounded(reading.webkitCompassAccuracy),
        result:
          rawHeading === undefined ? 'ignored' : rawHeading === null ? 'unstable' : 'accepted',
        rawHeading: rounded(rawHeading),
      });
    };

    window.addEventListener('deviceorientation', capture);
    window.addEventListener('deviceorientationabsolute', capture);
    const interval = window.setInterval(() => {
      outputs.push({
        t: elapsed(),
        heading: rounded(display.current.heading),
        status: display.current.status,
        restarts: restartCount.current,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 250);
    const timeout = window.setTimeout(() => {
      setReport(JSON.stringify({ version: 1, durationMs: elapsed(), counts, samples, outputs }));
      setRecording(false);
      setMessage('Kayıt tamamlandı. Raporu kopyalayıp konuşmaya yapıştır.');
    }, 10_000);

    return () => {
      window.removeEventListener('deviceorientation', capture);
      window.removeEventListener('deviceorientationabsolute', capture);
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [recording]);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setMessage('Rapor kopyalandı. Konuşmaya yapıştırabilirsin.');
    } catch {
      setMessage('Otomatik kopyalama açılamadı. Aşağıdaki rapor alanından metni seçip kopyala.');
    }
  }

  return (
    <section className="sensor-card" aria-label="Pusula tanılama">
      <h3>Pusula tanılama</h3>
      <p>
        Telefonu yataya yakın ve aynı yöne bakacak şekilde sabit tut. Kaydı başlat, birkaç saniye
        sonra buradaki yeniden başlat düğmesine bir kez dokun. Kayıt 10 saniyede tamamlanır.
      </p>
      <p>
        Gösterilen yön: <strong>{heading === null ? '—' : `${heading.toFixed(1)}°`}</strong>
      </p>
      <button
        className="outline"
        disabled={recording}
        onClick={() => {
          restartCount.current = 0;
          setReport('');
          setMessage('Kaydediliyor… Telefonun yönünü değiştirme.');
          setRecording(true);
        }}
      >
        {recording ? 'Kaydediliyor…' : '10 saniyelik kaydı başlat'}
      </button>
      <button
        className="outline"
        disabled={!recording}
        onClick={() => {
          restartCount.current += 1;
          onRestart();
        }}
      >
        Kayıt sırasında pusulayı yeniden başlat
      </button>
      {report && (
        <>
          <button className="outline" onClick={() => void copyReport()}>
            Raporu kopyala
          </button>
          <textarea
            aria-label="Pusula tanılama raporu"
            readOnly
            value={report}
            rows={4}
            style={{ width: '100%' }}
          />
        </>
      )}
      {message && <p role="status">{message}</p>}
      <small>Yalnızca yön sensörü kaydedilir. Konum bilgisi içermez; sunucuya gönderilmez.</small>
    </section>
  );
}
