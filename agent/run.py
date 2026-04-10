"""
RUNTIME — à lancer pour chaque mission de prospection.

Prérequis : avoir exécuté agent/setup.py au moins une fois.

Usage:
    ANTHROPIC_API_KEY=sk-... python agent/run.py
    ANTHROPIC_API_KEY=sk-... python agent/run.py "TPE dans la logistique à Paris"
"""

import json
import os
import sys
import anthropic

# --- Charger les IDs créés lors du setup ---
IDS_FILE = os.path.join(os.path.dirname(__file__), ".agent_ids.json")

AGENT_ID  = os.getenv("AGENT_ID")
ENV_ID    = os.getenv("ENV_ID")

if not AGENT_ID or not ENV_ID:
    if os.path.exists(IDS_FILE):
        with open(IDS_FILE) as f:
            ids = json.load(f)
        AGENT_ID = ids["AGENT_ID"]
        ENV_ID   = ids["ENV_ID"]
    else:
        print("Erreur : AGENT_ID et ENV_ID introuvables.")
        print("Lancez d'abord : python agent/setup.py")
        sys.exit(1)

# --- Mission passée en argument ou valeur par défaut ---
mission = sys.argv[1] if len(sys.argv) > 1 else (
    "Trouve 5 PME françaises dans l'industrie manufacturière "
    "qui pourraient bénéficier d'automatisation IA. "
    "Pour chacune, identifie un contact, un besoin probable "
    "et rédige un pitch court. Sauvegarde tout dans prospects.json."
)

client = anthropic.Anthropic()

print(f"Agent  : {AGENT_ID}")
print(f"Env    : {ENV_ID}")
print(f"Mission: {mission[:80]}{'...' if len(mission) > 80 else ''}\n")

# --- Créer la session ---
session = client.beta.sessions.create(
    agent=AGENT_ID,
    environment_id=ENV_ID,
    title="Prospection B2B",
)
print(f"Session créée : {session.id}\n")
print("=" * 60)

# --- Ouvrir le stream AVANT d'envoyer le message (stream-first) ---
stream = client.beta.sessions.events.stream(session_id=session.id)

client.beta.sessions.events.send(
    session_id=session.id,
    events=[{
        "type": "user.message",
        "content": [{"type": "text", "text": mission}],
    }],
)

# --- Consommer les événements ---
tool_calls: list[dict] = []

for event in stream:
    etype = event.type

    if etype == "agent.message":
        for block in event.content:
            if block.type == "text" and block.text:
                print(block.text, end="", flush=True)

    elif etype == "agent.thinking":
        # Optionnel : afficher la réflexion interne
        pass

    elif etype == "agent.tool_use":
        print(f"\n[outil] {event.name}", flush=True)

    elif etype == "agent.tool_result":
        pass  # résultat géré côté serveur

    elif etype == "agent.custom_tool_use":
        # Outils personnalisés côté client (non utilisés ici)
        tool_calls.append({
            "id": event.id,
            "name": getattr(event, "tool_name", event.name),
            "input": event.input,
        })

    elif etype == "session.status_idle":
        stop = getattr(event, "stop_reason", None)
        stop_type = stop.type if stop else "unknown"
        if stop_type != "requires_action":
            # Fin normale ou erreur terminale
            break

    elif etype == "session.status_terminated":
        break

    elif etype == "session.error":
        print(f"\n[erreur session] {event}", flush=True)
        break

print("\n" + "=" * 60)
print("Mission terminée.")

# --- Récupérer les fichiers produits par l'agent ---
try:
    files = client.beta.files.list()
    session_files = [f for f in files.data if getattr(f, "session_id", None) == session.id]
    if session_files:
        print(f"\nFichiers générés ({len(session_files)}) :")
        for f in session_files:
            print(f"  - {f.filename} ({f.size_bytes} octets)")
except Exception:
    pass  # l'API files peut ne pas être disponible dans tous les contextes

# --- Archiver la session ---
try:
    client.beta.sessions.archive(session.id)
except Exception:
    pass
