import * as React from "react";
import { format, subDays, startOfMonth, subMonths, startOfYear, isAfter, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  MessageSquare, 
  CalendarCheck, 
  TrendingUp, 
  Clock,
  ExternalLink,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getSupabaseClient, Lead } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

// --- Types ---
type Period = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

// --- Components ---

function KPICard({ title, value, subtitle, icon: Icon, colorClass, trend }: any) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
              {trend && <span className="text-xs font-medium text-green-600">{trend}</span>}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn("p-2 rounded-xl", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Home() {
  const [period, setPeriod] = React.useState<Period>('last7days');
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  const [data, setData] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  const supabase = getSupabaseClient();

  const fetchData = React.useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: leads, error } = await supabase
        .from('Meu Dentista Tabela')
        .select('*')
        .gte('inicio_atendimento_em', dateRange.from.toISOString())
        .lte('inicio_atendimento_em', dateRange.to.toISOString())
        .order('inicio_atendimento_em', { ascending: false });

      if (error) throw error;
      setData(leads || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, dateRange]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    const now = new Date();
    switch (newPeriod) {
      case 'today':
        setDateRange({ from: new Date(now.setHours(0,0,0,0)), to: new Date() });
        break;
      case 'yesterday':
        const yesterday = subDays(new Date(), 1);
        setDateRange({ 
          from: new Date(yesterday.setHours(0,0,0,0)), 
          to: new Date(yesterday.setHours(23,59,59,999)) 
        });
        break;
      case 'last7days':
        setDateRange({ from: subDays(new Date(), 6), to: new Date() });
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(new Date()), to: new Date() });
        break;
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
        const lastMonthEnd = new Date(startOfMonth(new Date()).getTime() - 1);
        setDateRange({ from: lastMonthStart, to: lastMonthEnd });
        break;
      case 'thisYear':
        setDateRange({ from: startOfYear(new Date()), to: new Date() });
        break;
    }
  };

  // --- Calculations ---
  const totalLeads = data.length;
  const totalAppointments = data.filter(l => l.data_hora_agendada !== null).length;
  const conversionRate = totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0;
  const afterHoursAppointments = data.filter(l => l.agendamento_fora_horario_comercial === true).length;

  // --- Chart Data ---
  const lineChartData = React.useMemo(() => {
    const map = new Map();
    data.forEach(lead => {
      const day = format(new Date(lead.inicio_atendimento_em), 'dd/MM');
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, total]) => ({ name, total })).reverse();
  }, [data]);

  const procedureData = React.useMemo(() => {
    const map = new Map();
    data.forEach(lead => {
      if (lead.procedimento) {
        map.set(lead.procedimento, (map.get(lead.procedimento) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const hourData = React.useMemo(() => {
    const commercial = data.filter(l => !l.inicio_fora_horario_comercial).length;
    const afterHours = data.filter(l => l.inicio_fora_horario_comercial).length;
    return [
      { name: 'Horário Comercial', value: commercial, color: 'oklch(0.55 0.15 240)' },
      { name: 'Fora do Horário', value: afterHours, color: 'oklch(0.75 0.15 40)' }
    ];
  }, [data]);

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
        <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 mb-4">
          <CalendarIcon className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold">Banco de Dados não Configurado</h2>
        <p className="text-muted-foreground max-w-md mt-2 mb-6">
          Para visualizar o dashboard, você precisa conectar sua conta do Supabase nas configurações.
        </p>
        <Link to="/settings">
          <Button className="gap-2">
            Ir para Configurações
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão geral do atendimento no WhatsApp</h1>
          <p className="text-muted-foreground">Monitore o desempenho da sua clínica em tempo real.</p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {period === 'custom' 
                  ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                  : {
                    today: 'Hoje',
                    yesterday: 'Ontem',
                    last7days: 'Últimos 7 dias',
                    thisMonth: 'Este mês',
                    lastMonth: 'Mês passado',
                    thisYear: 'Este ano'
                  }[period as string]
                }
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handlePeriodChange('today')}>Hoje</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange('yesterday')}>Ontem</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange('last7days')}>Últimos 7 dias</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange('thisMonth')}>Este mês</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange('lastMonth')}>Mês passado</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePeriodChange('thisYear')}>Este ano</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('custom')}>Personalizado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {period === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Selecionar Datas
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range: any) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                  disabled={(date) => isAfter(date, new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />) : (
          <>
            <KPICard 
              title="Atendimentos iniciados" 
              value={totalLeads}
              subtitle="Total de conversas iniciadas no WhatsApp"
              icon={MessageSquare}
              colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
            />
            <KPICard 
              title="Agendamentos gerados" 
              value={totalAppointments}
              subtitle="Conversas que viraram agendamento"
              icon={CalendarCheck}
              colorClass="bg-green-100 dark:bg-green-900/30 text-green-600"
            />
            <KPICard 
              title="Taxa de conversão" 
              value={`${conversionRate.toFixed(1)}%`}
              subtitle="Percentual de atendimentos convertidos"
              icon={TrendingUp}
              colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600"
            />
            <KPICard 
              title="Fora do Horário" 
              value={afterHoursAppointments}
              subtitle="Agendamentos feitos em horários alternativos"
              icon={Clock}
              colorClass="bg-orange-100 dark:bg-orange-900/30 text-orange-600"
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volume de atendimentos ao longo do tempo</CardTitle>
            <CardDescription>Quantas conversas o WhatsApp recebe por dia</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineChartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quando as pessoas chamam</CardTitle>
            <CardDescription>Horário Comercial vs Fora do Horário</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {loading ? <Skeleton className="w-48 h-48 rounded-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hourData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {hourData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          {!loading && (
            <div className="px-6 pb-6 flex justify-center gap-4 text-xs">
              {hourData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: Procedures and Recent Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Procedimentos mais procurados</CardTitle>
            <CardDescription>Top 10 tratamentos citados</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {loading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={procedureData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    width={100}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Atendimentos recentes</CardTitle>
              <CardDescription>As 10 conversas mais recentes do período</CardDescription>
            </div>
            <Link to="/leads">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todos <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Início</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 10).map((lead) => (
                    <TableRow 
                      key={lead.inicio_atendimento_em + lead.whatsapp} 
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.whatsapp}</TableCell>
                      <TableCell>{lead.procedimento || "Não informado"}</TableCell>
                      <TableCell>
                        {lead.inicio_fora_horario_comercial && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                            Fora do horário
                          </Badge>
                        )}
                        {lead.data_hora_agendada && (
                          <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                            Agendado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                        {format(new Date(lead.inicio_atendimento_em), 'dd/MM HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum atendimento encontrado no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Detalhes */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center justify-between pr-8">
              <span>Detalhes do Atendimento</span>
              {selectedLead?.data_hora_agendada && (
                <Badge className="bg-green-500 hover:bg-green-600">Agendado</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Informações completas extraídas da conversa via WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <section>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</label>
                  <p className="text-lg font-bold">{selectedLead.nome}</p>
                </section>
                
                <section>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono">{selectedLead.whatsapp}</p>
                    <a 
                      href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
                    >
                      Abrir conversa <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <section>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Iniciado em</label>
                    <p className="text-sm">{format(new Date(selectedLead.inicio_atendimento_em), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                  </section>
                  <section>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Horário</label>
                    <p className="text-sm">
                      {selectedLead.inicio_fora_horario_comercial ? "Fora do Horário Comercial" : "Horário Comercial"}
                    </p>
                  </section>
                </div>

                <section>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Procedimento</label>
                  <p className="text-sm bg-secondary p-2 rounded-md">{selectedLead.procedimento || "Não informado"}</p>
                </section>

                {selectedLead.data_hora_agendada && (
                  <section className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                    <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Data do Agendamento</label>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">
                      {format(new Date(selectedLead.data_hora_agendada), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </section>
                )}
              </div>

              <div className="space-y-4">
                <section>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo do Contato</label>
                  <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                    "{selectedLead.motivo_contato || "Nenhum motivo específico registrado."}"
                  </p>
                </section>

                <section>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo da Conversa (IA)</label>
                  <div className="text-sm leading-relaxed p-4 bg-muted/30 rounded-lg border max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                    {selectedLead.resumo_conversa || "O resumo da conversa não está disponível."}
                  </div>
                </section>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
