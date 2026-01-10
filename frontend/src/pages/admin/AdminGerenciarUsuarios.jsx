import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  ArrowLeft, UserCheck, UserX, Pause, Trash2, Filter, UserPlus, X, RefreshCw, 
  Edit, Save, Eye, Phone, Mail, MapPin, Building2, CreditCard
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { adminAPIService } from '../../services/adminAPI';
import { toast } from 'sonner';

const states = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

const AdminGerenciarUsuarios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    user_type: 'particular',
    city: '',
    state: 'MS',
    cpf: '',
    creci: ''
  });

  useEffect(() => {
    if (user?.user_type !== 'admin' && user?.user_type !== 'admin_senior') {
      toast.error('Acesso negado');
      navigate('/');
      return;
    }
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [filter, user, navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminAPIService.getUsers(filter || undefined);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminAPIService.updateUser(userId, { status: newStatus });
      toast.success(`Status alterado para ${newStatus}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar status');
    }
  };

  const confirmDeleteUser = (userId, userName) => {
    if (window.confirm(`Tem certeza que deseja EXCLUIR o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      deleteUser(userId);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await adminAPIService.deleteUser(userId);
      toast.success('Usuário excluído');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir usuário');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPIService.createUser(newUserData);
      toast.success('Usuário criado com sucesso!');
      setShowAddModal(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        phone: '',
        user_type: 'particular',
        city: '',
        state: 'MS',
        cpf: '',
        creci: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = async (userToEdit) => {
    setSelectedUser(userToEdit);
    setEditFormData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      cpf: userToEdit.cpf || '',
      city: userToEdit.city || '',
      state: userToEdit.state || 'MS',
      user_type: userToEdit.user_type || 'particular',
      status: userToEdit.status || 'active',
      plan_type: userToEdit.plan_type || 'free',
      creci: userToEdit.creci || '',
      company: userToEdit.company || '',
      cnpj: userToEdit.cnpj || '',
      razao_social: userToEdit.razao_social || '',
      bio: userToEdit.bio || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPIService.updateUser(selectedUser.id, editFormData);
      toast.success('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const getUserTypeBadge = (type) => {
    const config = {
      particular: { label: 'Particular', className: 'bg-gray-100 text-gray-700' },
      corretor: { label: 'Corretor', className: 'bg-blue-100 text-blue-700' },
      imobiliaria: { label: 'Imobiliária', className: 'bg-purple-100 text-purple-700' },
      admin: { label: 'Admin', className: 'bg-red-100 text-red-700' },
      admin_senior: { label: 'Admin Sênior', className: 'bg-orange-100 text-orange-700' }
    };
    const c = config[type] || config.particular;
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${c.className}`}>{c.label}</span>;
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      paused: { label: 'Pausado', className: 'bg-orange-100 text-orange-700' },
      deleted: { label: 'Excluído', className: 'bg-red-100 text-red-700' }
    };
    const c = config[status] || config.active;
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${c.className}`}>{c.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link to="/admin/master">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
                <p className="text-red-100 text-sm">Administração de todos os usuários da plataforma</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchUsers} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <RefreshCw size={18} />
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="bg-white text-red-600 hover:bg-gray-100">
                <UserPlus size={18} className="mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter size={20} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filtrar por tipo:</span>
            <div className="flex gap-2 flex-wrap">
              {['', 'particular', 'corretor', 'imobiliaria', 'admin_senior'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filter === type
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === '' ? 'Todos' : 
                   type === 'particular' ? 'Particular' : 
                   type === 'corretor' ? 'Corretor' : 
                   type === 'imobiliaria' ? 'Imobiliária' : 'Admin Sênior'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-bold text-lg">Usuários Cadastrados ({users.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plano</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Imóveis</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                      <td className="px-4 py-3">{getUserTypeBadge(u.user_type)}</td>
                      <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.plan_type === 'lifetime' ? 'bg-purple-100 text-purple-700' :
                          u.plan_type === 'anual' ? 'bg-blue-100 text-blue-700' :
                          u.plan_type === 'trimestral' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.plan_type || 'free'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">{u.properties_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar Usuário"
                          >
                            <Edit size={16} />
                          </button>
                          {/* Status Buttons */}
                          {u.status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(u.id, 'active')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Ativar"
                            >
                              <UserCheck size={16} />
                            </button>
                          )}
                          {u.status !== 'paused' && u.user_type !== 'admin' && (
                            <button
                              onClick={() => handleStatusChange(u.id, 'paused')}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                              title="Pausar"
                            >
                              <Pause size={16} />
                            </button>
                          )}
                          {/* Delete Button */}
                          {u.user_type !== 'admin' && (
                            <button
                              onClick={() => confirmDeleteUser(u.id, u.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>Preencha os dados para criar um novo usuário</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Senha *</Label>
                <Input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={newUserData.cpf}
                  onChange={(e) => setNewUserData({...newUserData, cpf: e.target.value})}
                />
              </div>
              <div>
                <Label>Tipo de Usuário *</Label>
                <select
                  value={newUserData.user_type}
                  onChange={(e) => setNewUserData({...newUserData, user_type: e.target.value})}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="particular">Particular</option>
                  <option value="corretor">Corretor</option>
                  <option value="imobiliaria">Imobiliária</option>
                  <option value="admin_senior">Admin Sênior</option>
                </select>
              </div>
              <div>
                <Label>Estado</Label>
                <select
                  value={newUserData.state}
                  onChange={(e) => setNewUserData({...newUserData, state: e.target.value})}
                  className="w-full border rounded-md p-2"
                >
                  {states.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Label>Cidade</Label>
                <Input
                  value={newUserData.city}
                  onChange={(e) => setNewUserData({...newUserData, city: e.target.value})}
                />
              </div>
              {(newUserData.user_type === 'corretor' || newUserData.user_type === 'imobiliaria') && (
                <div className="col-span-2">
                  <Label>CRECI</Label>
                  <Input
                    value={newUserData.creci}
                    onChange={(e) => setNewUserData({...newUserData, creci: e.target.value})}
                    placeholder="Ex: CRECI 12345/MS"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={20} />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Editando: {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Dados Pessoais */}
              <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Eye size={16} /> Dados Pessoais
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Nome Completo</Label>
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={editFormData.cpf}
                      onChange={(e) => setEditFormData({...editFormData, cpf: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Localização
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <select
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                      className="w-full border rounded-md p-2"
                    >
                      {states.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tipo e Status */}
              <div className="col-span-2 bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard size={16} /> Tipo, Status e Plano
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Tipo de Usuário</Label>
                    <select
                      value={editFormData.user_type}
                      onChange={(e) => setEditFormData({...editFormData, user_type: e.target.value})}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="particular">Particular</option>
                      <option value="corretor">Corretor</option>
                      <option value="imobiliaria">Imobiliária</option>
                      <option value="admin_senior">Admin Sênior</option>
                      <option value="admin">Admin Master</option>
                    </select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="active">Ativo</option>
                      <option value="pending">Pendente</option>
                      <option value="paused">Pausado</option>
                      <option value="deleted">Excluído</option>
                    </select>
                  </div>
                  <div>
                    <Label>Plano</Label>
                    <select
                      value={editFormData.plan_type}
                      onChange={(e) => setEditFormData({...editFormData, plan_type: e.target.value})}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="free">Free</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="anual">Anual</option>
                      <option value="lifetime">Vitalício</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dados Profissionais (Corretor/Imobiliária) */}
              {(editFormData.user_type === 'corretor' || editFormData.user_type === 'imobiliaria') && (
                <div className="col-span-2 bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 size={16} /> Dados Profissionais
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>CRECI</Label>
                      <Input
                        value={editFormData.creci}
                        onChange={(e) => setEditFormData({...editFormData, creci: e.target.value})}
                        placeholder="Ex: CRECI 12345/MS"
                      />
                    </div>
                    <div>
                      <Label>Empresa/Imobiliária</Label>
                      <Input
                        value={editFormData.company}
                        onChange={(e) => setEditFormData({...editFormData, company: e.target.value})}
                      />
                    </div>
                    {editFormData.user_type === 'imobiliaria' && (
                      <>
                        <div>
                          <Label>CNPJ</Label>
                          <Input
                            value={editFormData.cnpj}
                            onChange={(e) => setEditFormData({...editFormData, cnpj: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Razão Social</Label>
                          <Input
                            value={editFormData.razao_social}
                            onChange={(e) => setEditFormData({...editFormData, razao_social: e.target.value})}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              <div className="col-span-2">
                <Label>Bio / Descrição</Label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                  className="w-full border rounded-md p-2 h-20"
                  placeholder="Descrição do usuário..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminGerenciarUsuarios;
