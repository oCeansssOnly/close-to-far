import { useState, useCallback } from "react";
import { AddressInput } from "@/components/AddressInput";
import { SingleClientForm } from "@/components/SingleClientForm";
import { ClientCard } from "@/components/ClientCard";
import { ClientAddress, Motoboy, parseAddresses, optimizeRoute, generateGoogleMapsUrl, generateRouteDescription } from "@/lib/routeUtils";
import { Route, Navigation, Copy, Check, RotateCcw, MapPin, Plus, Users, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([
    { id: 'default', name: 'Motoboy 1', clients: [] }
  ]);
  const [activeMotoboy, setActiveMotoboy] = useState('default');
  const [copied, setCopied] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [addMode, setAddMode] = useState<'form' | 'paste'>('form');
  const [newMotoboyName, setNewMotoboyName] = useState('');
  const [showAddMotoboy, setShowAddMotoboy] = useState(false);

  const currentMotoboy = motoboys.find(m => m.id === activeMotoboy) || motoboys[0];
  const clients = currentMotoboy?.clients || [];

  const getUserLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (userLocation) { resolve(userLocation); return; }
      if (!navigator.geolocation) { reject(new Error("Geolocalização não suportada")); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          resolve(loc);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [userLocation]);

  const updateMotoboyClients = useCallback((motoboyId: string, newClients: ClientAddress[]) => {
    setMotoboys(prev => prev.map(m => m.id === motoboyId ? { ...m, clients: newClients } : m));
  }, []);

  const addClientToRoute = useCallback(async (client: ClientAddress) => {
    const current = motoboys.find(m => m.id === activeMotoboy);
    if (!current) return;
    const all = [...current.clients, client];
    try {
      const loc = await getUserLocation();
      updateMotoboyClients(activeMotoboy, optimizeRoute(all, loc.lat, loc.lng));
    } catch {
      updateMotoboyClients(activeMotoboy, optimizeRoute(all));
    }
    toast.success(`${client.name} adicionado à rota!`);
  }, [activeMotoboy, motoboys, getUserLocation, updateMotoboyClients]);

  const handlePaste = useCallback(async (text: string) => {
    const parsed = parseAddresses(text);
    if (parsed.length === 0) { toast.error("Nenhum endereço encontrado."); return; }
    const current = motoboys.find(m => m.id === activeMotoboy);
    if (!current) return;
    const all = [...current.clients, ...parsed];
    try {
      const loc = await getUserLocation();
      updateMotoboyClients(activeMotoboy, optimizeRoute(all, loc.lat, loc.lng));
      toast.success(`${parsed.length} endereços adicionados e otimizados!`);
    } catch {
      updateMotoboyClients(activeMotoboy, optimizeRoute(all));
      toast.success(`${parsed.length} endereços adicionados!`);
    }
  }, [activeMotoboy, motoboys, getUserLocation, updateMotoboyClients]);

  const updateClient = useCallback((updated: ClientAddress) => {
    setMotoboys(prev => prev.map(m => m.id === activeMotoboy
      ? { ...m, clients: m.clients.map(c => c.id === updated.id ? updated : c) }
      : m
    ));
  }, [activeMotoboy]);

  const removeClient = useCallback((clientId: string) => {
    setMotoboys(prev => prev.map(m => m.id === activeMotoboy
      ? { ...m, clients: m.clients.filter(c => c.id !== clientId) }
      : m
    ));
    toast.success("Cliente removido da rota.");
  }, [activeMotoboy]);

  const reoptimize = useCallback(async () => {
    const current = motoboys.find(m => m.id === activeMotoboy);
    if (!current) return;
    try {
      const loc = await getUserLocation();
      updateMotoboyClients(activeMotoboy, optimizeRoute([...current.clients], loc.lat, loc.lng));
      toast.success("Rota reotimizada!");
    } catch {
      updateMotoboyClients(activeMotoboy, optimizeRoute([...current.clients]));
      toast.success("Rota reotimizada!");
    }
  }, [activeMotoboy, motoboys, getUserLocation, updateMotoboyClients]);

  const openFullRoute = async () => {
    try {
      const loc = await getUserLocation();
      window.open(generateGoogleMapsUrl(clients, loc.lat, loc.lng), '_blank');
    } catch {
      window.open(generateGoogleMapsUrl(clients, userLocation?.lat, userLocation?.lng), '_blank');
    }
  };

  const copyRouteInfo = async () => {
    let mapsUrl = generateGoogleMapsUrl(clients, userLocation?.lat, userLocation?.lng);
    try {
      const loc = await getUserLocation();
      mapsUrl = generateGoogleMapsUrl(clients, loc.lat, loc.lng);
    } catch { /* keep best */ }
    const description = generateRouteDescription(clients);
    const fullText = `ROTA DE ENTREGAS - ${currentMotoboy.name} (${clients.length} paradas)\n${'─'.repeat(40)}\n${description}\n${'─'.repeat(40)}\n🗺️ Rota no Maps: ${mapsUrl}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Rota copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const addMotoboy = () => {
    const name = newMotoboyName.trim() || `Motoboy ${motoboys.length + 1}`;
    const id = `motoboy-${Date.now()}`;
    setMotoboys(prev => [...prev, { id, name, clients: [] }]);
    setActiveMotoboy(id);
    setNewMotoboyName('');
    setShowAddMotoboy(false);
    toast.success(`${name} adicionado!`);
  };

  const removeMotoboy = (id: string) => {
    if (motoboys.length <= 1) { toast.error("Deve haver pelo menos um motoboy."); return; }
    setMotoboys(prev => prev.filter(m => m.id !== id));
    if (activeMotoboy === id) setActiveMotoboy(motoboys[0].id === id ? motoboys[1]?.id : motoboys[0].id);
    toast.success("Motoboy removido.");
  };

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container py-6 space-y-4 max-w-lg mx-auto">
        {/* Motoboy tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Motoboys</span>
            </div>
            <button onClick={() => setShowAddMotoboy(!showAddMotoboy)}
              className="p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <UserPlus size={14} />
            </button>
          </div>

          {showAddMotoboy && (
            <div className="flex gap-2 animate-slide-up">
              <input value={newMotoboyName} onChange={e => setNewMotoboyName(e.target.value)}
                placeholder="Nome do motoboy" onKeyDown={e => e.key === 'Enter' && addMotoboy()}
                className="flex-1 bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/50 outline-none" />
              <button onClick={addMotoboy} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                Adicionar
              </button>
            </div>
          )}

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {motoboys.map(m => (
              <button key={m.id} onClick={() => setActiveMotoboy(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  activeMotoboy === m.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-secondary text-secondary-foreground border border-border hover:border-primary/20'
                }`}>
                {m.name}
                <span className="text-[10px] opacity-70">({m.clients.length})</span>
                {motoboys.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removeMotoboy(m.id); }}
                    className="ml-1 text-muted-foreground hover:text-destructive">
                    <Trash2 size={10} />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Add client section */}
        <div className="glass-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plus size={16} className="text-primary" />
              Adicionar Cliente
            </h2>
            <div className="flex bg-secondary rounded-md p-0.5">
              <button onClick={() => setAddMode('form')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${addMode === 'form' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                Formulário
              </button>
              <button onClick={() => setAddMode('paste')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${addMode === 'paste' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                Colar Texto
              </button>
            </div>
          </div>

          {addMode === 'form' ? (
            <SingleClientForm onAdd={addClientToRoute} />
          ) : (
            <AddressInput onParse={handlePaste} />
          )}
        </div>

        {/* Route */}
        {clients.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route size={18} className="text-primary" />
                <h2 className="font-semibold text-foreground">{clients.length} paradas</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={reoptimize} className="p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" title="Reotimizar rota">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {clients.map((client, i) => (
                <ClientCard key={client.id} client={client} index={i} onUpdate={updateClient} onRemove={removeClient} />
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <button onClick={openFullRoute}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all glow-primary flex items-center justify-center gap-2">
                <Navigation size={16} />
                Abrir Rota no Google Maps
              </button>
              <button onClick={copyRouteInfo}
                className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all border border-border flex items-center justify-center gap-2">
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                {copied ? "Copiado!" : "Copiar Rota Completa"}
              </button>
            </div>
          </>
        )}

        {clients.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin size={28} className="text-primary animate-pulse-glow" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Adicione clientes acima para gerar a rota otimizada de <strong>{currentMotoboy.name}</strong>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
