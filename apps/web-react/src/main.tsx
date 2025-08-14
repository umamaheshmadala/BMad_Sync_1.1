import React from 'react';
import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './ui/auth/Login';
import Signup from './ui/auth/Signup';
import Reset from './ui/auth/Reset';
import RequireAuth from './ui/auth/RequireAuth';
import ProfilePage from './ui/auth/Profile';
import CityInterestsPage from './ui/auth/CityInterests';
import BusinessPortal from './ui/business/Portal';
import BusinessProfilePage from './ui/business/BusinessProfile';
import StorefrontPage from './ui/business/Storefront';
import BusinessProductsPage from './ui/business/Products';
import StorefrontPublicView from './ui/public/StorefrontView';
import { LocaleProvider } from './ui/i18n';
// Sentry init (no-op if DSN not provided)
try {
  // @ts-ignore
  const dsn = (import.meta as any)?.env?.VITE_SENTRY_DSN || '';
  if (dsn) {
    Sentry.init({
      dsn,
      release: (import.meta as any)?.env?.npm_package_version,
      environment: (import.meta as any)?.env?.MODE || 'dev',
      tracesSampleRate: 0.0,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.0,
      beforeSend(event) {
        try {
          const reqId = (window as any)?.lastMeta?.x_request_id;
          if (reqId) {
            // @ts-ignore
            event.tags = { ...(event.tags || {}), 'x-request-id': reqId };
          }
        } catch {}
        // Remove potentially sensitive data
        if (event.request) {
          delete (event.request as any).cookies;
          delete (event.request as any).headers;
          delete (event.request as any).data;
        }
        return event;
      },
    });
  }
} catch {}
import './index.css';

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <LocaleProvider>
      <BrowserRouter basename="/react">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/reset" element={<Reset />} />
          <Route
            path="/business/portal"
            element={
              <RequireAuth>
                <BusinessPortal />
              </RequireAuth>
            }
          />
          <Route
            path="/business/portal/profile"
            element={
              <RequireAuth>
                <BusinessProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/business/portal/storefront"
            element={
              <RequireAuth>
                <StorefrontPage />
              </RequireAuth>
            }
          />
          <Route
            path="/business/portal/products"
            element={
              <RequireAuth>
                <BusinessProductsPage />
              </RequireAuth>
            }
          />
          <Route path="/storefront" element={<StorefrontPublicView />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <App />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/profile/city-interests"
            element={
              <RequireAuth>
                <CityInterestsPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </LocaleProvider>
  </React.StrictMode>
);


