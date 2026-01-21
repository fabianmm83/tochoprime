import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Award, 
  TrendingUp,
  Star,
  ChevronRight,
  Shield,
  Clock,
  Users as TeamIcon,
  Target
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import LocationsSection from '../components/landing/LocationsSection';
import StatsSection from '../components/landing/StatsSection';
import PastSeasonsSection from '../components/landing/PastSeasonsSection';
import TeamsSection from '../components/landing/TeamsSection';
import CTASection from '../components/landing/CTASection';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Locations Section */}
      <LocationsSection />

      {/* Past Seasons Section */}
      <PastSeasonsSection />

      {/* Teams Section */}
      <TeamsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/tochologo.jpg" 
                  alt="Tocho Prime Logo" 
                  className="h-12 w-12 rounded-lg object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://via.placeholder.com/48?text=TP";
                  }}
                />
                <div>
                  <h3 className="text-xl font-bold">TOCHOPRIME</h3>
                  <p className="text-sm text-gray-400">Liga Profesional de Tocho</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                La liga más competitiva de tocho flag en México. 
                Gestión profesional desde 2026
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Sedes</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <MapPin size={16} />
                  <span>Cuemanco Isla</span>
                </li>
                <li className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <MapPin size={16} />
                  <span>Zague </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">División</h4>
              <ul className="space-y-2">
                <li className="text-gray-400 hover:text-white transition-colors">Varonil</li>
                <li className="text-gray-400 hover:text-white transition-colors">Femenil</li>
                <li className="text-gray-400 hover:text-white transition-colors">Mixto</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>contacto@tochoprime.com</li>
                <li>+52 55 1234 5678</li>
                <li>Lunes a Viernes: 9:00 - 18:00</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© 2025 ToroTech. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;