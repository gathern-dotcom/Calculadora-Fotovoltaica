import './globals.css';

export const metadata = {
  title: 'Dimensionador FV — Sinergy Soluciones Integrales',
  description: 'Herramienta de dimensionamiento técnico, cotización y gestión de proyectos fotovoltaicos aislados (off-grid) en Colombia.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-white text-[#4D4D4D] antialiased min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
