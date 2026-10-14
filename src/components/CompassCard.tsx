import { Navigation } from 'lucide-react';
import { getHeadingDifference } from '../lib/angles';
import type { QiblaResult } from '../lib/qibla';

const ALIGNMENT_TOLERANCE_DEGREES = 5;
const NEAR_KAABA_DISTANCE_KM = 0.1;
const TICK_ANGLES = Array.from({ length: 72 }, (_, index) => index * 5);

interface CompassCardProps {
  qibla: QiblaResult | null;
  heading: number | null;
}

function getDirectionTitle(
  qibla: QiblaResult | null,
  turnAngle: number | null,
  isAligned: boolean,
): string {
  if (!qibla) return 'Yönünü keşfet';
  if (qibla.distanceKm < NEAR_KAABA_DISTANCE_KM) return 'Kâbe’nin yakınındasın';
  if (isAligned) return 'Kıble yönündesin';
  if (turnAngle === null) return 'Kıble açın hazır';

  const direction = turnAngle > 0 ? 'sağa' : 'sola';
  return `${Math.round(Math.abs(turnAngle))}° ${direction} dön`;
}

function getDirectionDescription(qibla: QiblaResult | null, isLive: boolean): string {
  if (!qibla) return 'Başlamak için konumuna izin ver.';
  if (qibla.distanceKm < NEAR_KAABA_DISTANCE_KM)
    return 'Bu mesafede GPS doğruluğu yönü etkileyebilir.';
  return isLive
    ? 'Telefonu önünde tut; ok yönüne doğru dön.'
    : 'Canlı yönlendirme için pusulayı etkinleştir.';
}

export function CompassCard({ qibla, heading }: CompassCardProps) {
  const isLive = heading !== null;
  const turnAngle = qibla && heading !== null ? getHeadingDifference(qibla.bearing, heading) : null;
  const isAligned = turnAngle !== null && Math.abs(turnAngle) < ALIGNMENT_TOLERANCE_DEGREES;
  const dialHeading = heading ?? 0;
  const statusLabel = isLive
    ? 'Pusula aktif'
    : qibla
      ? 'Kuzey referanslı görünüm'
      : 'Konum bekleniyor';
  const dialLabel = qibla
    ? `Kıble açısı ${qibla.bearing.toFixed(1)} derece. ${isLive ? 'Canlı pusula' : 'Kuzey referanslı sabit gösterim'}`
    : 'Kıble yönü için konum gerekli';

  return (
    <section className="compass-card">
      <div className="card-top">
        <span className={`badge ${isLive ? 'active' : ''}`}>
          <i />
          {statusLabel}
        </span>
        <span className="mini">KÂBE · MEKKE</span>
      </div>
      <div className={`dial ${isAligned ? 'aligned' : ''}`} role="img" aria-label={dialLabel}>
        <div className="dial-inner" />
        <div className="ticks" style={{ transform: `rotate(${-dialHeading}deg)` }}>
          {TICK_ANGLES.map((angle) => (
            <span
              key={angle}
              className={angle % 30 === 0 ? 'major' : ''}
              style={{ transform: `rotate(${angle}deg)` }}
            />
          ))}
          <b className="north">K</b>
          <b className="east">D</b>
          <b className="south">G</b>
          <b className="west">B</b>
        </div>
        {qibla ? (
          <div
            className="pointer"
            style={{ transform: `rotate(${qibla.bearing - dialHeading}deg)` }}
          >
            <div className="kaaba">▰</div>
            <div className="needle" />
            <div className="tail" />
          </div>
        ) : (
          <div className="empty-compass">
            <Navigation size={60} strokeWidth={1.1} />
            <span>
              Yolculuk bulunduğun
              <br />
              yerden başlar.
            </span>
          </div>
        )}
        <div className="center-dot" hidden={!qibla} />
        <span className="dial-ring" />
      </div>
      <div className="direction">
        <h2>{getDirectionTitle(qibla, turnAngle, isAligned)}</h2>
        <p>{getDirectionDescription(qibla, isLive)}</p>
      </div>
      <div className="stats">
        <div>
          <span>KIBLE AÇISI</span>
          <strong>{qibla ? `${qibla.bearing.toFixed(1)}°` : '—'}</strong>
          <small>Gerçek kuzeyden saat yönünde</small>
        </div>
        <div>
          <span>KÂBE’YE UZAKLIK</span>
          <strong>
            {qibla ? Math.round(qibla.distanceKm).toLocaleString('tr-TR') : '—'}
            {qibla && <em> km</em>}
          </strong>
          <small>Kuş uçuşu mesafe</small>
        </div>
      </div>
    </section>
  );
}
