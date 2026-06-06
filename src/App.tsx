import React from 'react';
import { Routes, Route } from 'react-router-dom';
import routes from './routes/config/routes';

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        {routes.map((route) => (
          <Route
            key={route.key}
            path={route.path}
            element={<route.element />}
          />
        ))}
      </Routes>
    </div>
  );
};

export default App;

