# scribe api

API para ler e editar documentos do Google Docs com a sua conta Google.

## Configuração do Google (uma vez só)

1. Crie um projeto em https://console.cloud.google.com.
2. Em **APIs e serviços → Biblioteca**, ative a **Google Docs API**.
3. Em **Google Auth Platform**, configure a tela de consentimento como **Externo** e
   adicione o seu e-mail em **Público-alvo → Usuários de teste**.
4. Em **Clientes**, crie um cliente OAuth do tipo **Aplicativo da Web** com o URI
   de redirecionamento `http://localhost:3199/auth/callback`.
5. Copie o client ID e o secret para o `.env`:

```bash
cp .env.example .env
```

Enquanto o app estiver em modo **Teste**, o Google expira o login depois de 7
dias. A API responde 401 e é só conectar de novo.

### Resumos a partir do whisper

O botão "Resumo no Google Docs" da tela de gravação do whisper usa mais três
coisas:

6. Em **APIs e serviços → Biblioteca**, ative a **Google Picker API**.
7. Em **APIs e serviços → Credenciais**, crie uma **chave de API**. Restrinja a
   chave à Google Picker API e ao referenciador `http://localhost:3100/*`.
   Ela vai em `GOOGLE_API_KEY`.
8. O **número do projeto** (não o ID) fica no painel inicial do console. Ele
   vai em `GOOGLE_APP_ID`.
9. Crie uma chave em https://console.anthropic.com e coloque em
   `ANTHROPIC_API_KEY`. Os resumos são feitos pelo Claude Opus 5.5 e custam
   por uso, em torno de US$ 0,10 a 0,15 por hora de áudio.

Se você conectou a conta antes do Picker existir, conecte de novo em
`/auth/google` para autorizar a nova permissão.

## Rodando

```bash
pnpm install
pnpm start:dev
```

Abra http://localhost:3199/auth/google e autorize a sua conta. O token fica
salvo em `.google-token.json`, que está no `.gitignore`.

## Endpoints

O `:id` é o trecho da URL do documento: `docs.google.com/document/d/<id>/edit`.

```bash
# Criar um documento (content é opcional)
curl -X POST localhost:3199/docs -H 'content-type: application/json' \
  -d '{"title": "Notas", "content": "Primeira linha"}'

# Ler o texto
curl localhost:3199/docs/<id>

# Adicionar um parágrafo no final
curl -X POST localhost:3199/docs/<id>/append -H 'content-type: application/json' \
  -d '{"text": "Mais uma linha"}'

# Substituir texto em todo o documento (replace vazio apaga)
curl -X POST localhost:3199/docs/<id>/replace -H 'content-type: application/json' \
  -d '{"find": "rascunho", "replace": "final", "matchCase": false}'

# Ver se a conta está conectada
curl localhost:3199/auth/status

# Resumir uma transcrição com o Claude (sem documentId cria um doc novo)
curl -X POST localhost:3199/summaries -H 'content-type: application/json' \
  -d '{"title": "Reunião", "transcript": "...", "documentId": "<id>"}'
```

`GET /auth/picker` devolve o token de acesso, a chave de API e o número do
projeto que o Google Picker precisa no navegador.

A API só escuta em `127.0.0.1`, porque qualquer pessoa que consiga chamá-la
edita documentos como você.

## Testes

```bash
pnpm test      # unitários
pnpm test:e2e  # sobe a aplicação sem falar com o Google
```
