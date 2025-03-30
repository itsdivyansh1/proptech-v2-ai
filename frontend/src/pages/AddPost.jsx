import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import UploadWidget from "@/components/UploadProfileImage";
import axios from "../api/axios";
import { formatPrice, getPriceComparisonColor } from "@/utils/priceUtils";

export default function AddPost() {
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [pricePrediction, setPricePrediction] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.currentUser);

  const form = useForm({
    defaultValues: {
      title: "",
      price: "",
      address: "",
      description: "",
      city: "",
      bedrooms: "",
      bathrooms: "",
      maintenance: "",
      category: "rent",
      totalarea: "",
      property: "apartment",
      pets: "allowed",
      watersupply: "",
      balcony: "",
      furnishing: "Unfurnished",
    },
  });

  const handleAmenityChange = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  };

  const onSubmit = async (data) => {
    console.log("Form submission started");
    setLoading(true);
    const basicInfo = {
      title: data.title,
      price: data.price,
      address: data.address.toLowerCase(),
      city: data.city.toLowerCase(),
      bedroom: data.bedrooms,
      bathroom: data.bathrooms,
      category: data.category,
      propertyType: data.property,
      images: images,
    };

    const postDetails = {
      description: data.description,
      totalArea: data.totalarea,
      pets: data.pets,
      amenities: selectedAmenities,
      waterSupply: data.watersupply,
      balcony: data.balcony,
      FurnishingStatus: data.furnishing,
      maintenance: data.maintenance,
      username: currentUser.username,
      avatar: currentUser.avatar,
    };

    console.log("Data prepared:", { basicInfo, postDetails });

    try {
      console.log("Making API request to /post/createpost");
      const response = await axios.post("/post/createpost", {
        basicInfo,
        postDetails,
      });
      console.log("API response received:", response.data);

      if (response.data.newPost) {
        console.log("Post created successfully, navigating to profile");
        setLoading(false);
        navigate(`/profile/${currentUser._id}`);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      console.error("Error details:", error.response?.data);
      setLoading(false);
    }
  };

  const predictPrice = async (formData) => {
    try {
      setPriceError(null);
      const response = await axios.post("http://127.0.0.1:5000/predict_price", {
        region: formData.city,
        bhk: formData.bedrooms,
        user_price: formData.price
      }, {
        withCredentials: false,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setPricePrediction(response.data);
    } catch (error) {
      console.error("Error predicting price:", error);
      if (error.response?.data) {
        setPriceError(error.response.data);
      } else {
        setPriceError({ error: "Failed to fetch price prediction" });
      }
    }
  };

  // Watch for changes in relevant form fields
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['price', 'bedrooms', 'bathrooms', 'totalarea', 'city'].includes(name)) {
        const formData = form.getValues();
        if (formData.price && formData.bedrooms && formData.bathrooms && formData.totalarea && formData.city) {
          predictPrice(formData);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="container max-w-[1300px] mx-auto p-4">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Add New Property Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        {field.value && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-blue-600">
                              Entered Price: {formatPrice(field.value)}
                            </p>
                            {pricePrediction && (
                              <div className="space-y-1">
                                <p className={`text-sm font-medium ${getPriceComparisonColor(pricePrediction.price_variation)}`}>
                                  Predicted: {pricePrediction.predicted_price}
                                </p>
                                <p className={`text-sm ${getPriceComparisonColor(pricePrediction.price_variation)}`}>
                                  {pricePrediction.price_variation}
                                </p>
                              </div>
                            )}
                            {priceError && (
                              <div className="text-sm text-red-500 mt-1">
                                <p>{priceError.error}</p>
                                {priceError.available_regions && (
                                  <p className="text-xs mt-1">
                                    Available regions: {priceError.available_regions.join(", ")}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[120px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location and Size */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalarea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Area (sq.ft)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maintenance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Maintenance</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Room Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="balcony"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balcony</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 2 balconies" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rent">Rent</SelectItem>
                            <SelectItem value="buy">Sale</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="property"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">Flat</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pet Policy</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pet policy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="allowed">Allowed</SelectItem>
                            <SelectItem value="not-allowed">
                              Not Allowed
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="watersupply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Water Supply</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., 24/7 water supply"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="furnishing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Furnishing Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select furnishing status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Fully Furnished">
                              Fully Furnished
                            </SelectItem>
                            <SelectItem value="Semi-Furnished">
                              Semi-Furnished
                            </SelectItem>
                            <SelectItem value="Unfurnished">
                              Unfurnished
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Amenities */}
                <div className="space-y-4">
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-4">
                    {["swimming pool", "gym", "parking"].map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityChange(amenity)}
                        />
                        <label
                          htmlFor={amenity}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <Label>Images</Label>
                  <UploadWidget
                    uwConfig={{
                      cloudName: "djqyemiwb",
                      uploadPreset: "postimages",
                      multiple: true,
                      folder: "postimages",
                    }}
                    setImages={setImages}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Listing"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
