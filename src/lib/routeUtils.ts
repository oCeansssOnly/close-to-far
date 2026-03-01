export interface ClientAddress {
  id: string;
  name: string;
  payment: string;
  phone: string;
  address: string;
  city: string;
  reference: string;
  lat: number;
  lng: number;
  paymentMethod: 'online' | 'dinheiro' | 'pix' | 'cartao';
  changeAmount?: string; // troco
}

export function parseAddresses(text: string): ClientAddress[] {
  const blocks = text.split(/(?=Endereço\s)/i).filter(b => b.trim());
  return blocks.map((block, i) => {
    const nameMatch = block.match(/Endereço\s+(?:de\s+)?(\w+)/i);
    const name = nameMatch ? nameMatch[1] : `Cliente ${i + 1}`;

    const paymentMatch = block.match(/Pagamento\s+([\w\s]+?)(?:\s*\(|:)/i);
    const payment = paymentMatch ? paymentMatch[1].trim() : 'Online';

    const phoneMatch = block.match(/\(([^)]*\d[^)]*)\)/);
    const phone = phoneMatch ? phoneMatch[1].replace(/[^\d\s()-]/g, '').trim() : '';

    const addressMatch = block.match(/:\s*(.+?)(?:\s*https|$)/s);
    const fullAddr = addressMatch ? addressMatch[1].trim() : '';

    // Parse address parts
    const parts = fullAddr.split(' - ').map(p => p.trim());
    const address = parts.slice(0, 2).join(' - ');
    const city = parts.find(p => p.includes('/')) || '';
    const refParts = parts.filter(p => !p.includes('/') && parts.indexOf(p) > 1);
    const reference = refParts.join(' - ').replace(/CEP\s*\d{5}-\d{3}\s*-?\s*/g, '').trim();

    const coordsMatch = block.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    const lat = coordsMatch ? parseFloat(coordsMatch[1]) : 0;
    const lng = coordsMatch ? parseFloat(coordsMatch[2]) : 0;

    const isOnline = /online/i.test(payment);

    return {
      id: `client-${i}-${Date.now()}`,
      name,
      payment,
      phone,
      address,
      city,
      reference,
      lat,
      lng,
      paymentMethod: isOnline ? 'online' : 'dinheiro',
      changeAmount: '',
    };
  });
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function optimizeRoute(clients: ClientAddress[], startLat?: number, startLng?: number): ClientAddress[] {
  if (clients.length <= 1) return [...clients];

  const remaining = [...clients];
  const ordered: ClientAddress[] = [];

  let currentLat = startLat ?? remaining[0].lat;
  let currentLng = startLng ?? remaining[0].lng;

  // If we have a start position different from clients, find nearest first
  if (startLat !== undefined && startLng !== undefined) {
    // nearest neighbor from start
  } else {
    // Use first client's position as start reference, find nearest to it
  }

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(currentLat, currentLng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    currentLat = nearest.lat;
    currentLng = nearest.lng;
  }

  return ordered;
}

export function generateGoogleMapsUrl(
  clients: ClientAddress[],
  startLat?: number,
  startLng?: number
): string {
  if (clients.length === 0) return '';

  const routePoints = [
    ...(startLat !== undefined && startLng !== undefined ? [`${startLat},${startLng}`] : []),
    ...clients.map(c => `${c.lat},${c.lng}`),
  ];

  return `https://www.google.com/maps/dir/${routePoints.join('/')}`;
}

export function generateRouteDescription(clients: ClientAddress[]): string {
  return clients.map((c, i) => {
    let desc = `${i + 1}. ${c.name} - ${c.address}`;
    if (c.phone) desc += ` | Tel: ${c.phone}`;
    desc += ` | Pgto: ${getPaymentLabel(c.paymentMethod)}`;
    if (c.paymentMethod === 'dinheiro' && c.changeAmount) {
      desc += ` (Troco p/ R$${c.changeAmount})`;
    }
    return desc;
  }).join('\n');
}

export function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    online: '💳 Online',
    dinheiro: '💵 Dinheiro',
    pix: '📱 PIX',
    cartao: '💳 Cartão na entrega',
  };
  return labels[method] || method;
}
