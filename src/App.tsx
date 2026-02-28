import React, { useState, useEffect, useRef } from 'react';
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
  Edit,
  Bell,
  Info,
  X,
  ChevronLeft,
  Lightbulb,
  Camera
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
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
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

const BrandIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
    <motion.div 
      animate={{ rotate: [0, 5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20" 
    />
    <div className="relative z-10 text-white">
      <FileText size={size * 0.6} strokeWidth={2.5} />
    </div>
    <div className="absolute -bottom-1 -right-1 w-1/2 h-1/2 bg-zinc-950 rounded-lg flex items-center justify-center border border-zinc-800">
      <CheckCircle2 size={size * 0.3} className="text-emerald-400" strokeWidth={3} />
    </div>
  </div>
);

const NotificationSystem = ({ clients }: { clients: Client[] }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const alerts = [];
    // Check for pending payments
    const pendingPayments = clients.filter(c => c.payment_status === 'Pendente');
    if (pendingPayments.length > 0) {
      alerts.push({
        id: 'payments',
        title: 'Pagamentos Pendentes',
        message: `Existem ${pendingPayments.length} clientes com honorários em aberto.`,
        type: 'warning',
        icon: DollarSign
      });
    }

    // Check for Malha Fina
    const malhaFina = clients.filter(c => c.status === 'Malha Fina');
    if (malhaFina.length > 0) {
      alerts.push({
        id: 'malha',
        title: 'Alerta de Malha Fina',
        message: `${malhaFina.length} declarações precisam de retificação urgente.`,
        type: 'error',
        icon: AlertCircle
      });
    }

    setNotifications(alerts);
  }, [clients]);

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative rounded-xl hover:bg-zinc-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-zinc-600" />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-50 bg-zinc-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Notificações</h3>
                <Badge variant="outline" className="text-[10px] font-bold">{notifications.length}</Badge>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className="p-4 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        n.type === 'warning' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                      )}>
                        <n.icon size={16} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-900">{n.title}</p>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-zinc-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium italic">Tudo em dia por aqui!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('ir_master_onboarding');
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      title: "Bem-vindo ao IR Master",
      description: "Sua plataforma definitiva para gestão de Imposto de Renda. Vamos conhecer as principais funcionalidades?",
      icon: LayoutDashboard,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      title: "Gestão de Clientes",
      description: "Cadastre clientes, gerencie documentos e acompanhe o status de cada declaração em tempo real.",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Controle Financeiro",
      description: "Acompanhe honorários, gere recibos e tenha uma visão clara da saúde financeira do seu escritório.",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      title: "Alertas Inteligentes",
      description: "Fique por dentro de prazos, malha fina e pagamentos pendentes com nosso sistema de notificações.",
      icon: Bell,
      color: "text-amber-500",
      bg: "bg-amber-50"
    }
  ];

  const handleFinish = () => {
    localStorage.setItem('ir_master_onboarding', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-8 text-center space-y-6">
          <div className={cn("w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg", steps[step].bg)}>
            {(() => {
              const StepIcon = steps[step].icon;
              return <StepIcon className={cn("h-10 w-10", steps[step].color)} />;
            })()}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{steps[step].title}</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">{steps[step].description}</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 py-2">
            {steps.map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === step ? "w-6 bg-emerald-500" : "w-1.5 bg-zinc-200")} />
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1 rounded-xl">
                Voltar
              </Button>
            )}
            <Button 
              className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold"
              onClick={() => step < steps.length - 1 ? setStep(step + 1) : handleFinish()}
            >
              {step < steps.length - 1 ? "Próximo" : "Começar Agora"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    'Pendente': 'bg-zinc-100 text-zinc-700 border-zinc-200',
    'Em Preenchimento': 'bg-blue-50 text-blue-700 border-blue-100',
    'Entregue': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Malha Fina': 'bg-red-50 text-red-700 border-red-100',
    'Processada': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Pago': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  const dots: Record<string, string> = {
    'Pendente': 'bg-zinc-400',
    'Em Preenchimento': 'bg-blue-500',
    'Entregue': 'bg-emerald-500',
    'Malha Fina': 'bg-red-500',
    'Processada': 'bg-emerald-600',
    'Pago': 'bg-emerald-500',
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200", 
      colors[status] || colors['Pendente']
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dots[status] || dots['Pendente'])} />
      {status}
    </span>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [accountantPhoto, setAccountantPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const savedPhoto = localStorage.getItem('ir_master_accountant_photo');
    if (savedPhoto) setAccountantPhoto(savedPhoto);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAccountantPhoto(base64String);
        localStorage.setItem('ir_master_accountant_photo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: DollarSign, label: 'Financeiro', path: '/finance' },
    { icon: CheckSquare, label: 'Serviços', path: '/services' },
  ];

  return (
    <div className="w-64 bg-zinc-950 text-zinc-400 h-screen fixed left-0 top-0 flex flex-col border-r border-zinc-800/50 z-50">
      <div className="p-8 flex items-center gap-3">
        <BrandIcon size={40} />
        <div>
          <span className="text-white font-bold tracking-tight block text-lg leading-tight">IR Master</span>
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Gestão Tributária</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-2 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-white/5 text-white" 
                  : "hover:bg-white/[0.02] hover:text-zinc-200"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full"
                />
              )}
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive ? "text-emerald-500" : "group-hover:text-emerald-400 transition-colors")} />
              <span className={cn("text-sm font-medium", isActive ? "font-semibold" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prazo IR 2026</p>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">65 dias</span>
          </div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-white font-bold text-sm">31 Mai</span>
            <span className="text-zinc-500 text-[10px]">66% concluído</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '66%' }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full" 
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 group/profile relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handlePhotoUpload}
          />
          <div 
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm shadow-inner overflow-hidden cursor-pointer relative group"
            onClick={() => fileInputRef.current?.click()}
          >
            {accountantPhoto ? (
              <img src={accountantPhoto} alt="Contador" className="w-full h-full object-cover" />
            ) : (
              "ES"
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={14} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Enio Silva</p>
            <p className="text-[10px] text-zinc-500 truncate">CRC 019130</p>
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
  const [clients, setClients] = useState<Client[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(setStats);
    fetch('/api/finance/stats').then(res => res.json()).then(data => setFinanceStats(data));
    fetch('/api/clients').then(res => res.json()).then(setClients);
  }, []);

  if (!stats || !financeStats) return <div className="p-8">Carregando...</div>;

  const statusChartData = [
    { name: 'Entregues', value: stats.delivered },
    { name: 'Pendentes', value: stats.totalClients - stats.delivered },
    { name: 'Malha Fina', value: stats.malhaFina },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Olá, Enio 👋</h1>
          <p className="text-zinc-500 mt-1">Aqui está o que está acontecendo no seu escritório hoje.</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationSystem clients={clients} />
          <div className="h-8 w-[1px] bg-zinc-200 mx-2 hidden md:block" />
          <div className="flex gap-3">
            <Button onClick={() => navigate('/clients')} variant="outline" className="gap-2 rounded-xl border-zinc-200 hover:bg-zinc-50">
              <Users className="h-4 w-4" />
              Base de Clientes
            </Button>
            <Button onClick={() => navigate('/finance')} className="gap-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <DollarSign className="h-4 w-4" />
              Gestão Financeira
            </Button>
          </div>
        </div>
      </header>

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-8 relative">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Lightbulb className="text-emerald-400 h-5 w-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Insights de Gestão</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Atenção Necessária</p>
                <p className="text-sm leading-relaxed">
                  Você tem <span className="text-emerald-400 font-bold">{clients.filter(c => c.status === 'Malha Fina').length} declarações</span> em malha fina. Recomendamos revisar as pendências antes do próximo lote.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Oportunidade Financeira</p>
                <p className="text-sm leading-relaxed">
                  Há <span className="text-emerald-400 font-bold">R$ {financeStats.pendingAmount?.toLocaleString('pt-BR')}</span> em honorários pendentes. Considere enviar lembretes automáticos para os clientes.
                </p>
              </div>
            </div>

            <Button variant="outline" className="bg-white/10 border-white/10 text-white hover:bg-white/20 rounded-xl font-bold">
              Ver Relatório Detalhado
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        </Card>

        <Card className="border-none shadow-sm rounded-3xl p-8 bg-emerald-50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-emerald-900/40 text-[10px] font-black uppercase tracking-widest">Meta de Entregas</p>
              <Badge className="bg-emerald-500 text-white border-none font-black">85%</Badge>
            </div>
            <h3 className="text-3xl font-black text-emerald-950 tracking-tight">Rumo ao Sucesso</h3>
            <p className="text-emerald-800/60 text-sm leading-relaxed">
              Você já entregou {stats.delivered} de {stats.totalClients} declarações. Faltam apenas {stats.totalClients - stats.delivered} para bater sua meta!
            </p>
          </div>
          <div className="pt-6">
            <div className="w-full bg-emerald-200 h-3 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                className="h-full bg-emerald-600 rounded-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Clientes', value: stats.totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12% este mês', description: 'Clientes ativos na base' },
          { label: 'Entregues', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `${((stats.delivered / (stats.totalClients || 1)) * 100).toFixed(0)}% concluído`, description: 'Declarações finalizadas' },
          { label: 'Receita Total', value: `R$ ${financeStats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Honorários confirmados', description: 'Total recebido no período' },
          { label: 'Malha Fina', value: stats.malhaFina, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', trend: 'Ação imediata', description: 'Pendências com a Receita' },
        ].map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.label} 
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{card.label}</CardTitle>
                <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300", card.bg, card.color)}>
                  <card.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tight text-zinc-900">{card.value}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", card.bg, card.color)}>
                    {card.trend}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">{card.description}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Status Chart */}
            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Status Geral</CardTitle>
                <CardDescription>Progresso das declarações 2026.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-zinc-900">{stats.totalClients}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-6">
                  {statusChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-xs font-semibold text-zinc-600">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{entry.value}</span>
                        <span className="text-[10px] text-zinc-400">({((entry.value / (stats.totalClients || 1)) * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Distribution */}
            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Volume por Serviço</CardTitle>
                  <CardDescription>Modalidades mais contratadas.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Clientes</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.serviceDistribution}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#888', fontWeight: 500 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#888', fontWeight: 500 }} 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f9f9f9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Clients */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Clientes Recentes</CardTitle>
                <CardDescription>Novos cadastros no sistema.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="text-emerald-600 font-bold text-xs hover:text-emerald-700 hover:bg-emerald-50 rounded-lg">
                Ver todos
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentClients.map((client: any) => (
                  <div 
                    key={client.id} 
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-zinc-100 group"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-sm font-black text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{client.name}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{format(new Date(client.created_at), "d 'de' MMM, HH:mm", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <StatusBadge status={client.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-3xl p-6 bg-zinc-950 text-white">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <Button onClick={() => navigate('/clients')} className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 text-white border-none rounded-xl h-12">
                <Plus className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold">Novo Cliente</span>
              </Button>
              <Button onClick={() => navigate('/finance')} className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 text-white border-none rounded-xl h-12">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold">Lançar Pagamento</span>
              </Button>
              <Button onClick={() => navigate('/services')} className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 text-white border-none rounded-xl h-12">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold">Configurar Serviços</span>
              </Button>
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Próximos Vencimentos</CardTitle>
              <CardDescription>Ações prioritárias.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.deadlines && stats.deadlines.length > 0 ? (
                  stats.deadlines.map((client: any) => {
                    let task = 'Acompanhamento';
                    let pColor = 'bg-blue-500';
                    
                    if (client.status === 'Pendente') {
                      task = 'Entrega Documentos';
                      pColor = 'bg-red-500';
                    } else if (client.status === 'Em Preenchimento') {
                      task = 'Revisão Final';
                      pColor = 'bg-amber-500';
                    } else if (client.status === 'Malha Fina') {
                      task = 'Regularização';
                      pColor = 'bg-red-500';
                    }

                    return (
                      <div 
                        key={client.id} 
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-zinc-100 group"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-1 h-8 rounded-full", pColor)} />
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{client.name}</p>
                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{task}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-zinc-400 italic text-xs">
                    Nenhum vencimento próximo
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl p-6 bg-emerald-600 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">Suporte Premium</p>
              <h4 className="text-lg font-black leading-tight">Precisa de ajuda com algum caso?</h4>
              <p className="text-emerald-100 text-xs leading-relaxed opacity-80">Nossa equipe de especialistas tributários está disponível para consultoria.</p>
              <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold mt-2">
                Falar com Especialista
              </Button>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          </Card>
        </div>
      </div>
    </div>
  );
};

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
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

  const handleUpdateStatus = async (clientId: number, status: string) => {
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetch('/api/clients').then(res => res.json()).then(setClients);
  };

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

  const handleDelete = async () => {
    if (!clientToDelete) return;
    const res = await fetch(`/api/clients/${clientToDelete.id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
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

  const exportCSV = () => {
    const headers = ['Nome', 'CPF', 'Status Declaração', 'Status Pagamento'];
    const rows = clients.map(c => [c.name, c.cpf, c.status, c.payment_status]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'clientes-ir-2026.csv');
  };

  const exportWord = () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "Relatório de Clientes - IR 2026",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nome", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CPF", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pagamento", bold: true })] })] }),
                ],
              }),
              ...clients.map(c => new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(c.name)] }),
                  new DocxTableCell({ children: [new Paragraph(c.cpf)] }),
                  new DocxTableCell({ children: [new Paragraph(c.status)] }),
                  new DocxTableCell({ children: [new Paragraph(c.payment_status)] }),
                ],
              }))
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "clientes-ir-2026.docx");
    });
  };

  return (
    <div className="p-10 space-y-8 max-w-[1600px] mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Clientes</h1>
          <p className="text-zinc-500 mt-1">Gerencie sua base de clientes e status de entrega.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/services')} className="gap-2 rounded-xl border-zinc-200">
            <CheckSquare className="h-4 w-4" />
            Serviços
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2 rounded-xl border-zinc-200 text-xs h-9">
              CSV
            </Button>
            <Button variant="outline" onClick={exportReport} className="gap-2 rounded-xl border-zinc-200 text-xs h-9">
              PDF
            </Button>
            <Button variant="outline" onClick={exportWord} className="gap-2 rounded-xl border-zinc-200 text-xs h-9">
              Word
            </Button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
        <div className="p-6 border-b border-zinc-100 flex items-center gap-4 bg-zinc-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Buscar por nome ou CPF..." 
              className="pl-10 bg-white border-zinc-200 rounded-xl h-11 focus-visible:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total:</span>
            <Badge variant="outline" className="bg-white text-zinc-900 font-bold border-zinc-200 rounded-lg px-2 py-1">
              {filteredClients.length}
            </Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-zinc-100">
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4 pl-6">Nome</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4">CPF</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4">Status Declaração</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4">Pagamento</TableHead>
              <TableHead className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4 pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow 
                key={client.id} 
                className="group cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                      {client.name.charAt(0)}
                    </div>
                    <span className="font-bold text-zinc-900">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-zinc-500 text-xs">{client.cpf}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <select 
                    value={client.status}
                    onChange={(e) => handleUpdateStatus(client.id, e.target.value)}
                    className="text-[11px] font-bold border-zinc-200 rounded-lg bg-white px-2.5 py-1.5 focus:ring-emerald-500 cursor-pointer shadow-sm hover:border-zinc-300 transition-colors"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Preenchimento">Em Preenchimento</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Malha Fina">Malha Fina</option>
                    <option value="Processada">Processada</option>
                  </select>
                </TableCell>
                <TableCell>
                  <StatusBadge status={client.payment_status} />
                </TableCell>
                <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-xl hover:bg-white hover:shadow-sm transition-all"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-all"
                      onClick={() => {
                        setClientToDelete(client);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-zinc-400 italic font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 opacity-20" />
                    Nenhum cliente encontrado.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Confirmação Exclusão */}
      <AnimatePresence>
        {isDeleteModalOpen && clientToDelete && (
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
                    Esta ação não pode ser desfeita. Todos os dados de <strong>{clientToDelete.name}</strong> serão removidos permanentemente.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setClientToDelete(null);
                    }}
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
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text('RECIBO DE PAGAMENTO', 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('IR Master Pro - Gestão Tributária', 105, 40, { align: 'center' });
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text(`Recebemos de ${client.name}`, 20, 60);
    doc.text(`CPF: ${client.cpf}`, 20, 70);
    doc.text(`A importância de R$ 250,00`, 20, 80);
    doc.text(`Referente a: Honorários Profissionais - IRPF 2026`, 20, 90);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 120);
    doc.line(20, 150, 100, 150);
    doc.text('Assinatura do Responsável', 20, 155);
    doc.save(`recibo-${client.name}.pdf`);
  };

  if (!client) return <div className="p-10">Carregando...</div>;

  return (
    <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Link to="/clients" className="hover:text-zinc-900 transition-colors">Clientes</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-900">Detalhes do Perfil</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl font-black text-zinc-500 shadow-sm">
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900">{client.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-zinc-500 font-mono text-sm">{client.cpf}</span>
                <StatusBadge status={client.status} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleEdit} className="gap-2 rounded-xl border-zinc-200">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)} className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 rounded-xl">
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
          <Button variant="outline" onClick={generateReceipt} className="gap-2 rounded-xl border-zinc-200">
            <Printer className="h-4 w-4" />
            Recibo
          </Button>
          <div className="h-10 w-px bg-zinc-100 mx-1" />
          <select 
            value={client.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold focus:ring-emerald-500 cursor-pointer shadow-sm"
          >
            <option value="Pendente">Pendente</option>
            <option value="Em Preenchimento">Em Preenchimento</option>
            <option value="Entregue">Entregue</option>
            <option value="Malha Fina">Malha Fina</option>
            <option value="Processada">Processada</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Informações Básicas */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
              <CardTitle className="text-lg font-bold">Dossiê do Cliente</CardTitle>
              <CardDescription>Dados cadastrais e credenciais de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nome Completo</Label>
                  <p className="text-sm font-bold text-zinc-900">{client.name}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Documento CPF</Label>
                  <p className="text-sm font-bold text-zinc-900 font-mono">{client.cpf}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">E-mail de Contato</Label>
                  <p className="text-sm font-bold text-zinc-900">{client.email || '-'}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Telefone / WhatsApp</Label>
                  <p className="text-sm font-bold text-zinc-900">{client.phone || '-'}</p>
                </div>
                <div className="col-span-1 md:col-span-2 p-5 bg-zinc-900 rounded-2xl flex items-center justify-between shadow-inner">
                  <div className="space-y-1">
                    <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Senha Gov.br</Label>
                    <p className="text-lg font-black text-white tracking-widest font-mono">
                      {showPassword ? decryptedPassword : '••••••••••••'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleRevealPassword}
                    className="text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-zinc-50/50 border-b border-zinc-100">
              <div>
                <CardTitle className="text-lg font-bold">Checklist de Documentos</CardTitle>
                <CardDescription>Controle de recebimento de arquivos.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Progresso:</span>
                <Badge className="bg-emerald-500 text-white font-black rounded-lg px-2.5 py-1">
                  {client.checklist.filter((i: any) => i.is_completed).length} / {client.checklist.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {client.checklist.map((item: ChecklistItem) => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleChecklist(item.id, item.is_completed)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer border group",
                      item.is_completed 
                        ? "bg-emerald-50/50 border-emerald-100/50" 
                        : "bg-zinc-50/50 border-zinc-100/50 hover:bg-white hover:shadow-md hover:border-white"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all duration-300",
                      item.is_completed 
                        ? "bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" 
                        : "border-zinc-200 bg-white group-hover:border-emerald-500"
                    )}>
                      {item.is_completed && <CheckSquare className="h-4 w-4" strokeWidth={3} />}
                    </div>
                    <span className={cn(
                      "text-sm font-bold transition-all duration-300", 
                      item.is_completed ? "text-emerald-700/50 line-through" : "text-zinc-700"
                    )}>
                      {item.item_name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-10">
          {/* Status Financeiro */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-emerald-600 text-white">
              <CardTitle className="text-lg font-bold">Financeiro</CardTitle>
              <CardDescription className="text-emerald-100">Gestão de honorários.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status de Pagamento</span>
                <StatusBadge status={client.payment_status} />
              </div>
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Valor do Serviço ({client.service_name || 'Geral'})</p>
                <p className="text-4xl font-black text-zinc-900">R$ {(client.service_value || 250).toFixed(2)}</p>
              </div>
              <Button 
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-sm transition-all duration-300 shadow-lg",
                  client.payment_status === 'Pago' 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" 
                    : "bg-zinc-950 hover:bg-zinc-800 text-white shadow-zinc-950/20"
                )}
                onClick={async () => {
                  await fetch(`/api/clients/${id}/payments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: client.service_value || 250, method: 'PIX' })
                  });
                  fetch(`/api/clients/${id}`).then(res => res.json()).then(setClient);
                }}
              >
                {client.payment_status === 'Pago' ? 'Pagamento Confirmado' : 'Marcar como Pago'}
              </Button>
            </CardContent>
          </Card>

          {/* Dados Bancários */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
              <CardTitle className="text-lg font-bold">Dados Bancários</CardTitle>
              <CardDescription>Para restituição ou repasses.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Instituição</Label>
                  <p className="text-sm font-bold text-zinc-900">{client.bank_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Chave PIX</Label>
                  <p className="text-sm font-bold text-zinc-900 truncate">{client.pix_key || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Agência</Label>
                  <p className="text-sm font-bold text-zinc-900 font-mono">{client.bank_agency || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Conta Corrente</Label>
                  <p className="text-sm font-bold text-zinc-900 font-mono">{client.bank_account || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Simplificado */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
              <CardTitle className="text-lg font-bold">Linha do Tempo</CardTitle>
              <CardDescription>Histórico de movimentações.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {[
                  { status: 'Processada', date: '2026-02-20', icon: CheckCircle2, color: 'text-emerald-500' },
                  { status: 'Entregue', date: '2026-02-15', icon: FileText, color: 'text-blue-500' },
                  { status: 'Cadastro Realizado', date: client.created_at, icon: Plus, color: 'text-zinc-400' },
                ].map((h, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i < 2 && <div className="absolute left-2.5 top-6 bottom-0 w-px bg-zinc-100" />}
                    <div className={cn("w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center z-10", h.color.replace('text-', 'border-'))}>
                      <h.icon size={10} className={h.color} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{h.status}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{format(new Date(h.date), "d 'de' MMM, yyyy", { locale: ptBR })}</p>
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
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newService, setNewService] = useState({ name: '', base_value: '' });
  const [editingService, setEditingService] = useState<any>(null);

  const activeTab = location.pathname === '/services' ? 'services' : 'history';

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

  const exportFinancialCSV = () => {
    const headers = ['Cliente', 'Valor', 'Data', 'Método'];
    const rows = payments.map(p => [
      p.client_name, 
      p.amount.toFixed(2), 
      format(new Date(p.date), 'dd/MM/yyyy'), 
      p.method
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'financeiro-ir-2026.csv');
  };

  const exportFinancialWord = () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "Relatório Financeiro - IR 2026",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cliente", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Valor", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data", bold: true })] })] }),
                  new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Método", bold: true })] })] }),
                ],
              }),
              ...payments.map(p => new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph(p.client_name)] }),
                  new DocxTableCell({ children: [new Paragraph(`R$ ${p.amount.toFixed(2)}`)] }),
                  new DocxTableCell({ children: [new Paragraph(format(new Date(p.date), 'dd/MM/yyyy'))] }),
                  new DocxTableCell({ children: [new Paragraph(p.method)] }),
                ],
              }))
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "financeiro-ir-2026.docx");
    });
  };

  if (!stats) return <div className="p-10">Carregando...</div>;

  return (
    <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">
            {activeTab === 'services' ? 'Serviços' : 'Financeiro'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {activeTab === 'services' 
              ? 'Gerencie os tipos de declarações e honorários profissionais.' 
              : 'Gestão de honorários, recebimentos e projeções.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportFinancialCSV} variant="outline" className="gap-2 rounded-xl border-zinc-200 text-xs h-9">
            CSV
          </Button>
          <Button onClick={exportFinancialReport} variant="outline" className="gap-2 rounded-xl border-zinc-200 text-xs h-9">
            PDF
          </Button>
          <Button onClick={exportFinancialWord} variant="outline" className="gap-2 rounded-xl border-zinc-200 text-xs h-9">
            Word
          </Button>
        </div>
      </header>

      {activeTab === 'history' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Total Recebido</CardDescription>
              <CardTitle className="text-3xl font-black text-emerald-700">
                R$ {stats.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-emerald-600/70 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>{payments.length} pagamentos confirmados</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600 font-bold text-[10px] uppercase tracking-widest">Previsão Pendente</CardDescription>
              <CardTitle className="text-3xl font-black text-amber-700">
                R$ {stats.estimatedPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-amber-600/70 font-medium">
                <Clock className="h-3 w-3" />
                <span>{stats.pendingCount} clientes aguardando</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Ticket Médio</CardDescription>
              <CardTitle className="text-3xl font-black text-zinc-900">R$ 250,00</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <DollarSign className="h-3 w-3" />
                <span>Valor base por declaração</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-zinc-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Total de Serviços</CardDescription>
              <CardTitle className="text-3xl font-black text-zinc-900">
                {serviceTypes.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <CheckSquare className="h-3 w-3" />
                <span>Modalidades cadastradas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Serviço Mais Rentável</CardDescription>
              <CardTitle className="text-xl font-black text-emerald-700 truncate">
                {serviceTypes.length > 0 ? [...serviceTypes].sort((a, b) => b.base_value - a.base_value)[0].name : '-'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-emerald-600/70 font-medium">
                <DollarSign className="h-3 w-3" />
                <span>Maior valor base</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-blue-50/30 col-span-2">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Dica de Gestão</CardDescription>
              <CardTitle className="text-lg font-bold text-blue-800">
                Padronize seus honorários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-blue-600/80 leading-relaxed font-medium">
                Manter valores base claros ajuda na negociação e evita discrepâncias entre clientes com o mesmo perfil de complexidade.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => navigate(value === 'services' ? '/services' : '/finance')} 
        className="w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList className={cn("bg-zinc-100 p-1 rounded-xl", activeTab === 'services' && "bg-zinc-100")}>
            <TabsTrigger value="history" className="rounded-lg font-bold text-xs px-6">Histórico</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg font-bold text-xs px-6">Serviços</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg font-bold text-xs px-6">Pendências</TabsTrigger>
          </TabsList>
          
          {activeTab !== 'services' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-10 bg-white border-zinc-200 rounded-xl h-11 focus-visible:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        <TabsContent value="history">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-zinc-100">
                  <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4 pl-6">Cliente</TableHead>
                  <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4">Valor</TableHead>
                  <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4">Data</TableHead>
                  <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4">Método</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4 pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0">
                    <TableCell className="font-bold text-zinc-900 py-4 pl-6">{payment.client_name}</TableCell>
                    <TableCell className="font-black text-emerald-600">R$ {payment.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-zinc-500 text-xs font-medium">{format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-zinc-500 text-xs font-bold">{payment.method}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[10px] rounded-lg">Pago</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-zinc-400 italic font-medium">
                      Nenhum pagamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-lg font-bold">Serviços Cadastrados</CardTitle>
                <CardDescription>Gerencie as modalidades de honorários profissionais.</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-b border-zinc-100">
                    <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4 pl-6">Nome do Serviço</TableHead>
                    <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4">Valor Base</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-4 pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceTypes.map((service) => (
                    <TableRow key={service.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0">
                      <TableCell className="font-bold text-zinc-900 py-4 pl-6">{service.name}</TableCell>
                      <TableCell className="font-black text-emerald-600">R$ {service.base_value.toFixed(2)}</TableCell>
                      <TableCell className="text-right pr-6 space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-white hover:shadow-sm"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
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

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden h-fit">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                <CardTitle className="text-lg font-bold">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</CardTitle>
                <CardDescription>
                  {editingService ? 'Atualize os dados da modalidade.' : 'Adicione uma nova modalidade de honorário.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddService} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nome do Serviço</Label>
                    <Input 
                      required
                      placeholder="Ex: IRPF Espólio"
                      className="rounded-xl border-zinc-200 h-11 focus-visible:ring-emerald-500"
                      value={newService.name}
                      onChange={e => setNewService({...newService, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Valor Base (R$)</Label>
                    <Input 
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="rounded-xl border-zinc-200 h-11 focus-visible:ring-emerald-500 font-bold"
                      value={newService.base_value}
                      onChange={e => setNewService({...newService, base_value: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    {editingService && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 rounded-xl border-zinc-200"
                        onClick={() => {
                          setEditingService(null);
                          setNewService({ name: '', base_value: '' });
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all">
                      {editingService ? 'Salvar' : 'Cadastrar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden p-20 text-center bg-zinc-50/50">
            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-2">
                <Clock className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Lista de Pendências</h3>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                Esta funcionalidade permitirá visualizar todos os clientes que ainda não pagaram e enviar lembretes automáticos via WhatsApp.
              </p>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-black px-4 py-1.5 rounded-full mt-2">
                EM DESENVOLVIMENTO
              </Badge>
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
        <Onboarding />
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
