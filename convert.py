
from flask import Flask, jsonify, request
from flask_cors import CORS
import geopandas as gpd
# creating instance for flask web application
app = Flask(__name__)
# CORS headers to resolve CORS issue (as we are using different domains in fe and be)
CORS(app)
# Decorator that defines a route for handling POST requests to the '/convertToShapefile' .
@app.route('/convertToShapefile', methods=['POST'])
def convert_to_shapefile():
    try:
        # Get the JSON data from the POST request payload and storing in a variable
        geojson_data = request.get_json()
        # Creating GeoDataFrame from GeoJSON features.
        gdf = gpd.GeoDataFrame.from_features(geojson_data['features'])
        output_shapefile = 'output.shp'
        # Save the GeoDataFrame to a Shapefile.
        gdf.to_file(output_shapefile, driver='ESRI Shapefile')
        # returning the successufull conversion of shapefile message as response 
        return jsonify({'message': 'GeoJSON converted to Shapefile successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
   
 
if __name__ == '__main__':
    # Running the Flask application in debug mode on port 5000.
    app.run(host='127.0.0.1', port=5000, debug=True)
    