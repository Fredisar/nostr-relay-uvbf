// =============================================================================
// VARIABLES GLOBALES
// =============================================================================

// Au début de votre script.js, ajoutez :
console.log('🔍 Vérification des bibliothèques...');
console.log('NostrTools:', typeof NostrTools);
console.log('QRCode:', typeof QRCode);
console.log('Méthodes QRCode disponibles:', Object.keys(QRCode || {}));

let userKeys = null;
let currentQRCode = null;
let relay = null;
let isConnected = false;

// =============================================================================
// INITIALISATION
// =============================================================================

window.addEventListener('load', function() {
    console.log('🔍 Initialisation UVBF Nostr...');
    console.log('NostrTools:', typeof NostrTools);
    
    // Vérifier les dépendances
    if (typeof NostrTools === 'undefined') {
        alert('Erreur: nostr-tools non chargé. Vérifiez la connexion internet.');
        return;
    }
    
    if (typeof QRCode === 'undefined') {
        console.warn('⚠️ Bibliothèque QR Code non chargée');
    } else {
        console.log('✅ Module QR Code opérationnel');
    }
    
    loadKeys();
});

// =============================================================================
// GESTION DES CLÉS
// =============================================================================

function setButtonState(loading) {
    const btn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    
    if (btn && btnText && spinner) {
        if (loading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'block';
        } else {
            btn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    }
}

function generateKeys() {
    console.log('🔄 Début de la génération des clés...');
    setButtonState(true);
    
    if (typeof NostrTools === 'undefined') {
        alert('❌ nostr-tools non chargé. Rafraîchissez la page.');
        setButtonState(false);
        return;
    }

    try {
        const privateKey = NostrTools.generatePrivateKey();
        const publicKey = NostrTools.getPublicKey(privateKey);
        
        userKeys = { 
            privateKey: privateKey,
            publicKey: publicKey 
        };
        
        saveKeys(userKeys);
        showKeys();
        updateExistingQRCodes();
        connectToRelay();
        
        showStatusMessage('✅ Clés générées avec succès !', 'success');
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
        alert('❌ Erreur lors de la génération des clés: ' + error.message);
    } finally {
        setButtonState(false);
    }
}

function loadKeys() {
    const saved = localStorage.getItem('uvbf_nostr_keys');
    if (saved) {
        try {
            userKeys = JSON.parse(saved);
            showKeys();
            connectToRelay();
        } catch (e) {
            console.log('ℹ️ Pas de clés sauvegardées ou erreur de parsing');
        }
    }
}

function saveKeys(keys) {
    localStorage.setItem('uvbf_nostr_keys', JSON.stringify(keys));
}

function showKeys() {
    if (!userKeys) return;

    try {
        document.getElementById('pubkey-display').textContent = userKeys.publicKey;
        document.getElementById('privkey-display').textContent = userKeys.privateKey;
        
        document.getElementById('keys-section').style.display = 'block';
        document.getElementById('message-section').style.display = 'block';
        document.getElementById('messages-section').style.display = 'block';
        
        updateExistingQRCodes();
        
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Erreur affichage clés:', error);
    }
}

// =============================================================================
// GESTION DES RELAYS
// =============================================================================

async function connectToRelay() {
    if (!userKeys) return;
    
    const status = document.getElementById('status');
    try {
        status.className = 'status pending';
        status.innerHTML = '<div class="status-dot"></div><span>Connexion au relay...</span>';
        
        relay = NostrTools.relayInit('ws://localhost:8080');
        await relay.connect();
        
        isConnected = true;
        status.className = 'status connected';
        status.innerHTML = '<div class="status-dot"></div><span>✅ Connecté au relay UVBF</span>';
        
        // Écouter les messages
        const sub = relay.sub([{
            kinds: [4],
            '#p': [userKeys.publicKey]
        }]);
        
        sub.on('event', async (event) => {
            try {
                const decrypted = await NostrTools.nip04.decrypt(
                    userKeys.privateKey,
                    event.pubkey,
                    event.content
                );
                showMessage(decrypted, 'received', event.pubkey);
            } catch (error) {
                console.log('Erreur déchiffrement:', error);
            }
        });
        
    } catch (error) {
        status.className = 'status error';
        status.innerHTML = '<div class="status-dot"></div><span>❌ Erreur de connexion au relay</span>';
        console.log('Erreur connexion:', error);
    }
}

// =============================================================================
// GESTION DES MESSAGES
// =============================================================================

async function sendMessage() {
    if (!userKeys || !isConnected) {
        alert('Générez d\'abord des clés et attendez la connexion');
        return;
    }

    const recipient = document.getElementById('recipient').value.trim();
    const content = document.getElementById('message').value.trim();
    
    if (!recipient || !content) {
        alert('Remplissez tous les champs');
        return;
    }

    try {
        console.log('Début chiffrement...');
        const encrypted = await NostrTools.nip04.encrypt(
            userKeys.privateKey,
            recipient,
            content
        );

        const event = {
            kind: 4,
            pubkey: userKeys.publicKey,
            created_at: Math.floor(Date.now() / 1000),
            tags: [['p', recipient]],
            content: encrypted
        };

        event.id = NostrTools.getEventHash(event);
        event.sig = NostrTools.signEvent(event, userKeys.privateKey);

        await relay.publish(event);
        showMessage(content, 'sent', recipient);
        
        document.getElementById('message').value = '';
        
    } catch (error) {
        alert('Erreur: ' + error.message);
        console.log('Erreur détaillée:', error);
    }
}

function showMessage(content, type, pubkey) {
    const container = document.getElementById('messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const shortKey = pubkey.substring(0, 10) + '...';
    const time = new Date().toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${type === 'sent' ? 'À' : 'De'} ${shortKey}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${content}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// =============================================================================
// GESTION DES QR CODES
// =============================================================================

function generateQRCode(type) {
    if (!userKeys) {
        alert('❌ Veuillez d\'abord générer des clés');
        return;
    }

    console.log('QRCode library:', typeof QRCode);
    console.log('QRCode methods:', Object.keys(QRCode || {}));

    if (typeof QRCode === 'undefined') {
        alert('❌ Bibliothèque QR Code non disponible');
        return;
    }

    const key = type === 'pubkey' ? userKeys.publicKey : userKeys.privateKey;
    const containerId = `${type}-qr-container`;
    const qrElementId = `${type}-qr`;
    
    // Masquer le QR Code précédent
    if (currentQRCode && currentQRCode !== containerId) {
        const previousContainer = document.getElementById(currentQRCode);
        if (previousContainer) {
            previousContainer.classList.remove('show');
        }
    }
    
    const container = document.getElementById(containerId);
    const qrElement = document.getElementById(qrElementId);
    
    if (!container || !qrElement) {
        console.error('❌ Éléments QR Code non trouvés');
        return;
    }
    
    // Basculer l'affichage
    if (container.classList.contains('show')) {
        container.classList.remove('show');
        currentQRCode = null;
    } else {
        qrElement.innerHTML = '';
        
        try {
            // ✅ CORRECTION : Utilisation correcte de la bibliothèque
            if (typeof QRCode === 'function') {
                // Pour qrcodejs library
                new QRCode(qrElement, {
                    text: key,
                    width: 200,
                    height: 200,
                    colorDark: type === 'privkey' ? '#dc2626' : '#6366f1',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                // Alternative si la bibliothèque a une interface différente
                console.error('Format de bibliothèque QRCode non supporté');
                throw new Error('Format de bibliothèque non supporté');
            }
            
            container.classList.add('show');
            currentQRCode = containerId;
            showQRCodeFeedback(type);
            
        } catch (error) {
            console.error('❌ Erreur création QR Code:', error);
            showQRCodeError(qrElement, 'Erreur technique: ' + error.message);
            
            // Solution de secours : utiliser une image d'API
            useQRCodeAPI(key, qrElement, type);
            container.classList.add('show');
            currentQRCode = containerId;
        }
    }
}

// Fonction de secours avec API
// function useQRCodeAPI(key, qrElement, type) {
//     const color = type === 'privkey' ? 'dc2626' : '6366f1';
//     const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(key)}&color=${color}`;
    
//     const img = document.createElement('img');
//     img.src = qrUrl;
//     img.alt = 'QR Code';
//     img.style.width = '200px';
//     img.style.height = '200px';
    
//     qrElement.appendChild(img);
// }

function showQRCodeError(qrElement, message) {
    if (qrElement) {
        qrElement.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--error);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <div>${message}</div>
            </div>
        `;
    }
}

function showQRCodeFeedback(type) {
    const message = type === 'pubkey' 
        ? '✅ QR Code public généré' 
        : '⚠️ QR Code privé généré - À conserver SECRET';
    
    showStatusMessage(message, type === 'privkey' ? 'warning' : 'success');
}

function updateExistingQRCodes() {
    if (!userKeys) return;
    
    const allContainers = document.querySelectorAll('.qr-container');
    allContainers.forEach(container => {
        container.classList.remove('show');
    });
    currentQRCode = null;
}

function downloadQRCode() {
    if (!currentQRCode) {
        alert('❌ Aucun QR Code affiché à télécharger');
        return;
    }
    
    const qrCanvas = document.querySelector(`#${currentQRCode} canvas`);
    if (!qrCanvas) {
        alert('❌ Impossible de trouver le QR Code à télécharger');
        return;
    }
    
    try {
        const link = document.createElement('a');
        const type = currentQRCode.includes('pubkey') ? 'public' : 'private';
        link.download = `nostr-key-${type}-${new Date().getTime()}.png`;
        link.href = qrCanvas.toDataURL('image/png');
        link.click();
        
        showStatusMessage(`✅ QR Code ${type} téléchargé`, 'success');
    } catch (error) {
        console.error('❌ Erreur téléchargement QR Code:', error);
        alert('❌ Erreur lors du téléchargement');
    }
}

// =============================================================================
// UTILITAIRES
// =============================================================================

function copyToClipboard(type) {
    if (!userKeys) {
        alert('❌ Générez d\'abord des clés');
        return;
    }

    const text = type === 'pubkey' ? userKeys.publicKey : userKeys.privateKey;
    
    navigator.clipboard.writeText(text).then(() => {
        alert(`✅ Clé ${type === 'pubkey' ? 'publique' : 'privée'} copiée !`);
    }).catch(err => {
        console.error('❌ Erreur copie:', err);
        alert('❌ Erreur lors de la copie');
    });
}

function showStatusMessage(message, type) {
    const existingMessage = document.getElementById('temp-status-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const statusMessage = document.createElement('div');
    statusMessage.id = 'temp-status-message';
    statusMessage.className = `status-message status-${type}`;
    statusMessage.textContent = message;
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
        ${type === 'success' ? 'background: #10b981;' : 
          type === 'error' ? 'background: #ef4444;' : 
          'background: #f59e0b;'}
    `;
    
    document.body.appendChild(statusMessage);
    
    setTimeout(() => {
        if (statusMessage.parentNode) {
            statusMessage.remove();
        }
    }, 5000);
}

