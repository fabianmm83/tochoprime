import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DIVISIONS, type Role } from '../../services/firebase';

const LoginForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'espectador' as Role
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        if (!formData.displayName.trim()) {
          throw new Error('El nombre es requerido');
        }
        await registerWithEmail(formData.email, formData.password, formData.displayName, formData.role);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error con Google');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-tocho-primary">
        {isLogin ? 'Iniciar Sesión' : 'Registrarse'} - Tocho Prime
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium mb-1">Nombre Completo</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tocho-primary"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tocho-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tocho-primary"
            required
            minLength={6}
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-tocho-primary"
            >
              <option value="espectador">Espectador</option>
              <option value="jugador">Jugador</option>
              <option value="arbitro">Árbitro</option>
              <option value="capitan">Capitán</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-tocho-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
        </button>
      </form>

      <div className="mt-6">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border py-3 rounded-lg hover:bg-gray-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continuar con Google
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-tocho-primary hover:underline"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;