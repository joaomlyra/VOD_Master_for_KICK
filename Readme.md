# 📼 VOD Master for Kick

![Version](https://img.shields.io/badge/version-1.1.0-green) ![Status](https://img.shields.io/badge/status-stable-blue)

Uma extensão de navegador avançada para recuperar e reconstruir o link mestre (`.m3u8`) da **transmissão ao vivo atual** e de **transmissões passadas (VODs)** na plataforma Kick.com.

Esta ferramenta permite obter o link direto do arquivo de vídeo para uso em players externos (VLC, MPV) ou gerenciadores de download (JDownloader, FFmpeg), permitindo assistir sem anúncios, voltar a live (DVR) e arquivar conteúdo antigo.

## 🚀 Funcionalidades

- **Live Atual (Instantâneo):** Gera o link `.m3u8` da live que está rolando agora, testando automaticamente servidores para encontrar o link funcional.
- **Histórico de VODs (Validação Automática):** Lista as últimas 5 transmissões do canal.
  - **Smart Check:** A extensão testa silenciosamente variações de tempo (minuto exato, -1, +1) para cada vídeo antigo.
  - **Feedback Visual:** O botão "Copy m3u8" só é ativado quando um link válido é encontrado.
- **Filtro Inteligente:** Remove a live atual da lista de "Previous Broadcasts" para evitar duplicidade na interface.
- **Fallback de Web Link:** Caso o arquivo `.m3u8` não possa ser reconstruído (ex: expirou ou formato diferente), fornece um botão "Copy Web Link" para acessar a página pública do vídeo.
- **Correção de "Time Drift":** Algoritmo que compensa a diferença entre o horário da API e o horário real de criação do arquivo no servidor da Amazon IVS.

## 📦 Instalação (Modo Desenvolvedor)

Como esta extensão não está na Chrome Web Store, você deve instalá-la manualmente:

1. Baixe ou clone este repositório em seu computador.
2. Abra o navegador (Chrome, Brave, Edge) e digite na barra de endereços:
   `chrome://extensions/`
3. No canto superior direito, ative a chave **"Modo do desenvolvedor"** (Developer mode).
4. Clique no botão **"Carregar sem compactação"** (Load unpacked).
5. Selecione a pasta onde estão os arquivos deste projeto (`manifest.json`, `popup.js`, etc).

## 🛠️ Como Usar

1. Acesse qualquer canal na [Kick.com](https://kick.com).
2. Clique no ícone da extensão **VOD Master** na barra do navegador.
3. O nome do canal (slug) será detectado automaticamente. Clique em **"Get Stream URLs"**.
4. **Para Live Atual:** O link verde aparecerá no topo ("Verified ✅").
5. **Para VODs Antigas:**
   - Aguarde alguns segundos enquanto os botões mostram **"⏳ Checking..."**.
   - Se o link for encontrado, clique em **"Copy m3u8"**.
   - Se não, use o botão **"Web Link"**.
6. Cole o link no seu player favorito (ex: VLC > Mídia > Abrir Transmissão de Rede).

## ⚙️ Como Funciona (Técnico)

A Kick não expõe o link `.m3u8` publicamente na API v1. Esta extensão utiliza um método de reconstrução ("Frankenstein URL"):

1. **Extração de ID:** Captura o `user_id` real através do `playback_url` ou metadados do canal.
2. **Tokens da Thumbnail:** Extrai os tokens de autenticação presentes na URL da miniatura de cada vídeo específico.
3. **Loop de Validação:** Testa combinações de Servidores de Ingestão (`3c8...`, `0f3...`) x Variações de Minuto (UTC) via requisições `HEAD` assíncronas para garantir que o link existe antes de exibi-lo ao usuário.

## ⚠️ Aviso Legal

Este projeto é uma ferramenta não-oficial e **não é afiliada, associada, autorizada, endossada ou de qualquer forma oficialmente conectada à Kick Streaming Pty Ltd**.

O uso desta ferramenta é para fins educacionais e de acesso pessoal. Respeite os direitos autorais dos criadores de conteúdo.

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.