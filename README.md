# MeuMEI (PWA) — baseado no protótipo v3

Mesmo visual e telas do protótipo v3, agora instalável e offline.

## Arquivos
- `index.html`, `styles.css`, `app.js`: o app (o JS é o do protótipo, com ajustes)
- `sw.js`, `manifest.webmanifest`, `icons/`: o que o torna PWA

## O que mudou em relação ao protótipo
- Instalável na tela inicial e funciona sem internet
- Vencimento do DAS passa para o próximo dia útil quando o dia 20 cai em fim de semana
- Campo opcional "mês de abertura": limite proporcional no primeiro ano
- Alerta separado quando passa de 120% do limite
- Backup em arquivo (compartilhar/salvar), CSV para o contador e restauração por arquivo; alerta se passar de 30 dias sem backup
- Backups e dados são validados ao restaurar (o formato antigo do protótipo continua aceito)
- Confirmação antes de excluir lançamento; campos com 16px (evita zoom do iOS ao digitar)
- Pede armazenamento persistente ao navegador

## Testar no computador
```
python3 -m http.server 8080
```
Abra http://localhost:8080

## Publicar de graça (HTTPS é obrigatório)
Cloudflare Pages (upload direto da pasta) ou GitHub Pages. Siga a documentação do serviço, os passos nas telas podem mudar.

## Instalar no iPhone
Safari > Compartilhar > Adicionar à Tela de Início.

## Atualizar
Suba os arquivos novos. O app atualiza na abertura seguinte à publicação (abra duas vezes). Se algo ficar preso, troque `VERSAO` em `sw.js`.

## Atenção
Os dados ficam só no aparelho (localStorage). Limpar dados do Safari apaga tudo: use o backup. Confira limite, DAS e prazos nos canais oficiais.
