import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Package, Printer, Search, Barcode, RefreshCw } from 'lucide-react';

// ── Carga JsBarcode desde CDN ──
function cargarJsBarcode() {
  return new Promise((resolve) => {
    if (window.JsBarcode) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// ── Imprime N copias de un código en filas de 3 ──
async function imprimirCodigos(codigo, cantidad) {
  await cargarJsBarcode();

  const codigos = Array(cantidad).fill(codigo);
  const imagenes = codigos.map(c => {
    const canvas = document.createElement('canvas');
    window.JsBarcode(canvas, c, {
      format: 'CODE128', width: 1, height: 38,
      displayValue: false, margin: 2,
    });
    return { codigo: c, img: canvas.toDataURL('image/png') };
  });

  const filas = Math.ceil(imagenes.length / 3);
  const totalCeldas = filas * 3;
  const celdas = [];
  for (let i = 0; i < totalCeldas; i++) {
    if (i < imagenes.length) {
      celdas.push(`
        <div class="etiqueta">
          <img src="${imagenes[i].img}" alt="barcode"/>
          <div class="codigo-texto">${imagenes[i].codigo}</div>
        </div>`);
    } else {
      celdas.push(`<div class="etiqueta"></div>`);
    }
  }

  let filasHTML = '';
  for (let f = 0; f < filas; f++) {
    filasHTML += `<div class="fila">${celdas.slice(f * 3, f * 3 + 3).join('')}</div>`;
  }

  const ventana = window.open('', '_blank', 'width=500,height=400');
  ventana.document.write(`
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: 100mm ${filas * 20}mm; margin: 0; }
      body { width: 100mm; background: white; }
      .fila { width: 100mm; height: 20mm; display: flex; flex-direction: row;
              align-items: center; padding: 0 2mm; gap: 3mm; overflow: hidden; }
      .etiqueta { flex: 1; height: 18mm; display: flex; flex-direction: column;
                  align-items: center; justify-content: center; overflow: hidden; }
      .etiqueta img { width: 100%; max-width: 26mm; height: 12mm; object-fit: contain; display: block; }
      .etiqueta .codigo-texto { font-family: 'Courier New', monospace; font-size: 8pt;
                                font-weight: bold; text-align: center; margin-top: 0.2mm;
                                letter-spacing: 0.4px; }
    </style></head>
    <body>${filasHTML}</body></html>
  `);
  ventana.document.close();
  setTimeout(() => { ventana.focus(); ventana.print(); ventana.close(); }, 600);
}

export default function ImprimirCodigo() {
  const [codigoInput, setCodigoInput] = useState('');
  const [cantidad, setCantidad] = useState(3);
  const [producto, setProducto] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const inputRef = useRef(null);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
  };

  const buscarCodigo = async () => {
    const codigo = codigoInput.trim();
    if (!codigo) return;
    setBuscando(true);
    setProducto(null);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, codigo_barras, stock, categoria')
        .eq('codigo_barras', codigo)
        .single();

      if (error || !data) {
        mostrarMensaje('error', `Código "${codigo}" no encontrado en el sistema`);
      } else {
        setProducto(data);
        mostrarMensaje('success', `Producto encontrado: ${data.nombre}`);
      }
    } catch {
      mostrarMensaje('error', 'Error al buscar el código');
    } finally {
      setBuscando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') buscarCodigo();
  };

  const handleImprimir = async () => {
    if (!producto) return;
    setImprimiendo(true);
    try {
      await imprimirCodigos(producto.codigo_barras, cantidad);
      mostrarMensaje('success', `✅ Enviando ${cantidad} etiqueta${cantidad > 1 ? 's' : ''} a imprimir`);
    } catch {
      mostrarMensaje('error', 'Error al imprimir');
    } finally {
      setImprimiendo(false);
    }
  };

  const limpiar = () => {
    setProducto(null);
    setCodigoInput('');
    setCantidad(3);
    setMensaje({ tipo: '', texto: '' });
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
            <Printer className="text-red-600" size={36} />
            Imprimir Código
          </h2>
          <p className="text-gray-400">Escribe o escanea un código de barras existente para imprimir etiquetas</p>
        </div>

        {/* Mensaje */}
        {mensaje.texto && (
          <div className={`mb-6 p-4 rounded-lg ${
            mensaje.tipo === 'success'
              ? 'bg-green-900/50 border border-green-600 text-green-200'
              : 'bg-red-900/50 border border-red-600 text-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="bg-gray-900 rounded-xl p-8 border border-red-600 space-y-6">

          {/* Input de código */}
          <div>
            <label className="block text-gray-300 mb-2 font-semibold flex items-center gap-2">
              <Barcode size={18} className="text-blue-400" />
              Código de Barras
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
                placeholder="Escanea o escribe el código"
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={buscarCodigo}
                disabled={buscando || !codigoInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-lg flex items-center gap-2 transition"
              >
                {buscando ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">Presiona Enter o haz clic en Buscar. También puedes usar el lector de códigos.</p>
          </div>

          {/* Resultado del producto */}
          {producto && (
            <>
              <div className="bg-gray-800 rounded-xl p-4 border border-green-600">
                <p className="text-green-400 text-xs font-semibold mb-1">✓ Producto encontrado</p>
                <p className="text-white font-bold text-lg">{producto.nombre}</p>
                <p className="text-gray-400 text-sm">Categoría: {producto.categoria}</p>
                <p className="text-blue-300 font-mono text-sm mt-1">Código: {producto.codigo_barras}</p>
                {producto.stock !== null && (
                  <p className={`text-sm mt-1 font-semibold ${producto.stock === 0 ? 'text-red-400' : producto.stock <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                    Stock: {producto.stock} unidades
                  </p>
                )}
              </div>

              {/* Cantidad de etiquetas */}
              <div>
                <label className="block text-gray-300 mb-3 font-semibold">Cantidad de etiquetas a imprimir</label>
                <div className="flex items-center gap-4">
                  <button type="button"
                    onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold text-2xl flex items-center justify-center transition">
                    −
                  </button>
                  <span className="text-4xl font-black text-white w-16 text-center">{cantidad}</span>
                  <button type="button"
                    onClick={() => setCantidad(c => Math.min(30, c + 1))}
                    className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold text-2xl flex items-center justify-center transition">
                    +
                  </button>
                  <span className="text-gray-400 text-sm">{cantidad} {cantidad === 1 ? 'etiqueta' : 'etiquetas'} → {Math.ceil(cantidad / 3)} {Math.ceil(cantidad / 3) === 1 ? 'fila' : 'filas'}</span>
                </div>
                {/* Accesos rápidos */}
                <div className="flex gap-2 mt-3">
                  {[1, 3, 6, 9, 12].map(n => (
                    <button key={n} type="button"
                      onClick={() => setCantidad(n)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                        cantidad === n ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleImprimir}
                  disabled={imprimiendo}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition"
                >
                  {imprimiendo ? (
                    <><RefreshCw size={20} className="animate-spin" /> Imprimiendo...</>
                  ) : (
                    <><Printer size={20} /> Imprimir {cantidad} {cantidad === 1 ? 'etiqueta' : 'etiquetas'}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={limpiar}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition"
                >
                  Limpiar
                </button>
              </div>
            </>
          )}

          {!producto && (
            <div className="text-center py-8 text-gray-600">
              <Barcode size={48} className="mx-auto mb-3 opacity-30" />
              <p>Busca un código para ver el producto y elegir cuántas etiquetas imprimir</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
