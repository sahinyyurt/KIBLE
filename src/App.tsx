import { useState } from 'react';
import { ArrowUpRight, Compass, Info, ShieldCheck } from 'lucide-react';
import { CompassCard } from './components/CompassCard';
import { HelpContent } from './components/HelpContent';
import { LocationCard } from './components/LocationCard';
import { LocationPicker } from './components/LocationPicker';
import { Modal } from './components/Modal';
import { SensorCard } from './components/SensorCard';
import { useCompass } from './hooks/useCompass';
import { useLocation } from './hooks/useLocation';
import { calculateQibla } from './lib/qibla';
import type { Location } from './types/location';

type Dialog = 'location' | 'help' | null;

export default function App() {
  const { location, isLocating, error, locate, selectLocation } = useLocation();
  const compass = useCompass();
  const [dialog, setDialog] = useState<Dialog>(null);
  const qibla = location ? calculateQibla(location) : null;

  function closeDialog() {
    setDialog(null);
  }

  function handleLocationSelect(selectedLocation: Location) {
    selectLocation(selectedLocation);
    closeDialog();
  }

  function handleCompassPermission() {
    void compass.start();
    if (!location && !isLocating) locate();
  }

  return (
    <div className="shell">
      <header>
        <a className="brand" href="./" aria-label="Kıble ana sayfa">
          <span className="brand-icon">
            <Compass size={24} />
          </span>
          kıble<span className="brand-dot">.</span>
        </a>
        <button className="help" onClick={() => setDialog('help')}>
          <Info size={17} /> Nasıl kullanılır?
        </button>
      </header>
      <main>
        <div className="intro">
          <span className="eyebrow">YÖNÜNÜ BUL, KALBİNİ DİNLE</span>
          <h1>Kıbleye bir adım daha yakın.</h1>
          <p>Bulunduğun yerden Kâbe’ye uzanan yönü keşfet.</p>
        </div>
        <div className="workspace">
          {compass.status === 'permission' && (
            <div className="permission-banner">
              <p>{compass.message}</p>
              <button className="primary" onClick={handleCompassPermission}>
                Pusula izni ver <ArrowUpRight size={18} />
              </button>
            </div>
          )}
          <CompassCard qibla={qibla} heading={compass.heading} />
          <aside>
            <LocationCard
              location={location}
              isLocating={isLocating}
              error={error}
              onLocate={locate}
              onChooseLocation={() => setDialog('location')}
            />
            <SensorCard
              status={compass.status}
              message={compass.message}
              onStart={() => void compass.start()}
            />
            <div className="privacy">
              <ShieldCheck size={20} />
              <p>Konumun yalnızca bu cihazda hesaplama için kullanılır; sunucuya gönderilmez.</p>
            </div>
          </aside>
        </div>
        <footer>
          <span>Her yerden, aynı yöne.</span>
          <span>SADE. SESSİZ. SANA ÖZEL.</span>
        </footer>
      </main>
      {dialog !== null && (
        <Modal title={dialog === 'help' ? 'Nasıl kullanılır' : 'Konum seç'} onClose={closeDialog}>
          {dialog === 'help' ? <HelpContent /> : <LocationPicker onSelect={handleLocationSelect} />}
        </Modal>
      )}
    </div>
  );
}
