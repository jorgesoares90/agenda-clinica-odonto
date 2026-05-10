import { createClient } from '@supabase/supabase-js';

export const getSupabaseConfig = () => {
  if (typeof window === 'undefined') return null;
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_anon_key');
  if (!url || !key) return null;
  return { url, key };
};

export const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key);
};

export interface Lead {
  nome: string;
  whatsapp: string;
  procedimento: string;
  motivo_contato: string;
  resumo_conversa: string;
  inicio_atendimento_em: string;
  inicio_fora_horario_comercial: boolean;
  data_hora_agendada: string | null;
  agendamento_criado_em: string | null;
  agendamento_fora_horario_comercial: boolean;
  id_agendamento: string | null;
  dentista?: string; // Adding based on new requirements even if not in original table spec
}
