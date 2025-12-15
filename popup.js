document.addEventListener('DOMContentLoaded', () => {
    const slugInput = document.getElementById('slug-input');
    const fetchBtn = document.getElementById('btn-fetch');
    const statusDiv = document.getElementById('status');
    const resultArea = document.getElementById('result-area');
    const vodLinkInput = document.getElementById('vod-link');
    const copyBtn = document.getElementById('btn-copy');
    const resultLabel = document.getElementById('result-label');
    const fallbackMsg = document.getElementById('fallback-msg');

    const SERVERS = [
        "3c81249a5ce0",
        "0f3cb0ebce7", 
        "c6d162017260", 
        "fa723fc1b171"
    ];

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
        vodLinkInput.select();
        navigator.clipboard.writeText(vodLinkInput.value);
        copyBtn.innerText = "Copiado!";
        setTimeout(() => copyBtn.innerText = "Copiar Link", 1500);
    });

    async function reconstructVOD(slug) {
        statusDiv.innerHTML = "Lendo API...";
        statusDiv.style.color = "#ccc";
        resultArea.classList.add('hidden');
        fallbackMsg.classList.add('hidden');
        vodLinkInput.value = "";
        
        let data = null;
        let generatedUrl = "";

        try {
            const response = await fetch(`https://kick.com/api/v1/channels/${slug}`);
            if (!response.ok) throw new Error(`Erro API: ${response.status}`);
            
            data = await response.json();

            if (!data.livestream) {
                statusDiv.innerHTML = "Canal OFFLINE.";
                statusDiv.style.color = "#ff4444";
                return;
            }

            // --- EXTRAÇÃO CIRÚRGICA DO ID ---
            const playbackUrl = data.playback_url || "";
            
            // Procura o padrão: us-west-2.{NUMEROS}.channel
            const idMatch = playbackUrl.match(/us-west-2\.(\d+)\.channel/);
            
            let targetId = null;
            
            if (idMatch && idMatch[1]) {
                targetId = idMatch[1];
                console.log("ID extraído do Playback URL:", targetId);
            } else {
                console.warn("Regex falhou no playback_url, tentando user_id do JSON...");
                targetId = data.user_id || data.livestream.channel_id;
            }

            if (!targetId) throw new Error("ID do Usuário não encontrado.");

            // --- EXTRAÇÃO DE TOKENS DA THUMBNAIL ---
            const thumbUrl = data.livestream.thumbnail?.url || "";
            const tokenMatch = thumbUrl.match(/\/video_thumbnails\/([^\/]+)\/([^\/]+)\//);
            
            if (!tokenMatch) throw new Error("Tokens da thumbnail não encontrados.");
            
            const token1 = tokenMatch[1]; 
            const token2 = tokenMatch[2]; 

            // --- DATA LITERAL ---
            const rawDate = data.livestream.created_at; 
            const dateParts = rawDate.split(/[- :]/);

            if (dateParts.length < 5) throw new Error("Formato de data desconhecido");

            const YYYY = parseInt(dateParts[0]);
            const M = parseInt(dateParts[1]);
            const D = parseInt(dateParts[2]);
            const H = parseInt(dateParts[3]); 
            const m = parseInt(dateParts[4]); 

            // Monta o link padrão (baseado no minuto exato)
            generatedUrl = `https://stream.kick.com/${SERVERS[0]}/ivs/v1/${targetId}/${token1}/${YYYY}/${M}/${D}/${H}/${m}/${token2}/media/hls/master.m3u8`;

            statusDiv.innerHTML = "Validando link...";
            
            let confirmedUrl = null;
            
            // ATUALIZAÇÃO: Testamos Anterior, Atual e Próximo
            const minutesToTest = [m - 1, m, m + 1];

            outerLoop:
            for (const server of SERVERS) {
                for (const testMin of minutesToTest) {
                    
                    // Ajuste matemático para não quebrar se for minuto -1 ou 60
                    let safeMin = testMin;
                    if (safeMin < 0) safeMin = 59;
                    if (safeMin > 59) safeMin = 0;
                    
                    const url = `https://stream.kick.com/${server}/ivs/v1/${targetId}/${token1}/${YYYY}/${M}/${D}/${H}/${safeMin}/${token2}/media/hls/master.m3u8`;
                    
                    console.log("Tentando:", url);
                    
                    try {
                        const head = await fetch(url, { method: 'HEAD' });
                        if (head.ok) { 
                            confirmedUrl = url; 
                            break outerLoop; 
                        }
                    } catch (e) {}
                }
            }

            if (confirmedUrl) {
                showResult(confirmedUrl, "Link VOD (Verificado ✅)");
                statusDiv.innerHTML = "BINGO! Link encontrado.";
                statusDiv.style.color = "#53fc18"; 
            } else {
                console.warn("Validação falhou. Mostrando gerado.");
                showResult(generatedUrl, "Link Gerado (Provável)");
                statusDiv.innerHTML = "Link gerado (Teste no JDownloader):";
                statusDiv.style.color = "#fce818"; 
                fallbackMsg.textContent = "Se der erro 404, o servidor do arquivo pode ser outro.";
                fallbackMsg.classList.remove('hidden');
            }

        } catch (err) {
            console.error(err);
            statusDiv.innerHTML = `Erro: ${err.message}`;
            statusDiv.style.color = "#ff4444";
            
            if (data?.livestream?.slug) {
                const fbUrl = `https://kick.com/${slug}/videos/${data.livestream.slug}`;
                vodLinkInput.value = fbUrl;
                resultArea.classList.remove('hidden');
            }
        }
    }

    function showResult(url, label) {
        resultLabel.innerText = label;
        vodLinkInput.value = url;
        resultArea.classList.remove('hidden');
    }
});