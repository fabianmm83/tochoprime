import React from 'react';
import Navbar from '../components/common/Navbar';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import SimpleFeatures from '../components/landing/SimpleFeatures';
import PublicTeamsView from '../components/landing/PublicTeamsView';
import PublicStandings from '../components/landing/PublicStandings';
import UpcomingMatches from '../components/landing/UpcomingMatches';
import LocationsSection from '../components/landing/LocationsSection';
import CTASection from '../components/landing/CTASection';
import { TrophyIcon } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Simple Features */}
      <SimpleFeatures />

      {/* Public Teams View */}
      <PublicTeamsView />

      {/* Public Standings */}
      <PublicStandings />

      {/* Upcoming Matches */}
      <UpcomingMatches />

      {/* Locations Section */}
      <LocationsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-tocho-primary rounded-lg flex items-center justify-center">
                  <TrophyIcon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">TOCHOPRIME</h3>
                  <p className="text-sm text-gray-400">Liga de Tocho Flag</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                La liga más competitiva de tocho flag en México.
                Temporada Primavera 2026.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/equipos-public" className="hover:text-white transition-colors">Ver Equipos</a></li>
                <li><a href="/partidos-public" className="hover:text-white transition-colors">Ver Partidos</a></li>
                <li><a href="/tabla-posiciones-public" className="hover:text-white transition-colors">Tabla de Posiciones</a></li>
                <li><a href="/calendario-public" className="hover:text-white transition-colors">Calendario</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>contacto@tochoprime.com</li>
                <li>+52 55 1234 5678</li>
                <li>Lunes a Viernes: 9:00 - 18:00</li>
                <li>Sábados: 8:00 - 14:00 (en sedes)</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© 2026 Tocho Prime. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;