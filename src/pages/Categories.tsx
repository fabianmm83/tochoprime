import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoriesService, divisionsService, seasonsService } from '../services/firestore';
import { Category, Division, Season } from '../types';
import {
  PlusIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const Categories: React.FC = () => {
  const { divisionId } = useParams<{ divisionId: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [division, setDivision] = useState<Division | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    level: 1,
    teamLimit: 10,
    playerLimit: 15,
    price: 2000,
    rules: [''],
    isActive: true,
  });

  useEffect(() => {
    if (divisionId) {
      fetchData(divisionId);
    } else {
      navigate('/divisiones');
    }
  }, [divisionId, navigate]);

  const fetchData = async (divId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for division:', divId);
      
      // 1. Obtener la división específica
      let currentDivision: Division | null = null;
      let currentSeason: Season | null = null;
      
      // Primero obtenemos todas las temporadas
      const seasons = await seasonsService.getSeasons();
      console.log('Temporadas encontradas:', seasons.length);
      
      // Buscamos la división en cada temporada
      for (const s of seasons) {
        try {
          const divisions = await divisionsService.getDivisionsBySeason(s.id);
          console.log(`Divisions in season ${s.name}:`, divisions.length);
          
          const foundDivision = divisions.find(d => d.id === divId);
          if (foundDivision) {
            currentDivision = foundDivision;
            currentSeason = s;
            console.log('División encontrada:', foundDivision.name);
            console.log('Temporada:', s.name);
            break;
          }
        } catch (seasonError) {
          console.error(`Error fetching divisions for season ${s.id}:`, seasonError);
        }
      }
      
      if (!currentDivision) {
        setError('División no encontrada. Puede que haya sido eliminada o no exista.');
        setNotification({ type: 'error', message: 'División no encontrada' });
        navigate('/divisiones');
        return;
      }
      
      setDivision(currentDivision);
      setSeason(currentSeason);
      
      // 2. Obtener categorías de la división
      console.log('Fetching categories for division:', divId);
      const categoriesData = await categoriesService.getCategoriesByDivision(divId);
      console.log('Categorías obtenidas:', categoriesData.length);
      
      // Ordenar por nivel (A=1, B=2, etc.)
      const sortedCategories = categoriesData.sort((a, b) => a.level - b.level);
      setCategories(sortedCategories);
      
    } catch (error) {
      console.error('Error completo en fetchData:', error);
      setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      setNotification({ type: 'error', message: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!division || !season || !divisionId) return;

    try {
      // Validar que el nombre sea una letra única
      if (!newCategory.name || newCategory.name.length !== 1) {
        setNotification({ type: 'error', message: 'El nombre debe ser una letra única (A-G)' });
        return;
      }

      const categoryData = {
        divisionId,
        seasonId: season.id,
        name: newCategory.name.toUpperCase(),
        level: newCategory.level,
        teamLimit: newCategory.teamLimit,
        playerLimit: newCategory.playerLimit,
        price: newCategory.price,
        rules: newCategory.rules.filter(rule => rule.trim() !== ''), // Filtrar reglas vacías
        isActive: newCategory.isActive,
      };

      console.log('Creando categoría:', categoryData);
      await categoriesService.createCategory(categoryData);
      
      setNotification({ type: 'success', message: 'Categoría creada exitosamente' });
      setShowCreateModal(false);
      resetForm();
      fetchData(divisionId);
    } catch (error) {
      console.error('Error creating category:', error);
      setNotification({ type: 'error', message: 'Error al crear la categoría' });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !division || !divisionId) return;

    try {
      await categoriesService.updateCategory(editingCategory.id, {
        name: newCategory.name.toUpperCase(),
        level: newCategory.level,
        teamLimit: newCategory.teamLimit,
        playerLimit: newCategory.playerLimit,
        price: newCategory.price,
        rules: newCategory.rules.filter(rule => rule.trim() !== ''),
        isActive: newCategory.isActive,
      });
      
      setNotification({ type: 'success', message: 'Categoría actualizada exitosamente' });
      setShowEditModal(false);
      setEditingCategory(null);
      fetchData(divisionId);
    } catch (error) {
      console.error('Error updating category:', error);
      setNotification({ type: 'error', message: 'Error al actualizar la categoría' });
    }
  };

  const handleCreateDefaultCategories = async () => {
    if (!division || !season || !divisionId) return;

    try {
      console.log('Creando categorías predeterminadas para división:', divisionId);
      await categoriesService.createDefaultCategories(divisionId, season.id);
      
      setNotification({ type: 'success', message: 'Categorías predeterminadas creadas exitosamente' });
      fetchData(divisionId);
    } catch (error) {
      console.error('Error creating default categories:', error);
      setNotification({ type: 'error', message: 'Error al crear las categorías predeterminadas' });
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría ${categoryName}?`)) {
      try {
        await categoriesService.deleteCategory(categoryId);
        setNotification({ type: 'success', message: 'Categoría eliminada exitosamente' });
        if (divisionId) fetchData(divisionId);
      } catch (error) {
        console.error('Error deleting category:', error);
        setNotification({ type: 'error', message: 'Error al eliminar la categoría' });
      }
    }
  };

  const resetForm = () => {
    setNewCategory({
      name: '',
      level: 1,
      teamLimit: 10,
      playerLimit: 15,
      price: 2000,
      rules: [''],
      isActive: true,
    });
  };

  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      level: category.level,
      teamLimit: category.teamLimit,
      playerLimit: category.playerLimit,
      price: category.price,
      rules: category.rules && category.rules.length > 0 ? [...category.rules] : [''],
      isActive: category.isActive,
    });
    setShowEditModal(true);
  };

  const addRule = () => {
    setNewCategory({ ...newCategory, rules: [...newCategory.rules, ''] });
  };

  const removeRule = (index: number) => {
    const newRules = newCategory.rules.filter((_, i) => i !== index);
    setNewCategory({ ...newCategory, rules: newRules });
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...newCategory.rules];
    newRules[index] = value;
    setNewCategory({ ...newCategory, rules: newRules });
  };

  const getCategoryColor = (level: number) => {
    const colors = [
      'bg-red-500',    // A
      'bg-orange-500', // B
      'bg-yellow-500', // C
      'bg-green-500',  // D
      'bg-blue-500',   // E
      'bg-indigo-500', // F
      'bg-purple-500', // G
    ];
    return colors[level - 1] || 'bg-gray-500';
  };

  const getLetterFromLevel = (level: number) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    return letters[level - 1] || level.toString();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !division) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Error al cargar</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => navigate('/divisiones')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Divisiones
          </button>
        </div>
      </div>
    );
  }

  if (!division || !divisionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">División no encontrada</h2>
          <p className="text-gray-600 mt-2">La división que estás buscando no existe o ha sido eliminada.</p>
          <button
            onClick={() => navigate('/divisiones')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver a Divisiones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header y Navegación */}
      <div className="mb-8">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            <HomeIcon className="w-4 h-4 mr-1" />
            Dashboard
          </button>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <button
            onClick={() => navigate('/divisiones')}
            className="hover:text-blue-600 transition-colors"
          >
            Divisiones
          </button>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span className="font-medium text-gray-900">{division.name}</span>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span className="font-medium text-blue-600">Categorías</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <button
              onClick={() => navigate('/divisiones')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
              <div className="flex items-center mt-2">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: division.color }}
                />
                <span className="text-gray-600">
                  {division.name} {season && `- ${season.name}`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/categorias')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <TagIcon className="w-5 h-5 mr-2" />
              Ver Todas las Categorías
            </button>
            <button
              onClick={handleCreateDefaultCategories}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              disabled={categories.length > 0}
            >
              <TagIcon className="w-5 h-5 mr-2" />
              Categorías Predeterminadas
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nueva Categoría
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${getCategoryColor(category.level)} rounded-lg flex items-center justify-center mr-3`}>
                    <span className="text-white font-bold text-lg">{category.name}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Categoría {category.name}</h3>
                    <p className="text-sm text-gray-600">Nivel {category.level} ({getLetterFromLevel(category.level)})</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Equipos Máx.</p>
                    <p className="text-sm font-semibold text-gray-900">{category.teamLimit}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Jugadores/Eq.</p>
                    <p className="text-sm font-semibold text-gray-900">{category.playerLimit}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Precio por Equipo</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">${category.price.toLocaleString()}</span>
                </div>

                {category.rules && category.rules.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Reglas específicas:</p>
                    <ul className="space-y-1">
                      {category.rules.slice(0, 2).map((rule, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600">
                          <span className="mr-2">•</span>
                          <span className="line-clamp-2">{rule}</span>
                        </li>
                      ))}
                      {category.rules.length > 2 && (
                        <li className="text-xs text-gray-500">
                          +{category.rules.length - 2} reglas más
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/equipos?category=${category.id}`)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  Ver equipos
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editCategory(category)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && !error && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <TagIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin categorías configuradas</h3>
          <p className="text-gray-600 mb-6">
            Esta división aún no tiene categorías. Crea las categorías A-G para organizar los equipos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCreateDefaultCategories}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              disabled={categories.length > 0}
            >
              <TagIcon className="w-5 h-5 mr-2" />
              Crear 7 Categorías Predeterminadas (A-G)
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Crear Categoría Personalizada
            </button>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Crear Nueva Categoría"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                placeholder="A, B, C, etc."
                maxLength={1}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Letra única (A-G)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel *
              </label>
              <select
                value={newCategory.level}
                onChange={(e) => setNewCategory({ ...newCategory, level: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7].map(level => (
                  <option key={level} value={level}>
                    Nivel {level} ({getLetterFromLevel(level)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Límite de Equipos
              </label>
              <input
                type="number"
                value={newCategory.teamLimit}
                onChange={(e) => setNewCategory({ ...newCategory, teamLimit: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jugadores por Equipo
              </label>
              <input
                type="number"
                value={newCategory.playerLimit}
                onChange={(e) => setNewCategory({ ...newCategory, playerLimit: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Equipo ($)
            </label>
            <input
              type="number"
              value={newCategory.price}
              onChange={(e) => setNewCategory({ ...newCategory, price: parseInt(e.target.value) || 2000 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="100"
            />
          </div>

          {/* Rules */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Reglas Específicas
              </label>
              <button
                type="button"
                onClick={addRule}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar Regla
              </button>
            </div>
            <div className="space-y-2">
              {newCategory.rules.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Regla específica para esta categoría"
                  />
                  {newCategory.rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={newCategory.isActive}
              onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Activar esta categoría
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateCategory}
              disabled={!newCategory.name || newCategory.name.length !== 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Categoría
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCategory(null);
          resetForm();
        }}
        title="Editar Categoría"
        size="md"
      >
        {editingCategory && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  maxLength={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel *
                </label>
                <select
                  value={newCategory.level}
                  onChange={(e) => setNewCategory({ ...newCategory, level: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(level => (
                    <option key={level} value={level}>
                      Nivel {level} ({getLetterFromLevel(level)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Equipos
                </label>
                <input
                  type="number"
                  value={newCategory.teamLimit}
                  onChange={(e) => setNewCategory({ ...newCategory, teamLimit: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jugadores por Equipo
                </label>
                <input
                  type="number"
                  value={newCategory.playerLimit}
                  onChange={(e) => setNewCategory({ ...newCategory, playerLimit: parseInt(e.target.value) || 15 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio por Equipo ($)
              </label>
              <input
                type="number"
                value={newCategory.price}
                onChange={(e) => setNewCategory({ ...newCategory, price: parseInt(e.target.value) || 2000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="100"
              />
            </div>

            {/* Rules */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reglas Específicas
                </label>
                <button
                  type="button"
                  onClick={addRule}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Agregar Regla
                </button>
              </div>
              <div className="space-y-2">
                {newCategory.rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => updateRule(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {newCategory.rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRule(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="editIsActive"
                checked={newCategory.isActive}
                onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
                Categoría activa
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={!newCategory.name || newCategory.name.length !== 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actualizar Categoría
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Categories;