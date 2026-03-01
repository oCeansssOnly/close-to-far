import { useState } from "react";
import { ClientAddress, getPaymentLabel } from "@/lib/routeUtils";
import { MapPin, Phone, CreditCard, ChevronDown, ChevronUp, Pencil, Check, X, GripVertical } from "lucide-react";

interface ClientCardProps {
  client: ClientAddress;
  index: number;
  onUpdate: (updated: ClientAddress) => void;
}

export function ClientCard({ client, index, onUpdate }: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(client.phone);

  const savePhone = () => {
    onUpdate({ ...client, phone: phoneValue });
    setEditingPhone(false);
  };

  const cancelPhone = () => {
    setPhoneValue(client.phone);
    setEditingPhone(false);
  };

  return (
    <div className="glass-card rounded-lg p-4 animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start gap-3">
        {/* Order number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5 mt-1">
            <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground leading-snug">{client.address}</p>
          </div>

          {/* Reference */}
          {client.reference && (
            <p className="text-xs text-accent-foreground mt-1 ml-5 italic">📍 {client.reference}</p>
          )}

          {/* Phone */}
          <div className="flex items-center gap-1.5 mt-2 ml-0.5">
            <Phone size={13} className="text-info flex-shrink-0" />
            {editingPhone ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={phoneValue}
                  onChange={e => setPhoneValue(e.target.value)}
                  className="bg-input border border-border rounded px-2 py-0.5 text-sm text-foreground w-36 focus:ring-1 focus:ring-primary outline-none"
                  autoFocus
                  placeholder="(XX) XXXXX-XXXX"
                />
                <button onClick={savePhone} className="text-primary hover:text-primary/80 p-0.5"><Check size={14} /></button>
                <button onClick={cancelPhone} className="text-destructive hover:text-destructive/80 p-0.5"><X size={14} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">{client.phone || 'Sem número'}</span>
                <button onClick={() => setEditingPhone(true)} className="text-muted-foreground hover:text-foreground p-0.5">
                  <Pencil size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Expanded: Payment config */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              {/* Payment method */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['online', 'dinheiro', 'pix', 'cartao'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => onUpdate({ ...client, paymentMethod: method })}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                        client.paymentMethod === method
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-secondary text-secondary-foreground border border-border hover:border-primary/20'
                      }`}
                    >
                      {getPaymentLabel(method)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change amount for cash */}
              {client.paymentMethod === 'dinheiro' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Troco para (R$)</label>
                  <input
                    type="text"
                    value={client.changeAmount || ''}
                    onChange={e => onUpdate({ ...client, changeAmount: e.target.value })}
                    className="bg-input border border-border rounded px-3 py-1.5 text-sm text-foreground w-full focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ex: 50, 100..."
                  />
                </div>
              )}

              {/* Google Maps link */}
              <a
                href={`https://maps.google.com/?q=${client.lat},${client.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <MapPin size={12} />
                Abrir no Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
