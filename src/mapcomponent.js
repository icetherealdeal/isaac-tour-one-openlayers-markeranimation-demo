import React, { useEffect } from 'react';
//import ImageTile from 'ol/source/ImageTile.js';
import XYZ from 'ol/source/XYZ.js';
import Feature from 'ol/Feature.js';
import Map from 'ol/Map.js';
import Point from 'ol/geom/Point.js';
//import Polyline from 'ol/format/Polyline.js';
import VectorSource from 'ol/source/Vector.js';
import View from 'ol/View.js';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
} from 'ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {getVectorContext} from 'ol/render.js';
import 'ol/ol.css';
import { LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj'; // Importing projection transformation

const MapComponent = () => {

  useEffect(() => {
    const key = 'getyourownkeyfoo';

    const center = fromLonLat([-120, 40]);
    const map = new Map({
      target: document.getElementById('map'),
      view: new View({
        center: center,
        zoom: 5,
        minZoom: 1,
        maxZoom: 19,
      }),
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=' + key,
            tileSize: 512,
          }),
        }),
      ],
    });

    // Replace this with your actual coordinate array
    const coordinates = [
      [-121.02, 31.08],
      [-117.13, 32.38],
      [-118.32, 33.4],
      [-119.33, 34.11],
      [-120.47, 34.18],
      [-124.48, 39.15],
      [-125.09, 42.59],
      [-125.02, 48.34],
      [-123.37, 48.13]
    ];

    // Transform the coordinates from EPSG:4326 (normal lonlat) to EPSG:3857 (web maps projection)
    const transformedCoordinates = coordinates.map(coord => fromLonLat(coord));

    // Create the Polyline geometry from the coordinates array. Note: Polyline doesn't work so use LineString instead for coordinate array
    const route = new LineString(transformedCoordinates);

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

    const styles = {
      'route': new Style({
        stroke: new Stroke({
          width: 5,
          color: [237, 212, 0, 0.8],
        }),
      }),
      'icon': new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'icon.png',
        }),
      }),
      'geoMarker': new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }),
    };

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature, geoMarker, startMarker, endMarker],
      }),
      style: function (feature) {
        return styles[feature.get('type')];
      },
    });

    map.addLayer(vectorLayer);

    const speedInput = document.getElementById('speed');
    const startButton = document.getElementById('start-animation');
    let animating = false;
    let distance = 0;
    let lastTime;

    function moveFeature(event) {
      if (!animating) return; // Check if animation is active
    
      const speed = Number(speedInput.value);
      const time = event.frameState.time;
      const elapsedTime = time - lastTime;
      distance = (distance + (speed * elapsedTime) / 1e6) % 2;
      lastTime = time;
    
      const currentCoordinate = route.getCoordinateAt(
        distance > 1 ? 2 - distance : distance,
      );

      // Updating geoMarker position
      position.setCoordinates(currentCoordinate);

      // Trigger a redraw of the vector layer
      // Ensure that vector layer refreshes everytime moveFeature function is triggered, which happens during each frame of the animation.
      vectorLayer.getSource().changed();

      const vectorContext = getVectorContext(event);
      vectorContext.setStyle(styles.geoMarker);
      vectorContext.drawGeometry(position);

      // Debugging: Check currentCoordinate is not stuck at a position
      console.log('Current Coordinate:', currentCoordinate);

      // Debugging: Check if geoMarker is hidden during animation 
      console.log('geoMarker position:', position.getCoordinates());
    
      // Debugging: Check position and rendering
      //console.log('Animating... Current Coordinate:', currentCoordinate);
      
      map.render()

      // Manually update the map's view after re-rendering
      map.getView().changed();
    }
    
    function startAnimation() {
      animating = true;
      lastTime = Date.now();
      startButton.textContent = 'Stop Animation';
      vectorLayer.on('postrender', moveFeature); // Register the moveFeature with postrender
    
      geoMarker.setGeometry(); // Hide geoMarker during animation
    
      // Debugging: Confirm animation started
      //console.log('Animation started');
    }
    
    function stopAnimation() {
      animating = false;
      startButton.textContent = 'Start Animation';
    
      // Keep marker at current animation position
      geoMarker.setGeometry(position);
      vectorLayer.un('postrender', moveFeature); // Unregister moveFeature from postrender
    
      // Debugging: Confirm animation stopped
      //console.log('Animation stopped');
    }
    
    startButton.addEventListener('click', function () {
      if (animating) {
        stopAnimation();
      } else {
        startAnimation();
      }
    });    

  }, []);

  return (
    <div>
      <div id="map" style={{ width: '100%', height: '80vh' }}></div>
      <input id="speed" type="range" min="5" max="999" step="10" defaultValue="500" />
      <button id="start-animation">Start Animation</button>
    </div>
  );
};

export default MapComponent;
