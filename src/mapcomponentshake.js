// this component does not work

import React, { useEffect } from 'react';
import { Box, Button } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Icon,
} from 'ol/style';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { useGeographic } from 'ol/proj';

const MapComponent = () => {
  useGeographic();

  useEffect(() => {
    const attributions =
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

    const map = new Map({
      target: 'map',
      view: new View({
        center: [-121.02, 31.08],
        zoom: 10,
        minZoom: 2,
        maxZoom: 19,
      }),
      layers: [
        new TileLayer({
          source: new XYZ({
            attributions: attributions,
            url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=' + key,
            tileSize: 512,
          }),
        }),
      ],
    });

    fetch('/data-route.json')
      .then(response => response.json())
      .then(result => {
        const features = result[0].track.features;
        const coordinates = features.map(feature => feature.geometry.coordinates);

        console.log('Coordinates:', coordinates);

        const routeFeature = new Feature({
          geometry: new Point(coordinates[0]),
        });

        const vectorSource = new VectorSource({
          features: [routeFeature],
        });

        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: 'icon.png',
            }),
          }),
        });

        map.addLayer(vectorLayer);

        let animating = false;
        let now;
        const speed = 50; // Time in milliseconds for each step
        const geoMarker = new Feature({
          type: 'geoMarker',
          geometry: new Point(coordinates[0]),
        });

        vectorSource.addFeature(geoMarker);

        function moveFeature() {
          if (animating) {
            const elapsedTime = new Date().getTime() - now;
            const index = Math.floor((elapsedTime / speed) % coordinates.length);
            const fraction = (elapsedTime / speed) % 1;

            const currentCoord = coordinates[index];
            const nextCoord = coordinates[(index + 1) % coordinates.length];

            const interpolatedCoord = [
              currentCoord[0] + fraction * (nextCoord[0] - currentCoord[0]),
              currentCoord[1] + fraction * (nextCoord[1] - currentCoord[1]),
            ];

            geoMarker.getGeometry().setCoordinates(interpolatedCoord);
            map.getView().setCenter(interpolatedCoord);

            requestAnimationFrame(moveFeature);
          }
        }

        function startAnimation() {
          animating = true;
          now = new Date().getTime();
          moveFeature();
        }

        function stopAnimation() {
          animating = false;
        }

        document.getElementById('start-animation').addEventListener('click', startAnimation);
      });
  }, []);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Box id="map" sx={{ width: '100%', height: '100%' }}></Box>
      <Box sx={{ position: 'absolute', top: '10px', right: '10px' }}>
        <Button variant="contained" id="start-animation">
          Start Animation
        </Button>
      </Box>
    </Box>
  );
};

/* 
const geoJsonRoute = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: route
          }
*/

export default MapComponent;
