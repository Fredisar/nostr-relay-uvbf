 // Le code JavaScript reste exactement le même que précédemment
        // Vérifier que nostr-tools est chargé
        console.log('NostrTools:', typeof NostrTools);
        
        let userKeys = null;
        let relay = null;
        let isConnected = false;

        // Charger au démarrage
        window.addEventListener('load', function() {
            console.log('Page chargée, vérification nostr-tools...');
            if (typeof NostrTools === 'undefined') {
                alert('Erreur: nostr-tools non chargé. Vérifiez la connexion internet.');
                return;
            }
            loadKeys();
        });

        function loadKeys() {
            const saved = localStorage.getItem('uvbf_nostr_keys');
            if (saved) {
                try {
                    userKeys = JSON.parse(saved);
                    showKeys();
                    connectToRelay();
                } catch (e) {
                    console.log('Pas de clés sauvegardées ou erreur de parsing');
                }
            }
        }

        function saveKeys(keys) {
            localStorage.setItem('uvbf_nostr_keys', JSON.stringify(keys));
        }

        function generateKeys() {
            if (typeof NostrTools === 'undefined') {
                alert('nostr-tools non chargé. Rafraîchissez la page.');
                return;
            }
            
            const privateKey = NostrTools.generatePrivateKey();
            const publicKey = NostrTools.getPublicKey(privateKey);
            
            userKeys = { privateKey, publicKey };
            saveKeys(userKeys);
            showKeys();
            connectToRelay();
        }

        function showKeys() {
            document.getElementById('pubkey-display').textContent = userKeys.publicKey;
            document.getElementById('privkey-display').textContent = userKeys.privateKey;
            
            document.getElementById('keys-section').style.display = 'block';
            document.getElementById('message-section').style.display = 'block';
            document.getElementById('messages-section').style.display = 'block';
            
            // Supprimer l'état vide des messages
            const emptyState = document.querySelector('.empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }

        async function connectToRelay() {
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

        function copyToClipboard(type) {
            const text = type === 'pubkey' ? userKeys.publicKey : userKeys.privateKey;
            navigator.clipboard.writeText(text).then(() => {
                alert('Clé copiée dans le presse-papier !');
            });
        }