import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import 'uikit/dist/css/uikit.min.css';
import './styles/app.css';
import App from './App.jsx';

UIkit.use(Icons);
window.UIkit = UIkit;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
