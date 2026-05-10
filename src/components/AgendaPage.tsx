import * as React from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isAfter,
  isToday,
  parseISO,
  startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getSupabaseClient, Lead } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadSidebar } from "@/components/LeadSidebar";

export function AgendaPage() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [data, setData] = React.useState<Lead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sidebarLead, setSidebarLead] = React.useState<Lead | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const supabase = getSupabaseClient();

  const fetchData = React.useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all appointments for the current month view (including previous/next month days visible in the grid)
      const start = startOfWeek(startOfMonth(currentMonth));
      const end = endOfWeek(endOfMonth(currentMonth));

      const { data: leads, error } = await supabase
        .from('Meu Dentista Tabela')
        .select('*')
        .not('data_hora_agendada', 'is', null)
        .gte('data_hora_agendada', startOfDay(new Date()).toISOString()); // Only future or today

      if (error) throw error;
      setData(leads || []);
    } catch (err) {
      console.error("Erro ao buscar agenda:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentMonth]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Calendar Helpers ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getAppointmentsForDate = (date: Date) => {
    return data.filter(lead => {
      if (!lead.data_hora_agendada) return false;
      return isSameDay(parseISO(lead.data_hora_agendada), date);
    }).sort((a, b) => {
      return parseISO(a.data_hora_agendada!).getTime() - parseISO(b.data_hora_agendada!).getTime();
    });
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);
  const totalFutureAppointments = data.length;

  const handleOpenSidebar = (lead: Lead) => {
    setSidebarLead(lead);
    setIsSidebarOpen(true);
  };

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
          <CalendarIcon className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold">Banco de Dados não Configurado</h2>
        <p className="text-muted-foreground max-w-md mt-2 mb-6">
          Para visualizar a agenda, você precisa conectar sua conta do Supabase nas configurações.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário de agendamentos futuros</h1>
          <p className="text-muted-foreground">Gerencie as visitas e consultas dos seus pacientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid */}
        <Card className="lg:col-span-8 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
            <div className="space-y-1">
              <CardTitle className="text-xl capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b bg-muted/30">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-3 text-center text-xs font-bold uppercase text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isTodayDate = isToday(day);
                const hasAppointments = dayAppointments.length > 0;
                
                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "min-h-[80px] sm:min-h-[110px] p-2 border-r border-b relative cursor-pointer transition-colors hover:bg-muted/30",
                      !isCurrentMonth && "bg-muted/10 opacity-40",
                      isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                      (i % 7 === 6) && "border-r-0"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                        isTodayDate && "bg-primary text-primary-foreground",
                        !isTodayDate && isSelected && "bg-muted text-foreground"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {hasAppointments && (
                        <Badge variant="secondary" className="px-1.5 py-0 h-5 min-w-[20px] justify-center bg-primary/10 text-primary border-primary/20">
                          {dayAppointments.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Tiny dots or indicator for mobile/compressed view */}
                    <div className="mt-2 space-y-1 hidden sm:block">
                      {dayAppointments.slice(0, 2).map((apt, idx) => (
                        <div key={idx} className="text-[10px] truncate bg-secondary px-1.5 py-0.5 rounded border border-secondary text-secondary-foreground">
                          {format(parseISO(apt.data_hora_agendada!), 'HH:mm')} {apt.nome.split(' ')[0]}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[9px] text-muted-foreground pl-1">
                          + {dayAppointments.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel: Details for selected day */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex items-center gap-2 text-primary mb-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Agendamentos do dia</span>
              </div>
              <CardTitle className="text-lg">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                {selectedDateAppointments.length === 0 
                  ? "Nenhum compromisso marcado para este dia." 
                  : `${selectedDateAppointments.length} visita${selectedDateAppointments.length > 1 ? 's' : ''} agendada${selectedDateAppointments.length > 1 ? 's' : ''}.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto max-h-[500px] lg:max-h-none">
              {loading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : selectedDateAppointments.length > 0 ? (
                <div className="divide-y">
                  {selectedDateAppointments.map((apt) => (
                    <div 
                      key={apt.id_agendamento || apt.whatsapp} 
                      className="p-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={() => handleOpenSidebar(apt)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {format(parseISO(apt.data_hora_agendada!), 'HH:mm')}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{apt.nome}</h4>
                            <p className="text-xs text-muted-foreground">WhatsApp: {apt.whatsapp}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronDown className="h-4 w-4 -rotate-90" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Procedimento</p>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Stethoscope className="h-3 w-3 text-primary/60" />
                            <span className="truncate">{apt.procedimento || "Geral"}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Dentista</p>
                          <div className="flex items-center gap-1.5 text-xs">
                            <User className="h-3 w-3 text-primary/60" />
                            <span>{apt.dentista || "Não definido"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 p-6 text-center text-muted-foreground">
                  <Clock className="h-10 w-10 opacity-20 mb-3" />
                  <p className="text-sm">Folga no calendário. Que tal um cafezinho?</p>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t bg-muted/5 mt-auto">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Total Futuros</span>
                <Badge variant="outline" className="font-mono">{totalFutureAppointments}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <LeadSidebar 
        lead={sidebarLead} 
        open={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </div>
  );
}
