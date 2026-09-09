import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Package, TrendingUp, Calendar, ShoppingBag, DollarSign } from 'lucide-react';

const PAGE_SIZE = 20;

function formatSoles(num) {
  return `S/ ${Number(num || 0).toFixed(2)}`;
}

function formatFechaHora(iso) {
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function Estadisticas() {
  const [periodo, setPeriodo] = useState('hoy');
  const [ventas, setVentas] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [topProductos, setTopProductos] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, cantidad: 0, promedio: 0, unidades: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const getFechaDesde = () => {
    const ahora = new Date();
    if (periodo === 'hoy') {
      ahora.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      ahora.setDate(ahora.getDate() - 7);
    } else if (periodo === 'mes') {
      ahora.setDate(1);
      ahora.setHours(0, 0, 0, 0);
    }
    return ahora.toISOString();
  };

  const cargarVentasPagina = async (desde, paginaActual, reemplazar) => {
    const inicio = paginaActual * PAGE_SIZE;
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id, created_at, total, metodo_pago,
        venta_items (
          nombre_producto, cantidad, precio_unitario, subtotal, producto_id
        )
      `)
      .gte('created_at', desde)
      .order('created_at', { ascending: false })
      .range(inicio, inicio + PAGE_SIZE - 1);

    if (error) { console.error(error); return; }
    setVentas(prev => reemplazar ? (data || []) : [...prev, ...(data || [])]);
    setHayMas((data || []).length === PAGE_SIZE);
  };

  const cargarDatos = async () => {
    setLoading(true);
    const desde = getFechaDesde();

    try {
      const [{ data: resumenData, error: errorResumen }, { data: topData, error: errorTop }] = await Promise.all([
        supabase.rpc('resumen_ventas', { p_desde: desde }),
        supabase.rpc('top_productos_periodo', { p_desde: desde, p_limite: 8 })
      ]);

      if (errorResumen) throw errorResumen;
      if (errorTop) throw errorTop;

      const fila = resumenData && resumenData[0];
      const totalIngresos = fila ? Number(fila.total_ingresos) : 0;
      const totalTransacciones = fila ? Number(fila.total_transacciones) : 0;
      const totalUnidades = fila ? Number(fila.total_unidades) : 0;

      setResumen({
        total: totalIngresos,
        cantidad: totalTransacciones,
        promedio: totalTransacciones ? totalIngresos / totalTransacciones : 0,
        unidades: totalUnidades
      });

      setTopProductos((topData || []).map(p => ({
        nombre: p.nombre_producto,
        cantidad: Number(p.cantidad),
        ingresos: Number(p.ingresos)
      })));

      setPagina(0);
      await cargarVentasPagina(desde, 0, true);

    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const verMasVentas = async () => {
    setCargandoMas(true);
    const desde = getFechaDesde();
    const siguiente = pagina + 1;
    await cargarVentasPagina(desde, siguiente, false);
    setPagina(siguiente);
    setCargandoMas(false);
  };

  const periodoLabel = { hoy: 'Hoy', semana: 'Últimos 7 días', mes: 'Este mes' };

  return (
    <div className="min-h-screen bg-black text-white">

      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-red-600" size={24} />
            <span className="text-xl font-bold">
              <span className="text-red-600">MAX</span>
              <span className="text-white"> SPORT</span>
              <span className="text-gray-400 text-sm ml-2">Estadísticas</span>
            </span>
          </div>
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex gap-3 mb-8">
          {['hoy', 'semana', 'mes'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-5 py-2 rounded-xl font-bold capitalize transition ${
                periodo === p
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              {periodoLabel[p]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-500">Cargando estadísticas...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-2xl p-5 border border-green-700">
                <p className="text-green-200 text-sm mb-1">Ingresos</p>
                <p className="text-2xl font-black text-white">{formatSoles(resumen.total)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-5 border border-blue-700">
                <p className="text-blue-200 text-sm mb-1">Transacciones</p>
                <p className="text-2xl font-black text-white">{resumen.cantidad}</p>
                <p className="text-blue-300 text-xs">ventas cobradas</p>
              </div>
              <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-2xl p-5 border border-red-700">
                <p className="text-red-200 text-sm mb-1">Unidades vendidas</p>
                <p className="text-2xl font-black text-white">{resumen.unidades}</p>
                <p className="text-red-300 text-xs">productos en total</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl p-5 border border-purple-700">
                <p className="text-purple-200 text-sm mb-1">Ticket promedio</p>
                <p className="text-2xl font-black text-white">{formatSoles(resumen.promedio)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Package size={20} className="text-red-400" />
                  Productos más vendidos
                </h3>
                {topProductos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Sin ventas en este período</p>
                ) : (
                  <div className="space-y-3">
                    {topProductos.map((p, i) => (
                      <div key={p.nombre} className="flex items-center gap-3">
                        <span className="w-6 text-center text-gray-500 text-sm font-bold">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{p.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="h-1.5 bg-red-600 rounded-full"
                              style={{ width: `${(p.cantidad / topProductos[0].cantidad) * 100}%`, minWidth: '4px' }}
                            />
                            <span className="text-gray-400 text-xs">
                              {p.cantidad} {p.cantidad === 1 ? 'unidad vendida' : 'unidades vendidas'}
                            </span>
                          </div>
                        </div>
                        <span className="text-green-400 text-sm font-bold flex-shrink-0">{formatSoles(p.ingresos)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-red-400" />
                  Últimas ventas
                </h3>
                {ventas.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Sin ventas en este período</p>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {ventas.map(v => {
                      const totalUnidadesVenta = (v.venta_items || []).reduce((s, i) => s + i.cantidad, 0);
                      return (
                        <div key={v.id} className="bg-gray-800 rounded-xl p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-gray-400 text-xs">{formatFechaHora(v.created_at)}</p>
                              <p className="text-gray-400 text-xs mt-0.5">
                                {totalUnidadesVenta} {totalUnidadesVenta === 1 ? 'unidad' : 'unidades'} · {v.metodo_pago}
                              </p>
                            </div>
                            <span className="text-white font-bold text-sm">{formatSoles(v.total)}</span>
                          </div>
                          <div className="space-y-1">
                            {(v.venta_items || []).map((item, j) => (
                              <div key={j} className="flex items-center justify-between bg-gray-700 rounded-lg px-2 py-1.5">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                                    x{item.cantidad}
                                  </span>
                                  <span className="text-gray-200 text-xs truncate">{item.nombre_producto}</span>
                                </div>
                                <div className="flex-shrink-0 text-right ml-3">
                                  {item.cantidad > 1 && (
                                    <p className="text-gray-400 text-xs">{formatSoles(item.precio_unitario)} c/u</p>
                                  )}
                                  <p className="text-green-400 text-xs font-bold">{formatSoles(item.subtotal)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {hayMas && (
                      <div className="text-center pt-2">
                        <button
                          onClick={verMasVentas}
                          disabled={cargandoMas}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition text-sm"
                        >
                          {cargandoMas ? 'Cargando...' : 'Ver más ventas'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}