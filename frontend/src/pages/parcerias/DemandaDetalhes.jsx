import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../components/ui/dialog';
import { 
  ArrowLeft, MapPin, DollarSign, Home, Eye, MessageSquare, 
  Calendar, Phone, User, Send, CheckCircle, Building2
} from 'lucide-react';
import { demandsAPI, propertiesAPI } from '../../services/api';
import { toast } from 'sonner';

const DemandaDetalhes = () => {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myProperties, setMyProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchDemandDetails();
    fetchMyProperties();
  }, [demandId]);

  const fetchDemandDetails = async () => {
    try {
      setLoading(true);
      const data = await demandsAPI.getDemand(demandId);
      setDemand(data);
    } catch (error) {
      console.error('Error fetching demand:', error);
      toast.error('Erro ao carregar detalhes da demanda');
      navigate('/admin/parcerias/mural');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProperties = async () => {
    try {
      const data = await propertiesAPI.getMyProperties();
      setMyProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSendProposal = async () => {
    if (!selectedProperty) {
      toast.error('Selecione um imóvel para enviar a proposta');
      return;
    }

    try {
      setSendingProposal(true);
      
      await demandsAPI.createProposal(demandId, {
        property_id: selectedProperty,
        message: proposalMessage || null
      });

      toast.success('Proposta enviada com sucesso!', {
        description: 'O corretor demandante será notificado.'
      });

      setDialogOpen(false);
      setSelectedProperty('');
      setProposalMessage('');
      
      // Atualizar a demanda para mostrar contador atualizado
      fetchDemandDetails();
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar proposta');
    } finally {
      setSendingProposal(false);
    }
  };

  const isMyDemand = demand && user && demand.corretor_id === user.id;

  // Filtrar apenas imóveis que podem ser compatíveis
  const compatibleProperties = myProperties.filter(prop => {
    if (!demand) return false;
    // Verificar se o tipo é compatível (simplificado)
    const tipoMatch = prop.property_type?.toLowerCase().includes(demand.tipo_imovel?.toLowerCase()) ||
                      demand.tipo_imovel?.toLowerCase().includes(prop.property_type?.toLowerCase());
    // Verificar se o preço está na faixa
    const priceMatch = prop.price >= demand.valor_minimo && prop.price <= demand.valor_maximo;
    return priceMatch; // Priorizando preço
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="bg-white rounded-lg h-96"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!demand) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/parcerias/mural')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Mural
        </Button>

        {/* Main Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Home className="text-blue-600" size={28} />
                  Cliente busca {demand.tipo_imovel}
                </CardTitle>
                <CardDescription className="mt-2 flex items-center gap-1 text-base">
                  <MapPin size={16} />
                  {demand.bairros_interesse.join(', ')}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                {String(demand.comissao_parceiro).replace('.', ',')}% de comissão
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Faixa de Valor */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign size={18} className="text-green-600" />
                Faixa de Valor
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(demand.valor_minimo)} - {formatCurrency(demand.valor_maximo)}
              </p>
            </div>

            {/* Critérios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demand.dormitorios_min && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <span className="text-2xl">🛏️</span>
                  <p className="font-semibold mt-1">{demand.dormitorios_min}+ dormitórios</p>
                </div>
              )}
              {demand.vagas_garagem_min && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <span className="text-2xl">🚗</span>
                  <p className="font-semibold mt-1">{demand.vagas_garagem_min}+ vagas</p>
                </div>
              )}
              {demand.area_util_min && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <span className="text-2xl">📐</span>
                  <p className="font-semibold mt-1">{demand.area_util_min}m² mínimo</p>
                </div>
              )}
            </div>

            {/* Características */}
            {demand.caracteristicas_essenciais && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Características Desejadas</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {demand.caracteristicas_essenciais}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4 border-t text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MessageSquare size={16} />
                {demand.propostas_count || 0} propostas
              </span>
              <span className="flex items-center gap-1">
                <Eye size={16} />
                {demand.views || 0} visualizações
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                Publicado em {formatDate(demand.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Corretor Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User size={20} />
              Corretor Demandante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{demand.corretor_name}</p>
                {demand.corretor_creci && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Building2 size={14} />
                    {demand.corretor_creci}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Phone size={18} />
                <span className="font-semibold">{demand.corretor_phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {!isMyDemand && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg">
                <Send className="mr-2 h-5 w-5" />
                Fazer Proposta com Meu Imóvel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enviar Proposta</DialogTitle>
                <DialogDescription>
                  Selecione um dos seus imóveis para enviar como proposta para esta demanda.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Seletor de Imóvel */}
                <div>
                  <Label htmlFor="property">Selecione o Imóvel *</Label>
                  {myProperties.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
                      <p className="text-yellow-800 text-sm">
                        Você não possui imóveis cadastrados. 
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-yellow-800 underline ml-1"
                          onClick={() => navigate('/admin/imoveis/novo')}
                        >
                          Cadastre um imóvel primeiro
                        </Button>
                      </p>
                    </div>
                  ) : (
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Escolha um imóvel" />
                      </SelectTrigger>
                      <SelectContent>
                        {myProperties.map((prop) => (
                          <SelectItem key={prop.id} value={prop.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{prop.title}</span>
                              <span className="text-sm text-gray-500">
                                {formatCurrency(prop.price)} - {prop.neighborhood}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {compatibleProperties.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {compatibleProperties.length} imóvel(is) compatível(is) com esta demanda
                    </p>
                  )}
                </div>

                {/* Mensagem */}
                <div>
                  <Label htmlFor="message">Mensagem (opcional)</Label>
                  <Textarea
                    id="message"
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    placeholder="Adicione uma mensagem para o corretor demandante..."
                    rows={4}
                    className="mt-2"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {proposalMessage.length}/1000 caracteres
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendProposal} 
                  disabled={!selectedProperty || sendingProposal}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {sendingProposal ? (
                    'Enviando...'
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Enviar Proposta
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {isMyDemand && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              Esta é a sua demanda. Vá para "Minhas Demandas" para gerenciá-la e ver as propostas.
            </p>
            <Button 
              variant="outline" 
              className="mt-3"
              onClick={() => navigate('/admin/parcerias/minhas')}
            >
              Ver Minhas Demandas
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DemandaDetalhes;
