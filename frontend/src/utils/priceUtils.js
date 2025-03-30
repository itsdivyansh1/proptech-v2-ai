export const convertToLakhs = (price) => {
  // Handle null, undefined, or empty string
  if (!price) return 0;
  
  // Convert to number, handling string inputs
  const numericPrice = Number(price);
  
  // Handle invalid numbers
  if (isNaN(numericPrice)) return 0;
  
  // If price is already in lakhs (e.g., 20), return as is
  if (numericPrice < 100000) {
    return numericPrice;
  }
  
  // If price is in actual amount (e.g., 2000000), convert to lakhs
  return numericPrice / 100000;
};

export const formatPrice = (price) => {
  // Handle null, undefined, or empty string
  if (!price) return "₹0.00 Lakhs";
  
  // Convert to number, handling string inputs
  const numericPrice = Number(price);
  
  // Handle invalid numbers
  if (isNaN(numericPrice)) return "₹0.00 Lakhs";
  
  // Format the price with 2 decimal places
  return `₹${numericPrice.toFixed(2)} Lakhs`;
};

export const getPriceComparisonColor = (variation) => {
  if (!variation) return 'text-blue-600';
  return variation > 0 ? 'text-red-600' : 'text-green-600';
};

export const extractNumericPrice = (priceString) => {
  if (!priceString) return 0;
  // Remove ₹ symbol and convert to number
  const numericStr = priceString.replace(/[₹,]/g, '');
  const num = parseFloat(numericStr);
  return isNaN(num) ? 0 : num;
}; 