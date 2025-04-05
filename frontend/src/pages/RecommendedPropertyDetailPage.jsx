import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { formatPrice } from '@/utils/priceUtils';
import { ArrowLeft, Bed, Bath, Square, MapPin, Building, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Default property images if none are provided
const DEFAULT_PROPERTY_IMAGES = [
  'https://i.ytimg.com/vi/jDpywBitseg/sddefault.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4g_2I7VmA0nMxF7-YJyXBfWAHRxLBgyornA&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVpTqSDPnP4kh9k33bFBGphYDQcKtcKodcJw&s',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&auto=format',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&auto=format',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=500&auto=format',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format'
];

export default function RecommendedPropertyDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const property = location.state?.property;
  const [activeTab, setActiveTab] = useState("overview");

  // Create an array of images for the property with fallbacks
  const propertyImages = React.useMemo(() => {
    if (!property) return DEFAULT_PROPERTY_IMAGES;
    
    if (Array.isArray(property.images) && property.images.length > 0) {
      return property.images;
    }
    
    if (property.image) {
      return [property.image, ...DEFAULT_PROPERTY_IMAGES.slice(1)];
    }
    
    return DEFAULT_PROPERTY_IMAGES;
  }, [property]);

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recommendations
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="relative h-96 overflow-hidden rounded-lg">
            <img 
              src={propertyImages[0]} 
              alt={`${property.bhk} BHK Property in ${property.locality}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {propertyImages.slice(1, 5).map((image, index) => (
              <div key={index} className="relative h-24 overflow-hidden rounded-lg">
                <img 
                  src={image} 
                  alt={`View ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{property.bhk} BHK Property in {property.locality}</h1>
            <p className="text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {property.location}, Mumbai
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Bed className="h-5 w-5 text-blue-600" />
              <span>{property.bhk} Bedrooms</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bath className="h-5 w-5 text-blue-600" />
              <span>{property.bhk + 1} Bathrooms</span>
            </div>
            <div className="flex items-center space-x-2">
              <Square className="h-5 w-5 text-blue-600" />
              <span>{property.area} sq.ft</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span>{property.status}</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold mb-4">Property Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Property Age</span>
                <span className="font-medium">{property.age || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property Status</span>
                <span className="font-medium">{property.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Locality</span>
                <span className="font-medium">{property.locality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Region</span>
                <span className="font-medium">{property.location}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-blue-600">
                  {formatPrice(property.price)} {property.price_unit}
                </h2>
                <p className="text-sm text-gray-500">Based on actual market data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-8">
        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    This {property.bhk} BHK property is located in the {property.locality} area of {property.location}, Mumbai. 
                    The property has a total area of {property.area} sq.ft and is currently {property.status.toLowerCase()}.
                  </p>
                  <p className="text-gray-700">
                    The property is {property.age || 'of standard age'} and offers a comfortable living space with {property.bhk} bedrooms 
                    and {property.bhk + 1} bathrooms. The property is priced at {formatPrice(property.price)} {property.price_unit}, 
                    which is based on current market rates for similar properties in the area.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="amenities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Bed className="h-5 w-5 text-blue-600" />
                    <span>{property.bhk} Bedrooms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bath className="h-5 w-5 text-blue-600" />
                    <span>{property.bhk + 1} Bathrooms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Square className="h-5 w-5 text-blue-600" />
                    <span>{property.area} sq.ft</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span>{property.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>{property.age || 'Standard Age'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="location" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{property.location}, Mumbai</span>
                  </div>
                  <p className="text-gray-700">
                    This property is located in the {property.locality} area of {property.location}, Mumbai. 
                    The location offers easy access to essential amenities and is well-connected to major parts of the city.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 