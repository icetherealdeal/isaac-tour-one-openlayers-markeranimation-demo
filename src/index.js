import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';


// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#81D8D0', // Primary color
    },
    secondary: {
      main: '#ffd700', // Secondary color
    },
  },
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);