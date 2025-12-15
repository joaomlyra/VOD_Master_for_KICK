# 📼 VOD Master for Kick

![Version](https://img.shields.io/badge/version-1.0.0-green) ![Status](https://img.shields.io/badge/status-stable-blue)

Uma extensão de navegador focada em recuperar e reconstruir o link mestre (`.m3u8`) da **transmissão ao vivo atual** na plataforma Kick.com.

Esta ferramenta permite obter o link direto da stream para uso em players externos (VLC, MPV) ou gerenciadores de download (JDownloader, FFmpeg), permitindo funcionalidades de DVR (voltar a live) em tempo real.

## 🚀 Funcionalidades

- **Reconstrução de Live Atual:** Gera o link `.m3u8` da live que está rolando agora, usando engenharia reversa para encontrar o servidor correto e o ID do usuário.
- **Fallback Inteligente:** - Para a **Live Atual**, tenta gerar o link mestre (M3U8).
- **Correção de "Time Drift":** Algoritmo que testa minutos anteriores e posteriores para garantir o link da live mesmo se houver desincronia de horário.

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
3. O nome do canal (slug) será detectado automaticamente. Clique em **"Get VOD URL"**.
4. **Live Atual:** O link `.m3u8` aparecerá no topo (destaque verde) pronto para copiar.
5. Use o link no seu player favorito (ex: VLC > Mídia > Abrir Transmissão de Rede).

## ⚙️ Como Funciona (Técnico)

A Kick não expõe o link `.m3u8` publicamente. Esta extensão utiliza um método de reconstrução baseado em padrões da infraestrutura Amazon IVS:

1. **Extração de ID:** Captura o `user_id` real através do `playback_url` oculto na API.
2. **Tokens:** Extrai os tokens de autenticação presentes na URL da miniatura (thumbnail).
3. **Validação:** Testa diferentes servidores de ingestão (`3c8...`, `0f3...`) para encontrar onde a live está hospedada ativamente.

## ⚠️ Aviso Legal

Este projeto é uma ferramenta não-oficial e **não é afiliada, associada, autorizada, endossada ou de qualquer forma oficialmente conectada à Kick Streaming Pty Ltd**.

O uso desta ferramenta é para fins educacionais e de acesso pessoal. Respeite os direitos autorais dos criadores de conteúdo.