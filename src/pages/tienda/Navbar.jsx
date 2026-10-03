import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar({ categorias, onCategoriaClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const clickCategoria = (slug) => {
    setMenuOpen(false);
    onCategoriaClick(slug);
  };

  return (
    <nav className="bg-gradient-to-r from-black via-red-900 to-black border-b border-red-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-8 rounded object-cover" />
            <h1 className="text-2xl font-bold">
              <span className="text-red-600">MAX</span>
              <span className="text-white"> SPORT</span>
            </h1>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-black border-t border-red-600">
          <div className="px-4 py-4 space-y-3">
            {categorias.map(cat => (
              <button key={cat.slug} onClick={() => clickCategoria(cat.slug)} className="block w-full text-left hover:text-red-600">
                {cat.slug === '2x95' && '🔥 '}{cat.slug === 'Ofertas' && '🎁 '}{cat.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}