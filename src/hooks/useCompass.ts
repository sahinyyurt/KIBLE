import { useCallback, useEffect, useRef, useState } from 'react';
import { getHeadingDifference, normalizeDegrees } from '../lib/angles';
import { readCompassHeading, type CompassReading } from '../lib/compass';

const HEADING_SMOOTHING_FACTOR = 0.22;
const SENSOR_TIMEOUT_MS = 5_000;
const SENSOR_CHECK_INTERVAL_MS = 1_000;

type OrientationConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: (absolute?: boolean) => Promise<PermissionState>;
};

type CompassState =
  | { status: 'off' | 'waiting'; heading: null; message: '' }
  | { status: 'active'; heading: number | null; message: '' }
  | { status: 'permission' | 'error'; heading: null; message: string };

export type CompassStatus = CompassState['status'];

function getScreenAngle(): number {
  const legacyWindow: Window & { orientation?: number } = window;
  return screen.orientation?.angle ?? legacyWindow.orientation ?? 0;
}

export function useCompass() {
  const [state, setState] = useState<CompassState>({ status: 'off', heading: null, message: '' });
  const cleanup = useRef<(() => void) | null>(null);
  const requestId = useRef(0);

  const start = useCallback(async (automatic = false) => {
    const currentRequestId = ++requestId.current;
    cleanup.current?.();
    cleanup.current = null;
    setState({ status: 'off', heading: null, message: '' });

    if (!window.isSecureContext) {
      setState({
        status: 'error',
        heading: null,
        message: 'Pusula için uygulamayı HTTPS bağlantısıyla aç.',
      });
      return;
    }

    if (!('DeviceOrientationEvent' in window)) {
      setState({
        status: 'error',
        heading: null,
        message: 'Bu cihazda pusula desteği yok. Aşağıdaki kıble açısını kullanabilirsin.',
      });
      return;
    }

    try {
      const orientationEvent: OrientationConstructor = DeviceOrientationEvent;

      if (orientationEvent.requestPermission) {
        try {
          const permission = await orientationEvent.requestPermission(true);
          // Permission may resolve after a restart or after unmounting.
          if (currentRequestId !== requestId.current) return;

          if (permission !== 'granted') {
            setState({
              status: 'error',
              heading: null,
              message:
                'Hareket ve yön izni verilmedi. Tarayıcı ayarlarından izin vererek tekrar dene.',
            });
            return;
          }
        } catch (error) {
          if (currentRequestId !== requestId.current) return;

          if (automatic) {
            setState({
              status: 'permission',
              heading: null,
              message: 'Tarayıcın pusula izni için bir dokunuş istiyor. Aşağıdaki düğmeye dokun.',
            });
            return;
          }

          throw error;
        }
      }

      setState({ status: 'waiting', heading: null, message: '' });
      let lastReadingAt = Date.now();
      let smoothedHeading: number | null = null;

      const handleOrientation = (event: Event) => {
        // Both browser event names carry orientation data, including Safari's extensions.
        const heading = readCompassHeading(
          event as DeviceOrientationEvent & CompassReading,
          getScreenAngle(),
        );
        if (heading === undefined) return;

        if (heading === null) {
          smoothedHeading = null;
          setState((previous) => ({ ...previous, heading: null }));
          return;
        }

        smoothedHeading =
          smoothedHeading === null
            ? heading
            : normalizeDegrees(
                smoothedHeading +
                  getHeadingDifference(heading, smoothedHeading) * HEADING_SMOOTHING_FACTOR,
              );
        lastReadingAt = Date.now();
        setState({ status: 'active', heading: smoothedHeading, message: '' });
      };

      window.addEventListener('deviceorientation', handleOrientation);
      window.addEventListener('deviceorientationabsolute', handleOrientation);

      const timer = window.setInterval(() => {
        if (Date.now() - lastReadingAt > SENSOR_TIMEOUT_MS) {
          smoothedHeading = null;
          setState({
            status: 'error',
            heading: null,
            message:
              'Güvenilir yön verisi alınamıyor. Telefonun tutuşunu biraz değiştir ve metal eşyalardan uzaklaş. Sensör desteklenmiyor olabilir.',
          });
        }
      }, SENSOR_CHECK_INTERVAL_MS);

      cleanup.current = () => {
        window.clearInterval(timer);
        window.removeEventListener('deviceorientation', handleOrientation);
        window.removeEventListener('deviceorientationabsolute', handleOrientation);
      };
    } catch {
      if (currentRequestId !== requestId.current) return;
      setState({
        status: 'error',
        heading: null,
        message: 'Pusula açılamadı. Uygulamayı doğrudan Safari veya Chrome’da açıp tekrar dene.',
      });
    }
  }, []);

  useEffect(() => {
    void start(true);

    return () => {
      requestId.current += 1;
      cleanup.current?.();
      cleanup.current = null;
    };
  }, [start]);

  return { ...state, start };
}
