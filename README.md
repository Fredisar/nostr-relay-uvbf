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
