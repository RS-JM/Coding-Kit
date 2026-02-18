"""
DOCX-Generator

Erstellt ein Kandidatenprofil als DOCX-Dokument.

Strategie:
  - Nutzt docxtpl (Jinja2-Templates im DOCX) für exaktes Layout
  - Das Template-DOCX wird vom Recruiter bereitgestellt (hochgeladen)
  - Nach der Template-Analyse werden die Jinja2-Variablen eingefügt

WICHTIG: Die render()-Methode und die Template-Variablen werden
nach der Analyse der hochgeladenen Profile vervollständigt.
"""

from pathlib import Path
from docxtpl import DocxTemplate
from src.models.profile import Kandidatenprofil
import datetime


class DocxGenerator:
    def __init__(self, template_pfad: str | Path):
        """
        Args:
            template_pfad: Pfad zum DOCX-Template mit Jinja2-Variablen.
                           Muss vom Recruiter bereitgestellt werden.
        """
        self.template_pfad = Path(template_pfad)
        if not self.template_pfad.exists():
            raise FileNotFoundError(
                f"Template nicht gefunden: {self.template_pfad}\n"
                "Bitte ein DOCX-Template hochladen."
            )

    def generiere(
        self,
        profil: Kandidatenprofil,
        ausgabe_pfad: str | Path | None = None,
    ) -> Path:
        """
        Rendert das Profil in das DOCX-Template und speichert es.

        Args:
            profil: Das Kandidatenprofil (Pydantic-Modell)
            ausgabe_pfad: Wo die Datei gespeichert werden soll.
                          Standard: output/<vollname>_<timestamp>.docx

        Returns:
            Pfad zur generierten DOCX-Datei
        """
        tpl = DocxTemplate(str(self.template_pfad))
        kontext = self._erstelle_kontext(profil)
        tpl.render(kontext)

        if ausgabe_pfad is None:
            ausgabe_pfad = self._standard_ausgabepfad(profil)

        ausgabe_pfad = Path(ausgabe_pfad)
        ausgabe_pfad.parent.mkdir(parents=True, exist_ok=True)
        tpl.save(str(ausgabe_pfad))
        return ausgabe_pfad

    # ------------------------------------------------------------------
    # Template-Kontext
    # ANPASSEN nach Template-Analyse der hochgeladenen Profile
    # ------------------------------------------------------------------

    def _erstelle_kontext(self, profil: Kandidatenprofil) -> dict:
        """
        Baut den Jinja2-Kontext für das Template.

        HINWEIS: Diese Variablen müssen mit den Platzhaltern im
        DOCX-Template übereinstimmen. Wird nach der Template-Analyse
        angepasst und vervollständigt.
        """
        return {
            # Persönliche Daten
            "vorname": profil.vorname,
            "nachname": profil.nachname,
            "vollname": profil.vollname(),
            "titel": profil.titel or "",
            "standort": profil.standort or "",
            "verfuegbarkeit": profil.verfuegbarkeit or "",
            "stundensatz": profil.stundensatz or "",

            # Profil-Text
            "zusammenfassung": profil.zusammenfassung or "",

            # Skills
            "kernkompetenzen": profil.kernkompetenzen,
            "technische_skills": profil.technische_skills,

            # Erfahrung
            "berufserfahrung": [
                {
                    "titel": e.titel,
                    "unternehmen": e.unternehmen or "",
                    "zeitraum": e.zeitraum or "",
                    "beschreibung": e.beschreibung or "",
                    "technologien": e.technologien,
                    "highlights": e.highlights,
                }
                for e in profil.berufserfahrung
            ],
            "projekte": [
                {
                    "titel": p.titel,
                    "unternehmen": p.unternehmen or "",
                    "zeitraum": p.zeitraum or "",
                    "beschreibung": p.beschreibung or "",
                    "technologien": p.technologien,
                    "highlights": p.highlights,
                }
                for p in profil.projekte
            ],

            # Ausbildung
            "ausbildung": [
                {
                    "abschluss": a.abschluss,
                    "institution": a.institution,
                    "zeitraum": a.zeitraum or "",
                    "zusatz": a.zusatz or "",
                }
                for a in profil.ausbildung
            ],

            # Zertifikate
            "zertifikate": [
                {
                    "name": z.name,
                    "aussteller": z.aussteller or "",
                    "jahr": z.jahr or "",
                }
                for z in profil.zertifikate
            ],

            # Sprachen
            "sprachen": [
                {"sprache": s.sprache, "niveau": s.niveau}
                for s in profil.sprachen
            ],

            # Metadaten
            "erstellt_datum": datetime.date.today().strftime("%d.%m.%Y"),
            "version": profil.version,
            "modus": profil.modus,
        }

    def _standard_ausgabepfad(self, profil: Kandidatenprofil) -> Path:
        zeitstempel = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        name = profil.vollname().replace(" ", "_") or "profil"
        modus_kuerzel = "tailored" if profil.modus == "tailored" else "standard"
        dateiname = f"{name}_{modus_kuerzel}_{zeitstempel}.docx"
        return Path("output") / dateiname
