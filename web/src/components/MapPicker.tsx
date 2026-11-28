import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, MapPin, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { localDigits } from '../lib/format';
import { Button } from './ui';

export type Point = { lat: number; lng: number };

// Tongi, Gazipur: a sensible start when nothing is pinned yet.
const DEFAULT_CENTER: Point = { lat: 23.8916, lng: 90.4023 };
const BRAND = '#2459a5';

type MapPickerProps = {
  value: Point | null;
  onChange?: (point: Point | null) => void;
  readOnly?: boolean;
  height?: number;
};

/**
 * Pick one point on a map: Leaflet with OpenStreetMap tiles (free; the attribution must stay visible).
 * Leaflet is used directly instead of through react-leaflet, which keeps the bundle small.
 */
export function MapPicker({ value, onChange, readOnly = false, height = 260 }: MapPickerProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'bn';
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const startRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    const start = startRef.current ?? DEFAULT_CENTER;
    const instance = L.map(container.current, { scrollWheelZoom: false }).setView(
      [start.lat, start.lng],
      startRef.current ? 15 : 12,
    );
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(instance);
    if (!readOnly) {
      instance.on('click', (event: L.LeafletMouseEvent) => {
        onChangeRef.current?.({ lat: round(event.latlng.lat), lng: round(event.latlng.lng) });
      });
    }
    map.current = instance;
    const sizeFix = window.setTimeout(() => instance.invalidateSize(), 0);
    return () => {
      window.clearTimeout(sizeFix);
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, [readOnly]);

  // Keep the pin in step with the value.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!value) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const latLng: L.LatLngExpression = [value.lat, value.lng];
    if (marker.current) marker.current.setLatLng(latLng);
    else {
      marker.current = L.circleMarker(latLng, {
        radius: 10,
        color: BRAND,
        weight: 3,
        fillColor: BRAND,
        fillOpacity: 0.45,
      }).addTo(instance);
    }
  }, [value]);

  function pinMyLocation() {
    navigator.geolocation?.getCurrentPosition((position) => {
      const point = { lat: round(position.coords.latitude), lng: round(position.coords.longitude) };
      onChangeRef.current?.(point);
      map.current?.setView([point.lat, point.lng], 15);
    });
  }

  return (
    <div className="space-y-2">
      <div
        ref={container}
        role="region"
        aria-label={t('map.label')}
        style={{ height }}
        className="z-0 overflow-hidden rounded-xl border border-field"
      />
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <MapPin aria-hidden className="size-4 shrink-0 text-brand" />
          <span className="min-w-0 flex-1">
            {value
              ? t('map.pinned', { lat: localDigits(String(value.lat), language), lng: localDigits(String(value.lng), language) })
              : t('map.hint')}
          </span>
          {'geolocation' in navigator && (
            <Button variant="ghost" className="px-2" onClick={pinMyLocation}>
              <LocateFixed aria-hidden className="size-4" />
              {t('map.myLocation')}
            </Button>
          )}
          {value && (
            <Button variant="ghost" className="px-2" onClick={() => onChangeRef.current?.(null)}>
              <X aria-hidden className="size-4" />
              {t('map.clear')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** About 10 m: plenty for a business or a job site. */
function round(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}
