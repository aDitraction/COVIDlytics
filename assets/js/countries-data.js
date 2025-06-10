// This is a simplified version of the countries GeoJSON data
// For production, you should use a complete GeoJSON file
export const countriesData = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "United States"
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[
                    -125.0, 48.0],
                    [-125.0, 25.0],
                    [-65.0, 25.0],
                    [-65.0, 48.0],
                    [-125.0, 48.0]
                ]]]
            }
        },
        // Add more countries as needed
        // This is just a sample, you should use a complete GeoJSON file
        // You can find complete country boundaries data at:
        // https://github.com/datasets/geo-countries
    ]
}; 