import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, TrendingUp, Users, MessageSquare, CheckCircle, 
  XCircle, Clock, Target, Award, BarChart3, RefreshCw
} from 'lucide-react';
import { adminAPIService } from '../../services/adminAPI';
import { toast } from 'sonner';

const AdminMuralOportunidades = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [demands, setDemands] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user?.user_type !== 'admin' && user?.user_type !== 'admin_senior') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, demandsData] = await Promise.all([
        adminAPIService.getMuralStats(),
        adminAPIService.getMuralDemands(filter || null)
      ]);
      setStats(statsData);
      setDemands(demandsData);
    } catch (error) {
      console.error('Error fetching mural data:', error);
      toast.error('Erro ao carregar dados do Mural');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
      negotiating: { label: 'Em Negociação', className: 'bg-blue-100 text-blue-700' },
      closed: { label: 'Fechada', className: 'bg-gray-100 text-gray-700' }
    };
    const c = config[status] || config.active;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
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

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/master">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Target size={28} />
                  Mural de Oportunidades
                </h1>
                <p className="text-purple-100 text-sm">Acompanhamento de parcerias e negócios</p>
              </div>
            </div>
            <Button 
              onClick={fetchData} 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw size={18} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Demandas</p>
                  <p className="text-3xl font-bold text-gray-800">{stats?.summary?.total_demands || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Target className="text-purple-600" size={24} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {stats?.summary?.active_demands || 0} ativas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Propostas</p>
                  <p className="text-3xl font-bold text-gray-800">{stats?.summary?.total_proposals || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <MessageSquare className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {stats?.summary?.pending_proposals || 0} pendentes
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Propostas Aceitas</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.summary?.accepted_proposals || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Parcerias realizadas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.summary?.conversion_rate || 0}%</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="text-orange-600" size={24} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Propostas aceitas / total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 size={18} />
                Demandas por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.demands_by_type && Object.keys(stats.demands_by_type).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.demands_by_type).slice(0, 5).map(([tipo, count]) => (
                    <div key={tipo} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{tipo}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award size={18} />
                Top Demandantes
              </CardTitle>
              <CardDescription>Corretores com mais demandas</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.top_demandantes?.length > 0 ? (
                <div className="space-y-2">
                  {stats.top_demandantes.slice(0, 5).map((d, i) => (
                    <div key={d._id || i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">{d.name}</span>
                      <Badge className="bg-purple-100 text-purple-700">{d.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users size={18} />
                Top Ofertantes
              </CardTitle>
              <CardDescription>Corretores com mais parcerias</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.top_ofertantes?.length > 0 ? (
                <div className="space-y-2">
                  {stats.top_ofertantes.slice(0, 5).map((o, i) => (
                    <div key={o._id || i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">{o.name}</span>
                      <Badge className="bg-green-100 text-green-700">{o.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Demands List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Demandas Recentes</CardTitle>
                <CardDescription>Últimas {demands.length} demandas do mural</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Todas</option>
                  <option value="active">Ativas</option>
                  <option value="negotiating">Em Negociação</option>
                  <option value="closed">Fechadas</option>
                </select>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {demands.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">TIPO</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">BAIRROS</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">VALOR</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">COMISSÃO</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DEMANDANTE</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">PROPOSTAS</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">STATUS</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demands.map((demand) => (
                      <tr key={demand.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {demand.tipo_imovel}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {demand.bairros_interesse?.slice(0, 2).join(', ')}
                          {demand.bairros_interesse?.length > 2 && '...'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatCurrency(demand.valor_minimo)} - {formatCurrency(demand.valor_maximo)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-green-100 text-green-700">
                            {String(demand.comissao_parceiro).replace('.', ',')}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {demand.corretor_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium">{demand.total_proposals || demand.propostas_count || 0}</span>
                            {(demand.accepted_count > 0 || demand.accepted_proposals > 0) && (
                              <CheckCircle size={14} className="text-green-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(demand.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(demand.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma demanda encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminMuralOportunidades;
