# Como ligar o Cloudflare D1

1. No Cloudflare, abra **Workers & Pages**.
2. No menu lateral, abra **D1 SQL Database**.
3. Clique em **Create database**.
4. Nome do banco: `ennea-path-pro-db`.
5. Depois de criar, abra o Worker `ennea-path-pro1515`.
6. Va em **Settings** > **Bindings**.
7. Clique em **Add binding**.
8. Escolha **D1 database**.
9. Em **Variable name**, coloque exatamente: `DB`.
10. Em **D1 database**, selecione `ennea-path-pro-db`.
11. Salve.
12. Volte em **Deployments** e rode uma nova implantacao.

O codigo tambem cria as tabelas automaticamente na primeira vez que o site salvar um cadastro.
