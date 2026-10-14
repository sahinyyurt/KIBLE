import { useCallback, useEffect, useRef, useState } from 'react';
import type { Location } from '../types/location';

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 60_000,
};

function getLocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Konum izni kapalı. Tarayıcı ayarlarından izin verebilir veya şehir seçebilirsin.';
    case 3:
      return 'Konum alınamadı; istek zaman aşımına uğradı. Tekrar dene veya şehir seç.';
    default:
      return 'Konum bulunamadı. GPS ayarlarını kontrol et veya şehir seç.';
  }
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const locate = useCallback(() => {
    const currentRequestId = ++requestId.current;

    if (!navigator.geolocation) {
      setIsLocating(false);
      setError('Bu tarayıcı konumu desteklemiyor. Şehir seçerek devam edebilirsin.');
      return;
    }

    setIsLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (currentRequestId !== requestId.current) return;

        setLocation({
          name: 'Mevcut konumun',
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setIsLocating(false);
      },
      (positionError) => {
        if (currentRequestId !== requestId.current) return;

        setIsLocating(false);
        setError(getLocationErrorMessage(positionError.code));
      },
      GEOLOCATION_OPTIONS,
    );
  }, []);

  const selectLocation = useCallback((selectedLocation: Location) => {
    // A pending GPS request must not overwrite a more recent manual selection.
    requestId.current += 1;
    setLocation(selectedLocation);
    setIsLocating(false);
    setError('');
  }, []);

  useEffect(() => {
    locate();

    return () => {
      // Geolocation cannot be cancelled; ignore callbacks after cleanup.
      requestId.current += 1;
    };
  }, [locate]);

  return { location, isLocating, error, locate, selectLocation };
}
