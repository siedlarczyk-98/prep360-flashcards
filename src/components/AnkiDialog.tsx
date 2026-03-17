import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnkiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnkiDialog = ({ open, onOpenChange }: AnkiDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <DialogTitle className="font-sans text-lg">Anki não encontrado</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Não foi possível conectar ao Anki. Certifique-se de que o Anki está aberto com o plugin AnkiConnect instalado.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-4 space-y-3 text-sm text-foreground">
          <p className="font-semibold">Como configurar:</p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Abra o Anki no seu computador</li>
            <li>Vá em <strong className="text-foreground">Ferramentas → Extensões</strong></li>
            <li>Clique em <strong className="text-foreground">Obter Extensões</strong></li>
            <li>Insira o código: <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">2055492159</code></li>
            <li>Reinicie o Anki e tente novamente</li>
          </ol>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button className="flex-1 gap-1" asChild>
            <a href="https://ankiweb.net/shared/info/2055492159" target="_blank" rel="noopener noreferrer">
              Ver AnkiConnect
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnkiDialog;
