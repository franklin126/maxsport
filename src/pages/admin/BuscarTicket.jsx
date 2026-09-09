import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Package, Search, Receipt, RefreshCw, Calendar, CreditCard, User } from 'lucide-react';

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

export default function BuscarTicket() {
  const [codigoInput, setCodigoInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [venta, setVenta] = useState(null);
  const [items, setItems] = useState([]);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const inputRef = useRef(null);

  const buscarTicket = async () => {
    const codigo = codigoInput.trim();
    if (!codigo) return;
    setBuscando(true);
    setVenta(null);
    setItems([]);
    setNoEncontrado(false);

    try {
      const { data: ventaData, error: errorVenta } = await supabase
        .rpc('buscar_venta_por_codigo', { p_codigo: codigo })
        .maybeSingle();

      if (errorVenta) throw errorVenta;

      if (!ventaData) {
        setNoEncontrado(true);
        return;
      }

      const { data: itemsData, error: errorItems } = await supabase
        .from('venta_items')
        .select('nombre_producto, cantidad, precio_unitario, subtotal')
        .eq('venta_id', ventaData.id);

      if (errorItems) throw errorItems;

      setVenta(ventaData);
      setItems(itemsData || []);
    } catch (err) {
      console.error('Error buscando ticket:', err);
      setNoEncontrado(true);
    } finally {
      setBuscando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') buscarTicket();
  };

  const limpiar = () => {
    setCodigoInput('');
    setVenta(null);
    setItems([]);
    setNoEncontrado(false);
    setTimeout(() => inputRef.current?.focus(), 100);
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
              </h1>
            </div>
            <Link to="/admin/dashboard" className="text-gray-300 hover:text-white flex items-center gap-2">
              <ArrowLeft size={20} />
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Receipt className="text-cyan-500" size={36} />
            Buscar Ticket
          </h2>
          <p className="text-gray-400">Escribe el código del ticket para ver el detalle de la venta</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-8 border border-cyan-600 space-y-6">

          <div>
            <label className="block text-gray-300 mb-2 font-semibold flex items-center gap-2">
              <Receipt size={18} className="text-cyan-400" />
              Código del Ticket
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 tracking-widest uppercase"
                placeholder="Ej: A1B2C3D4"
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={buscarTicket}
                disabled={buscando || !codigoInput.trim()}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2 transition"
              >
                {buscando ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">Es el código de 8 caracteres que sale impreso en el ticket</p>
          </div>

          {noEncontrado && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 text-red-200 text-sm">
              No se encontró ningún ticket con ese código
            </div>
          )}

          {venta && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-green-600">
                <p className="text-green-400 text-xs font-semibold mb-2">✓ Ticket encontrado</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar size={14} className="text-gray-500" />
                    {formatFechaHora(venta.created_at)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CreditCard size={14} className="text-gray-500" />
                    {venta.metodo_pago}
                  </div>
                  {venta.cajero_email && (
                    <div className="flex items-center gap-2 text-gray-300 col-span-2">
                      <User size={14} className="text-gray-500" />
                      {venta.cajero_email}
                    </div>
                  )}
                </div>
                <p className="text-3xl font-black text-white mt-3">{formatSoles(venta.total)}</p>
              </div>

              <div>
                <p className="text-gray-300 font-semibold mb-2 text-sm">Productos vendidos</p>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                          x{item.cantidad}
                        </span>
                        <span className="text-gray-200 text-sm truncate">{item.nombre_producto}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-gray-400 text-xs">{formatSoles(item.precio_unitario)} c/u</p>
                        <p className="text-green-400 text-sm font-bold">{formatSoles(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={limpiar}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
              >
                Buscar otro ticket
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}