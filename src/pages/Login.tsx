import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Shield,
  ArrowRight,
  Star
} from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <Trophy size={24} />, text: 'Campeonatos profesionales' },
    { icon: <Users size={24} />, text: '150+ equipos registrados' },
    { icon: <MapPin size={24} />, text: 'Sedes: Cuemanco & Zague' },
    { icon: <Shield size={24} />, text: 'Sistema 100% seguro' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-tocho-primary to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TOCHOPRIME</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Liga Profesional</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-tocho-primary dark:hover:text-blue-400 transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-gradient-to-br from-tocho-primary to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-4">
                    <Star size={16} className="fill-yellow-300 text-yellow-300" />
                    <span className="text-sm font-semibold">Liga #1 en México</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-4">
                    Accede a tu panel de control
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Gestiona tu equipo, sigue partidos en vivo y accede a estadísticas 
                    exclusivas desde cualquier dispositivo.
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        {React.cloneElement(feature.icon, { className: "text-white", size: 20 })}
                      </div>
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="bg-white/10 rounded-xl p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-sm opacity-90">Satisfacción</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm opacity-90">Soporte</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">1,200+</div>
                      <div className="text-sm opacity-90">Partidos</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Testimonials */}
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">CR</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">Carlos Rodríguez</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Capitán, Tiburones Azules</div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                  "La mejor plataforma para gestionar nuestro equipo. Todo en un solo lugar."
                </p>
                <div className="flex gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8 lg:hidden">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Bienvenido a <span className="text-tocho-primary">Tocho Prime</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Accede a tu cuenta para gestionar tu equipo
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4">
                  <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Acceso seguro
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Iniciar Sesión
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Ingresa tus credenciales para acceder
                </p>
              </div>

              <LoginForm />

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  ¿No tienes una cuenta?
                </p>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:border-tocho-primary transition-colors flex items-center justify-center gap-2"
                >
                  Crear nueva cuenta
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Quick access for demo */}
              <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  ¿Eres nuevo? Prueba con rol de jugador
                </p>
              </div>
            </div>

            {/* Mobile Features */}
            <div className="mt-8 grid grid-cols-2 gap-4 lg:hidden">
              {features.slice(0, 2).map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    {React.cloneElement(feature.icon, { className: "text-blue-600 dark:text-blue-400", size: 20 })}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2024 Tocho Prime. Liga Profesional de Tocho Flag.</p>
          <p className="mt-1">Sedes: Cuemanco Isla 5 • Zague (Próximamente)</p>
          <div className="flex justify-center gap-6 mt-4">
            <button 
              onClick={() => navigate('/campos')}
              className="text-gray-600 dark:text-gray-400 hover:text-tocho-primary transition-colors"
            >
              Campos
            </button>
            <button 
              onClick={() => navigate('/partidos')}
              className="text-gray-600 dark:text-gray-400 hover:text-tocho-primary transition-colors"
            >
              Partidos
            </button>
            <button 
              onClick={() => navigate('/equipos')}
              className="text-gray-600 dark:text-gray-400 hover:text-tocho-primary transition-colors"
            >
              Equipos
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;