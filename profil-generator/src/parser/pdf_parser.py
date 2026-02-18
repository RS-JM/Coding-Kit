"""
PDF-Parser

Liest ein bestehendes Kandidatenprofil im PDF-Format.
Extrahiert rohen Text für:
  - Weitergabe an Claude API (Profildaten verstehen)
  - Konvertierung in das DOCX-Template-Format

HINWEIS: PDFs können keine 1:1 Layouts liefern. Das Layout
kommt immer vom DOCX-Template. Der PDF-Parser ist für
Dateneingabe (Inhalt lesen), nicht für Layout-Reproduktion.
"""

from pathlib import Path

try:
    import pdfplumber
    PDF_VERFUEGBAR = True
except ImportError:
    PDF_VERFUEGBAR = False


class PdfParser:
    def __init__(self, pfad: str | Path):
        if not PDF_VERFUEGBAR:
            raise ImportError(
                "pdfplumber ist nicht installiert. Bitte 'pip install pdfplumber' ausführen."
            )
        self.pfad = Path(pfad)

    def extrahiere_text(self) -> str:
        """Gibt den vollständigen Text des PDFs zurück."""
        with pdfplumber.open(str(self.pfad)) as pdf:
            seiten_texte = []
            for seite in pdf.pages:
                text = seite.extract_text()
                if text:
                    seiten_texte.append(text)
        return "\n\n".join(seiten_texte)

    def extrahiere_tabellen(self) -> list[list[list[str]]]:
        """Extrahiert Tabellen aus dem PDF (falls vorhanden)."""
        alle_tabellen = []
        with pdfplumber.open(str(self.pfad)) as pdf:
            for seite in pdf.pages:
                tabellen = seite.extract_tables()
                alle_tabellen.extend(tabellen)
        return alle_tabellen

    def seitenanzahl(self) -> int:
        with pdfplumber.open(str(self.pfad)) as pdf:
            return len(pdf.pages)
