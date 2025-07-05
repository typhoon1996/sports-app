'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MapPin, Upload, User } from 'lucide-react';
import Link from 'next/link';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

// Validation schema
const profileSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  profile_picture_url: z.string().url().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, setError, setLoading, isLoading, error } = useAuthStore();
  const [locationLoading, setLocationLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      profile_picture_url: user?.profile_picture_url || '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Update form values when user data changes
    if (user) {
      setValue('first_name', user.first_name);
      setValue('last_name', user.last_name);
      setValue('phone', user.phone || '');
      setValue('bio', user.bio || '');
      setValue('location', user.location || '');
      setValue('profile_picture_url', user.profile_picture_url || '');
    }
  }, [user, setValue]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding using a simple approach
          // In production, you'd use Google Geocoding API
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const location = `${data.city || data.locality || ''}, ${data.principalSubdivision || ''}, ${data.countryName || ''}`.trim();
            setValue('location', location);
          } else {
            setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          console.error('Error getting location name:', error);
          const { latitude, longitude } = position.coords;
          setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to get your location. Please enter it manually.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Convert empty strings to undefined for optional fields
      const updateData = {
        ...data,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        location: data.location || undefined,
        profile_picture_url: data.profile_picture_url || undefined,
      };

      const response = await authService.updateProfile(updateData);
      
      setUser(response.data.user);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.error || 'An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-sm text-gray-600">Update your account information</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Profile Picture Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {watch('profile_picture_url') ? (
                          <img
                            className="h-20 w-20 rounded-full object-cover"
                            src={watch('profile_picture_url')}
                            alt="Profile"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Input
                        {...register('profile_picture_url')}
                        label="Profile Picture URL"
                        placeholder="https://example.com/photo.jpg"
                        error={errors.profile_picture_url?.message}
                        helpText="Enter a URL to your profile picture"
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      {...register('first_name')}
                      label="First Name"
                      placeholder="John"
                      error={errors.first_name?.message}
                      required
                    />
                    <Input
                      {...register('last_name')}
                      label="Last Name"
                      placeholder="Doe"
                      error={errors.last_name?.message}
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <Input
                      type="email"
                      label="Email Address"
                      value={user.email}
                      disabled
                      helpText="Email cannot be changed. Contact support if you need to update it."
                    />
                    <Input
                      {...register('phone')}
                      type="tel"
                      label="Phone Number"
                      placeholder="+91 98765 43210"
                      error={errors.phone?.message}
                      helpText="Optional - helps with match coordination"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Location
                  </h3>
                  <div className="relative">
                    <Input
                      {...register('location')}
                      label="Location"
                      placeholder="Bengaluru, Karnataka, India"
                      error={errors.location?.message}
                      helpText="This helps others find matches near you"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-8"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {locationLoading ? 'Getting...' : 'Use Current'}
                    </Button>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register('bio')}
                    id="bio"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell others about yourself, your favorite sports, skill level, etc."
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    {watch('bio')?.length || 0}/500 characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link href="/dashboard">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading || !isDirty}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
