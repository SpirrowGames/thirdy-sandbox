import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import LoginPage from './pages/LoginPage';
import BoardPage from './pages/BoardPage';

function RequireAuth({ children }) {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;