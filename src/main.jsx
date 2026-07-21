import { createRoot } from 'react-dom/client';
import { bootstrap } from './store/index.js';
import { App } from './App.jsx';
import './styles.css';

bootstrap();
createRoot(document.getElementById('root')).render(<App />);
