import { useState } from "react";
import { ClientAddress } from "@/lib/routeUtils";
import { Plus, MapPin } from "lucide-react";

interface SingleClientFormProps {
  onAdd: (client: ClientAddress) => void;
}

export function SingleClientForm({ onAdd }: SingleClientFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [reference, setReference] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ClientAddress['paymentMethod']>('online');
  const [changeAmount, setChangeAmount] = useState("");

  const extractCoords = (link: string): { lat: number; lng: number } => {
    const match = link.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    const match2 = link.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match2) return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
    return { lat: 0, lng: 0 };
  };

  const handleAdd = () => {
    if (!name.trim() && !address.trim() && !mapsLink.trim()) return;

    const coords = extractCoords(mapsLink);
    const client: ClientAddress = {
      id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || 'Cliente',
      payment: paymentMethod === 'online' ? 'Online' : paymentMethod,
      phone: phone.trim(),
      address: address.trim(),
      city: '',
      reference: reference.trim(),
      lat: coords.lat,
      lng: coords.lng,
      paymentMethod,
      changeAmount: paymentMethod === 'dinheiro' ? changeAmount : '',
      orderCode: orderCode.trim(),
      confirmationCode: '',
      confirmed: false,
    };

    onAdd(client);
    // Reset form
    setName("");
    setPhone("");
    setAddress("");
    setMapsLink("");
    setReference("");
    setOrderCode("");
    setPaymentMethod('online');
    setChangeAmount("");
  };

  const inputClass = "w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="Nome do cliente" value={name} onChange={e => setName(e.target.value)} />
        <input className={inputClass} placeholder="Telefone (opcional)" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <input className={inputClass} placeholder="Endereço completo" value={address} onChange={e => setAddress(e.target.value)} />
      <div className="flex gap-2">
        <div className="flex-1">
          <input className={inputClass} placeholder="Link do Google Maps" value={mapsLink} onChange={e => setMapsLink(e.target.value)} />
        </div>
        <div className="w-8 h-9 flex items-center justify-center">
          {mapsLink && extractCoords(mapsLink).lat !== 0 ? (
            <MapPin size={16} className="text-primary" />
          ) : mapsLink ? (
            <MapPin size={16} className="text-destructive" />
          ) : null}
        </div>
      </div>
      <input className={inputClass} placeholder="Ponto de referência (opcional)" value={reference} onChange={e => setReference(e.target.value)} />
      <input className={inputClass} placeholder="Código localizador do pedido (opcional)" value={orderCode} onChange={e => setOrderCode(e.target.value)} />
      
      {/* Payment */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Pagamento</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['online', 'dinheiro', 'pix', 'cartao'] as const).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`text-xs px-2 py-1.5 rounded-md transition-all ${
                paymentMethod === method
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-secondary text-secondary-foreground border border-border hover:border-primary/20'
              }`}
            >
              {method === 'online' ? '💳' : method === 'dinheiro' ? '💵' : method === 'pix' ? '📱' : '💳'} {method === 'cartao' ? 'Cartão' : method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {paymentMethod === 'dinheiro' && (
        <input className={inputClass} placeholder="Troco para (R$)" value={changeAmount} onChange={e => setChangeAmount(e.target.value)} />
      )}

      <button
        onClick={handleAdd}
        disabled={!name.trim() && !address.trim() && !mapsLink.trim()}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Adicionar Cliente
      </button>
    </div>
  );
}
