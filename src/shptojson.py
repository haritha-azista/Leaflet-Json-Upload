import geopandas as gpd

def convert_shapefile_to_geojson(output_geojson_path):
    # Reading the shapefile using geopandas
    gdf = gpd.read_file('D:/Haritha/myreact-app/assembly-constituencies/India_AC.shp')
    
    # Converting the geodataframe to a GeoJSON file
    out = gdf.to_file(output_geojson_path, driver='GeoJSON')
    print(out)
# Define the file path for output GeoJSON file
output_geojson_path = 'D:/Haritha/myreact-app/assembly-constituencies.json'

# Calling the conversion function
convert_shapefile_to_geojson( output_geojson_path)
# printing success msg to indicate successful conversion
print('Shapefile has been successfully converted to GeoJSON!')