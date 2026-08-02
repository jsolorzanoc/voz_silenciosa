import { Route, Routes } from 'react-router';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './pages/admin/AdminPanel';
import Assessment from './pages/Assessment';
import Directory from './pages/Directory';
import GroupForum from './pages/GroupForum';
import Groups from './pages/Groups';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import Result from './pages/Result';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="registro" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route
          path="autoevaluacion"
          element={
            <ProtectedRoute>
              <Assessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="resultado"
          element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          }
        />
        <Route
          path="directorio"
          element={
            <ProtectedRoute>
              <Directory />
            </ProtectedRoute>
          }
        />
        <Route
          path="grupos"
          element={
            <ProtectedRoute>
              <Groups />
            </ProtectedRoute>
          }
        />
        <Route
          path="grupos/:id"
          element={
            <ProtectedRoute>
              <GroupForum />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
