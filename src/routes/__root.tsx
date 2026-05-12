import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as React from "react";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro ao carregar esta página. Você pode tentar recarregar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Amanda Soares - Odontologia Especializada" },
      { name: "description", content: "Dashboard estratégico - Amanda Soares Odontologia Especializada" },
      { property: "og:title", content: "Amanda Soares - Odontologia Especializada" },
      { name: "twitter:title", content: "Amanda Soares - Odontologia Especializada" },
      { property: "og:description", content: "Dashboard estratégico - Amanda Soares Odontologia Especializada" },
      { name: "twitter:description", content: "Dashboard estratégico - Amanda Soares Odontologia Especializada" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dc36adf0-427d-4e45-8f83-05cf3f1fb2ef/id-preview-b8228df1--a28403df-23c8-4a4c-baea-5d7dbcea2020.lovable.app-1778457142366.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dc36adf0-427d-4e45-8f83-05cf3f1fb2ef/id-preview-b8228df1--a28403df-23c8-4a4c-baea-5d7dbcea2020.lovable.app-1778457142366.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main 
          className={cn(
            "flex-1 transition-all duration-300 min-h-screen",
            "lg:ml-64", // Standard sidebar width
            collapsed && "lg:ml-20" // Collapsed sidebar width
          )}
        >
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
