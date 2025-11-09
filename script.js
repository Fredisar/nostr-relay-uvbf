// Éléments DOM
        const generateKeysBtn = document.getElementById('generate-keys');
        const authSection = document.getElementById('auth-section');
        const chatSection = document.getElementById('chat-section');
        const keysDisplay = document.getElementById('keys-display');
        const pubkeySpan = document.getElementById('pubkey');
        const privkeySpan = document.getElementById('privkey');
        const sendBtn = document.getElementById('send');
        const messagesDiv = document.getElementById('messages');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        const userInfo = document.getElementById('user-info');
        const userPubkeyShort = document.getElementById('user-pubkey-short');
        const newChatBtn = document.getElementById('new-chat-btn');

        let userPrivateKey = null;
        let userPublicKey = null;
        let relay = null;

        // Mise à jour du statut de connexion
        function updateConnectionStatus(connected) {
            if (connected) {
                statusDot.className = 'status-dot status-connected';
                statusText.textContent = 'Connecté';
            } else {
                statusDot.className = 'status-dot status-disconnected';
                statusText.textContent = 'Déconnecté';
            }
        }

        // Génération des clés
        generateKeysBtn.addEventListener('click', () => {
            const privateKey = NostrTools.generatePrivateKey();
            const publicKey = NostrTools.getPublicKey(privateKey);
            
            userPrivateKey = privateKey;
            userPublicKey = publicKey;
            
            pubkeySpan.textContent = publicKey;
            privkeySpan.textContent = privateKey;
            
            keysDisplay.style.display = 'block';
            authSection.style.display = 'none';
            chatSection.style.display = 'block';
            userInfo.style.display = 'block';
            userPubkeyShort.textContent = publicKey.substring(0, 16) + '...';
            
            // Simulation de connexion au relay
            setTimeout(() => {
                updateConnectionStatus(true);
            }, 1500);
        });

        // Nouvelle conversation
        newChatBtn.addEventListener('click', () => {
            document.getElementById('recipient').value = '';
            document.getElementById('message').value = '';
        });

        // Envoi de message (simulation pour la démo)
        sendBtn.addEventListener('click', () => {
            const recipient = document.getElementById('recipient').value;
            const message = document.getElementById('message').value;
            
            if (!recipient || !message) {
                alert('Veuillez remplir tous les champs');
                return;
            }
            
            // Simulation d'envoi
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <div class="message-sender">Vous</div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
                <div class="message-content">${message}</div>
            `;
            
            // Supprimer l'état vide s'il existe
            const emptyState = messagesDiv.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            
            messagesDiv.prepend(messageDiv);
            
            // Réinitialisation du champ de message
            document.getElementById('message').value = '';
            
            // Simulation de réponse
            setTimeout(() => {
                const responseDiv = document.createElement('div');
                responseDiv.className = 'message received';
                responseDiv.innerHTML = `
                    <div class="message-header">
                        <div class="message-sender">${recipient.substring(0, 16)}...</div>
                        <div class="message-time">${new Date().toLocaleTimeString()}</div>
                    </div>
                    <div class="message-content">Merci pour votre message! Ceci est une réponse automatique de démonstration.</div>
                `;
                messagesDiv.prepend(responseDiv);
            }, 2000);
        });

        // Initialisation
        updateConnectionStatus(false);