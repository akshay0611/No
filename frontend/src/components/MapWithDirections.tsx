import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Clock, Loader2 } from "lucide-react";

interface MapWithDirectionsProps {
  salonLocation: {
    latitude: number;
    longitude: number;
  };
  salonName: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  onGetDirections: () => void;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

export default function MapWithDirections({
  salonLocation,
  salonName,
  userLocation,
  onGetDirections,
}: MapWithDirectionsProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: salonLocation.latitude, lng: salonLocation.longitude },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(mapInstance);

    // Add salon marker
    new google.maps.Marker({
      position: { lat: salonLocation.latitude, lng: salonLocation.longitude },
      map: mapInstance,
      title: salonName,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#0d9488",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      label: {
        text: "S",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "bold",
      },
    });

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [salonLocation, salonName]);

  // Add user marker and draw route
  useEffect(() => {
    if (!map || !userLocation) return;

    // Add user marker
    new google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map: map,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    // Draw route
    setIsLoadingRoute(true);
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#0d9488",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      },
    });

    directionsRendererRef.current = directionsRenderer;

    directionsService.route(
      {
        origin: { lat: userLocation.latitude, lng: userLocation.longitude },
        destination: { lat: salonLocation.latitude, lng: salonLocation.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsLoadingRoute(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);

          // Extract route info
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setRouteInfo({
              distance: route.legs[0].distance?.text || "",
              duration: route.legs[0].duration?.text || "",
            });
          }

          // Fit bounds to show entire route
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
          bounds.extend({ lat: salonLocation.latitude, lng: salonLocation.longitude });
          map.fitBounds(bounds);
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  }, [map, userLocation, salonLocation]);

  const handleOpenInGoogleMaps = () => {
    const url = userLocation
      ? `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${salonLocation.latitude},${salonLocation.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${salonLocation.latitude},${salonLocation.longitude}&travelmode=driving`;
    
    window.open(url, '_blank');
    onGetDirections();
  };

  return (
    <div className="space-y-4">
      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <div ref={mapRef} className="w-full h-80" />
        
        {/* Loading overlay */}
        {isLoadingRoute && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-teal-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Calculating route...</span>
            </div>
          </div>
        )}
      </div>

      {/* Route info */}
      {routeInfo && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Distance</p>
                <p className="text-lg font-semibold text-gray-900">{routeInfo.distance}</p>
              </div>
            </div>
            <div className="w-px h-12 bg-teal-300" />
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">ETA</p>
                <p className="text-lg font-semibold text-gray-900">{routeInfo.duration}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salon info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{salonName}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {salonLocation.latitude.toFixed(6)}, {salonLocation.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>

      {/* Open in Google Maps button */}
      <Button
        onClick={handleOpenInGoogleMaps}
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
      >
        <Navigation className="w-5 h-5 mr-2" />
        Open in Google Maps
      </Button>

      {/* Instructions */}
      <p className="text-xs text-center text-gray-500">
        Follow the directions to reach the salon on time
      </p>
    </div>
  );
}
