import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/overpass';
import '@fontsource/noto-sans-kannada/600.css';
import './styles.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
