import { ArrowUpRight, LocateFixed, MapPin } from 'lucide-react';
import type { Location } from '../types/location';

interface LocationCardProps {
  location: Location | null;
  isLocating: boolean;
  error: string;
  onLocate: () => void;
  onChooseLocation: () => void;
}

export function LocationCard({
  location,
  isLocating,
  error,
  onLocate,
  onChooseLocation,
}: LocationCardProps) {
  const buttonLabel = isLocating
    ? 'Konum bulunuyor…'
    : location
      ? 'Konumu güncelle'
      : 'Konumumu kullan';

  return (
    <section className="location-card">
      <span className="section-label">01 / KONUMUN</span>
      <div className="location-icon">
        <MapPin size={25} />
      </div>
      <h2>{location?.name ?? 'Neredesin?'}</h2>
      <p>
        {location
          ? `${location.latitude.toFixed(4)}° / ${location.longitude.toFixed(4)}°`
          : 'Kıble yönünü hesaplamak için bulunduğun konumu kullanıyoruz.'}
      </p>
      {location?.accuracy !== undefined && (
        <small className="accuracy">Konum doğruluğu: ±{Math.round(location.accuracy)} m</small>
      )}
      <button className="primary" disabled={isLocating} onClick={onLocate}>
        <LocateFixed size={19} />
        {buttonLabel}
        <ArrowUpRight size={18} />
      </button>
      <button className="secondary" onClick={onChooseLocation}>
        Şehir veya koordinat seç
      </button>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
