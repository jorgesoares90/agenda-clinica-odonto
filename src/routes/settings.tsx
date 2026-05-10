import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Database, Save, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [url, setUrl] = React.useState("");
  const [key, setKey] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedUrl = localStorage.getItem("supabase_url");
    const savedKey = localStorage.getItem("supabase_anon_key");
    if (savedUrl) setUrl(savedUrl);
    if (savedKey) setKey(savedKey);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.startsWith("https://")) {
      toast.error("URL do Supabase inválida");
      return;
    }

    localStorage.setItem("supabase_url", url);
    localStorage.setItem("supabase_anon_key", key);
    
    toast.success("Credenciais salvas com sucesso!");
    
    // Redirect to home after a short delay
    setTimeout(() => {
      navigate({ to: "/" });
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie a conexão com a base de dados do Supabase.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Conexão com a base de dados</CardTitle>
          </div>
          <CardDescription>
            Insira as credenciais do seu projeto Supabase para visualizar os dados da clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Supabase URL</Label>
              <Input
                id="url"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Encontrada em Settings {"->"} API {"->"} Project URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Supabase Anon Key</Label>
              <Input
                id="key"
                type="password"
                placeholder="sua-anon-public-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Encontrada em Settings {"->"} API {"->"} anon public key
              </p>
            </div>

            <Button type="submit" className="w-full gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Segurança dos Dados
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Suas credenciais são armazenadas localmente no seu navegador (<span className="font-mono">localStorage</span>) e nunca são enviadas para nossos servidores. 
          A conexão com o Supabase é feita diretamente do seu dispositivo.
        </p>
      </div>
    </div>
  );
}
