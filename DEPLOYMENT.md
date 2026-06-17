# Publicacao fora do Base44

Este app e um projeto React/Vite exportado do Base44. Ele pode ser publicado em plataformas como Vercel ou Netlify usando:

- comando de build: `npm run build`
- pasta publicada: `dist`
- variaveis de ambiente:
  - `VITE_BASE44_APP_ID=6a31ede3977440ad85d90421`
  - `VITE_BASE44_APP_BASE_URL=https://ennea-path-pro.base44.app`

## Cloudflare Pages

### Jeito mais simples: Direct Upload

Use o arquivo `ennea-path-pro-cloudflare-pages.zip`, que contem os arquivos ja compilados.

No painel da Cloudflare:

1. Acesse Workers & Pages.
2. Selecione Create application > Pages > Upload assets.
3. Use o nome `ennea-path-pro`.
4. Envie o arquivo `ennea-path-pro-cloudflare-pages.zip`.
5. Publique o site.

### Via Git

1. Crie um projeto no Cloudflare Pages.
2. Conecte este projeto por Git, ou envie a pasta `dist` se fizer build local.
3. Configure:
   - framework preset: `Vite`
   - build command: `npm run build`
   - build output directory: `dist`
4. Configure as duas variaveis de ambiente acima.

O arquivo `public/_redirects` ja foi adicionado para manter as rotas internas funcionando.

## Cloudflare Workers com GitHub

Se o projeto foi criado como Worker e a Cloudflare usar `npx wrangler deploy`, mantenha o arquivo `wrangler.toml` no repositorio e configure:

- build command: `npm ci && npm run build`
- deploy command: `npx wrangler deploy`
- root directory: `/`

O `wrangler.toml` aponta o deploy para a pasta `dist` gerada pelo Vite.

## Vercel

1. Importe este projeto na Vercel.
2. Configure as duas variaveis de ambiente acima.
3. A Vercel deve detectar Vite automaticamente. Se pedir configuracao manual, use `npm run build` e `dist`.

O arquivo `vercel.json` ja foi adicionado para manter as rotas internas funcionando.

## Netlify

1. Importe este projeto na Netlify.
2. Configure as duas variaveis de ambiente acima.
3. Use `npm run build` como build command e `dist` como publish directory.

O arquivo `netlify.toml` ja foi adicionado para manter as rotas internas funcionando.

## Observacao importante

Esta publicacao troca a hospedagem da interface, mas o app ainda usa o Base44 como backend para login, banco de dados, funcoes e IA. Para remover totalmente a dependencia do Base44, e preciso migrar autenticacao, dados, funcoes de PDF e chamadas de IA para outro backend.
