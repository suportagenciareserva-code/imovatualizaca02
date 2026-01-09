import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { 
  ArrowLeft, Home, DollarSign, Phone, User, CheckCircle, 
  XCircle, Clock, Eye, Building2, MessageSquare, MapPin
} from 'lucide-react';
import { demandsAPI } from '../../services/api';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProposalCard = ({ proposal, onAccept, onReject, loading }) => {
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { label: 'Aceita', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejeitada', className: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { label: 'Expirada', className: 'bg-gray-100 text-gray-800', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <IconComponent size={14} />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className={`border-l-4 ${
      proposal.status === 'accepted' ? 'border-l-green-500' :
      proposal.status === 'rejected' ? 'border-l-red-500' :
      'border-l-yellow-500'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="text-blue-600" size={20} />
              {proposal.property_title}
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <DollarSign size={14} />
                {formatCurrency(proposal.property_price)}
              </span>
            </CardDescription>
          </div>
          {getStatusBadge(proposal.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ofertante Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-gray-600 mb-2">Corretor Ofertante</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <User size={16} />
                {proposal.ofertante_name}
              </p>
              {proposal.ofertante_creci && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Building2 size={14} />
                  {proposal.ofertante_creci}
                </p>
              )}
            </div>
            <a 
              href={`https://wa.me/55${proposal.ofertante_phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Phone size={16} />
              <span className="font-medium">{proposal.ofertante_phone}</span>
            </a>
          </div>
        </div>

        {/* Mensagem */}
        {proposal.message && (
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-1">
              <MessageSquare size={14} />
              Mensagem
            </h4>
            <p className="text-gray-700 bg-blue-50 p-3 rounded-lg text-sm">
              "{proposal.message}"
            </p>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500">
          Proposta enviada em {formatDate(proposal.created_at)}
        </p>

        {/* Actions for pending proposals */}
        {proposal.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(proposal.id)}
              disabled={loading}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="mr-1 h-4 w-4" />
              Rejeitar
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept(proposal.id)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Aceitar Proposta
            </Button>
          </div>
        )}

        {/* Contact after acceptance */}
        {proposal.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-green-800 text-sm font-medium">
              ✅ Proposta aceita! Entre em contato com o corretor para dar continuidade.
            </p>
            <a 
              href={`https://wa.me/55${proposal.ofertante_phone.replace(/\D/g, '')}?text=Olá ${proposal.ofertante_name}, aceitei sua proposta para o imóvel "${proposal.property_title}". Vamos conversar?`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2"
            >
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Phone className="mr-2 h-4 w-4" />
                Chamar no WhatsApp
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const VerPropostas = () => {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [demandId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [demandData, proposalsData] = await Promise.all([
        demandsAPI.getDemand(demandId),
        demandsAPI.getProposals(demandId)
      ]);
      
      setDemand(demandData);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.detail || 'Erro ao carregar dados');
      navigate('/admin/parcerias/minhas');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposalId) => {
    if (!window.confirm('Tem certeza que deseja ACEITAR esta proposta? A demanda será marcada como "Em Negociação".')) {
      return;
    }

    try {
      setActionLoading(true);
      await demandsAPI.acceptProposal(proposalId);
      toast.success('Proposta aceita com sucesso!', {
        description: 'O corretor ofertante foi notificado.'
      });
      fetchData();
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error(error.response?.data?.detail || 'Erro ao aceitar proposta');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (proposalId) => {
    if (!window.confirm('Tem certeza que deseja REJEITAR esta proposta?')) {
      return;
    }

    try {
      setActionLoading(true);
      await demandsAPI.rejectProposal(proposalId);
      toast.success('Proposta rejeitada');
      fetchData();
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error(error.response?.data?.detail || 'Erro ao rejeitar proposta');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid gap-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-lg h-48"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/parcerias/minhas')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar às Minhas Demandas
        </Button>

        {/* Demand Summary */}
        {demand && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Home className="text-blue-600" size={24} />
                {demand.tipo_imovel} em {demand.bairros_interesse.join(', ')}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-4 text-base">
                <span className="flex items-center gap-1">
                  <DollarSign size={16} className="text-green-600" />
                  {formatCurrency(demand.valor_minimo)} - {formatCurrency(demand.valor_maximo)}
                </span>
                <Badge className="bg-green-100 text-green-800">
                  {demand.comissao_parceiro}% comissão
                </Badge>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Propostas Recebidas ({proposals.length})
          </h1>
          <p className="text-gray-600 mt-1">
            Analise as propostas e escolha a melhor para seu cliente
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{pendingProposals.length}</p>
              <p className="text-sm text-yellow-600">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-700">{acceptedProposals.length}</p>
              <p className="text-sm text-green-600">Aceitas</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-red-700">{rejectedProposals.length}</p>
              <p className="text-sm text-red-600">Rejeitadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Ainda não há propostas para esta demanda.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Aguarde, corretores serão notificados automaticamente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pending First */}
            {pendingProposals.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="text-yellow-600" size={18} />
                  Aguardando sua análise ({pendingProposals.length})
                </h3>
                <div className="space-y-4">
                  {pendingProposals.map(proposal => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Accepted */}
            {acceptedProposals.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={18} />
                  Propostas Aceitas ({acceptedProposals.length})
                </h3>
                <div className="space-y-4">
                  {acceptedProposals.map(proposal => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {rejectedProposals.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <XCircle className="text-red-600" size={18} />
                  Propostas Rejeitadas ({rejectedProposals.length})
                </h3>
                <div className="space-y-4 opacity-60">
                  {rejectedProposals.map(proposal => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      loading={actionLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VerPropostas;
