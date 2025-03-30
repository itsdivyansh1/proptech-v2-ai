import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from '@/utils/priceUtils';
import { Button } from "@/components/ui/button";

export default function RecommendedProperties() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const getRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting to get recommendations...");
      
      // Get user's location with high accuracy
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });

          const { latitude, longitude } = position.coords;
          console.log("Got coordinates:", { latitude, longitude });

          // Send coordinates to backend to get recommendations
          const recommendationsResponse = await axios.post(
            'http://127.0.0.1:5000/recommend_properties',
            { 
              latitude,
              longitude,
              seed: Math.random() // Add random seed to force different recommendations
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              withCredentials: false
            }
          );

          if (recommendationsResponse.data && recommendationsResponse.data.recommendations) {
            setRecommendations(recommendationsResponse.data.recommendations);
            setUserLocation(recommendationsResponse.data.location);
            console.log("Set recommendations for location:", recommendationsResponse.data.recommendations);
            return;
          }
        } catch (geoError) {
          console.error("Geolocation error:", geoError);
          let errorMessage = "Unable to get your location.";
          
          if (geoError.code === 1) {
            errorMessage = "Location access denied. Please enable location services in your browser settings.";
          } else if (geoError.code === 2) {
            errorMessage = "Location unavailable. Please check your device's location settings.";
          } else if (geoError.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }
          
          setError(errorMessage);
        }
      } else {
        setError("Geolocation is not supported by your browser.");
      }
    } catch (error) {
      console.error("Recommendations error:", error);
      setError(error.response?.data?.error || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2">Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 space-y-4">
        <p className="text-red-500">{error}</p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Please check your location settings and try again.</p>
          <Button 
            onClick={getRecommendations}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No recommendations available at the moment</p>
        <Button 
          onClick={getRecommendations}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Recommended Properties {userLocation ? `Near ${userLocation}` : ''}
        </h2>
        <Button 
          onClick={getRecommendations}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{rec.bhk} BHK Property</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Region:</p>
                  <p className="font-medium">{rec.location}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Locality:</p>
                  <p className="font-medium">{rec.locality}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Status:</p>
                  <p className="font-medium">{rec.status}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Age:</p>
                  <p className="font-medium">{rec.age}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Area:</p>
                  <p className="font-medium">{rec.area} sq.ft</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-lg font-semibold text-blue-600">
                    Price: {rec.price} {rec.price_unit}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Based on actual market data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 