import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { createRoot, Root } from 'react-dom/client';
import { MAP_CENTER } from '../constants';
import { Vehicle, VehicleStatus, Position } from '../types';

// --- Types & Interfaces ---

interface MapProps {
  vehicles: Vehicle[];
  selectedVehicleId?: string | null;
}

interface PopupContentProps {
  vehicle: Vehicle;
  sendCommand: (id: string, cmd: 'LOCK' | 'UNLOCK') => Promise<void>;
  loadingId: string | null;
  onCenter: () => void;
  // New Props for History UX
  isHistoryActive: boolean;
  onToggleHistory: () => void;
}

// --- Helper: Distance Calculation (Haversine) ---
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Raio da terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

// --- Helper: Route Processor (UX Critical) ---
const processRouteData = (history: Position[], currentPos: Position): [number, number][] => {
  const allPoints = [...history, currentPos].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const cleanPath: Position[] = [];

  allPoints.forEach((point) => {
    if (cleanPath.length === 0) {
      cleanPath.push(point);
      return;
    }

    const lastPoint = cleanPath[cleanPath.length - 1];
    const dist = getDistanceFromLatLonInMeters(
      lastPoint.lat, lastPoint.lng,
      point.lat, point.lng
    );

    if (dist > 10) {
      cleanPath.push(point);
    }
  });

  const lastFiltered = cleanPath[cleanPath.length - 1];
  if (new Date(lastFiltered.timestamp).getTime() !== new Date(currentPos.timestamp).getTime()) {
    cleanPath.push(currentPos);
  }

  return cleanPath.map(p => [p.lat, p.lng]);
};

// --- Internal Hook for Commands ---

const useVehicleCommands = () => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const sendCommand = async (vehicleId: string, command: 'LOCK' | 'UNLOCK') => {
    setLoadingId(vehicleId);
    console.log(`[NeoRastro Command] Sending ${command} to Vehicle ${vehicleId}...`);
    // Simula latência de rede TCP/IP
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`[NeoRastro Command] ACK received for Vehicle ${vehicleId}. Action confirmed.`);
    setLoadingId(null);
  };

  return { sendCommand, loadingId };
};

// --- Internal Component: Premium Popup Content ---

const VehiclePopup: React.FC<PopupContentProps> = ({ 
  vehicle, 
  sendCommand, 
  loadingId, 
  onCenter,
  isHistoryActive,
  onToggleHistory
}) => {
  const [confirmAction, setConfirmAction] = useState<'LOCK' | 'UNLOCK' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  
  const isMoving = vehicle.status === VehicleStatus.MOVING;
  const isLoading = loadingId === vehicle.id;
  
  const statusConfig = {
    [VehicleStatus.MOVING]: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'EM MOVIMENTO' },
    [VehicleStatus.ONLINE]: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'CONECTADO' },
    [VehicleStatus.IDLE]: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'PARADO (IGNIÇÃO ON)' },
    [VehicleStatus.OFFLINE]: { color: 'text-slate-400', bg: 'bg-slate-700/30', border: 'border-slate-600/30', label: 'OFFLINE' },
    [VehicleStatus.MAINTENANCE]: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'MANUTENÇÃO' },
  };

  const currentStatus = statusConfig[vehicle.status] || statusConfig[VehicleStatus.OFFLINE];

  const handleOpenRoute = () => {
    const lat = vehicle.lastPosition.lat;
    const lng = vehicle.lastPosition.lng;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const solicitarBloqueio = () => { setConfirmAction('LOCK'); setFeedbackMsg(null); };
  const solicitarDesbloqueio = () => { setConfirmAction('UNLOCK'); setFeedbackMsg(null); };
  const cancelarAcao = () => { setConfirmAction(null); };

  const confirmarAcao = async () => {
    if (!confirmAction) return;
    await sendCommand(vehicle.id, confirmAction);
    setFeedbackMsg(confirmAction === 'LOCK' ? 'Bloqueio Enviado!' : 'Desbloqueio Enviado!');
    setConfirmAction(null);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="text-left font-sans w-[280px] p-1">
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-700/50">
         <div>
           <div className="flex items-center gap-2">
             <span className="block font-bold text-white text-base tracking-tight">{vehicle.plate}</span>
             {isMoving && <span className="animate-pulse w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>}
           </div>
           <span className="text-xs text-slate-400 font-medium">{vehicle.model}</span>
         </div>
         <span className={`text-[10px] font-bold px-2 py-1 rounded border ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}>
           {currentStatus.label}
         </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1">Velocidade</span>
          <span className="text-lg font-mono text-white">{Math.round(vehicle.lastPosition.speed)} <span className="text-xs text-slate-500">km/h</span></span>
        </div>
        <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
          <span className="text-slate-500 block mb-1">Ignição</span>
          <span className={`text-lg font-mono ${vehicle.lastPosition.ignition ? 'text-emerald-400' : 'text-slate-400'}`}>
            {vehicle.lastPosition.ignition ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Action Grid: TALLER BUTTONS FOR TOUCH */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button onClick={onCenter} disabled={!!confirmAction || isLoading} className="bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600 text-slate-300 text-[10px] font-bold py-3 rounded transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-30 active:scale-95">
          <span>🎯</span> Focar
        </button>
        <button onClick={handleOpenRoute} disabled={!!confirmAction || isLoading} className="bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600 text-slate-300 text-[10px] font-bold py-3 rounded transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-30 active:scale-95">
          <span>↗️</span> Google
        </button>
        <button 
          onClick={onToggleHistory} 
          disabled={!!confirmAction || isLoading} 
          className={`text-[10px] font-bold py-3 rounded transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-30 border active:scale-95 ${
            isHistoryActive 
            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
            : 'bg-slate-700/40 hover:bg-slate-700/60 border-slate-600 text-slate-300'
          }`}
        >
          <span>{isHistoryActive ? '🗺️' : '🏳️'}</span> 
          {isHistoryActive ? 'Ocultar' : 'Trajeto'}
        </button>
      </div>

      <div className="border-t border-slate-800 pt-3 min-h-[60px] flex items-center justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse font-medium">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            Enviando comando...
          </div>
        )}
        {!isLoading && confirmAction && (
          <div className="w-full animate-fade-in bg-slate-800 rounded p-2 border border-slate-600">
            <p className="text-[10px] text-center text-slate-300 mb-2 font-medium">
              {confirmAction === 'LOCK' ? '⚠️ Atenção: Bloquear veículo?' : '✅ Confirmar desbloqueio?'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={cancelarAcao} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold py-2.5 rounded transition-colors active:scale-95">Cancelar</button>
              <button onClick={confirmarAcao} className={`text-[10px] font-bold py-2.5 rounded transition-colors text-white active:scale-95 ${confirmAction === 'LOCK' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>CONFIRMAR</button>
            </div>
          </div>
        )}
        {!isLoading && !confirmAction && !feedbackMsg && (
          <div className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded p-2 text-center animate-fade-in">
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1"><span>✓</span> {feedbackMsg}</span>
          </div>
        )}
        {!isLoading && !confirmAction && !feedbackMsg && (
          <div className="grid grid-cols-2 gap-2 w-full">
            <button onClick={solicitarBloqueio} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-bold py-2.5 rounded transition-all flex items-center justify-center gap-2 group active:scale-95">🔒 Bloquear</button>
            <button onClick={solicitarDesbloqueio} className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 text-xs font-bold py-2.5 rounded transition-all flex items-center justify-center gap-2 group active:scale-95">🔓 Liberar</button>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-slate-800/50 text-[9px] text-center text-slate-500 flex justify-center items-center gap-1">
          <span>Última atualização:</span>
          <span className="font-mono text-slate-400">{new Date(vehicle.lastPosition.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

// --- Helper: Pin Icon Creator ---

const createPinIcon = (status: VehicleStatus, isSelected: boolean) => {
  const pinColor = '#EA4335';
  const strokeColor = '#B91C1C';

  const containerClasses = `
    relative w-full h-full flex items-center justify-center 
    transition-all duration-300 ease-out
    ${isSelected 
      ? 'scale-125 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-[1000]' 
      : 'filter drop-shadow-md hover:scale-110 opacity-90'
    }
  `;

  const html = `
    <div class="${containerClasses}">
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C7.58172 0 4 3.58172 4 8C4 13.54 12 24 12 24C12 24 20 13.54 20 8C20 3.58172 16.4183 0 12 0Z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="0.5"/>
        <circle cx="12" cy="8" r="3.5" fill="white"/>
      </svg>
      ${status === VehicleStatus.MOVING ? 
        `<span class="absolute -top-1 -right-1 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-white"></span>
        </span>` 
      : ''}
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'bg-transparent',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });
};

// --- Main Component ---

export const MapVisualization: React.FC<MapProps> = ({ vehicles, selectedVehicleId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { sendCommand, loadingId } = useVehicleCommands();
  const markersRef = useRef<Map<string, { marker: L.Marker, root: Root, element: HTMLDivElement }>>(new Map());
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const [historyVehicleId, setHistoryVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedVehicleId !== historyVehicleId) {
      setHistoryVehicleId(null);
    }
  }, [selectedVehicleId]);

  // --- UX FEATURE: FOCUS ON POPUP (DOM-AWARE) ---
  const focusOnPopup = (map: L.Map, marker: L.Marker) => {
    const latLng = marker.getLatLng();
    map.setView(latLng, 16, { animate: true, duration: 0.5 });

    setTimeout(() => {
        const popup = marker.getPopup();
        if (popup && !popup.isOpen()) {
            marker.openPopup();
        }

        if (popup) {
            const content = popup.getElement();
            if (content) {
                const pxHeight = content.offsetHeight;
                const offsetY = -(pxHeight / 2) - 40; 
                map.panBy([0, offsetY], { animate: true, duration: 0.5 });
            }
        }
    }, 100);
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([MAP_CENTER.lat, MAP_CENTER.lng], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd' }).addTo(map);
    L.control.attribution({ position: 'bottomleft' }).addAttribution('&copy; OpenStreetMap, &copy; CartoDB').addTo(map);
    
    const routeGroup = L.layerGroup().addTo(map);
    routeGroupRef.current = routeGroup;

    mapInstanceRef.current = map;
    return () => {
      markersRef.current.forEach(({ root }) => root.unmount());
      markersRef.current.clear();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle History/Route Drawing (No changes needed)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeGroupRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    if (historyVehicleId) {
      const vehicle = vehicles.find(v => v.id === historyVehicleId);
      if (vehicle && vehicle.history && vehicle.history.length > 0) {
        const cleanRoutePoints = processRouteData(vehicle.history, vehicle.lastPosition);
        
        const polyline = L.polyline(cleanRoutePoints, {
          color: '#22d3ee',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
          lineCap: 'round',
          smoothFactor: 1.0,
          interactive: false
        });
        
        if (cleanRoutePoints.length > 0) {
          const startPoint = cleanRoutePoints[0];
          L.circleMarker(startPoint, {
            radius: 4,
            color: '#22d3ee',
            weight: 2,
            fillColor: '#0F172A',
            fillOpacity: 1,
            interactive: false
          }).addTo(routeGroup);
        }

        polyline.addTo(routeGroup);
        const bounds = polyline.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.2 });
        }
      }
    }
  }, [historyVehicleId, vehicles]);

  // 3. Data Sync: Markers & Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    vehicles.forEach(vehicle => {
      const existing = markersRef.current.get(vehicle.id);
      const isSelected = vehicle.id === selectedVehicleId;
      const isHistoryActive = vehicle.id === historyVehicleId;

      const handleCenter = () => {
        const entry = markersRef.current.get(vehicle.id);
        if (entry) {
            focusOnPopup(map, entry.marker);
        }
      };

      const handleToggleHistory = () => {
        setHistoryVehicleId(prev => prev === vehicle.id ? null : vehicle.id);
      };

      const popupProps: PopupContentProps = {
        vehicle,
        sendCommand,
        loadingId,
        onCenter: handleCenter,
        isHistoryActive,
        onToggleHistory: handleToggleHistory
      };

      if (existing) {
        const { marker, root } = existing;
        const currentLatLng = marker.getLatLng();
        if (currentLatLng.lat !== vehicle.lastPosition.lat || currentLatLng.lng !== vehicle.lastPosition.lng) {
          marker.setLatLng([vehicle.lastPosition.lat, vehicle.lastPosition.lng]);
        }
        root.render(<VehiclePopup {...popupProps} />);
      } else {
        const marker = L.marker([vehicle.lastPosition.lat, vehicle.lastPosition.lng]).addTo(map);
        marker.setIcon(createPinIcon(vehicle.status, isSelected));
        marker.setZIndexOffset(isSelected ? 1000 : 500);

        marker.on('click', () => {
           focusOnPopup(map, marker);
        });

        const popupNode = document.createElement('div');
        const root = createRoot(popupNode);
        root.render(<VehiclePopup {...popupProps} />);
        
        marker.bindPopup(popupNode, { 
            className: 'leaflet-popup-content-wrapper-override', 
            minWidth: 280, 
            closeButton: false, 
            offset: [0, -10],
            autoPan: false 
        });
        
        markersRef.current.set(vehicle.id, { marker, root, element: popupNode });
      }
    });

    const vehicleIds = new Set(vehicles.map(v => v.id));
    markersRef.current.forEach((value, key) => {
      if (!vehicleIds.has(key)) {
        value.root.unmount();
        value.marker.remove();
        markersRef.current.delete(key);
      }
    });

  }, [vehicles, loadingId, sendCommand, historyVehicleId, selectedVehicleId]);

  // 4. Selection Sync
  useEffect(() => {
    vehicles.forEach(vehicle => {
       const entry = markersRef.current.get(vehicle.id);
       if (entry) {
         const isSelected = vehicle.id === selectedVehicleId;
         entry.marker.setIcon(createPinIcon(vehicle.status, isSelected));
         entry.marker.setZIndexOffset(isSelected ? 1000 : 500);
       }
    });
  }, [selectedVehicleId, vehicles]);

  // 5. Follow Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVehicleId || historyVehicleId) return;

    const targetVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (targetVehicle) {
      map.panTo(
        [targetVehicle.lastPosition.lat, targetVehicle.lastPosition.lng], 
        { animate: true, duration: 1.0, easeLinearity: 0.25 }
      );
    }
  }, [vehicles, selectedVehicleId, historyVehicleId]);

  return (
    // Height is controlled by parent to be responsive
    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 shadow-2xl z-0 group">
      <div ref={mapContainerRef} className="w-full h-full bg-[#0F172A]" />
      
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-lg shadow-xl flex items-center gap-3">
          {historyVehicleId ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xl">🗺️</span>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Modo Trajeto</span>
                 <span className="text-[9px] text-slate-400">Histórico recente</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-200 tracking-wider uppercase">Live</span>
              </div>
              <div className="h-3 w-[1px] bg-slate-700"></div>
              <span className="text-[10px] text-slate-400 font-mono">{vehicles.length} Units</span>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none z-[400]"></div>
    </div>
  );
};