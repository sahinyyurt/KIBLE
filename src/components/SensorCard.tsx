import { Compass } from 'lucide-react';
import type { CompassStatus } from '../hooks/useCompass';

const BUTTON_LABELS: Record<CompassStatus, string> = {
  off: 'Pusulayı etkinleştir',
  waiting: 'Sensör bekleniyor…',
  active: 'Pusulayı yeniden başlat',
  permission: 'Pusula izni ver',
  error: 'Pusulayı etkinleştir',
};

interface SensorCardProps {
  status: CompassStatus;
  message: string;
  onStart: () => void;
}

export function SensorCard({ status, message, onStart }: SensorCardProps) {
  return (
    <section className="sensor-card">
      <span className="section-label">02 / PUSULA</span>
      <h3>Telefonun sana yol göstersin.</h3>
      <p>
        Pusula otomatik başlar. Telefonu ekranı yukarı bakacak şekilde yataya yakın tut; istenirse
        sensör iznini ver.
      </p>
      <button className="outline" onClick={onStart}>
        <Compass size={18} />
        {BUTTON_LABELS[status]}
      </button>
      {message && (status === 'error' || status === 'permission') && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <small>
        Pusula yaklaşık yön gösterir. Manyetik alan ve sensör kalibrasyonu sonucu etkileyebilir.
      </small>
    </section>
  );
}
