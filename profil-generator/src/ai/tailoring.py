"""
Claude AI Tailoring

Passt ein Kandidatenprofil an die Anforderungen eines spezifischen
Projekts an. Nutzt die Claude API (Anthropic).

Funktionen:
  1. Profildaten aus Rohtext extrahieren (strukturieren)
  2. Profil auf Projektanforderungen zuschneiden
"""

import os
import json
from anthropic import Anthropic
from src.models.profile import Kandidatenprofil, ProjektAnforderungen


SYSTEM_PROMPT_EXTRAKTION = """Du bist ein erfahrener Recruiter-Assistent.
Deine Aufgabe ist es, aus einem unstrukturierten Profiltext eines Kandidaten
strukturierte Daten zu extrahieren.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt — ohne Erklärungen, ohne Markdown-Blöcke.

Das JSON muss folgende Struktur haben:
{
  "vorname": "",
  "nachname": "",
  "titel": "",
  "standort": "",
  "verfuegbarkeit": "",
  "stundensatz": "",
  "zusammenfassung": "",
  "kernkompetenzen": [],
  "technische_skills": {},
  "berufserfahrung": [
    {
      "titel": "",
      "unternehmen": "",
      "zeitraum": "",
      "beschreibung": "",
      "technologien": [],
      "highlights": []
    }
  ],
  "projekte": [],
  "ausbildung": [
    {
      "abschluss": "",
      "institution": "",
      "zeitraum": "",
      "zusatz": ""
    }
  ],
  "zertifikate": [],
  "sprachen": [
    {
      "sprache": "",
      "niveau": ""
    }
  ]
}
"""

SYSTEM_PROMPT_TAILORING = """Du bist ein erfahrener Recruiter-Assistent und Texter.
Deine Aufgabe ist es, ein Kandidatenprofil so anzupassen, dass es optimal
zu den Anforderungen eines bestimmten Projekts passt.

Regeln:
- Erfinde KEINE neuen Skills oder Erfahrungen — nutze nur was im Profil steht
- Hebe relevante Skills und Erfahrungen stärker hervor
- Passe Beschreibungen so an, dass sie die Projekt-Keywords aufgreifen
- Sortiere Berufserfahrung und Skills nach Relevanz für das Projekt
- Die Zusammenfassung soll das Profil gezielt auf das Projekt ausrichten
- Behalte den professionellen deutschen Stil bei
- Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt (gleiche Struktur wie Eingabe)
"""


class ProfilTailoring:
    def __init__(self, api_key: str | None = None):
        """
        Args:
            api_key: Anthropic API Key. Standard: ANTHROPIC_API_KEY Umgebungsvariable.
        """
        self.client = Anthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))
        self.modell = "claude-sonnet-4-6"

    def extrahiere_profil(self, rohtext: str) -> Kandidatenprofil:
        """
        Extrahiert strukturierte Profildaten aus einem Rohtext.
        Nutzt Claude um den Text zu parsen und in das Datenmodell zu überführen.

        Args:
            rohtext: Vollständiger Text des Kandidatenprofils

        Returns:
            Strukturiertes Kandidatenprofil
        """
        antwort = self.client.messages.create(
            model=self.modell,
            max_tokens=4096,
            system=SYSTEM_PROMPT_EXTRAKTION,
            messages=[
                {
                    "role": "user",
                    "content": f"Extrahiere die Profildaten aus folgendem Text:\n\n{rohtext}",
                }
            ],
        )

        json_text = antwort.content[0].text.strip()
        # JSON-Blöcke bereinigen falls Claude doch Markdown nutzt
        if json_text.startswith("```"):
            json_text = json_text.split("```")[1]
            if json_text.startswith("json"):
                json_text = json_text[4:]

        daten = json.loads(json_text)
        return Kandidatenprofil(**daten)

    def tailore_profil(
        self,
        profil: Kandidatenprofil,
        anforderungen: ProjektAnforderungen,
    ) -> Kandidatenprofil:
        """
        Passt ein Profil an Projektanforderungen an.

        Args:
            profil: Das Original-Kandidatenprofil
            anforderungen: Die Projektanforderungen

        Returns:
            Angepasstes Kandidatenprofil (neues Objekt, Original bleibt unverändert)
        """
        profil_json = profil.model_dump_json(indent=2)

        anforderungs_text = self._formatiere_anforderungen(anforderungen)

        antwort = self.client.messages.create(
            model=self.modell,
            max_tokens=8192,
            system=SYSTEM_PROMPT_TAILORING,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"KANDIDATENPROFIL (JSON):\n{profil_json}\n\n"
                        f"PROJEKTANFORDERUNGEN:\n{anforderungs_text}\n\n"
                        "Passe das Profil optimal auf das Projekt an. "
                        "Antworte nur mit dem angepassten JSON."
                    ),
                }
            ],
        )

        json_text = antwort.content[0].text.strip()
        if json_text.startswith("```"):
            json_text = json_text.split("```")[1]
            if json_text.startswith("json"):
                json_text = json_text[4:]

        daten = json.loads(json_text)
        angepasstes_profil = Kandidatenprofil(**daten)
        angepasstes_profil.modus = "tailored"
        angepasstes_profil.projekt_referenz = anforderungen.titel
        return angepasstes_profil

    def _formatiere_anforderungen(self, anf: ProjektAnforderungen) -> str:
        teile = [f"Projekttitel: {anf.titel}"]
        if anf.branche:
            teile.append(f"Branche: {anf.branche}")
        if anf.dauer:
            teile.append(f"Dauer: {anf.dauer}")
        if anf.pflicht_skills:
            teile.append(f"Pflicht-Skills: {', '.join(anf.pflicht_skills)}")
        if anf.wunsch_skills:
            teile.append(f"Wunsch-Skills: {', '.join(anf.wunsch_skills)}")
        if anf.rohe_ausschreibung:
            teile.append(f"\nVollständige Ausschreibung:\n{anf.rohe_ausschreibung}")
        elif anf.beschreibung:
            teile.append(f"\nBeschreibung:\n{anf.beschreibung}")
        return "\n".join(teile)
