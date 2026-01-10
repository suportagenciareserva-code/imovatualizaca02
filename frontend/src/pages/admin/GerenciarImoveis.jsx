import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Eye, Star, Lock, Unlock } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BACKEND_URL}${imagePath}`;
};

const GerenciarImoveis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [togglingFeatured, setTogglingFeatured] = useState(null);
  const [togglingExclusive, setTogglingExclusive] = useState(null);
  const [featuredInfo, setFeaturedInfo] = useState({ featured_count: 0, max_featured: 10, remaining: 10 });

  useEffect(() => {
    fetchProperties();
    fetchFeaturedCount();
  }, []);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getMyProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Erro ao carregar imóveis');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedCount = async () => {
    try {
      const data = await propertiesAPI.getFeaturedCount();
      setFeaturedInfo(data);
    } catch (error) {
      console.error('Error fetching featured count:', error);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      return;
    }

    setDeleting(propertyId);
    try {
      await propertiesAPI.delete(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
      toast.success('Imóvel excluído com sucesso!');
      fetchFeaturedCount();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir imóvel');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleFeatured = async (propertyId) => {
    setTogglingFeatured(propertyId);
    try {
      const updatedProperty = await propertiesAPI.toggleFeatured(propertyId);
      setProperties(properties.map(p => p.id === propertyId ? updatedProperty : p));
      fetchFeaturedCount();
      toast.success(updatedProperty.is_featured ? 'Imóvel destacado!' : 'Destaque removido');
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error(error.response?.data?.detail || 'Erro ao alterar destaque');
    } finally {
      setTogglingFeatured(null);
    }
  };

  const handleToggleExclusive = async (propertyId) => {
    setTogglingExclusive(propertyId);
    try {
      const updatedProperty = await propertiesAPI.toggleExclusive(propertyId);
      setProperties(properties.map(p => p.id === propertyId ? updatedProperty : p));
      toast.success(updatedProperty.is_exclusive ? 'Marcado como Lançamento Exclusivo!' : 'Exclusividade removida');
    } catch (error) {
      console.error('Error toggling exclusive:', error);
      toast.error(error.response?.data?.detail || 'Erro ao alterar exclusividade');
    } finally {
      setTogglingExclusive(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  const canFeature = user?.user_type === 'corretor' || user?.user_type === 'imobiliaria';
  const canExclusive = user?.user_type === 'imobiliaria';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gerenciar Imóveis</h1>
                <p className="text-blue-100 text-sm">{properties.length} imóveis cadastrados</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {canFeature && (
                <div className="bg-white/10 rounded-lg px-4 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-400" />
                    Destaques: {featuredInfo.featured_count}/{featuredInfo.max_featured}
                  </span>
                </div>
              )}
              <Link to="/admin/imoveis/novo">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus size={18} className="mr-2" />
                  Novo Imóvel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {properties.map(property => (
              <div key={property.id} className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${property.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-64 h-48 md:h-auto relative">
                    <img
                      src={property.images?.[0] ? getImageUrl(property.images[0]) : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Badges on image */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {property.is_featured && (
                        <Badge className="bg-yellow-500 text-white">
                          <Star size={12} className="mr-1" /> DESTAQUE
                        </Badge>
                      )}
                      {property.is_exclusive && (
                        <Badge className="bg-purple-600 text-white">
                          <Lock size={12} className="mr-1" /> EXCLUSIVO
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                            property.purpose === 'VENDA' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {property.purpose}
                          </span>
                          {property.is_launch && (
                            <span className="px-3 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700">
                              LANÇAMENTO
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-600">{property.property_type}</p>
                        <p className="text-sm text-gray-600">{property.neighborhood}, {property.city} - {property.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatPrice(property.price)}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mb-4 text-sm text-gray-600 flex-wrap">
                      {property.bedrooms && <span>🛏️ {property.bedrooms} quartos</span>}
                      {property.bathrooms && <span>🚿 {property.bathrooms} banheiros</span>}
                      {property.area && <span>📐 {property.area}m²</span>}
                      {property.garage && <span>🚗 {property.garage} vagas</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/imovel/${property.id}`)}
                      >
                        <Eye size={16} className="mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/imoveis/editar/${property.id}`)}
                      >
                        <Edit size={16} className="mr-1" />
                        Editar
                      </Button>
                      
                      {/* Feature Button */}
                      {canFeature && (
                        <Button
                          variant={property.is_featured ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleFeatured(property.id)}
                          disabled={togglingFeatured === property.id || (!property.is_featured && featuredInfo.remaining <= 0)}
                          className={property.is_featured ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "text-yellow-600 hover:text-yellow-700 hover:border-yellow-600"}
                          title={!property.is_featured && featuredInfo.remaining <= 0 ? "Limite de destaques atingido" : ""}
                        >
                          <Star size={16} className="mr-1" />
                          {togglingFeatured === property.id ? '...' : property.is_featured ? 'Destacado' : 'Destacar'}
                        </Button>
                      )}
                      
                      {/* Exclusive Button - Only for Imobiliarias */}
                      {canExclusive && (
                        <Button
                          variant={property.is_exclusive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleExclusive(property.id)}
                          disabled={togglingExclusive === property.id}
                          className={property.is_exclusive ? "bg-purple-600 hover:bg-purple-700 text-white" : "text-purple-600 hover:text-purple-700 hover:border-purple-600"}
                        >
                          {property.is_exclusive ? <Lock size={16} className="mr-1" /> : <Unlock size={16} className="mr-1" />}
                          {togglingExclusive === property.id ? '...' : property.is_exclusive ? 'Exclusivo' : 'Exclusivo'}
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
                        disabled={deleting === property.id}
                        className="text-red-600 hover:text-red-700 hover:border-red-600"
                      >
                        <Trash2 size={16} className="mr-1" />
                        {deleting === property.id ? '...' : 'Excluir'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-300 mb-4">
              <Plus size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum imóvel cadastrado</h3>
            <p className="text-gray-600 mb-6">Comece cadastrando seu primeiro imóvel</p>
            <Link to="/admin/imoveis/novo">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus size={18} className="mr-2" />
                Cadastrar Imóvel
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default GerenciarImoveis;
