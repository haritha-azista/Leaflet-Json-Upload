import React, { useRef, useState, useEffect } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import exp from '../../data/Json3.json';
import L from 'leaflet';
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { saveAs } from "file-saver";
import { Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './formpopup.css'
const VectorDataUpload = () => {
  const [data, setData] = useState(exp);
  const [vectorData, setVectordata] = useState([]);
  const fileInputRef = useRef();
  const map = useRef();
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    measure: '',
  });

  const featureCollection = {
    type: 'FeatureCollection',
    features: [],
  }

  //function to handle the upload files
  const handleUploadFiles = (event) => {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const jsonContent = e.target.result;
        const vector = JSON.parse(jsonContent);
        console.log(vector);
        // setData(vector);
        setData((prevData) => ({
          ...prevData,
          features: [...prevData.features, ...vector.features],
        }));
        console.log(JSON.stringify(data));
        const map1 = map.current;
        L.geoJSON(vector, {
          onEachFeature: (feature, layer) => {
            const popupContent = Object.keys(feature.properties)
              .map((key) => `<strong>${key}:</strong> ${feature.properties[key]}`)
              .join('<br>');
            layer.bindPopup(popupContent);
          },
        }).addTo(map1);
        // console.log(vector.features);

      };
      reader.readAsText(file, 'UTF-8');
    };
  }
  useEffect(() => {
    setVectordata(
      data.features.map((feature, index) => ({
        ...feature,
        id: index,
      }))
    );
  }, [data]);

  vectorData.map((value) => {
    // console.log(value);
    featureCollection.features.push(value)
  })


  // function to update form values with table data when we click on edit button based on it's id
  const EditValue = (LayerId) => {
    const layerData = vectorData.find((value) => value.id === LayerId);
    setFormData({
      id: LayerId,
      ...layerData.properties,
    });
    setEditId(LayerId);
  };

  // function to handle submit data after editing in form
  const handleSubmit = () => {
    const idValue = formData.id;
    const nameValue = formData.name;
    const descValue = formData.description;
    const measureValue = formData.measure;

    if (editId !== null) {
      // Update existing entry
      setVectordata((prevFormData) =>
        prevFormData.map((item) =>
          item.id === editId
            ? {
              ...item,
              properties: {
                ...item.properties,
                name: nameValue,
                description: descValue,
                measure: measureValue,
              },
            }
            : item
        )
      );
    }
    else {
      // Add new entry
      setVectordata((prevFormData) => [
        ...prevFormData,
        {
          id: idValue,
          properties: {
            name: nameValue,
            description: descValue,
            measure: measureValue,
          },
        },
      ]);
    }
    // Clearing form fields after submission of form values
    setFormData({
      id: '',
      name: '',
      description: '',
      measure: '',
    });
  };

  // accessing map current state and adding leaflet geoman pluggin to enable editing
  if (map.current) {
    const map1 = map.current;
    // Enable the Leaflet-Geoman plugin
    map1.pm.addControls({
      position: 'topright',
      drawCircleMarker: false,
      rotateMode: false,
    });
    map1.pm.setPathOptions({
      color: 'orange',
      fillColor: 'green',
      fillOpacity: 0.4,
    });
  }
  // export funtion to handle exporting of vector layers
  const handleExportClick = () => {
    const blob = new Blob([JSON.stringify(featureCollection)], { type: 'application/json' });
    saveAs(blob, 'expData.geojson');
  }
  return (
    <div>

      <div className='divMapContainer'>
        <MapContainer className="mapContainerMain"
          zoom={2}
          pin={true}
          pinControl={true}
          worldCopyJump={true}
          center={[20, 100]}
          ref={map}
          scrollWheelZoom={true}
          guideLayers={[]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | GIS Simplified contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          <GeoJSON data={data} />
        </MapContainer>
      </div>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        webkit_directory={true}
        onChange={handleUploadFiles}
        style={{ display: 'none' }}
      />

      
      <div style={{ border: '2ps solid' }} className="formPopup">
        ID<input type="number" id="input_i" value={formData.id} readOnly />
        <br />
        Name<input type="text" id="input_n" value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        <br />
        Desc<input type="text" id="input_d" value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <br />
        Measure<input type="text" id="input_m" value={formData.measure}
          onChange={(e) => setFormData({ ...formData, measure: e.target.value })} />
        <br />
        <input
          type="button"
          id="input_b"
          value="Datasubmit"
          onClick={() => {
            handleSubmit();

          }}
        />
      </div>

      <div>
        <br />
        <h5 className='tableHeading'>Attribute Table</h5>
        <Table striped bordered hover variant='dark'>
          <thead>
            <tr>
              <th>id</th>
              <th>Name</th>
              <th>Description</th>
              <th>Measure</th>
              <th>Edit Data</th>
            </tr>
          </thead>
          {vectorData.length > 0 ? (
            vectorData.map(({ id, properties }) => (
              <tbody key={id}>
                <tr>
                  <td>{id}</td>
                  {Object.keys(properties).map((propertyKey) => (
                    <td key={propertyKey}>{properties[propertyKey]}</td>
                  ))}
                  <td>
                    <button onClick={() => EditValue(id)}>Edit</button>
                  </td>
                </tr>
              </tbody>
            ))
          ) : (
            <td>Draw Vector Layers</td>
          )}
        </Table>
      </div>

      <button variant='info' size='sm' className='uploadButton' onClick={() => fileInputRef.current.click()}>Upload</button>
      <button className="jsonExpButton" onClick={handleExportClick} style={{ backgroundColor: 'green', color: 'white' }}>
        Export to Json
      </button>
    </div>
  );
};


export default VectorDataUpload;