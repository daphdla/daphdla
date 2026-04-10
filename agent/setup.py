"""
ONE-TIME SETUP — run once, then save AGENT_ID and ENV_ID to your .env file.

Usage:
    pip install anthropic
    ANTHROPIC_API_KEY=sk-... python agent/setup.py
"""

import json
import anthropic

client = anthropic.Anthropic()

# 1. Créer l'environnement (template réutilisable pour les conteneurs)
print("Création de l'environnement...")
environment = client.beta.environments.create(
    name="prospection-env",
    config={
        "type": "cloud",
        "networking": {"type": "unrestricted"},  # accès internet complet
    },
)
print(f"Environnement créé : {environment.id}")

# 2. Créer l'agent (config versionnée et réutilisable)
print("\nCréation de l'agent de prospection...")
agent = client.beta.agents.create(
    name="mon-agent-prospection",
    model="claude-sonnet-4-6",
    system="""
Tu es un agent de prospection B2B.
Ta mission : trouver et qualifier des prospects
pour une agence d'automatisation IA.
Tu cherches, tu analyses, tu rédiges.
Tu ne demandes pas confirmation à chaque étape.

Processus de prospection :
1. Recherche sur le web les entreprises correspondant aux critères
2. Qualifie chaque prospect (taille, secteur, besoins potentiels en automatisation)
3. Rédige un résumé structuré avec les informations de contact et le pitch personnalisé
4. Sauvegarde les résultats dans un fichier prospects.json
""",
    tools=[
        {
            "type": "agent_toolset_20260401",
            "default_config": {"enabled": False},
            "configs": [
                {"name": "web_search", "enabled": True},
                {"name": "web_fetch", "enabled": True},
                {"name": "write", "enabled": True},
                {"name": "read", "enabled": True},
            ],
        }
    ],
)
print(f"Agent créé : {agent.id}")
print(f"Version     : {agent.version}")

# 3. Sauvegarder les IDs pour la phase runtime
ids = {
    "AGENT_ID": agent.id,
    "AGENT_VERSION": agent.version,
    "ENV_ID": environment.id,
}

with open("agent/.agent_ids.json", "w") as f:
    json.dump(ids, f, indent=2)

print("\n✓ IDs sauvegardés dans agent/.agent_ids.json")
print("  Ajoutez ces valeurs à votre .env pour le runtime :")
for k, v in ids.items():
    print(f"  {k}={v}")
