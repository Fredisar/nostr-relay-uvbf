// =============================================================================
// CONFIGURATION OPTIMISÉE DES RELAYS
// =============================================================================

// 🔧 Relays triés par fiabilité (les plus rapides en premier)
const RELAY_URLS = [
    "wss://relay.nostr.band",        // Très rapide et fiable
    "wss://nos.lol",                 // Performant
    "wss://relay.damus.io",          // Stable mais parfois chargé
    "wss://nostr.wine",              // Bonne alternative
    "wss://relay.current.fyi"        // Relay rapide
];

// =============================================================================
// GESTION OPTIMISÉE DES RELAYS
// =============================================================================

async function connectToRelays() {
    const status = document.getElementById('status');
    const relaysStatus = document.getElementById('relays-status');
    
    status.className = 'status pending';
    status.innerHTML = '<div class="status-dot"></div><span>Connexion aux relays...</span>';
    
    relaysStatus.innerHTML = '';
    let connectedCount = 0;

    // 🔥 CONNEXION PARALLÈLE avec timeout individuel
    const connectionPromises = RELAY_URLS.map(async (url) => {
        try {
            console.log(`🔌 Tentative de connexion à: ${url}`);
            
            const relay = NostrTools.relayInit(url);
            
            // Timeout réduit à 5 secondes par relay
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout 5s')), 5000)
            );
            
            await Promise.race([relay.connect(), timeoutPromise]);
            
            relays.set(url, relay);
            connectedCount++;
            
            console.log(`✅ Connecté à: ${url}`);
            updateRelayStatus(url, 'connected', '✅ Connecté');
            
            // S'abonner aux messages
            subscribeToRelay(relay, url);
            
            return { url, success: true };
            
        } catch (error) {
            console.log(`❌ Erreur connexion ${url}:`, error.message);
            updateRelayStatus(url, 'error', `❌ ${error.message}`);
            return { url, success: false, error: error.message };
        }
    });

    // Attendre toutes les connexions
    const results = await Promise.allSettled(connectionPromises);
    
    // Mise à jour du statut global
    updateConnectionStatus(connectedCount);
    
    // 🔥 Si moins de 2 relays connectés, essayer les backups
    if (connectedCount < 2) {
        await tryBackupRelays();
    }
}

// 🔧 RELAYS DE BACKUP (se connectent si pas assez de relays principaux)
async function tryBackupRelays() {
    const backupRelays = [
        "wss://offchain.pub",
        "wss://eden.nostr.land",
        "wss://relay.snort.social"
    ];
    
    console.log('🔄 Essai des relays de backup...');
    
    for (const url of backupRelays) {
        if (relays.size >= 3) break; // Stop si on a assez de relays
        
        try {
            const relay = NostrTools.relayInit(url);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 4000)
            );
            
            await Promise.race([relay.connect(), timeoutPromise]);
            relays.set(url, relay);
            
            console.log(`✅ Backup connecté: ${url}`);
            updateRelayStatus(url, 'connected', '✅ Backup');
            subscribeToRelay(relay, url);
            
        } catch (error) {
            console.log(`❌ Backup échoué: ${url}`);
        }
    }
    
    updateConnectionStatus(relays.size);
}

function updateConnectionStatus(connectedCount) {
    const status = document.getElementById('status');
    
    if (connectedCount > 0) {
        isConnected = true;
        status.className = 'status connected';
        status.innerHTML = `<div class="status-dot"></div><span>✅ Connecté à ${connectedCount} relay(s)</span>`;
        
        // 🔥 Afficher un message de statut optimisé
        showStatusMessage(`Réseau Nostr opérationnel (${connectedCount} relay(s))`, 'success');
        
    } else {
        isConnected = false;
        status.className = 'status error';
        status.innerHTML = '<div class="status-dot"></div><span>❌ Aucun relay disponible</span>';
        showStatusMessage('Impossible de se connecter au réseau Nostr', 'error');
    }
}

// 🔧 FONCTION DE RÉESSAI INTELLIGENT
function setupReconnection() {
    // Réessayer automatiquement après 30 secondes si moins de 2 relays
    setInterval(() => {
        if (relays.size < 2 && userKeys) {
            console.log('🔄 Reconnexion automatique...');
            connectToRelays();
        }
    }, 30000);
}

// 🔧 MESSAGE DE STATUT TEMPORAIRE
function showStatusMessage(message, type) {
    // Créer un message temporaire
    const existingMessage = document.getElementById('temp-status-message');
    if (existingMessage) existingMessage.remove();
    
    const statusMessage = document.createElement('div');
    statusMessage.id = 'temp-status-message';
    statusMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    
    statusMessage.textContent = message;
    document.body.appendChild(statusMessage);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        if (statusMessage.parentNode) {
            statusMessage.remove();
        }
    }, 5000);
}

// =============================================================================
// ABONNEMENT OPTIMISÉ
// =============================================================================

function subscribeToRelay(relay, url) {
    if (!userKeys) return;

    try {
        // 🔥 FILTRES OPTIMISÉS - limiter la quantité de données
        const sub = relay.sub([
            {
                kinds: [4],
                '#p': [userKeys.publicKey],
                since: Math.floor(Date.now() / 1000) - 86400 // 24h max
            }
        ], {
            skipVerification: true // Accélérer le traitement
        });
        
        sub.on('event', async (event) => {
            try {
                // 🔥 Vérifier rapidement si c'est un nouveau message
                if (isNewMessage(event.id)) {
                    console.log(`📨 Nouveau message de ${url}`);
                    
                    const decrypted = await NostrTools.nip04.decrypt(
                        userKeys.privateKey,
                        event.pubkey,
                        event.content
                    );
                    
                    showMessage(decrypted, 'received', event.pubkey, url);
                    storeMessageId(event.id);
                }
            } catch (error) {
                console.log(`❌ Erreur déchiffrement:`, error);
            }
        });

        sub.on('eose', () => {
            console.log(`📬 Synchronisation terminée pour: ${url}`);
        });

    } catch (error) {
        console.log(`❌ Erreur abonnement:`, error);
    }
}

// 🔧 ÉVITER LES DOUBLONS
const processedMessages = new Set();

function isNewMessage(messageId) {
    if (processedMessages.has(messageId)) {
        return false;
    }
    processedMessages.add(messageId);
    
    // Nettoyer périodiquement (éviter fuite mémoire)
    if (processedMessages.size > 1000) {
        const array = Array.from(processedMessages);
        processedMessages.clear();
        // Garder les 500 plus récents
        array.slice(-500).forEach(id => processedMessages.add(id));
    }
    
    return true;
}

function storeMessageId(messageId) {
    const stored = JSON.parse(localStorage.getItem('uvbf_processed_messages') || '[]');
    stored.push(messageId);
    
    // Garder seulement les 500 derniers
    if (stored.length > 500) {
        stored.splice(0, stored.length - 500);
    }
    
    localStorage.setItem('uvbf_processed_messages', JSON.stringify(stored));
}

// =============================================================================
// INITIALISATION AMÉLIORÉE
// =============================================================================

window.addEventListener('load', function() {
    console.log('🔍 Initialisation UVBF Nostr...');
    
    if (typeof NostrTools === 'undefined') {
        showStatusMessage('Erreur: bibliothèque non chargée', 'error');
        return;
    }
    
    console.log('✅ NostrTools chargé');
    loadKeys();
    
    // 🔥 Démarrer la reconnexion automatique
    setupReconnection();
});

// Modifiez votre fonction loadKeys() pour inclure les messages traités
function loadKeys() {
    const saved = localStorage.getItem('uvbf_nostr_keys');
    if (saved) {
        try {
            userKeys = JSON.parse(saved);
            showKeys();
            
            // Charger les IDs de messages déjà traités
            const storedMessages = JSON.parse(localStorage.getItem('uvbf_processed_messages') || '[]');
            storedMessages.forEach(id => processedMessages.add(id));
            
            connectToRelays();
        } catch (e) {
            console.log('ℹ️ Pas de clés sauvegardées');
        }
    }
}