import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from '@/utils/priceUtils';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin } from 'lucide-react';

// Array of random property images
const propertyImages = [
  'https://i.ytimg.com/vi/jDpywBitseg/sddefault.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4g_2I7VmA0nMxF7-YJyXBfWAHRxLBgyornA&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVpTqSDPnP4kh9k33bFBGphYDQcKtcKodcJw&s',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&auto=format',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&auto=format',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=500&auto=format',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&auto=format',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=500&auto=format',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&auto=format',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=500&auto=format',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=500&auto=format',
];

export default function RecommendedProperties() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

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
            // Add random images to recommendations
            const recommendationsWithImages = recommendationsResponse.data.recommendations.map(rec => ({
              ...rec,
              image: propertyImages[Math.floor(Math.random() * propertyImages.length)]
            }));
            
            setRecommendations(recommendationsWithImages);
            setUserLocation(recommendationsResponse.data.location);
            console.log("Set recommendations for location:", recommendationsWithImages);
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

  const handlePropertyClick = (property) => {
    navigate('/recommended-property-detail', { state: { property } });
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((property, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handlePropertyClick(property)}
          >
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              <img 
                src={property.image} 
                alt={`${property.bhk} BHK Property in ${property.locality}`}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-xl">
                {property.bhk} BHK Property in {property.locality}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{property.location}, Mumbai</span>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <Bed className="h-4 w-4 text-blue-600" />
                    <span>{property.bhk} Beds</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bath className="h-4 w-4 text-blue-600" />
                    <span>{property.bhk + 1} Baths</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Square className="h-4 w-4 text-blue-600" />
                    <span>{property.area} sq.ft</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-lg font-bold">
                    {formatPrice(property.price)} {property.price_unit}
                  </Badge>
                  <Badge variant="outline">{property.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 