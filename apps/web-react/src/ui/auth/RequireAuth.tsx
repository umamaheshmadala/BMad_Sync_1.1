import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  let token = '';
  try { token = localStorage.getItem('sync_token') || ''; } catch {}
  const location = useLocation();
  if (!token) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?redirectTo=${redirectTo}`} replace />;
  }
  return <>{children}</>;
}


