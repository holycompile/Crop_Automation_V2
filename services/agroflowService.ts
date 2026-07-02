
export async function getFarmData(location: string, crop: string = 'Wheat', stage: string = 'Vegetative') {
  const response = await fetch(
    `http://127.0.0.1:5000/api/location?location=${location}&crop=${encodeURIComponent(crop)}&stage=${encodeURIComponent(stage)}`
  );

  return await response.json();
}