import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  CheckSquare, 
  AlertCircle, 
  Plus, 
  Search, 
  ChevronRight, 
  Download, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowLeft,
  Printer,
  Trash2,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from './lib/utils';

// Shadcn UI Imports
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Types ---
interface Client {
  id: number;
  name: string;
  cpf: string;
  status: string;
  payment_status: string;
  email?: string;
  phone?: string;
  has_password?: boolean;
}

interface ChecklistItem {
  id: number;
  item_name: string;
  is_completed: number;
}

interface Payment {
  id: number;
  amount: number;
  date: string;
  method: string;
}

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Pendente': 'bg-gray-100 text-gray-700 border-gray-200',
    'Em Preenchimento': 'bg-blue-100 text-blue-700 border-blue-200',
    'Entregue': 'bg-green-100 text-green-700 border-green-200',
    'Malha Fina': 'bg-red-100 text-red-700 border-red-200',
    'Processada': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Pago': 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", colors[status] || colors['Pendente'])}>
      {status}
    </span>
  );
};

const Sidebar = () => {
  const location = window.location.pathname;
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: DollarSign, label: 'Financeiro', path: '/finance' },
    { icon: CheckSquare, label: 'Serviços', path: '/services' },
  ];

  return (
    <div className="w-64 bg-zinc-950 text-zinc-400 h-screen fixed left-0 top-0 flex flex-col border-r border-zinc-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">IR</div>
        <span className="text-white font-semibold tracking-tight">Master Pro</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
              location === item.path 
                ? "bg-zinc-900 text-white" 
                : "hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <item.icon size={18} className={cn(location === item.path ? "text-emerald-500" : "group-hover:text-emerald-400")} />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-900 rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Prazo Final</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-bold">31 Mai 2026</span>
            <span className="text-emerald-500 text-xs font-medium">65 dias</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Pages ---

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [financeStats, setFinanceStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(setStats);
    fetch('/api/finance/stats').then(res => res.json()).then(data => setFinanceStats(data));
  }, []);

  if (!stats || !financeStats) return <div className="p-8">Carregando...</div>;

  const statusChartData = [
    { name: 'Entregues', value: stats.delivered },
    { name: 'Pendentes', value: stats.totalClients - stats.delivered },
    { name: 'Malha Fina', value: stats.malhaFina },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Visão Geral</h1>
          <p className="text-zinc-500">Acompanhe o desempenho do seu escritório em tempo real.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/clients')} variant="outline" className="gap-2">
            Ver Todos Clientes
          </Button>
          <Button onClick={() => navigate('/finance')} className="gap-2 bg-zinc-900 hover:bg-zinc-800">
            Módulo Financeiro
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total de Clientes', value: stats.totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12% este mês' },
          { label: 'Declarações Entregues', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `${((stats.delivered / (stats.totalClients || 1)) * 100).toFixed(0)}% do total` },
          { label: 'Total Recebido', value: `R$ ${financeStats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Honorários confirmados' },
          { label: 'Em Malha Fina', value: stats.malhaFina, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', trend: 'Atenção necessária' },
        ].map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.label} 
          >
            <Card className="border-none shadow-sm overflow-hidden relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">{card.label}</CardTitle>
                <div className={cn("p-2 rounded-md", card.bg, card.color)}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-[10px] text-zinc-400 mt-1 font-medium">{card.trend}</p>
              </CardContent>
              <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-20", card.bg.replace('bg-', 'bg-'))} />
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Status das Declarações</CardTitle>
            <CardDescription>Distribuição por estágio de entrega.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {statusChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-zinc-600">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição por Serviço</CardTitle>
            <CardDescription>Volume de clientes por modalidade contratada.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.serviceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip cursor={{ fill: '#f9f9f9' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Clientes Recentes</CardTitle>
              <CardDescription>Últimos cadastros realizados no sistema.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>Ver todos</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentClients.map((client: any) => (
                <div 
                  key={client.id} 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer border border-transparent hover:border-zinc-100"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{client.name}</p>
                      <p className="text-[10px] text-zinc-400">{format(new Date(client.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  </div>
                  <StatusBadge status={client.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Vencimentos</CardTitle>
            <CardDescription>Ações prioritárias para os próximos dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.deadlines && stats.deadlines.length > 0 ? (
                stats.deadlines.map((client: any) => {
                  let task = 'Acompanhamento';
                  let priority = 'Low';
                  
                  if (client.status === 'Pendente') {
                    task = 'Entrega Documentos';
                    priority = 'High';
                  } else if (client.status === 'Em Preenchimento') {
                    task = 'Revisão Final';
                    priority = 'Medium';
                  } else if (client.status === 'Malha Fina') {
                    task = 'Regularização';
                    priority = 'High';
                  }

                  // Simulate a deadline date (e.g., 10 days after creation)
                  const deadlineDate = new Date(client.created_at);
                  deadlineDate.setDate(deadlineDate.getDate() + 15);

                  return (
                    <div 
                      key={client.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100 transition-colors"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-1.5 h-8 rounded-full",
                          priority === 'High' ? "bg-red-500" : priority === 'Medium' ? "bg-amber-500" : "bg-blue-500"
                        )} />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{client.name}</p>
                          <p className="text-xs text-zinc-500">{task}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-zinc-900">{format(deadlineDate, 'dd MMM', { locale: ptBR })}</p>
                        <p className="text-[10px] text-zinc-400">
                          {Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0 
                            ? `Restam ${Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias`
                            : 'Vencido'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-zinc-400 italic text-sm">
                  Nenhum vencimento pendente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ 
    name: '', 
    cpf: '', 
    email: '', 
    phone: '', 
    gov_password: '', 
    service_type_id: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    pix_key: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(setClients);
    fetch('/api/service-types').then(res => res.json()).then(setServiceTypes);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpf.includes(searchTerm)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    });
    if (res.ok) {
      const data = await res.json();
      navigate(`/clients/${data.id}`);
    }
  };

  const exportReport = () => {
    const doc = new jsPDF();
    doc.text('Relatório Consolidado de Clientes - IR 2026', 14, 15);
    
    const tableData = clients.map(c => [c.name, c.cpf, c.status, c.payment_status]);
    
    autoTable(doc, {
      head: [['Nome', 'CPF', 'Status Declaração', 'Status Pagamento']],
      body: tableData,
      startY: 25,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    doc.save('relatorio-clientes-ir.pdf');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Clientes</h1>
          <p className="text-zinc-500">Gerencie sua base de clientes e status de entrega.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/services')} className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Serviços
          </Button>
          <Button variant="outline" onClick={exportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <Search className="h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por nome ou CPF..." 
            className="border-none focus-visible:ring-0 shadow-none h-auto py-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50">
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Status Declaração</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow 
                key={client.id} 
                className="cursor-pointer hover:bg-zinc-50/50"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="font-mono text-zinc-500">{client.cpf}</TableCell>
                <TableCell>
                  <StatusBadge status={client.status} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={client.payment_status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-zinc-500 italic">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Novo Cliente */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-xl font-bold">Cadastrar Novo Cliente</h2>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      required
                      value={newClient.name}
                      onChange={e => setNewClient({...newClient, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input 
                      required
                      placeholder="000.000.000-00"
                      value={newClient.cpf}
                      onChange={e => setNewClient({...newClient, cpf: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Tipo de Serviço</Label>
                    <select 
                      required
                      value={newClient.service_type_id}
                      onChange={e => setNewClient({...newClient, service_type_id: e.target.value})}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecione um serviço...</option>
                      {serviceTypes.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - R$ {s.base_value.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Senha Gov.br (Criptografada)</Label>
                    <Input 
                      type="password" 
                      value={newClient.gov_password}
                      onChange={e => setNewClient({...newClient, gov_password: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 pt-4 border-t border-zinc-100">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-3">Dados Bancários (Opcional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Banco</Label>
                        <Input 
                          placeholder="Ex: Nubank"
                          value={newClient.bank_name}
                          onChange={e => setNewClient({...newClient, bank_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Chave PIX</Label>
                        <Input 
                          placeholder="CPF, E-mail ou Celular"
                          value={newClient.pix_key}
                          onChange={e => setNewClient({...newClient, pix_key: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Agência</Label>
                        <Input 
                          placeholder="0001"
                          value={newClient.bank_agency}
                          onChange={e => setNewClient({...newClient, bank_agency: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Conta</Label>
                        <Input 
                          placeholder="00000-0"
                          value={newClient.bank_account}
                          onChange={e => setNewClient({...newClient, bank_account: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Salvar Cliente
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(res => res.json()).then(setClient);
    fetch('/api/service-types').then(res => res.json()).then(setServiceTypes);
  }, [id]);

  const handleEdit = () => {
    setEditData({
      name: client.name,
      cpf: client.cpf,
      email: client.email || '',
      phone: client.phone || '',
      gov_password: '', 
      service_type_id: client.service_type_id,
      bank_name: client.bank_name || '',
      bank_agency: client.bank_agency || '',
      bank_account: client.bank_account || '',
      pix_key: client.pix_key || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToUpdate = { ...editData };
    if (!dataToUpdate.gov_password) delete dataToUpdate.gov_password;

    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToUpdate)
    });

    if (res.ok) {
      setIsEditModalOpen(false);
      fetch(`/api/clients/${id}`).then(res => res.json()).then(setClient);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      navigate('/clients');
    }
  };

  const toggleChecklist = async (itemId: number, currentStatus: number) => {
    await fetch(`/api/clients/${id}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, is_completed: !currentStatus })
    });
    // Refresh
    fetch(`/api/clients/${id}`).then(res => res.json()).then(setClient);
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetch(`/api/clients/${id}`).then(res => res.json()).then(setClient);
  };

  const handleRevealPassword = async () => {
    if (!showPassword) {
      const res = await fetch(`/api/clients/${id}/password`);
      const data = await res.json();
      setDecryptedPassword(data.password);
    }
    setShowPassword(!showPassword);
  };

  const generateReceipt = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text('RECIBO DE PAGAMENTO', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('IR Master Pro - Gestão Tributária', 105, 40, { align: 'center' });
    
    // Content
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text(`Recebemos de ${client.name}`, 20, 60);
    doc.text(`CPF: ${client.cpf}`, 20, 70);
    doc.text(`A importância de R$ 250,00`, 20, 80);
    doc.text(`Referente a: Honorários Profissionais - IRPF 2026`, 20, 90);
    
    // Footer
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 120);
    doc.line(20, 150, 100, 150);
    doc.text('Assinatura do Responsável', 20, 155);
    
    doc.save(`recibo-${client.name}.pdf`);
  };

  if (!client) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/clients')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Editar Dados
          </Button>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
          <Button variant="outline" onClick={generateReceipt} className="gap-2">
            <Printer className="h-4 w-4" />
            Gerar Recibo
          </Button>
          <select 
            value={client.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Pendente">Pendente</option>
            <option value="Em Preenchimento">Em Preenchimento</option>
            <option value="Entregue">Entregue</option>
            <option value="Malha Fina">Malha Fina</option>
            <option value="Processada">Processada</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>Dados cadastrais e acesso Gov.br.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-zinc-400">Nome</Label>
                  <p className="text-sm font-medium">{client.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400">CPF</Label>
                  <p className="text-sm font-medium font-mono">{client.cpf}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400">E-mail</Label>
                  <p className="text-sm font-medium">{client.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400">Telefone</Label>
                  <p className="text-sm font-medium">{client.phone || '-'}</p>
                </div>
                <div className="col-span-2 p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-zinc-400">Senha Gov.br</Label>
                    <p className="text-sm font-mono text-zinc-900">
                      {showPassword ? decryptedPassword : '••••••••••••'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleRevealPassword}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Checklist de Documentos</CardTitle>
                <CardDescription>Acompanhe a entrega dos documentos necessários.</CardDescription>
              </div>
              <Badge variant="secondary">
                {client.checklist.filter((i: any) => i.is_completed).length} de {client.checklist.length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {client.checklist.map((item: ChecklistItem) => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleChecklist(item.id, item.is_completed)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer group border border-transparent hover:border-zinc-100"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                      item.is_completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 group-hover:border-emerald-500"
                    )}>
                      {item.is_completed && <CheckSquare className="h-3.5 w-3.5" />}
                    </div>
                    <span className={cn("text-sm transition-colors", item.is_completed ? "text-zinc-400 line-through" : "text-zinc-700")}>
                      {item.item_name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Dados Bancários */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Bancários</CardTitle>
              <CardDescription>Informações para restituição ou pagamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Banco</Label>
                  <p className="text-sm font-medium">{client.bank_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Chave PIX</Label>
                  <p className="text-sm font-medium">{client.pix_key || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Agência</Label>
                  <p className="text-sm font-medium">{client.bank_agency || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Conta</Label>
                  <p className="text-sm font-medium">{client.bank_account || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>Status de honorários.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Status Atual</span>
                <StatusBadge status={client.payment_status} />
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Honorários ({client.service_name || 'Geral'})</p>
                <p className="text-2xl font-bold text-emerald-700">R$ {(client.service_value || 250).toFixed(2)}</p>
              </div>
              <Button 
                className="w-full bg-zinc-900 hover:bg-zinc-800"
                onClick={async () => {
                  await fetch(`/api/clients/${id}/payments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: client.service_value || 250, method: 'PIX' })
                  });
                  fetch(`/api/clients/${id}`).then(res => res.json()).then(setClient);
                }}
              >
                Marcar como Pago
              </Button>
            </CardContent>
          </Card>

          {/* Histórico de Status (Simulado) */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
              <CardDescription>Linha do tempo da declaração.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { status: 'Processada', date: '2026-02-20' },
                  { status: 'Entregue', date: '2026-02-15' },
                  { status: 'Em Preenchimento', date: '2026-02-10' },
                ].map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-zinc-300" />
                      {i < 2 && <div className="w-px h-full bg-zinc-200" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-semibold text-zinc-900">{h.status}</p>
                      <p className="text-[10px] text-zinc-400">{format(new Date(h.date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Editar Cliente */}
      <AnimatePresence>
        {isEditModalOpen && editData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-xl font-bold">Editar Dados do Cliente</h2>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      required
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input 
                      required
                      value={editData.cpf}
                      onChange={e => setEditData({...editData, cpf: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={editData.phone}
                      onChange={e => setEditData({...editData, phone: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>E-mail</Label>
                    <Input 
                      type="email"
                      value={editData.email}
                      onChange={e => setEditData({...editData, email: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Tipo de Serviço</Label>
                    <select 
                      required
                      value={editData.service_type_id}
                      onChange={e => setEditData({...editData, service_type_id: e.target.value})}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecione um serviço...</option>
                      {serviceTypes.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - R$ {s.base_value.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Senha Gov.br (Deixe em branco para não alterar)</Label>
                    <Input 
                      type="password" 
                      value={editData.gov_password}
                      onChange={e => setEditData({...editData, gov_password: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 pt-4 border-t border-zinc-100">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-3">Dados Bancários</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Banco</Label>
                        <Input 
                          value={editData.bank_name}
                          onChange={e => setEditData({...editData, bank_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Chave PIX</Label>
                        <Input 
                          value={editData.pix_key}
                          onChange={e => setEditData({...editData, pix_key: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Agência</Label>
                        <Input 
                          value={editData.bank_agency}
                          onChange={e => setEditData({...editData, bank_agency: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Conta</Label>
                        <Input 
                          value={editData.bank_account}
                          onChange={e => setEditData({...editData, bank_account: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Atualizar Dados
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Confirmação Exclusão */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Excluir Cliente?</h2>
                  <p className="text-zinc-500 mt-2">
                    Esta ação não pode ser desfeita. Todos os dados de <strong>{client.name}</strong> serão removidos permanentemente.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDelete}
                  >
                    Confirmar Exclusão
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FinanceModule = () => {
  const location = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newService, setNewService] = useState({ name: '', base_value: '' });
  const [editingService, setEditingService] = useState<any>(null);

  const defaultTab = location.pathname === '/services' ? 'services' : 'history';

  useEffect(() => {
    fetch('/api/finance/stats').then(res => res.json()).then(setStats);
    fetch('/api/payments').then(res => res.json()).then(setPayments);
    fetch('/api/service-types').then(res => res.json()).then(setServiceTypes);
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingService ? 'PATCH' : 'POST';
    const url = editingService ? `/api/service-types/${editingService.id}` : '/api/service-types';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newService, base_value: parseFloat(newService.base_value) })
    });
    
    if (res.ok) {
      const updatedServices = await fetch('/api/service-types').then(r => r.json());
      setServiceTypes(updatedServices);
      setNewService({ name: '', base_value: '' });
      setEditingService(null);
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setNewService({ name: service.name, base_value: service.base_value.toString() });
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    const res = await fetch(`/api/service-types/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setServiceTypes(serviceTypes.filter(s => s.id !== id));
    }
  };

  const filteredPayments = payments.filter(p => 
    p.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportFinancialReport = () => {
    const doc = new jsPDF();
    doc.text('Relatório Financeiro Consolidado - IR 2026', 14, 15);
    
    const tableData = payments.map(p => [
      p.client_name, 
      `R$ ${p.amount.toFixed(2)}`, 
      format(new Date(p.date), 'dd/MM/yyyy'), 
      p.method
    ]);
    
    autoTable(doc, {
      head: [['Cliente', 'Valor', 'Data', 'Método']],
      body: tableData,
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    const total = payments.reduce((acc, p) => acc + p.amount, 0);
    doc.text(`Total Recebido: R$ ${total.toFixed(2)}`, 14, (doc as any).lastAutoTable.finalY + 10);
    
    doc.save('relatorio-financeiro-ir.pdf');
  };

  if (!stats) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Financeiro</h1>
          <p className="text-zinc-500">Gestão de honorários, recebimentos e projeções.</p>
        </div>
        <Button onClick={exportFinancialReport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-600 font-medium">Total Recebido</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-700">
              R$ {stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-emerald-600/70">
              <CheckCircle2 className="h-3 w-3" />
              <span>{payments.length} pagamentos confirmados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-600 font-medium">Previsão Pendente</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-700">
              R$ {stats.estimatedPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-amber-600/70">
              <Clock className="h-3 w-3" />
              <span>{stats.pendingCount} clientes aguardando</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Ticket Médio</CardDescription>
            <CardTitle className="text-3xl font-bold text-zinc-900">R$ 250,00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <DollarSign className="h-3 w-3" />
              <span>Valor base por declaração</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="history">Histórico de Recebimentos</TabsTrigger>
            <TabsTrigger value="services">Tipos de Serviços</TabsTrigger>
            <TabsTrigger value="pending">Pendências</TabsTrigger>
          </TabsList>
          
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="history">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.client_name}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">R$ {payment.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-zinc-500">{format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-zinc-500">{payment.method}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pago</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-zinc-500 italic">
                      Nenhum pagamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Serviços Cadastrados</CardTitle>
                <CardDescription>Gerencie os tipos de declarações e seus valores base.</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Serviço</TableHead>
                    <TableHead>Valor Base</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceTypes.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">R$ {service.base_value.toFixed(2)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-zinc-400 hover:text-zinc-600"
                          onClick={() => handleEditService(service)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</CardTitle>
                <CardDescription>
                  {editingService ? 'Atualize os dados do serviço selecionado.' : 'Adicione uma nova modalidade de honorário.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddService} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Serviço</Label>
                    <Input 
                      required
                      placeholder="Ex: IRPF Espólio"
                      value={newService.name}
                      onChange={e => setNewService({...newService, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Base (R$)</Label>
                    <Input 
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newService.base_value}
                      onChange={e => setNewService({...newService, base_value: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingService && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setEditingService(null);
                          setNewService({ name: '', base_value: '' });
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-12 w-12 text-zinc-200" />
              <h3 className="text-lg font-semibold text-zinc-900">Lista de Pendências</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                Esta funcionalidade permitirá visualizar todos os clientes que ainda não pagaram e enviar lembretes automáticos.
              </p>
              <Button variant="outline" className="mt-4" disabled>
                Em breve
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/finance" element={<FinanceModule />} />
            <Route path="/services" element={<FinanceModule />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
