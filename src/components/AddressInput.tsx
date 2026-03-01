import { useState } from "react";

interface AddressInputProps {
  onParse: (text: string) => void;
}

export function AddressInput({ onParse }: AddressInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onParse(text.trim());
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"Cole os endereços aqui no formato:\nEndereço de Nome | Pagamento Online (telefone): Rua...\nhttps://maps.google.com/?q=lat,lng"}
        className="w-full h-40 bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all font-mono"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-primary"
      >
        🗺️ Gerar Rota Otimizada
      </button>
    </div>
  );
}
