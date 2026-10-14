# Tetriz · DMC

Jogo de blocos para Android e iOS, criado pela **DMC — Dynamic Motion Century**. A partida funciona offline; o ranking global é opcional e não exige criação de conta.

## Recursos

- Partida contínua com velocidade crescente, quatro dificuldades e encaixe automático opcional.
- Controles por botões, teclado e arraste direto na peça.
- Reserva, próximas peças e projeção de encaixe.
- Layout vertical/horizontal, temas claro/escuro e 13 modelos visuais de blocos.
- Efeitos de linhas e combos configuráveis.
- Progresso, preferências e recordes salvos no aparelho; retomada da partida pausada.
- Publicação opcional de nome, avatar/foto e resultado no ranking global, com fila de reenvio para partidas jogadas offline.

## Requisitos

| Para | Necessário |
| --- | --- |
| Jogar no navegador / compilar a interface | Node.js 22+ e npm |
| Android | Android Studio 2025.2.1+ (JDK embutido) e Android SDK Platform 36 |
| iOS | macOS com Xcode 26+ e conta Apple Developer para distribuir |
| Ranking global (opcional) | Hospedagem com HTTPS, PHP 8.2+ (PDO MySQL e GD) e MariaDB/MySQL |

## Instalação

```sh
git clone https://github.com/caio-vinicius-dmc/dmc-tetriz.git
cd dmc-tetriz
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite (`http://127.0.0.1:5173`). Sem `VITE_API_BASE_URL` configurada, o jogo funciona normalmente e apenas o ranking global fica indisponível.

Teclado: ← → movem, ↑ gira, ↓ desce, espaço solta, C reserva e Esc pausa.

Outros comandos:

- `npm run build`: gera a versão de produção em `dist/`.
- `npm run preview`: serve a build de `dist/` localmente.
- `npm run sync`: gera a build e atualiza os projetos Android e iOS.

## Configurar o ranking (opcional)

### App

Copie `.env.example` para `.env.local` e informe **somente a URL pública da API** (obrigatoriamente HTTPS):

```dotenv
VITE_API_BASE_URL=https://seu-dominio.com
```

A URL é embutida na build: depois de alterá-la, execute `npm run sync` e compile o app novamente.

### Servidor

Estrutura recomendada na hospedagem:

```text
dominio/
  tetriz-private/      ← fora da pasta pública
    config.php
    validation.php
  public_html/
    index.php
    .htaccess
    .user.ini
```

1. Habilite HTTPS e as extensões PHP PDO MySQL e GD.
2. Crie o banco e importe `server/schema.sql` (por exemplo, pelo phpMyAdmin).
3. Envie o conteúdo de `server/public/` (incluindo os arquivos ocultos) para `public_html/`.
4. Envie `server/validation.php` para `tetriz-private/`.
5. Copie `server/config.example.php` para `tetriz-private/config.php` e preencha DSN, usuário e senha do banco.
6. Gere o `rate_secret` com `php -r "echo bin2hex(random_bytes(32));"` e mantenha `require_https => true`.
7. Em `origins`, mantenha `https://localhost` (Android) e `capacitor://localhost` (iOS). Para testar pelo `npm run dev`, adicione `http://127.0.0.1:5173`.
8. Acesse `https://seu-dominio.com/index.php?route=records&rules=1`: a resposta deve conter `records`, `page` e `rules`.

Por padrão, a API procura `tetriz-private` ao lado da raiz pública (`DOCUMENT_ROOT`), funcionando na raiz do domínio ou em `/api`. Para outra estrutura, defina a variável de ambiente `TETRIZ_PRIVATE_DIR` com um caminho absoluto privado.

**Nunca coloque credenciais do banco em variáveis `VITE_`, no app ou na pasta pública.** Trocar de banco exige editar apenas `tetriz-private/config.php`.

## Compilar Android e iOS

```sh
npm run sync
npx cap open android
# No Mac:
npx cap open ios
```

Android: gere APK para testes e AAB assinado para a Google Play. iOS: assine no Xcode e envie o archive ao App Store Connect. O passo a passo completo, incluindo assinatura, versões e checklist antes do envio às lojas, está em [Compilar e publicar](docs/COMPILAR-E-PUBLICAR.md).

Chaves de assinatura, senhas e configurações locais não fazem parte do repositório.

## Ranking

O ranking lista partidas (não pessoas únicas), ordenadas por pontuação decrescente, com 20 resultados por página. Em caso de empate, vence a partida mais antiga. Cada modo tem sua própria tabela, identificada pelo parâmetro `rules`:

| Dificuldade | Normal | Encaixe automático |
| --- | --- | --- |
| Fácil | 10 | 14 |
| Médio | 1 | 15 |
| Difícil | 12 | 16 |
| Profissional | 13 | 17 |

Cada resultado tem um identificador único, o que evita duplicação no reenvio. A validação no servidor verifica plausibilidade, mas partidas offline não oferecem prova de autenticidade para competições com premiação.

Sem conta, os dados locais não são recuperáveis entre aparelhos e podem ser apagados ao desinstalar o app.

## Estrutura

- `src/`: jogo e interface.
- `public/`: recursos estáticos.
- `server/`: API PHP, validação, schema e modelo de configuração.
- `android/` e `ios/`: projetos nativos Capacitor.
- `scripts/generate-icons.mjs`: regenera ícones e telas de abertura nativos (usa Playwright com o Google Chrome instalado no Windows).
- `docs/`: guia de compilação e publicação.

## Licença

Distribuído sob a [licença MIT](LICENSE): uso, modificação e distribuição são livres, inclusive para fins comerciais, desde que o aviso de licença seja preservado. Dependências mantêm suas próprias licenças. A licença não concede direitos sobre marcas de terceiros mencionadas nos modelos visuais.
