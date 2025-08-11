import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


