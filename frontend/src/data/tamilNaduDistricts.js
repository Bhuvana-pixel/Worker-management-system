// Tamil Nadu Districts GeoJSON data (simplified boundaries for key districts)
// This is a simplified version - in production, use official GeoJSON data
export const tamilNaduDistricts = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "district": "Thoothukudi",
        "area": "thoothukudi",
        "aliases": ["tuty", "thoothukudi", "tuticorin"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.8, 8.6], [78.2, 8.6], [78.2, 9.2], [77.8, 9.2], [77.8, 8.6]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district": "Kovilpatti",
        "area": "kovilpatti",
        "aliases": ["kovilpatti", "kovilpatti area"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.7, 9.0], [78.0, 9.0], [78.0, 9.4], [77.7, 9.4], [77.7, 9.0]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district": "Tenakasi",
        "area": "tenkasi",
        "aliases": ["tenkasi", "tenkasiam"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.0, 8.8], [77.4, 8.8], [77.4, 9.2], [77.0, 9.2], [77.0, 8.8]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district": "Tirunelveli",
        "area": "tirunelveli",
        "aliases": ["tirunelveli", "nelveli"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.4, 8.4], [77.8, 8.4], [77.8, 8.8], [77.4, 8.8], [77.4, 8.4]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district": "Virudhunagar",
        "area": "virudhunagar",
        "aliases": ["virudhunagar", "virudhu"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [77.8, 9.2], [78.2, 9.2], [78.2, 9.6], [77.8, 9.6], [77.8, 9.2]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "district": "Ramanathapuram",
        "area": "ramanathapuram",
        "aliases": ["ramanathapuram", "ramnad"]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [78.2, 8.6], [78.6, 8.6], [78.6, 9.4], [78.2, 9.4], [78.2, 8.6]
        ]]
      }
    }
  ]
};

// Helper function to get district name from area
export const getDistrictFromArea = (area) => {
  if (!area) return null;
  const normalizedArea = area.toLowerCase().trim();

  for (const feature of tamilNaduDistricts.features) {
    const district = feature.properties;
    if (district.area === normalizedArea ||
        district.aliases.includes(normalizedArea)) {
      return district.district;
    }
  }
  return null;
};

// Helper function to get area from district
export const getAreaFromDistrict = (district) => {
  if (!district) return null;
  const normalizedDistrict = district.toLowerCase().trim();

  for (const feature of tamilNaduDistricts.features) {
    if (feature.properties.district.toLowerCase() === normalizedDistrict) {
      return feature.properties.area;
    }
  }
  return null;
};

// Get all district names
export const getAllDistrictNames = () => {
  return tamilNaduDistricts.features.map(feature => feature.properties.district);
};

// Get district feature by name
export const getDistrictFeature = (districtName) => {
  return tamilNaduDistricts.features.find(
    feature => feature.properties.district.toLowerCase() === districtName.toLowerCase()
  );
};
