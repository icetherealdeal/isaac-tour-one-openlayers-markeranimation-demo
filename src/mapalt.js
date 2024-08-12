// this component does not work

import React, { useEffect, useState } from 'react';
import Feature from 'ol/Feature.js';
import Map from 'ol/Map.js';
import Point from 'ol/geom/Point.js';
import Polyline from 'ol/format/Polyline.js';
import VectorSource from 'ol/source/Vector.js';
import View from 'ol/View.js';
import XYZ from 'ol/source/XYZ.js';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
} from 'ol/style.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { getVectorContext } from 'ol/render.js';
import { boundingExtent } from 'ol/extent.js';
import LocalShipping from '@mui/icons-material/LocalShipping';
import { Box, Button, TextField } from '@mui/material';
import { useGeographic } from 'ol/proj';

const MapComponent = () => {
  const [animating, setAnimating] = useState(false);
  const [lastTime, setLastTime] = useState(0);
  const [distance, setDistance] = useState(0);

  useGeographic(); // console error bug fix suggestion. Tell OpenLayers to work with geographic [longitude, latitude] coordinates

    /* OpenLayers is designed to work with various coordinate systems.
    By default, it works with coordinates in the EPSG:3857 projection, which is commonly used for web maps.
    However, your data is in longitude and latitude format, which is EPSG:4326. */

  useEffect(() => {

    // Center coordinates for the map view
    const center = [36.77826, -119.417932];

    // Initialize the map
    const map = new Map({
      target: 'map', // The HTML element ID where the map will be rendered
      view: new View({
        center: center, // Initial center of the map
        zoom: 4, // Initial zoom level
        minZoom: 2, // Minimum zoom level
        maxZoom: 19, // Maximum zoom level
      }),
      layers: [
        // Tile layer for the map background using MapTiler
        new TileLayer({
          source: new XYZ({
            url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=' + key,
            tileSize: 512,
          }),
        }),
      ],
    });

    fetch('/data-route.json')
      .then(response => response.json())
      .then(result => {
        // Extracting coordinates from the JSON file
        const features = result[0].track.features;
        const coordinates = features.map(feature => feature.geometry.coordinates);

        console.log('Coordinates:', coordinates); // Debug: Log coordinates

        // Define route geometry using coordinates
        const route = new Polyline({
          factor: 1e6,
        }).readGeometry(
          new Polyline({
            factor: 1e6,
          }).writeGeometry(
            new Polyline({
              factor: 1e6,
            }).readGeometry(coordinates, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
            {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }
          ),
          {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          }
        );

        const routeFeature = new Feature({
          type: 'route',
          geometry: route,
        });
        const startMarker = new Feature({
          type: 'icon',
          geometry: new Point(route.getFirstCoordinate()),
        });
        const endMarker = new Feature({
          type: 'icon',
          geometry: new Point(route.getLastCoordinate()),
        });
        const position = startMarker.getGeometry().clone();
        const geoMarker = new Feature({
          type: 'geoMarker',
          geometry: position,
        });

        // Define styles for route and markers
        const styles = {
          route: new Style({
            stroke: new Stroke({
              width: 6,
              color: [237, 212, 0, 0.8],
            }),
          }),
          icon: new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="M80 896q-33 0-56.5-23.5T0 816V576h240v-80q0-33 23.5-56.5T320 416h400v160h72l128 160v80q0 33-23.5 56.5T880 896h-32q-20 0-38.5-9T776 862q-12 16-30.5 25T707 896q-20 0-38.5-9T640 862q-12 16-30.5 25T571 896q-20 0-38.5-9T464 862q-12 16-30.5 25T395 896q-20 0-38.5-9T320 862q-12 16-30.5 25T251 896q-20 0-38.5-9T176 862q-12 16-30.5 25T107 896H80Zm0-80h54q14-27 41-43t59-16q33 0 59.5 16T335 816h77q14-27 41-43t59-16q33 0 59.5 16T615 816h77q14-27 41-43t59-16q33 0 59.5 16T895 816h35v-42L820 624H640V496H320v160H80v160Zm154-20q-25 0-42.5 17.5T174 856q0 25 17.5 42.5T234 916q25 0 42.5-17.5T294 856q0-25-17.5-42.5T234 796Zm456 0q-25 0-42.5 17.5T610 856q0 25 17.5 42.5T670 916q25 0 42.5-17.5T730 856q0-25-17.5-42.5T670 796ZM80 816h54-54 154-154 77-77 154-154 240-240Zm154 40Zm436 0ZM80 816h800-35 35-77 77-154 154-35 35H640 320 80Zm0 0h240-240 320-320 320-320 240-240Zm308 0Zm436 0ZM234 856Zm436 0Z"/></svg>`),
            }),
          }),
          geoMarker: new Style({
            image: new CircleStyle({
              radius: 20, // Radius of the circle
              fill: new Fill({ color: 'red' }), 
              stroke: new Stroke({
                color: 'white',
                width: 4,
              }),
            }),
          }),
        };

        const vectorLayer = new VectorLayer({
          source: new VectorSource({
            features: [routeFeature, geoMarker, startMarker, endMarker],
          }),
          style: (feature) => {
            return styles[feature.get('type')];
          },
        });

        map.addLayer(vectorLayer);

        // Fit map to the extent of the features
        const extent = boundingExtent(coordinates);
        map.getView().fit(extent, { padding: [50, 50, 50, 50] });

        let animating = false;
        let distance = 0;
        let lastTime;

        function moveFeature(event) {
          if (!animating) return;

          const speed = 50; // Fixed speed for simplicity
          const time = event.frameState.time;
          const elapsedTime = time - lastTime;
          distance = (distance + (speed * elapsedTime) / 1e6) % 2;
          lastTime = time;

          const currentCoordinate = route.getCoordinateAt(
            distance > 1 ? 2 - distance : distance,
          );
          position.setCoordinates(currentCoordinate);
          const vectorContext = getVectorContext(event);
          vectorContext.setStyle(styles.geoMarker);
          vectorContext.drawGeometry(position);
          map.render();
        }

        function startAnimation() {
          animating = true;
          lastTime = Date.now();
          document.getElementById('start-button').textContent = 'Stop Animation';
          vectorLayer.on('postrender', moveFeature);
          geoMarker.setGeometry(null);
        }

        function stopAnimation() {
          animating = false;
          document.getElementById('start-button').textContent = 'Start Animation';
          geoMarker.setGeometry(position);
          vectorLayer.un('postrender', moveFeature);
        }

        document.getElementById('start-button').addEventListener('click', function () {
          if (animating) {
            stopAnimation();
          } else {
            startAnimation();
          }
        });
      })
      .catch(error => {
        console.error('Error fetching JSON:', error);
      });
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
      }}
    >
      <div id="map" style={{ height: '100%', width: '100%' }}></div>
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          right: '10px',
        }}
      >
        <Button id="start-button" variant="contained" color="primary">
          Start Animation
        </Button>
      </Box>
    </Box>
  );
};

export default MapComponent; 