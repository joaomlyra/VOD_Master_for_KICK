document.addEventListener('DOMContentLoaded', () => {
    const slugInput = document.getElementById('slug-input');
    const fetchBtn = document.getElementById('btn-fetch');
    const statusDiv = document.getElementById('status');
    
    // Live Section Elements
    const resultArea = document.getElementById('result-area');
    const vodLinkInput = document.getElementById('vod-link');
    const copyBtn = document.getElementById('btn-copy');
    const resultLabel = document.getElementById('result-label');
    const fallbackMsg = document.getElementById('fallback-msg');

    // VOD List Section Elements
    const vodListArea = document.getElementById('vod-list-area');
    const vodListContainer = document.getElementById('vod-list');

    const SERVERS = [
        "3c81249a5ce0", // Principal
        "0f3cb0ebce7",
        "c6d162017260",
        "fa723fc1b171"
    ];

    // --- INITIALIZATION ---
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url.includes('kick.com')) {
            const parts = currentTab.url.split('/');
            const candidate = parts[3];
            if (candidate && !['api', 'video'].includes(candidate)) {
                slugInput.value = candidate;
            }
        }
    });

    fetchBtn.addEventListener('click', () => {
        const slug = slugInput.value.trim();
        if (slug) reconstructVOD(slug);
    });

    copyBtn.addEventListener('click', () => {
        copyText(vodLinkInput.value, copyBtn);
    });

    // --- HELPER FUNCTIONS ---

    function copyText(text, btnElement) {
        navigator.clipboard.writeText(text);
        const originalText = btnElement.innerText;
        btnElement.innerText = "Copied!";
        setTimeout(() => btnElement.innerText = originalText, 1500);
    }

    function getUserId(data) {
        const playbackUrl = data.playback_url || "";
        const idMatch = playbackUrl.match(/us-west-2\.(\d+)\.channel/);
        
        if (idMatch && idMatch[1]) {
            return idMatch[1];
        }
        return data.user_id || (data.livestream ? data.livestream.channel_id : null);
    }

    /**
     * Tenta encontrar o link correto testando variações de minuto e servidor
     */
    async function findWorkingUrl(streamObject, userId) {
        try {
            // 1. Extrair dados básicos
            const thumbData = streamObject.thumbnail;
            const thumbUrl = (thumbData && (thumbData.url || thumbData.src)) ? (thumbData.url || thumbData.src) : "";
            const tokenMatch = thumbUrl.match(/\/video_thumbnails\/([^\/]+)\/([^\/]+)\//);
            
            if (!tokenMatch) return null;
            const token1 = tokenMatch[1];
            const token2 = tokenMatch[2];

            const rawDate = streamObject.created_at; 
            const dateStr = rawDate.replace(" ", "T") + (rawDate.includes("Z") ? "" : "Z");
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) return null;

            const m = dateObj.getUTCMinutes();

            // 2. Definir estratégia de teste
            // Ordem de prioridade: Minuto -1 (comum), Minuto 0 (exato), Minuto +1
            const offsetsToTest = [-1, 0, 1];

            // Loop Principal
            for (const server of SERVERS) {
                for (const offset of offsetsToTest) {
                    
                    // Clona a data para não alterar a original
                    const loopDate = new Date(dateObj);
                    loopDate.setUTCMinutes(m + offset);

                    const tYYYY = loopDate.getUTCFullYear();
                    const tM = loopDate.getUTCMonth() + 1;
                    const tD = loopDate.getUTCDate();
                    const tH = loopDate.getUTCHours();
                    const tm = loopDate.getUTCMinutes();

                    const url = `https://stream.kick.com/${server}/ivs/v1/${userId}/${token1}/${tYYYY}/${tM}/${tD}/${tH}/${tm}/${token2}/media/hls/master.m3u8`;

                    try {
                        // Teste Rápido (HEAD request)
                        const head = await fetch(url, { method: 'HEAD' });
                        if (head.ok) {
                            return url; // Achou! Retorna e encerra.
                        }
                    } catch (e) {
                        // Ignora erros de rede e tenta o próximo
                    }
                }
            }
        } catch (e) {
            console.error("Erro na busca:", e);
        }
        return null; // Não achou nada
    }

    // --- MAIN LOGIC ---

    async function reconstructVOD(slug) {
        statusDiv.innerHTML = "Fetching API...";
        statusDiv.style.color = "#ccc";
        
        // Reset UI
        resultArea.classList.add('hidden');
        fallbackMsg.classList.add('hidden');
        vodListArea.classList.add('hidden');
        vodListContainer.innerHTML = "";
        vodLinkInput.value = "";
       
        let data = null;

        try {
            const response = await fetch(`https://kick.com/api/v1/channels/${slug}`);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            data = await response.json();

            const targetId = getUserId(data);
            if (!targetId) throw new Error("Could not find User ID.");

            let currentLiveId = null;

            // Processar Live
            if (data.livestream) {
                currentLiveId = data.livestream.id;
                statusDiv.innerHTML = "Checking Live link...";
                // Reutilizamos a função de busca robusta também para a live
                const liveUrl = await findWorkingUrl(data.livestream, targetId);
                
                if (liveUrl) {
                    showLiveResult(liveUrl, "Live m3u8 (Verified ✅)");
                    statusDiv.innerHTML = "LIVE Link found.";
                    statusDiv.style.color = "#53fc18";
                } else {
                    statusDiv.innerHTML = "Live detected but URL failed.";
                }
            } else {
                statusDiv.innerHTML = "Channel is Offline.";
                statusDiv.style.color = "#ff4444";
            }

            // Processar VODs
            if (data.previous_livestreams && data.previous_livestreams.length > 0) {
                processPreviousStreams(data.previous_livestreams, targetId, slug, currentLiveId);
            }

        } catch (err) {
            console.error(err);
            statusDiv.innerHTML = `Error: ${err.message}`;
            statusDiv.style.color = "#ff4444";
        }
    }

    function processPreviousStreams(streams, userId, channelSlug, excludeId) {
        // Filtra a live atual e pega os 5 últimos
        const filteredList = excludeId ? streams.filter(s => s.id !== excludeId) : streams;
        const list = filteredList.slice(0, 5);
        
        list.forEach(async (vod) => {
            const videoId = (vod.video && vod.video.uuid) ? vod.video.uuid : (vod.session_id || vod.uuid || vod.slug);
            const publicUrl = `https://kick.com/${channelSlug}/videos/${videoId}`; 
            
            // Criação dos Elementos UI
            const itemDiv = document.createElement('div');
            itemDiv.className = 'vod-item';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'vod-title';
            titleDiv.innerText = vod.session_title || "Untitled Stream";
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'vod-date';
            dateDiv.innerText = new Date(vod.created_at).toLocaleString();

            const actionDiv = document.createElement('div');
            actionDiv.className = 'vod-actions';

            // BOTÃO M3U8 (Estado Inicial: Carregando)
            const btnM3u8 = document.createElement('button');
            btnM3u8.className = 'vod-btn btn-m3u8';
            btnM3u8.innerText = "⏳ Checking..."; 
            btnM3u8.disabled = true;
            btnM3u8.style.opacity = "0.7";
            actionDiv.appendChild(btnM3u8);

            // BOTÃO PUBLICO (Sempre disponível)
            const btnPublic = document.createElement('button');
            btnPublic.className = 'vod-btn btn-public';
            btnPublic.innerText = "Web Link";
            btnPublic.onclick = () => copyText(publicUrl, btnPublic);
            actionDiv.appendChild(btnPublic);

            itemDiv.appendChild(titleDiv);
            itemDiv.appendChild(dateDiv);
            itemDiv.appendChild(actionDiv);
            vodListContainer.appendChild(itemDiv);

            // VALIDAÇÃO ASSÍNCRONA
            // O código continua rodando e preenche o botão quando achar
            const validUrl = await findWorkingUrl(vod, userId);
            
            if (validUrl) {
                btnM3u8.innerText = "Copy m3u8";
                btnM3u8.disabled = false;
                btnM3u8.style.opacity = "1";
                btnM3u8.onclick = () => copyText(validUrl, btnM3u8);
            } else {
                // Se não achar, remove o botão para não confundir
                btnM3u8.remove();
                btnPublic.style.width = "100%"; // Expande o botão público
                btnPublic.innerText = "Copy Web Link (No m3u8)";
            }
        });

        vodListArea.classList.remove('hidden');
    }

    function showLiveResult(url, label) {
        resultLabel.innerText = label;
        vodLinkInput.value = url;
        resultArea.classList.remove('hidden');
    }
});