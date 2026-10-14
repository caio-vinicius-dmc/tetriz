# Compilar e publicar o Tetriz

Guia conferido em 14/10/2026. Os projetos nativos existem e os arquivos web foram sincronizados. Isso não significa que um APK/AAB ou archive iOS assinado já foi gerado e validado: essa etapa depende do ambiente nativo e da assinatura da sua empresa.

## 1. Qual arquivo gerar

| Objetivo | Arquivo/caminho |
| --- | --- |
| Instalar diretamente em Android para testar | APK |
| Publicar na Google Play | AAB assinado, via Play App Signing |
| Testar em iPhone | Xcode em dispositivo ou TestFlight |
| Publicar na App Store | Archive do Xcode enviado ao App Store Connect |

O AAB é usado para distribuição na Play Store; não é um APK para instalar diretamente. No iOS, o fluxo recomendado é enviar o archive pelo Xcode, sem precisar exportar manualmente um IPA. Fontes: [assinatura Android](https://developer.android.com/studio/publish/app-signing) e [upload Apple](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds).

## 2. Preparar o projeto

No Windows, abra PowerShell na pasta do projeto:

```powershell
Set-Location 'C:\caminho\para\dmc-tetriz'
node --version
npm ci
npm run sync
```

`npm run sync` compila a interface e copia os arquivos para Android e iOS. Execute novamente sempre que alterar o jogo ou o endereço da API. O servidor Vite não precisa ficar ligado para o aplicativo instalado funcionar.

Confira `.env.local` na raiz:

```dotenv
VITE_API_BASE_URL=https://tetriz.dynamicmotioncentury.com.br
```

Esse arquivo contém somente o endereço público. Senha do MariaDB, DSN e rate_secret ficam exclusivamente na Hostinger, em tetriz-private/config.php. Para trocar de banco, altere a configuração privada no servidor. Para trocar a URL da API, edite .env.local e compile novamente.

Identificador atual: `com.dynamicmotioncentury.tetriz`. Nome: Tetriz. Use esse identificador nas duas lojas, salvo se decidir mudá-lo antes da primeira publicação. Trocar apenas appId no capacitor.config.json não renomeia projetos nativos já criados; namespace/applicationId e Bundle Identifier devem permanecer coerentes.

## 3. Android: ferramentas

Instale Android Studio 2025.2.1 ou superior e Node.js 22 ou superior. O Studio fornece o JDK; selecione seu JDK embutido nas configurações de Gradle. No SDK Manager, instale Android SDK Platform 36 e as ferramentas de build solicitadas pelo projeto. Requisitos: [Capacitor 8](https://capacitorjs.com/docs/getting-started/environment-setup).

Configuração existente em android/variables.gradle: compileSdk 36, targetSdk 36, minSdk 24. Em android/app/build.gradle: versionCode 1 e versionName 1.0.

Abra o projeto:

```powershell
npx cap open android
```

Se não abrir automaticamente, use Open no Android Studio e selecione a pasta android. Aguarde Gradle Sync e instale os componentes que forem solicitados.

## 4. Android: APK de teste

Com um Android conectado por USB e depuração USB habilitada, selecione o aparelho no Android Studio e clique Run. Também é possível usar um emulador.

Para gerar um APK debug pelo terminal, com Android SDK e JDK configurados:

```powershell
Set-Location .\android
.\gradlew.bat assembleDebug
```

Saída padrão: `android/app/build/outputs/apk/debug/app-debug.apk`, relativa à raiz do projeto. Transfira para o celular e autorize a instalação dessa origem quando solicitado. Esse APK é para testes, não é o artefato de publicação.

Se o terminal não encontrar Java/SDK, use o Android Studio para configurar o ambiente antes de repetir. Não publique arquivos debug.

## 5. Android: AAB assinado para a loja

1. No Android Studio, abra Build → Generate Signed Bundle / APK.
2. Escolha Android App Bundle e o módulo app.
3. Na primeira vez, escolha Create new para criar sua upload key/keystore. Guarde o arquivo fora do repositório, por exemplo em uma pasta privada da DMC.
4. Guarde o keystore, alias e senhas em local seguro, com backup. Não escreva senhas no build.gradle nem as envie no chat.
5. Selecione release e gere o bundle. Nas próximas versões, use a mesma upload key.
6. O assistente informa o destino. Conforme as opções escolhidas, o arquivo pode aparecer em android/app/release ou em android/app/build/outputs/bundle/release.

A Google Play usa o AAB assinado com a upload key e o Play App Signing para distribuir as versões aos usuários. [Instruções oficiais de assinatura](https://developer.android.com/studio/publish/app-signing).

## 6. Android: enviar à Google Play

1. Acesse a conta da empresa no [Play Console](https://play.google.com/console).
2. Crie o aplicativo Tetriz e preencha idioma, descrição, categoria e dados de contato.
3. Prepare ícone, imagens da loja e capturas obtidas do aplicativo final.
4. Preencha privacidade, segurança dos dados, classificação indicativa, público-alvo e demais formulários exibidos pelo Console conforme o comportamento real do app.
5. Comece por uma faixa de testes. Envie o AAB, configure Play App Signing quando solicitado e inclua notas da versão.
6. Instale pelo link da faixa de testes e valide o aplicativo distribuído pela loja.
7. Siga os requisitos de testes e verificações indicados para sua conta antes de solicitar produção. O Console mostra os requisitos aplicáveis; não presuma que o primeiro AAB já possa ir direto à produção.

## 7. iOS: preparar no Mac

A compilação local de iOS exige macOS, Xcode 26 ou superior, ferramentas de linha de comando e Node.js 22 ou superior para este Capacitor 8. [Requisitos oficiais](https://capacitorjs.com/docs/getting-started/environment-setup).

Leve o projeto ao Mac incluindo src, public, android, ios, package.json, package-lock.json e capacitor.config.json. Crie .env.local no Mac com a URL pública acima. Não transfira node_modules, caches, server/private ou credenciais do banco.

No Terminal, dentro da pasta copiada:

```sh
npm ci
npm run sync
npx cap open ios
```

Este projeto usa Swift Package Manager; aguarde a resolução dos pacotes no Xcode. Não é necessário executar pod install para esta estrutura. Se a abertura automática falhar, abra ios/App/App.xcodeproj.

## 8. iOS: assinatura e teste

1. Adicione a conta Apple ao Xcode e selecione o target App.
2. Em Signing & Capabilities, selecione o Team da DMC e a assinatura automática.
3. Confira Bundle Identifier: com.dynamicmotioncentury.tetriz.
4. Confira nome Tetriz, Version 1.0 e Build 1.
5. Selecione um simulador e execute Run. Depois teste em iPhone físico, configurando a assinatura do aparelho.
6. Para distribuir via TestFlight/App Store, use uma conta participante do Apple Developer Program.

## 9. iOS: Archive, TestFlight e App Store

1. No App Store Connect, crie o registro do aplicativo com o Bundle ID correspondente.
2. No Xcode, selecione um destino de dispositivo genérico compatível, não um simulador.
3. Execute Product → Archive.
4. No Organizer, selecione o archive e use Distribute App → App Store Connect. Siga a validação e o upload apresentados pelo Xcode.
5. Aguarde o processamento no App Store Connect e teste via TestFlight.
6. Preencha os dados da versão, capturas, privacidade, classificação, suporte e informações para revisão.
7. Selecione a build processada, responda às perguntas de exportação/criptografia conforme o app real e envie para revisão.

O upload e o processamento não equivalem à aprovação da loja. [Upload oficial Apple](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds) e [seleção da build](https://developer.apple.com/help/app-store-connect/manage-builds/choose-a-build-to-submit/).

## 10. Publicar atualizações

- Android: aumente versionCode a cada envio; altere versionName quando mudar a versão exibida. Arquivo: android/app/build.gradle.
- iOS: aumente Build a cada novo upload; altere Version quando mudar a versão comercial. Faça isso no target App do Xcode.
- Execute npm run sync depois de mudanças na interface/API.
- Compile novamente, assine e envie a nova build.
- Atualizar só a versão em package.json não aumenta automaticamente versionCode ou Build.

## 11. Verificação antes do envio

Teste em aparelhos físicos: instalação nova, abertura sem internet, fim de partida, recordes locais, retomada pausada, orientação horizontal/vertical, gestos, temas e efeitos. Com internet, confirme ranking e envio/reenvio, inclusive após jogar offline.

A API da Hostinger precisa estar na versão atual: consulta records deve devolver records, page e rules. Configure as origens https://localhost (Android) e capacitor://localhost (iOS). O app usa HTTPS; não habilite cleartext para contornar problemas de configuração.

Complete política de privacidade e contato real da DMC. Confira os ícones e telas de abertura no aplicativo nativo. Como nomes/fotos podem ser públicos, o projeto ainda precisa de um fluxo adequado de moderação/denúncia e remoção antes do lançamento amplo; a versão atual não entrega esses controles. Revise também os nomes dos modelos que fazem referência a outras marcas antes de preparar o material público da loja.

Estado atual: testes web e sincronização concluídos. Builds nativas assinadas, testes físicos e publicação ainda dependem das ferramentas/contas acima. Nenhum APK/AAB/IPA de produção é fornecido por este guia.
