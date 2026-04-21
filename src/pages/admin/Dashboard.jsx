import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LogOut, Package, PlusCircle, List, Home, ShoppingCart, TrendingUp, Printer, Barcode } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [totalProductos, setTotalProductos] = useState(0);
  const [ventasHoy, setVentasHoy] = useState({ cantidad: 0, total: 0, unidades: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    contarProductos();
    cargarVentasHoy();
  }, []);

  const contarProductos = async () => {
    const { count } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    setTotalProductos(count || 0);
  };

  const cargarVentasHoy = async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('ventas')
      .select(`total, venta_items(cantidad)`)
      .gte('created_at', hoy.toISOString());
    if (data) {
      const unidades = data.reduce((s, v) =>
        s + (v.venta_items || []).reduce((si, i) => si + i.cantidad, 0), 0);
      setVentasHoy({
        cantidad: data.length,
        total: data.reduce((s, v) => s + Number(v.total), 0),
        unidades
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-black">
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
              <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-2">
                <Home size={20} />
                <span className="hidden md:inline">Ver Tienda</span>
              </Link>
              <span className="text-gray-400 text-sm hidden md:inline">{user?.email}</span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Panel de Administración</h2>
          <p className="text-gray-400">Gestiona productos, ventas y estadísticas</p>
        </div>

        {/* 4 tarjetas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-gradient-to-br from-red-900 to-red-700 rounded-xl p-5 border border-red-600">
            <p className="text-gray-200 text-sm mb-1">Productos</p>
            <p className="text-3xl font-bold text-white">{totalProductos}</p>
            <p className="text-red-300 text-xs">en catálogo</p>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-xl p-5 border border-green-600">
            <p className="text-gray-200 text-sm mb-1">Ventas hoy</p>
            <p className="text-3xl font-bold text-white">{ventasHoy.cantidad}</p>
            <p className="text-green-300 text-xs">transacciones cobradas</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-5 border border-blue-600">
            <p className="text-gray-200 text-sm mb-1">Unidades vendidas hoy</p>
            <p className="text-3xl font-bold text-white">{ventasHoy.unidades}</p>
            <p className="text-blue-300 text-xs">productos despachados</p>
          </div>

          {/* Tarjeta amarilla — total en soles vendido hoy, se reinicia solo cada día */}
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-xl p-5 border border-yellow-600">
            <p className="text-gray-200 text-sm mb-1">Total vendido hoy</p>
            <p className="text-3xl font-bold text-white">S/ {ventasHoy.total.toFixed(2)}</p>
            <p className="text-yellow-300 text-xs">en efectivo, Yape o tarjeta</p>
          </div>

        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Link
            to="/admin/pos"
            className="bg-gray-900 hover:bg-gray-800 border-2 border-red-600 rounded-xl p-8 transition group col-span-1 md:col-span-2"
          >
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-4 rounded-lg group-hover:scale-110 transition">
                <ShoppingCart size={36} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Sistema POS — Punto de Venta</h3>
                <p className="text-gray-400">Escanea productos, arma el carrito, cobra y registra ventas con descuento automático de stock</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/estadisticas"
            className="bg-gray-900 hover:bg-gray-800 border-2 border-green-600 rounded-xl p-8 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-600 p-4 rounded-lg group-hover:scale-110 transition">
                <TrendingUp size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Estadísticas</h3>
                <p className="text-gray-400">Ventas del día, semana y mes. Productos más vendidos</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/agregar"
            className="bg-gray-900 hover:bg-gray-800 border-2 border-yellow-600 rounded-xl p-8 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-yellow-600 p-4 rounded-lg group-hover:scale-110 transition">
                <PlusCircle size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Agregar Producto</h3>
                <p className="text-gray-400">Añade nuevos productos con código de barras, stock y etiqueta</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/productos"
            className="bg-gray-900 hover:bg-gray-800 border-2 border-blue-600 rounded-xl p-8 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-4 rounded-lg group-hover:scale-110 transition">
                <List size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Ver Productos</h3>
                <p className="text-gray-400">Gestiona, edita stock, código de barras y ubicación</p>
              </div>
            </div>
          </Link>

          {/* Cambio 2: Imprimir código existente */}
          <Link
            to="/admin/imprimir-codigo"
            className="bg-gray-900 hover:bg-gray-800 border-2 border-purple-600 rounded-xl p-8 transition group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-600 p-4 rounded-lg group-hover:scale-110 transition">
                <Printer size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Imprimir Código</h3>
                <p className="text-gray-400">Busca cualquier código existente e imprime las etiquetas que necesites</p>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
