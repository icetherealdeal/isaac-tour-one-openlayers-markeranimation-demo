import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { fromLonLat, toLonLat } from 'ol/proj';
import axios from 'axios';

function MapComponent({ drawingMode, clickMode }) {
    const mapRef = useRef(null);
    const vectorSourceRef = useRef(new VectorSource());
    const drawInteractionRef = useRef(null);
    const drawnFeaturesRef = useRef([]);
    const [cityName, setCityName] = useState('');

    useEffect(() => {
      const map = new Map({
        target: 'map',
        layers: [
            new TileLayer({
            source: new OSM(),
            }),
            new VectorLayer({
            source: vectorSourceRef.current,
            }),
        ],
        view: new View({
            center: fromLonLat([-110.0, 40.0]),
            zoom: 4,
        }),
      });
      mapRef.current = map;

      const handleChangeMapView = (event) => {
          const [longitude, latitude] = event.detail;
          const newCenter = fromLonLat([longitude, latitude]);
          map.getView().setCenter(newCenter);
      };
    
      window.addEventListener('changeMapView', handleChangeMapView);
    
      return () => {
        window.removeEventListener('changeMapView', handleChangeMapView);
        map.setTarget(null); // remove map instance from memory
      };
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;
    
        const map = mapRef.current;
    
        if (drawingMode === 'Point') {
          drawInteractionRef.current = new Draw({
            source: vectorSourceRef.current,
            type: 'Point',
          });
          drawInteractionRef.current.on('drawend', (event) => {
            drawnFeaturesRef.current.push(event.feature);
          });
          map.addInteraction(drawInteractionRef.current);
        } else {
          if (drawInteractionRef.current) {
            map.removeInteraction(drawInteractionRef.current);
            drawInteractionRef.current = null;
          }
        }
    
        return () => {
          if (drawInteractionRef.current) {
            map.removeInteraction(drawInteractionRef.current);
            drawInteractionRef.current = null;
          }
        };
      }, [drawingMode]);

      useEffect(() => {
        const handleUndoLastPoint = () => {
            if (drawnFeaturesRef.current.length > 0) {
                const lastFeature = drawnFeaturesRef.current.pop();
                vectorSourceRef.current.removeFeature(lastFeature);
            }
        };

        window.addEventListener('undoLastPoint', handleUndoLastPoint);

        return () => {
          window.removeEventListener('undoLastPoint', handleUndoLastPoint);
        };
      }, []);

      const fetchCityName = async (lat, lon) => {
        try {
          const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (response.data && response.data.address) {
            return (response.data.address.city || response.data.address.town || response.data.address.village || 'Unknown location');
          }
        } catch (error) {
          console.error(`Error fetching the city name:`, error);
          alert(`Error fetching city name`);
        }
        return 'Unknown location';
      };

      useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleMapClick = async (event) => {
          const pixel = map.getEventPixel(event.originalEvent);
          const coordinate = map.getCoordinateFromPixel(pixel);
          if (coordinate) {
            const lonLat = toLonLat(coordinate);
            const cityName = await fetchCityName(lonLat[1], lonLat[0]);
            setCityName(cityName);
            alert(`Longitude: ${lonLat[0]}, Latitude: ${lonLat[1]}`);
            alert(`City: ${cityName}`);
          }
        };

        if (clickMode) {
          map.on('click', handleMapClick);
        } else {
          map.un('click', handleMapClick);
        }

        return () => {
          map.un('click', handleMapClick);
        };
      }, [clickMode]);

    return (
        <div id="map" style={{ height: '835px', width: '100%', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'white', padding: '5px', borderRadius: '5px', zIndex: 1 }}>
            City: {cityName}
          </div>
        {/* Add Material UI components here if needed */}
        </div>
  );
}

export default MapComponent;