# Compilar e publicar o Tetriz

Passo a passo para gerar o app Android (APK/AAB) e iOS, testar no celular e enviar às lojas.

- [Preparar o projeto](#preparar-o-projeto)
- [Android](#android)
- [iOS](#ios)
- [Publicar atualizações](#publicar-atualizações)
- [Antes de enviar às lojas](#antes-de-enviar-às-lojas)

| Quero… | Gerar |
| --- | --- |
| Testar no Android | APK debug |
| Publicar na Google Play | AAB assinado |
| Testar no iPhone | Run pelo Xcode ou TestFlight |
| Publicar na App Store | Archive enviado pelo Xcode |

App: **Tetriz** · identificador `com.dynamicmotioncentury.tetriz` · Android 7.0+ · iOS 15+.

## Preparar o projeto

Vale para Android e iOS. Precisa de **Node.js 22 ou superior**.

1. Na pasta do projeto, instale as dependências:

   ```sh
   npm ci
   ```

2. *(Opcional, para o ranking)* Crie `.env.local` na raiz com a URL pública da API:

   ```dotenv
   VITE_API_BASE_URL=https://seu-dominio.com
   ```

   Sem esse arquivo o jogo funciona offline e o ranking fica desativado. Senhas e credenciais do banco **nunca** vão aqui, só no servidor.

3. Compile o jogo e copie para os projetos nativos:

   ```sh
   npm run sync
   ```

> Rode `npm run sync` **sempre** antes de compilar: depois de mudar o jogo ou a URL da API. Sem isso, o app sai com a versão anterior.

## Android

### O que instalar

| Ferramenta | Versão |
| --- | --- |
| Node.js | 22+ |
| Android Studio | 2025.2.1+ (já inclui o Java) |
| Android SDK Platform | 36, pelo SDK Manager do Android Studio |

### Primeira vez

1. Instale o Android Studio e aceite a instalação padrão do SDK.
2. Em **Settings → Languages & Frameworks → Android SDK**, confirme que **API 36** está instalada.
3. Abra o projeto e espere o **Gradle Sync** terminar, instalando o que ele pedir:

   ```sh
   npx cap open android
   ```

   Se não abrir sozinho, use **File → Open** no Android Studio e selecione a pasta `android`.

### APK de teste

**Pelo Android Studio:**

1. Rode `npm run sync`.
2. Clique em **Build → Generate App Bundles or APKs → Generate APKs**.
3. Quando terminar, clique em **locate** no aviso do canto da tela.

**Pelo terminal (Windows/PowerShell):**

```powershell
npm run sync
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat assembleDebug
cd ..
```

No macOS/Linux, use `./gradlew assembleDebug` com `JAVA_HOME` apontando para o JDK do Android Studio.

O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

### Instalar no celular

- **Com cabo:** ative **Opções do desenvolvedor → Depuração USB**, conecte o celular e clique em **Run ▶** no Android Studio.
- **Sem cabo:** envie o `app-debug.apk` ao celular, abra e autorize "instalar apps desconhecidos".

O APK debug é só para testes. Não o publique.

### AAB para a Google Play

1. Rode `npm run sync` e abra o projeto no Android Studio.
2. Clique em **Build → Generate Signed Bundle / APK → Android App Bundle**.
3. Na primeira vez, clique em **Create new** para criar a keystore (chave de upload).
4. Escolha **release** e gere. O arquivo fica em `android/app/release/` ou `android/app/build/outputs/bundle/release/`.

> **Guarde a keystore, o alias e as senhas com backup, fora do repositório.** Todas as próximas versões precisam ser assinadas com a mesma chave.

### Enviar à Google Play

1. No [Play Console](https://play.google.com/console), crie o app e preencha descrição, categoria, ícone, capturas de tela e contato.
2. Preencha os formulários de privacidade, segurança dos dados, classificação indicativa e público-alvo.
3. Em uma faixa de **teste**, envie o AAB e aceite o **Play App Signing**.
4. Instale pelo link de teste e confira o app.
5. Cumpra os requisitos de teste que o Console mostrar para a sua conta e só então promova para **produção**.

### Problemas comuns

| Erro | Solução |
| --- | --- |
| `JAVA_HOME is not set` | defina `JAVA_HOME` como acima ou gere pelo Android Studio |
| `SDK location not found` | abra o projeto uma vez no Android Studio para criar `android/local.properties` |
| Mudança não aparece no app | faltou `npm run sync` antes de compilar |
| Celular recusa instalar por cima | desinstale a versão antiga, assinada com outra chave |

## iOS

### O que instalar

Compilar para iOS **exige um Mac**.

| Ferramenta | Versão |
| --- | --- |
| macOS + Xcode | Xcode 26+, pela App Store do Mac |
| Node.js | 22+ |
| Conta Apple | Apple ID gratuito para testar no próprio iPhone; **Apple Developer Program** (pago) para TestFlight e App Store |

### Primeira vez

1. Instale o Xcode, abra-o uma vez e aceite os componentes adicionais.
2. Clone o repositório no Mac e siga [Preparar o projeto](#preparar-o-projeto), recriando o `.env.local` se usar o ranking.
3. Abra o projeto:

   ```sh
   npx cap open ios
   ```

   Se não abrir sozinho, abra `ios/App/App.xcodeproj`. Espere o Xcode baixar os pacotes (Swift Package Manager). Não é preciso rodar `pod install`.

4. Em **Xcode → Settings → Accounts**, adicione sua conta Apple.
5. Selecione o target **App → Signing & Capabilities**, marque **Automatically manage signing** e escolha o **Team**.

### Testar

- **Simulador:** escolha um iPhone na barra superior do Xcode e clique em **Run ▶**.
- **iPhone real:** conecte o cabo, confie no computador e ative **Ajustes → Privacidade e Segurança → Modo de Desenvolvedor**. Depois selecione o aparelho no Xcode e clique em **Run ▶**.

Com Apple ID gratuito, o app instalado no iPhone expira em 7 dias. Para distribuir a outras pessoas, use o TestFlight.

### TestFlight e App Store

Exige conta no Apple Developer Program.

1. No [App Store Connect](https://appstoreconnect.apple.com), crie o app com o Bundle ID `com.dynamicmotioncentury.tetriz`.
2. No Xcode, rode `npm run sync` antes e selecione o destino **Any iOS Device (arm64)**.
3. Clique em **Product → Archive**.
4. No Organizer que abrir, clique em **Distribute App → App Store Connect** e siga até o upload.
5. Aguarde o processamento e teste pelo **TestFlight**.
6. Preencha descrição, capturas, privacidade, classificação e suporte. Depois selecione a build e envie para **revisão**.

### Problemas comuns

| Erro | Solução |
| --- | --- |
| "Signing requires a development team" | escolha o Team em **Signing & Capabilities** |
| iPhone não aparece no Xcode | desbloqueie, confie no computador e ative o Modo de Desenvolvedor |
| Pacotes não resolvem | **File → Packages → Reset Package Caches** |
| Mudança não aparece no app | faltou `npm run sync` antes de compilar |

## Publicar atualizações

1. Aumente a versão:
   - **Android:** em `android/app/build.gradle`, aumente `versionCode` a cada envio (1, 2, 3…) e mude `versionName` (ex.: `1.1`) quando quiser.
   - **iOS:** no target **App → General**, aumente **Build** a cada envio e mude **Version** quando quiser.
2. Rode `npm run sync`.
3. Gere e assine de novo (AAB ou Archive) e envie.

A versão do `package.json` não altera a versão dos apps.

## Antes de enviar às lojas

- Teste em aparelhos reais: instalação nova, jogar sem internet, recordes, pausa e retomada, orientação, gestos, temas e efeitos.
- Com internet, confira o ranking e o reenvio de partidas jogadas offline.
- A API deve responder em `https://seu-dominio.com/index.php?route=records&rules=1` e permitir as origens `https://localhost` (Android) e `capacitor://localhost` (iOS). Não habilite HTTP sem criptografia para contornar erros.
- Publique uma política de privacidade e um contato de suporte.
- Como nomes e fotos do ranking são públicos, implemente moderação, denúncia e remoção antes do lançamento amplo.
- Revise os modelos visuais que citam marcas de terceiros antes de preparar as imagens da loja.

Referências oficiais: [ambiente Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup) · [assinatura Android](https://developer.android.com/studio/publish/app-signing) · [envio de builds Apple](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds).
