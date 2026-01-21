import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  Users,
  Trophy,
  Shield,
  Zap
} from 'lucide-react';

const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamName: '',
    players: '',
    category: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        teamName: '',
        players: '',
        category: ''
      });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const categories = [
    'Varonil A', 'Varonil B', 'Varonil C', 'Varonil D', 'Varonil E', 'Varonil F', 'Varonil G',
    'Femenil A', 'Femenil B', 'Femenil C',
    'Mixto A', 'Mixto B', 'Mixto C'
  ];

  const benefits = [
    {
      icon: <Trophy size={24} />,
      title: "Inscripción garantizada",
      description: "Asegura tu lugar en la próxima temporada"
    },
    {
      icon: <Shield size={24} />,
      title: "Kit de bienvenida",
      description: "Incluye playeras y material promocional"
    },
    {
      icon: <Zap size={24} />,
      title: "Acceso anticipado",
      description: "Elige horarios y campos preferidos"
    },
    {
      icon: <Users size={24} />,
      title: "Capacitación incluida",
      description: "Sesión de onboarding para capitanes"
    }
  ];

  const contactMethods = [
    {
      icon: <Phone size={24} />,
      title: "Llámanos",
      description: "+52 55 1234 5678",
      action: "Lunes a Viernes 9:00 - 18:00",
      color: "bg-green-500"
    },
    {
      icon: <Mail size={24} />,
      title: "Escríbenos",
      description: "contacto@tochoprime.com",
      action: "Respuesta en menos de 24h",
      color: "bg-blue-500"
    },
    {
      icon: <MessageSquare size={24} />,
      title: "WhatsApp",
      description: "+52 55 8765 4321",
      action: "Soporte instantáneo",
      color: "bg-green-600"
    },
    {
      icon: <Calendar size={24} />,
      title: "Agenda reunión",
      description: "15 minutos",
      action: "Demo personalizada",
      color: "bg-purple-500"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para unirte a la{" "}
            <span className="text-tocho-primary">liga más competitiva</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Regístrate ahora y asegura tu lugar en la próxima temporada. 
            Más de 150 equipos ya confían en Tocho Prime.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Registration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-tocho-primary rounded-lg flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Registro de Equipo
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Completa el formulario y te contactaremos en 24h
                </p>
              </div>
            </div>

            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  ¡Registro exitoso!
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Te contactaremos en las próximas 24 horas para confirmar tu inscripción.
                </p>
                <button
                  onClick={() => navigate('/temporadas')}
                  className="px-6 py-3 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  Ver temporada actual
                  <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent"
                      placeholder="55 1234 5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del equipo *
                    </label>
                    <input
                      type="text"
                      name="teamName"
                      value={formData.teamName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent"
                      placeholder="Ej: Tiburones Azules"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de jugadores *
                    </label>
                    <select
                      name="players"
                      value={formData.players}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent"
                    >
                      <option value="">Seleccionar</option>
                      <option value="7-10">7-10 jugadores</option>
                      <option value="11-14">11-14 jugadores</option>
                      <option value="15-18">15-18 jugadores</option>
                      <option value="19+">19+ jugadores</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoría de interés *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-tocho-primary focus:border-transparent"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Al enviar este formulario, recibirás información detallada sobre 
                      costos, calendario y requisitos. Sin compromiso inicial.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-tocho-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                >
                  <Users size={22} />
                  Registrar mi equipo ahora
                  <ArrowRight size={20} />
                </button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Te contactaremos en menos de 24 horas hábiles.
                </p>
              </form>
            )}
          </div>

          {/* Benefits and Contact */}
          <div className="space-y-8">
            {/* Benefits */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-8">
                Beneficios al registrar tu equipo
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="bg-gray-700/50 p-4 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-tocho-primary/20 rounded-lg flex items-center justify-center">
                        {React.cloneElement(benefit.icon, { className: "text-tocho-primary" })}
                      </div>
                      <h4 className="font-semibold text-white">{benefit.title}</h4>
                    </div>
                    <p className="text-gray-300 text-sm">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Methods */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-8">
                O contáctanos directamente
              </h3>
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (index === 0) window.location.href = 'tel:+525512345678';
                      else if (index === 1) window.location.href = 'mailto:contacto@tochoprime.com';
                      else if (index === 2) window.location.href = 'https://wa.me/525587654321';
                      else navigate('/contacto');
                    }}
                    className="w-full bg-gray-700/50 hover:bg-gray-700 p-4 rounded-xl transition-colors flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center`}>
                      {React.cloneElement(method.icon, { className: "text-white" })}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white">{method.title}</div>
                      <div className="text-gray-300">{method.description}</div>
                      <div className="text-sm text-gray-400">{method.action}</div>
                    </div>
                    <ArrowRight size={20} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-tocho-primary to-blue-600 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">48h</div>
                  <div className="text-sm opacity-90">Respuesta máxima</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-sm opacity-90">Equipos satisfechos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm opacity-90">Costo de registro</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-center text-white/90">
                  No pierdas tu lugar en la próxima temporada
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Assurance */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-gray-800 rounded-full px-8 py-4">
            <Shield size={24} className="text-green-400" />
            <span className="text-white font-semibold">
              Únete a Tocho Prime
            </span>
            <CheckCircle size={24} className="text-green-400" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;