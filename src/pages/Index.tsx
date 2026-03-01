import { useState, useCallback } from "react";
import { AddressInput } from "@/components/AddressInput";
import { ClientCard } from "@/components/ClientCard";
import { ClientAddress, parseAddresses, optimizeRoute, generateGoogleMapsUrl, generateRouteDescription } from "@/lib/routeUtils";
import { Route, Navigation, Copy, Check, RotateCcw, MapPin } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [clients, setClients] = useState<ClientAddress[]>([]);
  const [copied, setCopied] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getUserLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (userLocation) {
        resolve(userLocation);
        return;
      }
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLoadingLocation(false);
          resolve(loc);
        },
        (err) => {
          setLoadingLocation(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [userLocation]);

  const handleParse = useCallback(async (text: string) => {
    const parsed = parseAddresses(text);
    if (parsed.length === 0) {
      toast.error("Nenhum endereço encontrado. Verifique o formato.");
      return;
    }
    try {
      const loc = await getUserLocation();
      const optimized = optimizeRoute(parsed, loc.lat, loc.lng);
      setClients(optimized);
      toast.success(`${optimized.length} endereços otimizados a partir da sua localização!`);
    } catch {
      const optimized = optimizeRoute(parsed);
      setClients(optimized);
      toast.success(`${optimized.length} endereços encontrados! (sem localização, usando primeiro endereço como base)`);
    }
  }, [getUserLocation]);

  const updateClient = useCallback((updated: ClientAddress) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  const reoptimize = useCallback(async () => {
    try {
      const loc = await getUserLocation();
      setClients(prev => optimizeRoute([...prev], loc.lat, loc.lng));
      toast.success("Rota reotimizada a partir da sua localização!");
    } catch {
      setClients(prev => optimizeRoute([...prev]));
      toast.success("Rota reotimizada!");
    }
  }, [getUserLocation]);

  const openFullRoute = () => {
    const url = generateGoogleMapsUrl(clients);
    window.open(url, '_blank');
  };

  const copyRouteInfo = () => {
    const mapsUrl = generateGoogleMapsUrl(clients);
    const description = generateRouteDescription(clients);
    const fullText = `ROTA DE ENTREGAS (${clients.length} paradas)\n${'─'.repeat(40)}\n${description}\n${'─'.repeat(40)}\n🗺️ Rota no Maps: ${mapsUrl}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Rota copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setClients([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center glow-primary">
              <Navigation size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">RotaFácil</h1>
              <p className="text-xs text-muted-foreground">Otimizador de rotas de entrega</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6 max-w-lg mx-auto">
        {clients.length === 0 ? (
          <>
            {/* Empty state */}
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin size={28} className="text-primary animate-pulse-glow" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Adicionar Endereços</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Cole os endereços dos clientes abaixo para gerar uma rota otimizada automaticamente.
              </p>
            </div>
            <AddressInput onParse={handleParse} />
          </>
        ) : (
          <>
            {/* Route header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route size={18} className="text-primary" />
                <h2 className="font-semibold text-foreground">{clients.length} paradas</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={reoptimize}
                  className="p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  title="Reotimizar rota"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={reset}
                  className="px-3 py-1.5 rounded-md text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Nova rota
                </button>
              </div>
            </div>

            {/* Client cards */}
            <div className="space-y-3">
              {clients.map((client, i) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  index={i}
                  onUpdate={updateClient}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={openFullRoute}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all glow-primary flex items-center justify-center gap-2"
              >
                <Navigation size={16} />
                Abrir Rota no Google Maps
              </button>
              <button
                onClick={copyRouteInfo}
                className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all border border-border flex items-center justify-center gap-2"
              >
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                {copied ? "Copiado!" : "Copiar Rota Completa"}
              </button>
            </div>

            {/* Add more */}
            <details className="glass-card rounded-lg">
              <summary className="px-4 py-3 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                + Adicionar mais endereços
              </summary>
              <div className="px-4 pb-4">
                <AddressInput onParse={async (text) => {
                  const parsed = parseAddresses(text);
                  const all = [...clients, ...parsed];
                  try {
                    const loc = await getUserLocation();
                    setClients(optimizeRoute(all, loc.lat, loc.lng));
                  } catch {
                    setClients(optimizeRoute(all));
                  }
                  toast.success(`${parsed.length} endereços adicionados!`);
                }} />
              </div>
            </details>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
