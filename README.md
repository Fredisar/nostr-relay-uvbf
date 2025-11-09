# 🌐 Relay Nostr UVBF

**Messagerie décentralisée et sécurisée pour les étudiants de l'Université Virtuelle du Burkina Faso**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Nostr Protocol](https://img.shields.io/badge/Nostr-Protocol-blue.svg)](https://nostr.com)

## 🚀 Fonctionnalités

- ✅ **Messagerie chiffrée** de bout en bout
- ✅ **Génération sécurisée** de clés cryptographiques
- ✅ **Interface moderne** et intuitive
- ✅ **Relay Nostr** décentralisé
- ✅ **Accès multiplateforme**
- ✅ **Sans collecte de données**

## 🏗️ Architecture
┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Interface │ │ Reverse Proxy │ │ Relay Nostr │
│ Web UVBF │◄──►│ Nginx │◄──►│ (Rust) │
│ (HTML/JS/CSS) │ │ │ │ │
└─────────────────┘ └──────────────────┘ └──────────────────┘
│ │ │
│ │ │
▼ ▼ ▼
┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Cloudflare │ │ Certificats │ │ Base de │
│ Tunnel │ │ SSL │ │ Données SQLite │
└─────────────────┘ └──────────────────┘ └──────────────────┘


## ⚡ Démarrage Rapide

### Prérequis
- Ubuntu 20.04+ / Debian 11+
- 2GB RAM, 10GB disque
- Accès Internet

### Installation Automatique
```bash
git clone https://github.com/votre-org/uvbf-nostr-relay.git
cd uvbf-nostr-relay
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```
## 🔧 Installation Complète

1. Préparation du Système
```bash
   # Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install build-essential curl wget git nginx python3 certbot -y

# Installation de Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```
2. Installation du Relay Nostr
   
```bash
# Cloner nostr-rs-relay
git clone https://github.com/scsibug/nostr-rs-relay.git
cd nostr-rs-relay

# Compiler en mode release
cargo build --release

# Configuration UVBF
cat > config.toml << 'EOF'
[info]
name = "UVBF Nostr Relay"
description = "Relay Nostr pour les étudiants UVBF"
contact = "tic@uvbf.edu"

[network]
address = "0.0.0.0"
port = 8080

[database]
data_directory = "./data"

[options]
log_level = "info"
whitelist = false
blacklist = false

[authorization]
enabled = false

[limits]
max_events_per_second = 10
max_subscriptions = 50
EOF
```

3. Interface Web UVBF

```bash
# Créer la structure
mkdir -p ~/uvbf-nostr-relay/frontend
cd ~/uvbf-nostr-relay/frontend

# Créer index.html (voir section fichiers complets)
```

4. Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/uvbf-nostr
```
```nginx
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
```bash
# Activer Nginx
sudo ln -sf /etc/nginx/sites-available/uvbf-nostr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

5. HTTPS avec Cloudflare (Recommandé)

```bash
# Installation cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Configuration tunnel
cloudflared tunnel login
cloudflared tunnel create uvbf-nostr
cloudflared tunnel route dns uvbf-nostr votre-domaine.duckdns.org

# Service systemd
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```
```yaml
tunnel: VOTRE_TUNNEL_ID
credentials-file: /home/ubuntu/.cloudflared/VOTRE_TUNNEL_ID.json

ingress:
  - service: http://localhost:3000
  - service: http_status:404
```
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

6. Services Systemd

```bash
# Service Relay Nostr
sudo nano /etc/systemd/system/uvbf-nostr-relay.service
```
```ini
[Unit]
Description=UVBF Nostr Relay
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/nostr-rs-relay
ExecStart=/home/ubuntu/nostr-rs-relay/target/release/nostr-rs-relay
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
```bash
# Service Interface Web
sudo nano /etc/systemd/system/uvbf-web-interface.service
```
```ini
[Unit]
Description=UVBF Web Interface
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/uvbf-nostr-relay/frontend
ExecStart=/usr/bin/python3 -m http.server 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
```bash
# Activer les services
sudo systemctl daemon-reload
sudo systemctl enable uvbf-nostr-relay uvbf-web-interface
sudo systemctl start uvbf-nostr-relay uvbf-web-interface
```

## 🎯 Utilisation

### Accès à l'Application

Interface Web local : http://localhost:3000/

### Premiers Pas

1. Générer vos clés : Cliquez sur "Générer mes identifiants"
2. Sauvegarder la clé privée : ⚠️ Ne jamais la partager !
3. Partager la clé publique avec vos contacts
4. Envoyer des messages chiffrés

### Commandes d'Administration

```bash
# Vérifier l'état des services
sudo systemctl status uvbf-nostr-relay
sudo systemctl status uvbf-web-interface
sudo systemctl status nginx
sudo systemctl status cloudflared

# Voir les logs
sudo journalctl -u uvbf-nostr-relay -f
sudo tail -f /var/log/nginx/access.log

# Redémarrer tout
sudo systemctl restart uvbf-nostr-relay uvbf-web-interface nginx cloudflared
```

## 🐛 Dépannage

### Problèmes Courants

#### ❌ "Site inaccessible"

```bash
# Vérifier les services
sudo systemctl status nginx
sudo systemctl status cloudflared

# Vérifier les ports
sudo netstat -tlnp | grep -E '(:80|:3000|:8080)'

# Tester localement
curl http://localhost:3000

```

#### ❌ Erreur "crypto.subtle is undefined"

. Cause : HTTP au lieu de HTTPS
. Solution : Utiliser Cloudflare Tunnel ou certificat SSL

#### ❌ Port déjà utilisé

```bash
# Trouver le processus
sudo netstat -tlnp | grep :3000
sudo kill -9 <PID>
```

#### ❌ Cloudflare Tunnel ne fonctionne pas

```bash
# Réinitialiser le tunnel
cloudflared tunnel delete uvbf-nostr
cloudflared tunnel create uvbf-nostr
cloudflared tunnel route dns uvbf-nostr votre-domaine.duckdns.org
sudo systemctl restart cloudflared
```

#### Script de Diagnostic

```bash
#!/bin/bash
echo "=== DIAGNOSTIC UVBF NOSTR RELAY ==="
echo "1. Services Systemd:"
sudo systemctl status uvbf-nostr-relay --no-pager -l
sudo systemctl status uvbf-web-interface --no-pager -l
sudo systemctl status nginx --no-pager -l
sudo systemctl status cloudflared --no-pager -l
echo "2. Ports en écoute:"
sudo netstat -tlnp | grep -E '(:80|:3000|:8080|:443)'
echo "3. Connectivité:"
curl -I http://localhost:3000 2>/dev/null | head -1
curl -I http://localhost:8080 2>/dev/null | head -1
echo "=== DIAGNOSTIC TERMINÉ ==="
```

## 🔒 Sécurité

### Mesures Implémentées

. ✅ Chiffrement de bout en bout (NIP-04)
. ✅ Génération sécurisée de clés
. ✅ Validation des signatures
. ✅ Isolation des services
. ✅ Certificats SSL/TLS

### Bonnes Pratiques

.🔑 Ne jamais partager sa clé privée
. 🔄 Maintenir les services à jour
. 📋 Sauvegarder régulièrement
. 👁️ Monitorer les logs

## 📈 Monitoring et Maintenance

### Sauvegardes Automatiques

```bash
# Script de sauvegarde (à planifier dans cron)
#!/bin/bash
BACKUP_DIR="/home/ubuntu/uvbf-nostr-relay/backup"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/backup-$DATE.tar.gz \
  ~/nostr-rs-relay/data/ \
  ~/uvbf-nostr-relay/frontend/ \
  /etc/nginx/sites-available/uvbf-nostr
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Mises à Jour

```bash
# Mise à jour du relay
cd ~/nostr-rs-relay
git pull
cargo build --release
sudo systemctl restart uvbf-nostr-relay

# Mise à jour interface
cd ~/uvbf-nostr-relay  
git pull
sudo systemctl restart uvbf-web-interface
```

## 🛠️ Développement

### Technologies Utilisées

. Relay : nostr-rs-relay (Rust)
. Frontend : HTML5, CSS3, JavaScript + nostr-tools
. Proxy : Nginx
. Tunnel : Cloudflare Tunnel
. Sécurité : Chiffrement NIP-04

### Structure Technique

```bash
# Processus en cours d'exécution
ps aux | grep -E '(nostr-rs-relay|python3|nginx|cloudflared)'

# Fichiers de données
ls -la ~/nostr-rs-relay/data/

# Logs importantes
tail -f ~/nostr-rs-relay/nostr.db
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u cloudflared -f
```

## Escalade des Problèmes

1. ✅ Consulter ce README et la section dépannage
2. ✅ Vérifier les Issues GitHub

## 📄 Licence
Ce projet est distribué sous licence MIT. Voir LICENSE pour plus de détails.

## Prochaines Versions
1. Posibilité d'enregistrer les clées de facon permanente dans une section contact
2. posibilité de gerer les relays
3. Effectuer le deploiement du projet sur internet

