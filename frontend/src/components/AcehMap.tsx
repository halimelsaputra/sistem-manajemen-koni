'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, GeoJSON, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RegionMedal } from '@/data/mockData';
import { REGION_COORDINATES } from '@/data/mapData';

interface AcehMapProps {
  regions: RegionMedal[];
  activeRegion: RegionMedal | null;
  onSelectRegion: (region: RegionMedal) => void;
}

// Di-module level (bukan di dalam komponen) agar tidak remount saat render ulang.
function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function AcehMap({ regions, activeRegion, onSelectRegion }: AcehMapProps) {
  const centerAceh: [number, number] = [3.85, 96.85];

  const coordMap = useMemo(() => {
    return Object.fromEntries(REGION_COORDINATES.map(c => [c.id, c]));
  }, []);

  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/aceh-kabupaten.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Gagal memuat GeoJSON Aceh:', err));
  }, []);

  // Process GeoJSON: split Aceh Besar, remove hole from Polygon 1
  const processedGeoData = useMemo(() => {
    if (!geoData?.features) return geoData;

    const features = [...geoData.features];
    const acehBesarIndex = features.findIndex((f: any) => f.properties?.kabkot === 'Aceh Besar');
    const acehBesar = features[acehBesarIndex];

    if (!acehBesar || acehBesar.geometry?.type !== 'MultiPolygon') return geoData;

    // Split MultiPolygon → individual Polygons
    const acehBesarPolygons = acehBesar.geometry.coordinates.map((polygon: number[][][]) => ({
      ...acehBesar,
      geometry: { type: 'Polygon' as const, coordinates: polygon },
    }));

    // Remove hole from Polygon 1 (index 1) — keep only outer ring
    if (acehBesarPolygons[1]) {
      acehBesarPolygons[1] = {
        ...acehBesarPolygons[1],
        geometry: {
          type: 'Polygon' as const,
          coordinates: [acehBesarPolygons[1].geometry.coordinates[0]], // outer ring only
        },
      };
    }

    // Replace Aceh Besar with split polygons
    features.splice(acehBesarIndex, 1, ...acehBesarPolygons);

    return { ...geoData, features };
  }, [geoData]);

  const findRegionByFeature = (feature: any): RegionMedal | undefined => {
    const kabName = (feature.properties?.kabkot || feature.properties?.NAME_2 || '').trim();
    const exact = regions.find((r) => r.kabupaten_kota.toLowerCase() === kabName.toLowerCase());
    if (exact) return exact;

    const cleanKabName = kabName.replace(/^(kabupaten|kota)\s+/i, '').trim();
    return regions.find(
      (r) => r.kabupaten_kota.toLowerCase() === cleanKabName.toLowerCase()
    );
  };

  const getPolygonStyle = (feature: any) => {
    const matchedRegion = findRegionByFeature(feature);
    const isSelected = matchedRegion && matchedRegion.id === activeRegion?.id;

    if (isSelected) {
      return {
        fillColor: '#ffffff',
        weight: 2.5,
        opacity: 1,
        color: '#ffffff',
        fillOpacity: 0.1,
      };
    }

    return {
      fillColor: 'transparent',
      weight: 0,
      opacity: 0,
      color: 'transparent',
      fillOpacity: 0,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const matchedRegion = findRegionByFeature(feature);

    (layer as any).setStyle(getPolygonStyle(feature));

    layer.on({
      mouseover: (e: any) => {
        const matched = findRegionByFeature(feature);
        if (matched && matched.id === activeRegion?.id) {
          e.target.setStyle({ weight: 3, color: '#ffffff', fillColor: '#ffffff', fillOpacity: 0.2 });
        }
      },
      mouseout: (e: any) => {
        e.target.setStyle(getPolygonStyle(feature));
      },
      click: () => {
        if (matchedRegion) onSelectRegion(matchedRegion);
      },
    });
  };

  const hasSelection = activeRegion?.id;

  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl overflow-hidden relative z-10 flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-4 left-5 right-5 z-[450] flex items-start justify-between pointer-events-none">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-lg">
            <span>Peta Wilayah & Medali</span>
          </h3>
          <div className="text-[10px] font-mono tracking-[0.25em] text-white/70 uppercase font-bold mt-1">
            KONI ACEH · PERSEBARAN PRESTASI
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full relative bg-black">
        {/* Blur overlay — tampil saat wilayah dipilih */}
        {hasSelection && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-[400] pointer-events-none" />
        )}

        <MapContainer
          center={centerAceh}
          zoom={7.85}
          zoomSnap={0.1}
          zoomDelta={0.1}
          minZoom={7}
          maxZoom={10}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <ResizeHandler />
          {/* Satellite tiles — Esri World Imagery */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri"
          />

          {/* Labels — 23 Marker, selalu tampil */}
          {regions.map((region) => {
            const coord = coordMap[region.id];
            if (!coord) return null;
            return (
              <Marker
                key={`label-${region.id}`}
                position={[
                  coord.lat + (coord.labelOffset?.[0] ?? 0),
                  coord.lng + (coord.labelOffset?.[1] ?? 0),
                ]}
                icon={L.divIcon({
                  className: 'map-region-label',
                  html: `<span>${region.kabupaten_kota}</span>`,
                  iconSize: [0, 0],
                  iconAnchor: [0, 0],
                })}
                interactive={false}
              />
            );
          })}

          {/* GeoJSON — processed, semua wilayah */}
          {processedGeoData && (
            <GeoJSON
              key={`geojson-${activeRegion?.id ?? 'none'}`}
              data={processedGeoData}
              style={getPolygonStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
