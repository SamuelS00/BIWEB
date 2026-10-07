import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { IntlProvider } from 'react-intl';
import { router } from './router';
import { messages } from './i18n/pt-BR';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntlProvider locale="pt-BR" messages={messages} defaultLocale="pt-BR">
      <RouterProvider router={router} />
    </IntlProvider>
  </StrictMode>,
);
