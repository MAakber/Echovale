"use client";

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";

interface MemoryNode {
  id: string | number;
  name: string;
  year: number;
  latitude: number;
  longitude: number;
  type: string;
}

interface LeafletMapProps {
  nodes: MemoryNode[];
  activeYear: number;
  selectedNodeId: string | number | null;
  onSelectNode: (id: string | number | null) => void;
  onMapReady: () => void;
}

const CHINA_CENTER: [number, number] = [35.8617, 104.1954];
const CHINA_BOUNDS: [[number, number], [number, number]] = [[17.5, 73], [54.5, 136]];

export default function LeafletMap({
  nodes,
  activeYear,
  selectedNodeId,
  onSelectNode,
  onMapReady,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={CHINA_CENTER}
      zoom={4}
      minZoom={3}
      maxZoom={9}
      maxBounds={CHINA_BOUNDS}
      className="h-full w-full"
      zoomControl
      attributionControl
      whenReady={onMapReady}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {nodes
        .filter((node) => node.year <= activeYear)
        .map((node) => {
          const isActive = selectedNodeId === node.id;
          return (
            <CircleMarker
              key={node.id}
              center={[node.latitude, node.longitude]}
              radius={isActive ? 10 : 7}
              pathOptions={{
                color: isActive ? "#7c3aed" : "#111827",
                fillColor: isActive ? "#7c3aed" : "#111827",
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onSelectNode(isActive ? null : node.id),
              }}
            />
          );
        })}
    </MapContainer>
  );
}
