import { useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CITIES } from '../data/cities';
import { parseCoordinates } from '../lib/location';
import type { Location } from '../types/location';

interface LocationPickerProps {
  onSelect: (location: Location) => void;
}

export function LocationPicker({ onSelect }: LocationPickerProps) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const coordinates = parseCoordinates(latitude, longitude);

    if (!coordinates) {
      setError('Geçerli bir enlem (−90 ile 90 arası) ve boylam (−180 ile 180) gir.');
      return;
    }

    onSelect({ name: 'Seçilen koordinatlar', ...coordinates });
  }

  return (
    <>
      <span className="eyebrow">BULUNDUĞUN YER</span>
      <h2>Konum seç</h2>
      <p>Şehir merkezine göre yaklaşık hesaplanır.</p>
      <div className="cities">
        {CITIES.map((city) => (
          <button key={city.name} onClick={() => onSelect(city)}>
            {city.name}
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <h3>Ya da koordinat gir</h3>
        <div className="inputs">
          <label>
            Enlem
            <input
              required
              inputMode="decimal"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              placeholder="41.0082"
            />
          </label>
          <label>
            Boylam
            <input
              required
              inputMode="decimal"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              placeholder="28.9784"
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <button className="primary" type="submit">
          Bu konumu kullan
          <ArrowUpRight size={18} />
        </button>
      </form>
    </>
  );
}
