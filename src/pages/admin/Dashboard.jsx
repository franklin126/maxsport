import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LogOut, Package, PlusCircle, List, Home } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [totalProductos, setTotalProductos] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener usuario actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Contar productos
    contarProductos();
  }, []);

  const contarProductos = async () => {
    const { count } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    setTotalProductos(count || 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Package className="text-red-600" size={28} />
              <h1 className="text-2xl font-bold">
                <span className="text-red-600">MAX</span>
                <span className="text-white"> SPORT</span>
                <span className="text-gray-400 text-sm ml-2">Admin</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-gray-300 hover:text-white flex items-center gap-2"
              >
                <Home size={20} />
                <span className="hidden md:inline">Ver Tienda</span>
              </Link>
              <span className="text-gray-400 text-sm hidden md:inline">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            🎄 Panel de Administración
          </h2>
          <p className="text-gray-400">
            Gestiona productos, categorías y contenido de la tienda
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-900 to-red-700 rounded-xl p-6 border border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm mb-1">Total Productos</p>
                <p className="text-4xl font-bold text-white">{totalProductos}</p>
              </div>
              <Package className="text-white opacity-50" size={48} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-xl p-6 border border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm mb-1">Categorías</p>
                <p className="text-4xl font-bold text-white">4</p>
              </div>
              <List className="text-white opacity-50" size={48} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-xl p-6 border border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200 text-sm mb-1">🎁 Ofertas</p>
                <p className="text-4xl font-bold text-white">{totalProductos}</p>
              </div>
              <PlusCircle className="text-white opacity-50" size={48} />
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/admin/agregar"
            className="bg-gray-900 hover:bg-gray-800 border-2 border-red-600 rounded-xl p-8 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-4 rounded-lg group-hover:scale-110 transition">
                <PlusCircle size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Agregar Producto
                </h3>
                <p className="text-gray-400">
                  Añade nuevos productos a la tienda
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/productos"
            className="bg-gray-900 hover:bg-gray-800 border-2 border-green-600 rounded-xl p-8 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-600 p-4 rounded-lg group-hover:scale-110 transition">
                <List size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Ver Productos
                </h3>
                <p className="text-gray-400">
                  Gestiona, edita o elimina productos
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}