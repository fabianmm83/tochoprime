import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Trophy, 
  Calendar, 
  Zap, 
  BarChart3,
  Smartphone,
  Globe,
  Clock,
  Award,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const navigate = useNavigate();

  const mainFeatures = [
    {
      icon: <Users className="text-blue-500" size={28} />,
      title: "Gestión Completa de Equipos",
      description: "Administra jugadores, estadísticas, pagos y documentos de tu equipo en un solo lugar.",
      details: [
        "Roster de jugadores con perfiles completos",
        "Estadísticas individuales y de equipo",
        "Control de pagos y cuotas",
        "Documentos médicos y permisos"
      ],
      color: "blue",
      link: "/equipos"
    },
    {
      icon: <Calendar className="text-green-500" size={28} />,
      title: "Calendario Inteligente",
      description: "Programa automática de partidos, notificaciones y gestión de horarios.",
      details: [
        "Generación automática de calendarios",
        "Notificaciones push para partidos",
        "Disponibilidad de campos en tiempo real",
        "Sincronización con Google Calendar"
      ],
      color: "green",
      link: "/calendario"
    },
    {
      icon: <Trophy className="text-yellow-500" size={28} />,
      title: "Sistema de Competencia",
      description: "Ligas, torneos y playoff con seguimiento en vivo de resultados.",
      details: [
        "Tablas de posiciones automáticas",
        "Marcador en vivo con estadísticas",
        "Sistema de playoff personalizable",
        "Historial completo de partidos"
      ],
      color: "yellow",
      link: "/partidos"
    },
    {
      icon: <Shield className="text-purple-500" size={28} />,
      title: "Panel de Árbitros Profesional",
      description: "Herramientas especializadas para árbitros con modo offline.",
      details: [
        "Marcador en tiempo real",
        "Registro de faltas y eventos",
        "Modo offline para zonas sin internet",
        "Reportes automáticos de partidos"
      ],
      color: "purple",
      link: "/arbitro"
    },
    {
      icon: <BarChart3 className="text-red-500" size={28} />,
      title: "Analytics Avanzados",
      description: "Estadísticas detalladas y reportes personalizados para cada rol.",
      details: [
        "Dashboard personalizado por rol",
        "Reportes descargables en PDF/Excel",
        "Tendencias y predicciones",
        "Métricas de rendimiento"
      ],
      color: "red",
      link: "/admin"
    },
    {
      icon: <Smartphone className="text-indigo-500" size={28} />,
      title: "App Móvil Nativa",
      description: "Acceso completo desde cualquier dispositivo, optimizado para móviles.",
      details: [
        "Diseño mobile-first responsive",
        "Notificaciones push instantáneas",
        "Acceso sin conexión",
        "Instalación como PWA"
      ],
      color: "indigo",
      link: "/"
    }
  ];

  const platformFeatures = [
    {
      title: "Multiplataforma",
      description: "Accede desde web, móvil o tablet. Siempre sincronizado.",
      icon: <Globe size={24} />
    },
    {
      title: "Tiempo Real",
      description: "Actualizaciones instantáneas en marcadores y estadísticas.",
      icon: <Zap size={24} />
    },
    {
      title: "24/7 Disponible",
      description: "Sistema siempre activo para gestión en cualquier momento.",
      icon: <Clock size={24} />
    },
    {
      title: "Certificado Seguro",
      description: "Datos protegidos con encriptación de grado empresarial.",
      icon: <Shield size={24} />
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'green': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'yellow': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'purple': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'red': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'indigo': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      default: return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-6">
            <Zap size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              Plataforma Todo-en-Uno
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Todo lo que necesitas para{" "}
            <span className="text-tocho-primary">gestionar tu liga</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Desde la inscripción de equipos hasta el marcador final, 
            Tocho Prime cubre todas las necesidades de una liga profesional.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <div 
              key={index}
              className={`border-2 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${getColorClasses(feature.color)}`}
            >
              <div className="mb-6">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {feature.description}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{detail}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(feature.link)}
                className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:border-tocho-primary transition-colors flex items-center justify-center gap-2"
              >
                Explorar función
                <TrendingUp size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Platform Features */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 mb-12">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Por qué elegir ToroTech?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              La plataforma más completa para gestión deportiva
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Award size={32} className="text-tocho-primary" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Comparativa con otras soluciones
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Característica</th>
                  <th className="text-center p-4 font-semibold text-tocho-primary">Tocho Prime</th>
                  <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Otras plataformas</th>
                  <th className="text-center p-4 font-semibold text-gray-600 dark:text-gray-400">Gestión manual</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Gestión de equipos", "✓ Completa", "✓ Parcial", "✗ Manual"],
                  ["Marcador en vivo", "✓ Tiempo real", "✓ Básico", "✗ Papel"],
                  ["App móvil", "✓ Nativa", "✗ Web only", "✗ No existe"],
                  ["Estadísticas", "✓ Avanzadas", "✓ Básicas", "✗ Manuales"],
                  ["Soporte 24/7", "✓ Incluido", "✓ Horario limitado", "✗ No hay"],
                  ["Costo mensual", "$2,500/liga", "$5,000+/liga", "$10,000+ en personal"]
                ].map((row, index) => (
                  <tr 
                    key={index}
                    className={`border-b border-gray-200 dark:border-gray-700 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}`}
                  >
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{row[0]}</td>
                    <td className="p-4 text-center font-semibold text-tocho-primary">{row[1]}</td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">{row[2]}</td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Todo incluido en una sola plataforma
            </span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            No necesitas múltiples herramientas. En ToroTech integra todo lo necesario 
            para gestionar tu liga de manera profesional y eficiente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
            >
              <Users size={22} />
              Comenzar con mi equipo
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:border-tocho-primary transition-colors"
            >
              Solicitar demostración
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;