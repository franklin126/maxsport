import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const dominio = process.env.SITE_URL || 'https://www.maxsport.pe';

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generar() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error trayendo productos:', error.message);
    process.exit(1);
  }

  const urlsProductos = (productos || []).map(p => {
    const fecha = p.created_at ? p.created_at.split('T')[0] : '';
    return `  <url>
    <loc>${dominio}/producto/${p.id}</loc>
    <lastmod>${fecha}</lastmod>
    <priority>0.8</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${dominio}</loc>
    <priority>1.0</priority>
  </url>
${urlsProductos.join('\n')}
</urlset>
`;

  writeFileSync('public/sitemap.xml', xml);
  console.log(`sitemap.xml generado con ${(productos || []).length + 1} urls`);
}

generar();