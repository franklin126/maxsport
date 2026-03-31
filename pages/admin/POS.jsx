import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import {
  ShoppingCart, Trash2, Package, ArrowLeft,
  CheckCircle, AlertTriangle, Printer, X,
  MapPin, Tag, Layers
} from 'lucide-react';

// ─── Utilidad: imprimir ticket con Xprinter térmica ───────────────────────────
// Usa window.print() con estilos de impresión. Para Xprinter de 58mm o 80mm
// selecciona el tamaño de papel correcto en el driver de Windows.
function imprimirTicket(venta, items) {
  const fecha = new Date(venta.created_at).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const lineas = items.map(item =>
    `<tr>
      <td style="padding:2px 4px;font-size:12px">${item.nombre_producto}</td>
      <td style="padding:2px 4px;font-size:12px;text-align:center">${item.cantidad}</td>
      <td style="padding:2px 4px;font-size:12px;text-align:right">S/${item.precio_unitario.toFixed(2)}</td>
      <td style="padding:2px 4px;font-size:12px;text-align:right">S/${item.subtotal.toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <html><head>
    <style>
      @page { size: 80mm auto; margin: 4mm; }
      body { font-family: monospace; font-size: 13px; color: #000; }
      h2 { text-align:center; font-size:18px; margin:0 0 4px; }
      p  { text-align:center; margin:2px 0; font-size:11px; }
      hr { border: 1px dashed #000; }
      table { width:100%; border-collapse:collapse; }
      th { font-size:11px; border-bottom:1px solid #000; padding:2px 4px; }
      .total { font-size:16px; font-weight:bold; text-align:right; padding:4px; }
      .footer { text-align:center; font-size:10px; margin-top:8px; }
    </style>
    </head><body>
      <h2>MAX SPORT</h2>
      <p>Huancavelica, Perú</p>
      <p>Tel: 929 505 174</p>
      <hr/>
      <p>Fecha: ${fecha}</p>
      <p>Ticket #${venta.id.slice(-8).toUpperCase()}</p>
      <hr/>
      <table>
        <thead><tr>
          <th style="text-align:left">Producto</th>
          <th>Cant.</th>
          <th style="text-align:right">Precio</th>
          <th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>${lineas}</tbody>
      </table>
      <hr/>
      <p class="total">TOTAL: S/ ${venta.total.toFixed(2)}</p>
      <p>Pago: ${venta.metodo_pago}</p>
      <hr/>
      <p class="footer">¡Gracias por su compra!</p>
      <p class="footer">Vuelva pronto :)</p>
    </body></html>
  `;

  const ventana = window.open('', '_blank', 'width=320,height=600');
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => { ventana.print(); ventana.close(); }, 400);
}

// ─── Componente principal POS ─────────────────────────────────────────────────
export default function POS() {
  const [carrito, setCarrito] = useState([]);
  const [productoEscaneado, setProductoEscaneado] = useState(null);
  const [codigoInput, setCodigoInput] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [procesando, setProcesando] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const inputRef = useRef(null);

  // Mantener el foco en el input del scanner siempre
  useEffect(() => {
    const mantenerFoco = () => {
      if (inputRef.current && !procesando && !ventaExitosa) {
        inputRef.current.focus();
      }
    };
    mantenerFoco();
    document.addEventListener('click', mantenerFoco);
    return () => document.removeEventListener('click', mantenerFoco);
  }, [procesando, ventaExitosa]);

  // ── Buscar producto por código de barras ──────────────────────────────────
  const buscarProducto = async (codigo) => {
    if (!codigo.trim()) return;

    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('codigo_barras', codigo.trim())
        .single();

      if (error || !data) {
        mostrarMensaje('error', `Código "${codigo}" no encontrado en el sistema`);
        setProductoEscaneado(null);
        return;
      }

      if (data.stock !== null && data.stock <= 0) {
        mostrarMensaje('error', `"${data.nombre}" está agotado (stock: 0)`);
        setProductoEscaneado(null);
        return;
      }

      setProductoEscaneado(data);
      mostrarMensaje('success', `Producto encontrado: ${data.nombre}`);
    } catch (err) {
      mostrarMensaje('error', 'Error al buscar el producto');
    }
  };

  const handleScan = (e) => {
    if (e.key === 'Enter') {
      buscarProducto(codigoInput);
      setCodigoInput('');
    }
  };

  // ── Agregar al carrito ────────────────────────────────────────────────────
  const agregarAlCarrito = (producto) => {
    if (!producto) return;

    const precioFinal = (producto.precio_oferta && producto.precio_oferta < producto.precio)
      ? producto.precio_oferta
      : producto.precio;

    setCarrito(prev => {
      const existente = prev.find(i => i.id === producto.id);
      if (existente) {
        // Verificar stock antes de incrementar
        if (producto.stock !== null && existente.cantidad >= producto.stock) {
          mostrarMensaje('error', `Stock máximo disponible: ${producto.stock}`);
          return prev;
        }
        return prev.map(i =>
          i.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioFinal }
            : i
        );
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        precioFinal,
        precioOriginal: producto.precio,
        tieneOferta: !!(producto.precio_oferta && producto.precio_oferta < producto.precio),
        tallas: producto.tallas,
        ubicacion: producto.ubicacion_almacen,
        stock: producto.stock,
        cantidad: 1,
        subtotal: precioFinal
      }];
    });

    setProductoEscaneado(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nuevaCantidad = item.cantidad + delta;
      if (nuevaCantidad <= 0) return null;
      if (item.stock !== null && nuevaCantidad > item.stock) {
        mostrarMensaje('error', `Stock máximo: ${item.stock}`);
        return item;
      }
      return { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precioFinal };
    }).filter(Boolean));
  };

  const quitarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(i => i.id !== id));
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // ── Confirmar venta ───────────────────────────────────────────────────────
  const confirmarVenta = async () => {
    if (carrito.length === 0) {
      mostrarMensaje('error', 'El carrito está vacío');
      return;
    }
    setProcesando(true);

    try {
      // 1. Insertar venta principal
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
          total,
          metodo_pago: metodoPago,
          cajero_email: (await supabase.auth.getUser()).data.user?.email
        }])
        .select()
        .single();

      if (ventaError) throw ventaError;

      // 2. Insertar items de la venta
      const items = carrito.map(item => ({
        venta_id: venta.id,
        producto_id: item.id,
        nombre_producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precioFinal,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('venta_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // 3. Descontar stock de cada producto
      for (const item of carrito) {
        if (item.stock !== null) {
          await supabase.rpc('decrementar_stock', {
            p_producto_id: item.id,
            p_cantidad: item.cantidad
          });
        }
      }

      // 4. Guardar para ticket y limpiar
      setVentaExitosa({ venta, items });
      setCarrito([]);
      setProductoEscaneado(null);

    } catch (err) {
      mostrarMensaje('error', `Error al procesar la venta: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

  const nuevaVenta = () => {
    setVentaExitosa(null);
    setCarrito([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ─── PANTALLA DE VENTA EXITOSA ─────────────────────────────────────────────
  if (ventaExitosa) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl border-2 border-green-500 p-8 max-w-md w-full text-center">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
          <h2 className="text-3xl font-bold text-white mb-2">¡Venta Registrada!</h2>
          <p className="text-gray-400 mb-2">Ticket #{ventaExitosa.venta.id.slice(-8).toUpperCase()}</p>
          <p className="text-4xl font-black text-green-400 mb-6">
            S/ {ventaExitosa.venta.total.toFixed(2)}
          </p>
          <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left">
            {ventaExitosa.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-300 py-1 border-b border-gray-700 last:border-0">
                <span>{item.nombre_producto} x{item.cantidad}</span>
                <span className="text-white font-bold">S/ {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => imprimirTicket(ventaExitosa.venta, ventaExitosa.items)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              Imprimir Ticket
            </button>
            <button
              onClick={nuevaVenta}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              Nueva Venta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PANTALLA PRINCIPAL POS ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Navbar */}
      <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-14">
          <div className="flex items-center gap-3">
            <Package className="text-red-600" size={24} />
            <span className="text-xl font-bold">
              <span className="text-red-600">MAX</span>
              <span className="text-white"> SPORT</span>
              <span className="text-gray-400 text-sm ml-2">POS</span>
            </span>
          </div>
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </div>
      </nav>

      {/* Mensaje de estado */}
      {mensaje.texto && (
        <div className={`mx-4 mt-3 p-3 rounded-lg flex items-center gap-2 text-sm ${
          mensaje.tipo === 'success'
            ? 'bg-green-900/60 border border-green-600 text-green-200'
            : 'bg-red-900/60 border border-red-600 text-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {mensaje.texto}
        </div>
      )}

      <div className="flex flex-1 gap-0 overflow-hidden max-w-7xl mx-auto w-full px-4 py-4">

        {/* ── PANEL IZQUIERDO: Scanner + Producto ── */}
        <div className="flex-1 mr-4 flex flex-col gap-4 min-w-0">

          {/* Input scanner (invisible pero siempre activo) */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wider">
              Escanear código de barras
            </label>
            <input
              ref={inputRef}
              type="text"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={handleScan}
              className="w-full bg-gray-800 border-2 border-red-600 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
              placeholder="Apunta el scanner aquí y escanea..."
              autoComplete="off"
            />
            <p className="text-gray-500 text-xs mt-2">
              El scanner envía Enter automáticamente. También puedes escribir el código manualmente.
            </p>
          </div>

          {/* Tarjeta de producto escaneado */}
          {productoEscaneado ? (
            <div className="bg-gray-900 rounded-xl border-2 border-green-500 p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white leading-tight pr-4">
                  {productoEscaneado.nombre}
                </h3>
                <button onClick={() => setProductoEscaneado(null)} className="text-gray-500 hover:text-white flex-shrink-0">
                  <X size={20} />
                </button>
              </div>

              {/* Precios */}
              <div className="mb-4">
                {productoEscaneado.precio_oferta && productoEscaneado.precio_oferta < productoEscaneado.precio ? (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 line-through text-lg">S/ {productoEscaneado.precio.toFixed(2)}</span>
                    <span className="text-3xl font-black text-yellow-400">S/ {productoEscaneado.precio_oferta.toFixed(2)}</span>
                    <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">OFERTA</span>
                  </div>
                ) : (
                  <span className="text-3xl font-black text-green-400">S/ {productoEscaneado.precio.toFixed(2)}</span>
                )}
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-1 gap-2 mb-5">
                {productoEscaneado.tallas && productoEscaneado.tallas.length > 0 && (
                  <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-3">
                    <Layers size={16} className="text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs">Tallas disponibles</p>
                      <p className="text-white font-semibold">{productoEscaneado.tallas.join(' · ')}</p>
                    </div>
                  </div>
                )}

                {productoEscaneado.ubicacion_almacen && (
                  <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-3">
                    <MapPin size={16} className="text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs">Ubicación en almacén</p>
                      <p className="text-white font-semibold">{productoEscaneado.ubicacion_almacen}</p>
                    </div>
                  </div>
                )}

                {productoEscaneado.stock !== null && (
                  <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-3">
                    <Tag size={16} className="text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-xs">Stock disponible</p>
                      <p className={`font-semibold ${productoEscaneado.stock <= 3 ? 'text-red-400' : 'text-white'}`}>
                        {productoEscaneado.stock} unidades
                        {productoEscaneado.stock <= 3 && ' ⚠ Poco stock'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => agregarAlCarrito(productoEscaneado)}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 rounded-xl text-lg transition flex items-center justify-center gap-2"
              >
                <ShoppingCart size={22} />
                Agregar al Carrito
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-dashed border-gray-700 flex-1 flex items-center justify-center min-h-48">
              <div className="text-center text-gray-600">
                <Package size={48} className="mx-auto mb-3 opacity-40" />
                <p className="text-lg">Escanea un producto</p>
                <p className="text-sm mt-1">para ver sus detalles aquí</p>
              </div>
            </div>
          )}
        </div>

        {/* ── PANEL DERECHO: Carrito ── */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-gray-900 rounded-xl border border-gray-700">

          {/* Cabecera carrito */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="text-red-400" />
              <span className="font-bold text-lg">Carrito</span>
            </div>
            {carrito.length > 0 && (
              <button
                onClick={() => setCarrito([])}
                className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1"
              >
                <Trash2 size={12} /> Vaciar
              </button>
            )}
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {carrito.length === 0 ? (
              <div className="text-center text-gray-600 py-12">
                <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Carrito vacío</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold text-white leading-tight pr-2 flex-1">{item.nombre}</p>
                    <button
                      onClick={() => quitarDelCarrito(item.id)}
                      className="text-gray-500 hover:text-red-400 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarCantidad(item.id, -1)}
                        className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold flex items-center justify-center"
                      >−</button>
                      <span className="w-8 text-center font-bold text-white">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.id, 1)}
                        className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold flex items-center justify-center"
                      >+</button>
                    </div>
                    <div className="text-right">
                      {item.tieneOferta && (
                        <p className="text-gray-500 line-through text-xs">S/ {item.precioOriginal.toFixed(2)}</p>
                      )}
                      <p className="text-white font-bold">S/ {item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total y cobrar */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-lg">Total</span>
              <span className="text-3xl font-black text-white">S/ {total.toFixed(2)}</span>
            </div>

            <div className="mb-3">
              <label className="text-gray-400 text-xs mb-1 block">Método de pago</label>
              <div className="grid grid-cols-3 gap-1">
                {['efectivo', 'yape', 'plin'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMetodoPago(m)}
                    className={`py-2 rounded-lg text-sm font-semibold capitalize transition ${
                      metodoPago === m
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={confirmarVenta}
              disabled={procesando || carrito.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-xl transition flex items-center justify-center gap-2"
            >
              {procesando ? (
                <span className="animate-pulse">Procesando...</span>
              ) : (
                <>
                  <CheckCircle size={24} />
                  COBRAR
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}