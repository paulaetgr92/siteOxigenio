# Catálogo feminino conectado ao SQL Server

## Regra mais importante

O navegador **não deve** receber usuário, senha ou endereço do SQL Server. A página chama a API Node.js; somente a API acessa o banco.

## 1. Conecte a VPN no Mac

1. Instale o v2rayN correspondente ao processador do Mac.
2. Importe a URL VLESS fornecida pela empresa.
3. Ative o perfil e o modo de roteamento indicado pelo responsável de TI.
4. Teste a porta do banco:

```bash
nc -vz SEU_HOST_SQL SUA_PORTA
```

O resultado esperado contém `succeeded` ou `open`.

Para descobrir o processador:

```bash
uname -m
```

- `arm64`: Apple Silicon.
- `x86_64`: Intel.

## 2. Copie estes arquivos para a raiz do site

A pasta deve ficar assim:

```text
oxigenio-site/
├── package.json
├── server.js
├── .env
├── src/
├── scripts/
├── queries/
├── feminino.html
├── css/
│   ├── styles.css
│   └── catalogo.css
├── js/
│   ├── app.js
│   └── catalogo-feminino.js
└── assets/
```

## 3. Configure o `.env`

```bash
cp .env.example .env
```

Abra `.env` e preencha as credenciais localmente. Nunca envie ou publique esse arquivo.

## 4. Instale as dependências

```bash
npm install
```

## 5. Teste a conexão

```bash
npm run db:test
```

Erros comuns:

- `ETIMEOUT` / `ESOCKET`: VPN, rota, firewall, host ou porta.
- `ELOGIN`: usuário, senha ou permissão.
- erro de certificado/TLS: ajuste `DB_ENCRYPT` e `DB_TRUST_SERVER_CERTIFICATE` conforme orientação do DBA.

## 6. Descubra as tabelas reais do ERP

```bash
npm run db:inspect
```

Isso cria `schema-report.json`, sem incluir a senha. O relatório lista tabelas, colunas e candidatas prováveis para produto, preço, estoque e imagem.

## 7. Adapte a consulta

Edite:

```text
queries/catalogo.sql
```

Ela deve devolver os aliases:

```text
id
nome
preco
preco_promocional
imagem
subcategoria
tamanhos
disponivel
destaque
```

A solução mais limpa é o DBA criar uma view somente leitura chamada:

```text
dbo.vw_site_catalogo_feminino
```

## 8. Abra o card Feminino

No `index.html`, deixe o link do primeiro card assim:

```html
<a class="category-card category-card--01 reveal"
   href="feminino.html"
   data-category="feminino">
```

## 9. Rode o site e a API

Pare o servidor Python e use:

```bash
npm start
```

Abra:

```text
http://localhost:8000
```

Teste o banco no navegador:

```text
http://localhost:8000/api/health
```

## Produção

A VPN ligada no seu Mac serve apenas para desenvolvimento. Na publicação, a API precisa rodar em um servidor com acesso permanente ao SQL Server pela rede privada/VPN. Uma alternativa mais segura e estável é sincronizar apenas os dados públicos do catálogo para um banco web separado.
