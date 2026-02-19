# Profil-Dokument-Generator

Lokales Tool für Recruiter zum Erstellen von Kandidatenprofilen in DOCX und PDF.

## Setup

```bash
# 1. Python-Umgebung
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Abhängigkeiten
pip install -r requirements.txt

# 3. API Key
cp .env.example .env
# .env öffnen und ANTHROPIC_API_KEY eintragen

# 4. Tool starten
streamlit run app.py
```

Öffnet automatisch http://localhost:8501 im Browser.

## PDF-Export

Für den PDF-Export wird **LibreOffice** benötigt:
- Linux: `sudo apt install libreoffice`
- Mac: `brew install --cask libreoffice`
- Windows: https://www.libreoffice.org/download/

## Modi

| Modus | Beschreibung |
|-------|-------------|
| **1:1 Transfer** | Profil direkt ins Template-Layout übertragen |
| **Projekt-Tailoring** | Claude passt Profil auf Projektanforderungen an |

## Workflow

1. Template hochladen (unter "Template verwalten")
2. Kandidatenprofil als Text einfügen oder Datei hochladen
3. Modus wählen (1:1 oder Tailoring)
4. DOCX herunterladen, optional als PDF exportieren
