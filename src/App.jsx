import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Inicio from './pages/tienda/Inicio';
import TiendaPublica from './pages/tienda/TiendaPublica';
import AnuncioModal from './pages/tienda/AnuncioModal';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AgregarProducto from './pages/admin/AgregarProducto';
import ListaProductos from './pages/admin/ListaProductos';
import POS from './pages/admin/POS';
import Estadisticas from './pages/admin/Estadisticas';
import ImprimirCodigo from './pages/admin/ImprimirCodigo';
import BuscarTicket from './pages/admin/BuscarTicket';
import AgregarAnuncio from './pages/admin/AgregarAnuncio';
import ContenidoInicio from './pages/admin/ContenidoInicio';
import ProtectedRoute from './components/admin/ProtectedRoute';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AnuncioModal />
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/tienda" element={<TiendaPublica />} />
          <Route path="/producto/:id" element={<TiendaPublica />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/agregar" element={<ProtectedRoute><AgregarProducto /></ProtectedRoute>} />
          <Route path="/admin/productos" element={<ProtectedRoute><ListaProductos /></ProtectedRoute>} />
          <Route path="/admin/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
          <Route path="/admin/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
          <Route path="/admin/imprimir-codigo" element={<ProtectedRoute><ImprimirCodigo /></ProtectedRoute>} />
          <Route path="/admin/buscar-ticket" element={<ProtectedRoute><BuscarTicket /></ProtectedRoute>} />
          <Route path="/admin/anuncio" element={<ProtectedRoute><AgregarAnuncio /></ProtectedRoute>} />
          <Route path="/admin/contenido-inicio" element={<ProtectedRoute><ContenidoInicio /></ProtectedRoute>} />
          <Route path="*" element={<Inicio />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;