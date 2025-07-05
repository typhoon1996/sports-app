'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Initial check
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      // Try to refresh anyway - the service worker might have cached content
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
            <WifiOff className="h-12 w-12 text-gray-400" />
          </div>
        </div>

        {/* Title and Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-8">
          {isOnline 
            ? "You're back online! The page is loading..." 
            : "It looks like you've lost your internet connection. Check your connection and try again."
          }
        </p>

        {/* Status Indicator */}
        <div className="mb-8">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={handleRetry}
            className="w-full"
            disabled={!isOnline}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isOnline ? 'Reload Page' : 'Try Again'}
          </Button>

          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="mt-12 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What you can do offline:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                Browse previously viewed matches
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                View your profile information
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                Access cached content
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                Your changes will sync when you're back online
              </li>
            </ul>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
          <h4 className="font-medium text-blue-900 mb-2">Connection Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Check your WiFi or mobile data</li>
            <li>• Move to an area with better signal</li>
            <li>• Restart your router if using WiFi</li>
            <li>• Contact your network provider if issues persist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
