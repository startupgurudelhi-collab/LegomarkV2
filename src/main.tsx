import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRecaptchaProvider } from './components/common/AppRecaptchaProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRecaptchaProvider>
      <App />
    </AppRecaptchaProvider>
  </StrictMode>,
);
