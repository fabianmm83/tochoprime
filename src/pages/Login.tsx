import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tocho-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Tocho Prime</h1>
          </div>
          <p className="text-gray-600 mt-2">Gestión profesional de ligas de tocho</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-7xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <div className="hidden md:block">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Gestiona tu liga de <span className="text-tocho-primary">tocho</span> como un profesional
            </h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-tocho-success/20 rounded-full flex items-center justify-center">
                  <span className="text-tocho-success">✓</span>
                </div>
                <span>Ligas varonil, femenil y mixto</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-tocho-success/20 rounded-full flex items-center justify-center">
                  <span className="text-tocho-success">✓</span>
                </div>
                <span>Categorías A-G con 16 campos disponibles</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-tocho-success/20 rounded-full flex items-center justify-center">
                  <span className="text-tocho-success">✓</span>
                </div>
                <span>Sistema completo de gestión de partidos</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-tocho-success/20 rounded-full flex items-center justify-center">
                  <span className="text-tocho-success">✓</span>
                </div>
                <span>Panel de árbitros con modo offline</span>
              </li>
            </ul>
          </div>

          {/* Right Side - Login Form */}
          <div>
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>© 2024 Tocho Prime. Todos los derechos reservados.</p>
        <p className="mt-1">División varonil, femenil, mixto • Categorías A-G</p>
      </footer>
    </div>
  );
};

export default Login;