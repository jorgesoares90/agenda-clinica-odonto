import * as React from "react";
import { format, subDays, startOfMonth, subMonths, startOfYear, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Search,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSupabaseClient, Lead } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LeadSidebar } from "@/components/LeadSidebar";

type Period = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export function LeadsPage() {
  const [period, setPeriod] = React.useState<Period>('last7days');
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  const [data, setData] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'commercial' | 'afterHours'>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const recordsPerPage = 50;

  const supabase = getSupabaseClient();

  const fetchData = React.useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('Meu Dentista Tabela')
        .select('*')
        .gte('inicio_atendimento_em', dateRange.from.toISOString())
        .lte('inicio_atendimento_em', dateRange.to.toISOString())
        .order('inicio_atendimento_em', { ascending: false });

      const { data: leads, error } = await query;

      if (error) throw error;
      setData(leads || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      toast.error("Erro ao carregar dados do Supabase");
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

  const filteredData = React.useMemo(() => {
    return data.filter(lead => {
      const matchesSearch = 
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        lead.whatsapp.includes(searchTerm) ||
        (lead.procedimento || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'commercial' && !lead.inicio_fora_horario_comercial) ||
        (statusFilter === 'afterHours' && lead.inicio_fora_horario_comercial);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const currentRecords = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleOpenSidebar = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSidebarOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = ["Nome", "WhatsApp", "Procedimento", "Data Atendimento", "Fora do Horário"];
    const rows = filteredData.map(lead => [
      lead.nome,
      lead.whatsapp,
      lead.procedimento || "Não informado",
      format(new Date(lead.inicio_atendimento_em), "dd/MM/yyyy HH:mm"),
      lead.inicio_fora_horario_comercial ? "Sim" : "Não"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso!");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todos os contatos recebidos via WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie e analise todos os seus leads em um só lugar.</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selection */}
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-9 text-xs">
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
              <DropdownMenuContent align="start" className="w-48">
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
                  <Button variant="outline" size="sm" className="h-9">
                    Datas
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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

            <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-9 text-xs">
                  <Filter className="h-4 w-4" />
                  Status: {statusFilter === 'all' ? 'Todos' : statusFilter === 'commercial' ? 'Comercial' : 'Fora do Horário'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todos os Horários</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('commercial')}>Horário Comercial</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('afterHours')}>Fora do Horário Comercial</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[200px]">Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Atendimento</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.map((lead) => (
                    <TableRow 
                      key={lead.inicio_atendimento_em + lead.whatsapp} 
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => handleOpenSidebar(lead)}
                    >
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{lead.whatsapp}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{lead.procedimento || "Não informado"}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(lead.inicio_atendimento_em), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        {lead.inicio_fora_horario_comercial && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                            Fora do horário
                          </Badge>
                        )}
                        {!lead.inicio_fora_horario_comercial && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                            Comercial
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Nenhum contato encontrado com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * recordsPerPage, filteredData.length)}</span> de <span className="font-medium">{filteredData.length}</span> resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = currentPage;
                        if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        
                        if (pageNum < 1 || pageNum > totalPages) return null;

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <LeadSidebar 
        lead={selectedLead} 
        open={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </div>
  );
}
