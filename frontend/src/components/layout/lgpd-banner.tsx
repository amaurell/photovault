import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, X } from 'lucide-react';

export function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api.get<{ hasConsent: boolean }>('/auth/consent')
      .then((res) => { if (!res.hasConsent) setVisible(true); })
      .catch(() => setVisible(true));
  }, []);

  async function accept() {
    try {
      await api.post('/auth/consent', { accepted: true, version: '1.0' });
      setVisible(false);
    } catch {
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg">
      <div className="mx-auto flex max-w-7xl items-start gap-4 px-6 py-4">
        <div className="flex-shrink-0 mt-1">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Política de Privacidade - LGPD</p>
          <p>
            O PhotoVault coleta e armazena seus dados (nome, email, fotos e metadados)
            exclusivamente para fornecer o serviço de gerenciamento de fotos. Seus dados não
            são compartilhados com terceiros sem seu consentimento explícito.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Dados coletados:</strong> nome, email, fotos enviadas, metadata (data, local, dimensões)</li>
            <li><strong>Finalidade:</strong> organização, armazenamento e compartilhamento de fotos</li>
            <li><strong>Armazenamento:</strong> seus dados são mantidos em servidores seguros enquanto sua conta estiver ativa</li>
            <li><strong>Seus direitos:</strong> acessar, corrigir, exportar e excluir seus dados a qualquer momento na página de Perfil</li>
            <li><strong>Compartilhamento:</strong> fotos só são compartilhadas com terceiros se você criar links de compartilhamento</li>
          </ul>
          <p className="text-xs">
            Ao clicar em &quot;Aceitar&quot;, você declara que leu e concorda com esta política de privacidade.
            Você pode revogar seu consentimento a qualquer momento na página de Perfil.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button onClick={accept} size="sm">
            Aceitar
          </Button>
          <button
            onClick={() => setVisible(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
