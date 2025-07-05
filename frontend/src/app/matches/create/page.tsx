'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Calendar, Clock, Users, DollarSign, Target, Globe, Lock } from 'lucide-react';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { sportsService, matchesService } from '@/services/sportsService';
import { Sport, MatchFormData, SkillLevel } from '@/types';

// Validation schema
const matchSchema = z.object({
  sport_id: z.string().min(1, 'Please select a sport'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  location: z.string().min(3, 'Please enter a location'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  scheduled_date: z.string().min(1, 'Please select a date'),
  start_time: z.string().min(1, 'Please select a start time'),
  end_time: z.string().optional(),
  max_players: z.number().min(2, 'Minimum 2 players required').max(100, 'Maximum 100 players allowed'),
  required_skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
  cost: z.number().min(0, 'Cost cannot be negative').max(10000, 'Cost too high'),
  is_public: z.boolean(),
}).refine((data) => {
  if (data.end_time && data.start_time >= data.end_time) {
    return false;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["end_time"],
});

type MatchFormData = z.infer<typeof matchSchema>;

export default function CreateMatchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError: setFormError,
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      required_skill_level: 'beginner',
      cost: 0,
      is_public: true,
      scheduled_date: new Date().toISOString().split('T')[0], // Today's date
    }
  });

  const watchedSportId = watch('sport_id');
  const watchedMaxPlayers = watch('max_players');

  // Load sports data
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await sportsService.getAllSports();
        setSports(sportsData);
      } catch (error) {
        console.error('Error loading sports:', error);
        setError('Failed to load sports data');
      }
    };
    loadSports();
  }, []);

  // Update selected sport when sport_id changes
  useEffect(() => {
    if (watchedSportId) {
      const sport = sports.find(s => s.id === watchedSportId);
      setSelectedSport(sport || null);
      
      // Validate max_players against sport constraints
      if (sport && watchedMaxPlayers) {
        if (watchedMaxPlayers < sport.min_players) {
          setValue('max_players', sport.min_players);
        } else if (watchedMaxPlayers > sport.max_players) {
          setValue('max_players', sport.max_players);
        }
      }
    }
  }, [watchedSportId, sports, watchedMaxPlayers, setValue]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapsLoaded) return;

      try {
        // Load Google Maps API
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        setMapsLoaded(true);

        // Get user's current location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            initializeMap(userLocation);
          },
          () => {
            // Default to a central location if geolocation fails
            const defaultLocation = { lat: 12.9716, lng: 77.5946 }; // Bangalore
            initializeMap(defaultLocation);
          }
        );
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Failed to load map. Please enter location manually.');
      }
    };

    const initializeMap = (center: { lat: number; lng: number }) => {
      if (!mapRef.current) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMap(mapInstance);

      // Add click listener to place marker
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          placeMarker(event.latLng, mapInstance);
        }
      });

      // Initialize Places Autocomplete
      const input = document.getElementById('location-input') as HTMLInputElement;
      if (input) {
        const autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', mapInstance);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            mapInstance.setCenter(place.geometry.location);
            mapInstance.setZoom(15);
            placeMarker(place.geometry.location, mapInstance);
          }
        });
      }
    };

    const placeMarker = (location: google.maps.LatLng, mapInstance: google.maps.Map) => {
      // Remove existing marker
      if (marker) {
        marker.setMap(null);
      }

      // Create new marker
      const newMarker = new google.maps.Marker({
        position: location,
        map: mapInstance,
        draggable: true,
      });

      setMarker(newMarker);

      // Update form values
      setValue('latitude', location.lat());
      setValue('longitude', location.lng());

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setValue('location', results[0].formatted_address);
          const input = document.getElementById('location-input') as HTMLInputElement;
          if (input) {
            input.value = results[0].formatted_address;
          }
        }
      });

      // Add drag listener
      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition();
        if (position) {
          setValue('latitude', position.lat());
          setValue('longitude', position.lng());
          
          // Update address
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              setValue('location', results[0].formatted_address);
              const input = document.getElementById('location-input') as HTMLInputElement;
              if (input) {
                input.value = results[0].formatted_address;
              }
            }
          });
        }
      });
    };

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    initMap();
  }, [isAuthenticated, router, mapsLoaded, marker, setValue]);

  const onSubmit = async (data: MatchFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate date is not in the past
      const matchDateTime = new Date(`${data.scheduled_date}T${data.start_time}`);
      if (matchDateTime <= new Date()) {
        setFormError('scheduled_date', { message: 'Match date and time must be in the future' });
        return;
      }

      const match = await matchesService.createMatch(data);
      
      // Redirect to the created match
      router.push(`/matches/${match.id}`);
    } catch (error: any) {
      console.error('Create match error:', error);
      
      if (error.code === 'SPORT_NOT_FOUND') {
        setFormError('sport_id', { message: 'Please select a valid sport' });
      } else if (error.code === 'INVALID_PLAYER_COUNT') {
        setFormError('max_players', { message: error.error });
      } else if (error.details) {
        error.details.forEach((detail: string) => {
          if (detail.includes('title')) {
            setFormError('title', { message: detail });
          } else if (detail.includes('location')) {
            setFormError('location', { message: detail });
          }
        });
      } else {
        setError(error.error || 'Failed to create match');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Create a Match</h1>
            <p className="text-gray-600">Organize a sports match for your community</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Global Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sport Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport *
                </label>
                <select
                  {...register('sport_id')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a sport</option>
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name} ({sport.min_players}-{sport.max_players} players)
                    </option>
                  ))}
                </select>
                {errors.sport_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.sport_id.message}</p>
                )}
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <Input
                  {...register('title')}
                  label="Match Title"
                  placeholder="e.g., Weekend Football at Central Park"
                  error={errors.title?.message}
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional details about the match..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
            
            <div className="space-y-4">
              <div>
                <Input
                  id="location-input"
                  {...register('location')}
                  label="Location"
                  placeholder="Enter location or click on the map"
                  error={errors.location?.message}
                  required
                />
              </div>

              {/* Map */}
              <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                <div ref={mapRef} className="w-full h-full" />
              </div>
              
              <p className="text-sm text-gray-600">
                <MapPin className="h-4 w-4 inline mr-1" />
                Click on the map or search above to set the match location
              </p>
            </div>

            {/* Hidden coordinate inputs */}
            <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
            <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Input
                  {...register('scheduled_date')}
                  type="date"
                  label="Date"
                  error={errors.scheduled_date?.message}
                  required
                />
              </div>

              <div>
                <Input
                  {...register('start_time')}
                  type="time"
                  label="Start Time"
                  error={errors.start_time?.message}
                  required
                />
              </div>

              <div>
                <Input
                  {...register('end_time')}
                  type="time"
                  label="End Time (Optional)"
                  error={errors.end_time?.message}
                />
              </div>
            </div>
          </div>

          {/* Match Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Match Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  {...register('max_players', { valueAsNumber: true })}
                  type="number"
                  label="Maximum Players"
                  min={selectedSport?.min_players || 2}
                  max={selectedSport?.max_players || 100}
                  error={errors.max_players?.message}
                  helpText={selectedSport ? `${selectedSport.name} requires ${selectedSport.min_players}-${selectedSport.max_players} players` : undefined}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skill Level
                </label>
                <select
                  {...register('required_skill_level')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {errors.required_skill_level && (
                  <p className="text-sm text-red-600 mt-1">{errors.required_skill_level.message}</p>
                )}
              </div>

              <div>
                <Input
                  {...register('cost', { valueAsNumber: true })}
                  type="number"
                  label="Cost per Person (₹)"
                  min={0}
                  step={0.01}
                  error={errors.cost?.message}
                  helpText="Set to 0 for free matches"
                />
              </div>

              <div className="flex items-center space-x-4 pt-6">
                <div className="flex items-center">
                  <input
                    {...register('is_public')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Public Match
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Public matches are visible to all users
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Match...' : 'Create Match'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
