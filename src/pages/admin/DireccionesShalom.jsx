import { useState } from 'react';
import { Link } from 'react-router-dom';
import { agenciasShalom } from '../../data/agenciasShalom';
import { ArrowLeft, Package, Truck, MapPin, Clock } from 'lucide-react';

const departamentos = Object.keys(agenciasShalom).sort((a, b) => a.localeCompare(b, 'es'));
const totalAgencias = departamentos.reduce((suma, dep) => suma + agenciasShalom[dep].length, 0);

export default function DireccionesShalom() {
  const [departamento, setDepartamento] = useState('');
  const agencias = agenciasShalom[departamento] || [];

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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Truck className="text-teal-500" size={36} />
            Direcciones Shalom
          </h2>
          <p className="text-gray-400">{totalAgencias} agencias en {departamentos.length} departamentos de todo el Perú</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-8 border border-teal-600 mb-6">
          <label className="block text-gray-300 mb-2 font-semibold flex items-center gap-2">
            <MapPin size={18} className="text-teal-400" />
            Departamento
          </label>
          <select
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Selecciona un departamento</option>
            {departamentos.map((dep) => (
              <option key={dep} value={dep}>{dep} ({agenciasShalom[dep].length})</option>
            ))}
          </select>
        </div>

        {departamento && (
          <>
            <p className="text-gray-400 text-sm mb-3">
              {agencias.length} {agencias.length === 1 ? 'agencia' : 'agencias'} en {departamento}
            </p>
            <div className="space-y-3">
              {agencias.map((agencia) => (
                <div key={agencia.nombre} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-white font-bold text-lg mb-2">{agencia.nombre}</h3>
                  {agencia.direccion && (
                    <p className="text-gray-300 text-sm flex items-start gap-2 mb-1">
                      <MapPin size={16} className="text-teal-400 shrink-0 mt-0.5" />
                      {agencia.direccion}
                    </p>
                  )}
                  {agencia.horario && (
                    <p className="text-gray-400 text-sm flex items-start gap-2">
                      <Clock size={16} className="text-teal-400 shrink-0 mt-0.5" />
                      {agencia.horario}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
