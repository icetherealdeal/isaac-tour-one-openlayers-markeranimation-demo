import './App.css';
import { Box } from '@mui/material';
import MapComponent from './mapcomponent';
import ResponsiveAppBar from './appbar';

function App() {
  return (
    <Box sx={{ height: '100vh', width: '100vw', position: 'fixed' }}>
      <ResponsiveAppBar />
      <h2>Isaac's Demo OpenLayers API Marker Animation</h2>
      <MapComponent />
    </Box>
  );
}

export default App;
