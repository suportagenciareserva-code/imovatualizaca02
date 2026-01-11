import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import BannerDisplay from '../components/BannerDisplay';
import Footer from '../components/Footer';
import { propertiesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Sparkles, Building2 } from 'lucide-react';

const Home = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [launches, setLaunches] = useState([]);
  const [regularProperties, setRegularProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Fetch all properties
        const allProperties = await propertiesAPI.list({ limit: 100 });
        
        // Separate by type:
        // 1. Destaques (is_featured = true)
        const featured = allProperties.filter(p => p.is_featured === true);
        
        // 2. Lançamentos (is_launch = true) - excluindo os que já são destaque
        const launchProps = allProperties.filter(p => p.is_launch === true && !p.is_featured);
        
        // 3. Anúncios comuns (nem destaque, nem lançamento)
        const regular = allProperties.filter(p => !p.is_featured && !p.is_launch);
        
        setFeaturedProperties(featured.slice(0, 8));
        setLaunches(launchProps.slice(0, 8));
        setRegularProperties(regular.slice(0, 8));
        
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <SearchBar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SearchBar />

      {/* Banner Topo */}
      <div className="container mx-auto px-4 py-4">
        <BannerDisplay position="home_topo" className="mb-4" />
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1">
            
            {/* ============================================ */}
            {/* SEÇÃO 1: DESTAQUES */}
            {/* ============================================ */}
            {featuredProperties.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Star className="text-yellow-500" size={32} />
                    Imóveis em Destaque
                  </h2>
                  <Link 
                    to="/destaques" 
                    className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold transition-colors"
                  >
                    Ver todos
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredProperties.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </section>
            )}

            {/* Banner Meio */}
            <BannerDisplay position="home_meio" className="mb-12" />

            {/* ============================================ */}
            {/* SEÇÃO 2: LANÇAMENTOS */}
            {/* ============================================ */}
            {launches.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Sparkles className="text-orange-500" size={32} />
                    Lançamentos
                  </h2>
                  <Link 
                    to="/lancamentos" 
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                  >
                    Ver todos
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {launches.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </section>
            )}

            {/* ============================================ */}
            {/* SEÇÃO 3: ANÚNCIOS DE IMÓVEIS */}
            {/* ============================================ */}
            {regularProperties.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Building2 className="text-blue-500" size={32} />
                    Anúncios de Imóveis
                  </h2>
                  <Link 
                    to="/busca-detalhada" 
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Ver todos
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {regularProperties.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </section>
            )}

            {/* Caso não tenha nenhum imóvel em nenhuma categoria */}
            {featuredProperties.length === 0 && launches.length === 0 && regularProperties.length === 0 && (
              <div className="text-center py-12">
                <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600">Nenhum imóvel disponível no momento</h3>
                <p className="text-gray-500 mt-2">Volte em breve para conferir novos anúncios!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            {/* Client Area */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-xl font-bold mb-3">Cliente ImovLocal</h3>
              <p className="text-sm mb-4 text-blue-100">Administre seus imóveis no site.</p>
              <Link 
                to="/login" 
                className="block w-full bg-white text-blue-700 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition-colors text-center"
              >
                Área administrativa
              </Link>
            </div>

            {/* Quick Search */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Busca Rápida</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/busca-detalhada"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Busca Detalhada
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/buscar-mapa"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Buscar no Mapa
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/lancamentos"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Lançamentos
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/destaques"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                    Imóveis em Destaque
                  </Link>
                </li>
              </ul>
            </div>

            {/* Banner Lateral */}
            <BannerDisplay position="home_lateral" />
          </aside>
        </div>
      </div>

      {/* Banner Rodapé */}
      <div className="container mx-auto px-4 pb-8">
        <BannerDisplay position="home_rodape" />
      </div>

      <Footer />
    </div>
  );
};

export default Home;
