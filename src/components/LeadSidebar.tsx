import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  X, 
  ExternalLink,
  User,
  Phone,
  Stethoscope,
  MessageSquare,
  Calendar as CalendarIcon,
  Clock,
  FileText
} from "lucide-react";
import { Lead } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface LeadSidebarProps {
  lead: Lead | null;
  onClose: () => void;
  open: boolean;
}

export function LeadSidebar({ lead, onClose, open }: LeadSidebarProps) {
  if (!lead) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <aside 
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[450px] bg-card border-l z-[101] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-muted/20">
          <h2 className="text-xl font-bold tracking-tight">Detalhes do Cliente</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Main Info */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold leading-tight">{lead.nome}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="font-mono text-sm">{lead.whatsapp}</span>
                  <a 
                    href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {lead.inicio_fora_horario_comercial && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">
                  <Clock className="h-3 w-3 mr-1" /> Fora do horário
                </Badge>
              )}
              {lead.data_hora_agendada && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CalendarIcon className="h-3 w-3 mr-1" /> Agendado
                </Badge>
              )}
            </div>
          </section>

          <Separator />

          {/* Details Grid */}
          <section className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="h-3.5 w-3.5" /> Procedimento de Interesse
              </div>
              <p className="text-sm bg-secondary/50 p-3 rounded-lg border">
                {lead.procedimento || "Não informado"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <MessageSquare className="h-3.5 w-3.5" /> Motivo do Contato
              </div>
              <p className="text-sm italic border-l-4 border-primary/20 pl-4 py-1">
                {lead.motivo_contato || "Nenhum motivo específico registrado."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight">Início do Atendimento</p>
                <p className="text-sm font-medium">
                  {format(new Date(lead.inicio_atendimento_em), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight">Dentista</p>
                <p className="text-sm font-medium">{lead.dentista || "Não atribuído"}</p>
              </div>
            </div>
          </section>

          {/* Appointment Section */}
          {lead.data_hora_agendada && (
            <section className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                <CalendarCheck className="h-4 w-4" /> Dados do Agendamento
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase">Data e Hora</p>
                  <p className="text-lg font-bold text-primary">
                    {format(new Date(lead.data_hora_agendada), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {lead.id_agendamento && (
                  <div>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase">ID do Agendamento</p>
                    <p className="text-xs font-mono bg-background px-2 py-1 rounded border inline-block">
                      {lead.id_agendamento}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Conversation Summary */}
          <section className="space-y-3 pb-8">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" /> Resumo da Conversa (IA)
            </div>
            <div className="text-sm leading-relaxed p-4 bg-muted/40 rounded-xl border border-dashed whitespace-pre-wrap">
              {lead.resumo_conversa || "O resumo da conversa não está disponível."}
            </div>
          </section>
        </div>

        <div className="p-6 border-t bg-muted/10 shrink-0">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Fechar Detalhes
          </Button>
        </div>
      </aside>
    </>
  );
}

// Separate icon for local usage
function CalendarCheck({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/>
    </svg>
  );
}
