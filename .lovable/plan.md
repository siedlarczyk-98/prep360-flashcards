

## Correção do `toEmbedPath()` em `useEmbedNavigate.tsx`

### Problema
A função `toEmbedPath()` compara o path inteiro (incluindo query string) contra o Set `EMBED_ROUTES`. Paths como `/simulado?aula_id=2479` não batem com `/simulado`, resultando em no-op.

### Correção
Alterar apenas a função `toEmbedPath()` em `src/hooks/useEmbedNavigate.tsx`:

1. Separar o path recebido em `pathname`, `search` e `hash` usando `new URL()` com base fictícia
2. Fazer o match usando apenas o `pathname`
3. Reanexar `search` e `hash` ao resultado embed

### Arquivo alterado
- `src/hooks/useEmbedNavigate.tsx` — apenas a função `toEmbedPath()`

### Resultado esperado
```text
entrada:  /simulado?aula_id=2479&modo=essenciais&limite=20
match em: /simulado
saída:    /embed/simulado?aula_id=2479&modo=essenciais&limite=20
```

