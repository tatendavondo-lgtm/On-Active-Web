import { Routes, useLocation } from 'react-router-dom';

export function AnimatedRoutes({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <Routes location={location} key={location.pathname}>
      {children}
    </Routes>
  );
}
