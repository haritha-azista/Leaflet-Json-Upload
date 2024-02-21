import React, { useRef, useState, useEffect } from "react";
import { MapContainer, GeoJSON, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { saveAs } from "file-saver";
import { Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './formpopup.css';

const VectorDataUpload = () => {
    const [data, setData] = useState({ features: [] });
    const fileInputRef = useRef();
    const map = useRef();
    const [vectordata, setVectordata] = useState([])
    const [editId, setEditId] = useState(null);
    const [formInput, setFormInput] = useState({
        id: '',
        properties: {},
    });
    const featureCollection = {
        type: 'FeatureCollection',
        features: [],
    }

    const featureGroupRef = useRef();
    // Function to handle the upload files
    const handleUploadFiles = (event) => {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = async (e) => {
                const jsonContent = e.target.result;
                const vector = JSON.parse(jsonContent);
                setData((prevData) => ({
                    ...prevData,
                    features: [...prevData.features, ...vector.features],
                }));
                const map1 = map.current;
                L.geoJSON(vector, {
                    onEachFeature: (feature, layer) => {
                        const popupContent = Object.keys(feature.properties)
                            .map((key) => `<strong>${key}:</strong> ${feature.properties[key]}`)
                            .join('<br>');
                        layer.bindPopup(popupContent);
                        featureGroupRef.current.addLayer(layer);
                    },
                }).addTo(map1);

            };
            reader.readAsText(file, 'UTF-8');
        }
    };
    const _onCreated = (e) => {

    }
    const _onEdited = (e) => {
        const layers = e.layers;
        layers.eachLayer((layer) => {
            const editedGeoJSON = layer.toGeoJSON();
            console.log("Edited GeoJSON:", editedGeoJSON);
            if (layer instanceof L.Polygon) {
                updateTooltip(layer);
            }
        });
    }
    const updateTooltip = (layer) => {
        
            const editedPolygonCoords = layer.getLatLngs()[0];
            const area = L.GeometryUtil.geodesicArea(editedPolygonCoords);
            const readableArea = L.GeometryUtil.readableArea(area, true);
            const toolContent = readableArea;
            layer.bindTooltip(toolContent.toString(), { permanent: true, direction: "center" }).openTooltip();
        
    }
    const handleInputChange = (e, propertyKey) => {
        const { value } = e.target;
        setFormInput((prevFormInput) => ({
            ...prevFormInput,
            properties: {
                ...prevFormInput.properties,
                [propertyKey]: value,
            },
        }));
    };
    const EditValue = (LayerId) => {
        const layerData = data.features[LayerId];
        console.log("LayerId:", LayerId);
        console.log("data.features:", data.features);
        console.log("layerData:", layerData);
        if (layerData) {
            const { properties } = layerData;
            console.log("id:", LayerId);
            console.log("properties:", properties);

            setFormInput({
                LayerId,
                properties: { ...properties },
            });
            setEditId(LayerId);
        } else {
            console.error("Layer data not found for id:", LayerId);
        }
    };

    const handleSubmit = () => {
        if (editId !== null) {
            // Editing existing feature
            setData((prevData) => {
                const updatedFeatures = prevData.features.map((feature, index) => {
                    if (index === editId) {
                        return {
                            ...feature,
                            properties: formInput.properties,
                        };
                    }
                    return feature;
                });

                return {
                    ...prevData,
                    features: updatedFeatures,
                };
            });
        } else {
            // Adding new feature
            setData((prevData) => ({
                ...prevData,
                features: [
                    ...prevData.features,
                    {
                        type: 'Feature',
                        properties: formInput.properties,
                        geometry: {
                            type: 'Point',
                            coordinates: [],
                        },
                    },
                ],
            }));
        }

        // Reset form input and editId
        setFormInput({
            id: '',
            properties: {},
        });
        setEditId(null);
    };

    useEffect(() => {
        setVectordata(
            data.features.map((feature, index) => ({
                ...feature,
                id: index,
            }))
        );
    }, [data]);
    vectordata.map((value) => {
        // console.log(value);
        featureCollection.features.push(value)
    })

    const handleExportClick = () => {
        const blob = new Blob([JSON.stringify(featureCollection)], { type: 'application/json' });
        saveAs(blob, 'expData.geojson');
    };

    return (
        <div>
            <div className="mapForm">
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
                        <FeatureGroup ref={featureGroupRef}>
                            <EditControl
                                position="topright"
                                onEdited={_onEdited}
                                onCreated={_onCreated}
                                draw={{
                                    rectangle: true,
                                    polygon: {
                                        showArea: true,
                                        clickable: true,
                                        metric: false,
                                        allowIntersection: false
                                    },
                                    polyline: true,
                                    circlemarker: true,
                                    circle: true,
                                    showMeasurements: true
                                }}
                            />
                        </FeatureGroup>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | GIS Simplified contributors'
                            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        />
                        <GeoJSON data={data} />
                    </MapContainer>
                </div>
                <div className="formButtons">
                    <div className="formPopup">
                        {Object.entries(formInput.properties).map(([propertyKey, propertyValue]) => (
                            <div key={propertyKey}>
                                <input
                                    type="text"
                                    name={propertyKey}
                                    value={propertyValue}
                                    onChange={(e) => handleInputChange(e, propertyKey)}
                                    placeholder={propertyKey}
                                />
                            </div>
                        ))}
                        <input
                            type="button"
                            id="input_b"
                            value="Datasubmit"
                            onClick={() => {
                                handleSubmit();
                            }}
                        />
                    </div>
                    <div className="buttonC">
                        <button variant='info' size='sm' className='uploadButton' onClick={() => fileInputRef.current.click()}>Upload</button>
                        <button className="jsonExpButton" onClick={handleExportClick} style={{ backgroundColor: 'green', color: 'white' }}>
                            Export to Json
                        </button>
                    </div>
                </div>
            </div>
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                webkit_directory={true}
                onChange={handleUploadFiles}
                style={{ display: 'none' }}
            />
            <div>
                <br />
                <br />
                <br />
                <br />
                <h5 className='tableHeading'>Attribute Table</h5>
                <Table striped bordered hover variant='dark'>
                    {vectordata.length > 0 ? (
                        vectordata.map(({ id, properties }) => (
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


        </div>
    );
};

export default VectorDataUpload;
