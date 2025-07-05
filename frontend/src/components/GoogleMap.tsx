'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface GoogleMapComponentProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  height?: string;
  zoom?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 12.9716, // Bangalore coordinates
  lng: 77.5946
};

export default function GoogleMapComponent({
  onLocationSelect,
  initialLocation,
  height = '400px',
  zoom = 13
}: GoogleMapComponentProps) {
  const mapRef = useRef<google.maps.Map>();
  const autocompleteRef = useRef<google.maps.places.Autocomplete>();
  const [center, setCenter] = React.useState(initialLocation || defaultCenter);
  const [marker, setMarker] = React.useState<Location | null>(initialLocation || null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current !== undefined) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const location: Location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || place.name
        };
        
        setCenter(location);
        setMarker(location);
        onLocationSelect(location);
        
        if (mapRef.current) {
          mapRef.current.panTo(location);
        }
      }
    }
  }, [onLocationSelect]);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const location: Location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      
      setMarker(location);
      onLocationSelect(location);
      
      // Reverse geocoding to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: event.latLng },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const updatedLocation = {
              ...location,
              address: results[0].formatted_address
            };
            onLocationSelect(updatedLocation);
          }
        }
      );
    }
  }, [onLocationSelect]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCenter(location);
          setMarker(location);
          onLocationSelect(location);
          
          if (mapRef.current) {
            mapRef.current.panTo(location);
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, [onLocationSelect]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'your-google-maps-api-key') {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center" style={{ height }}>
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Google Maps API Key Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please add your Google Maps API key to continue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
        <div className="space-y-2">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              placeholder="Search for a location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </Autocomplete>
          
          <button
            type="button"
            onClick={getCurrentLocation}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Use my current location
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={{ ...mapContainerStyle, height }}
          center={center}
          zoom={zoom}
          onLoad={onMapLoad}
          onClick={onMapClick}
        >
          {marker && (
            <Marker
              position={marker}
              draggable
              onDragEnd={(event) => {
                if (event.latLng) {
                  const location: Location = {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng()
                  };
                  setMarker(location);
                  onLocationSelect(location);
                }
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
