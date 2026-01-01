
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import POSPage from './pages/POSPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Default route redirects to POS */}
        <Route path="/" element={<Navigate to="/pos" replace />} />
        
        {/* POS Module with sub-routes */}
        <Route path="/pos/*" element={<POSPage />} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
