import './App.css';
import React, { useState } from 'react';
import { Button, Box, CircularProgress, Backdrop } from '@mui/material';
import MapComponent from './mapcomponent';
import ControlledOpenSpeedDial from './speeddial';
import ResponsiveAppBar from './appbar';

function App() {
    const getRandomCoordinates = () => {
      //Generate random longitude and latitude
      const randomLongitude = (Math.random() * 360 - 180).toFixed(6); // Range: -180 to 180
      const randomLatitude = (Math.random() * 180 - 90).toFixed(6); // Range: -90 to 90
      return [parseFloat(randomLongitude), parseFloat(randomLatitude)];
    };

    const handleRandomButtonClick = () => {
      setLoading(true);
      //Simulate fetching a random location and updating the map view
      setTimeout(() => {
        const newCoordinates = getRandomCoordinates();
        window.dispatchEvent(new CustomEvent('changeMapView', { detail: newCoordinates }));
        setLoading(false);
      }, 500) //Simulate 0.5 second delay
    };  

    const thailandCoordinates = [100.992541, 15.870032]; // Longitude and Latitude for Thailand

    const handleHomeButtonClick = () => {
      window.dispatchEvent(new CustomEvent('changeMapView', { detail: thailandCoordinates }));
    };

    const [drawingMode, setDrawingMode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [clickMode, setClickMode] = useState(false)

    const handleDrawPointClick = () => {
      setDrawingMode('Point');
    }

    const handleClickModeToggle = () => {
      setClickMode(!clickMode);
    };

  return (
    <Box sx={{ height: '100vh', width: '100vw', position: 'fixed' }}>
      <ResponsiveAppBar />
      <h2>Isaac's Demo Open Layers Map with Material UI</h2>
      <Button variant="contained" color="secondary" onClick={handleRandomButtonClick} >Visit Random Location</Button>
      <Button variant="contained" color="primary" onClick={handleHomeButtonClick}>Return Home</Button>
      <Button variant="contained" color="secondary" onClick={handleDrawPointClick}>Draw New Point</Button>
      <Button variant="contained" color="error" onClick={() => window.dispatchEvent(new CustomEvent('undoLastPoint'))}>Undo Last Point</Button>
      <Button variant="contained" color="success" onClick={handleClickModeToggle}>
        {clickMode ? 'Disable Click' : 'Enable Click'}
        </Button>
      <MapComponent drawingMode={drawingMode} clickMode={clickMode} />
      <ControlledOpenSpeedDial />
      <Backdrop
        sx={{ color: '#fff', zIndex: 20 }}
        open={loading}
      >
        <CircularProgress color="secondary" />
      </Backdrop>
    </Box>
  );
}

export default App;
