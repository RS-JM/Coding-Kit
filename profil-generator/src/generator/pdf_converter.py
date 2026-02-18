"""
PDF-Konverter

Konvertiert eine DOCX-Datei in PDF.
Strategie: DOCX → PDF via docx2pdf (nutzt Word auf Windows/Mac
oder LibreOffice auf Linux).

Das Layout bleibt dadurch exakt erhalten — es wird keine eigene
PDF-Rendering-Engine benötigt.
"""

from pathlib import Path
import subprocess
import shutil


class PdfConverter:

    def konvertiere(self, docx_pfad: str | Path, pdf_pfad: str | Path | None = None) -> Path:
        """
        Konvertiert eine DOCX-Datei in PDF.

        Args:
            docx_pfad: Pfad zur DOCX-Quelldatei
            pdf_pfad:  Pfad zur PDF-Ausgabedatei.
                       Standard: gleicher Pfad, .pdf Endung

        Returns:
            Pfad zur generierten PDF-Datei

        Raises:
            RuntimeError: wenn kein Konverter verfügbar ist
        """
        docx_pfad = Path(docx_pfad)
        if pdf_pfad is None:
            pdf_pfad = docx_pfad.with_suffix(".pdf")
        pdf_pfad = Path(pdf_pfad)

        if self._libreoffice_verfuegbar():
            return self._konvertiere_libreoffice(docx_pfad, pdf_pfad)
        elif self._docx2pdf_verfuegbar():
            return self._konvertiere_docx2pdf(docx_pfad, pdf_pfad)
        else:
            raise RuntimeError(
                "Kein PDF-Konverter gefunden.\n"
                "Bitte LibreOffice installieren: https://www.libreoffice.org/download/\n"
                "Oder: pip install docx2pdf (benötigt Microsoft Word)"
            )

    def verfuegbare_methode(self) -> str:
        if self._libreoffice_verfuegbar():
            return "LibreOffice"
        elif self._docx2pdf_verfuegbar():
            return "docx2pdf"
        return "Keine"

    # ------------------------------------------------------------------
    # Private Methoden
    # ------------------------------------------------------------------

    def _libreoffice_verfuegbar(self) -> bool:
        return (
            shutil.which("libreoffice") is not None
            or shutil.which("soffice") is not None
        )

    def _docx2pdf_verfuegbar(self) -> bool:
        try:
            import docx2pdf  # noqa: F401
            return True
        except ImportError:
            return False

    def _konvertiere_libreoffice(self, docx_pfad: Path, pdf_pfad: Path) -> Path:
        befehl = shutil.which("libreoffice") or shutil.which("soffice")
        ergebnis = subprocess.run(
            [
                befehl,
                "--headless",
                "--convert-to", "pdf",
                "--outdir", str(pdf_pfad.parent),
                str(docx_pfad),
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if ergebnis.returncode != 0:
            raise RuntimeError(
                f"LibreOffice-Konvertierung fehlgeschlagen:\n{ergebnis.stderr}"
            )
        # LibreOffice speichert mit dem originalen Dateinamen + .pdf
        lo_output = docx_pfad.parent / (docx_pfad.stem + ".pdf")
        if lo_output != pdf_pfad:
            lo_output.rename(pdf_pfad)
        return pdf_pfad

    def _konvertiere_docx2pdf(self, docx_pfad: Path, pdf_pfad: Path) -> Path:
        import docx2pdf
        docx2pdf.convert(str(docx_pfad), str(pdf_pfad))
        return pdf_pfad
