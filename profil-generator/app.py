"""
Profil-Dokument-Generator
Streamlit UI — läuft lokal im Browser (http://localhost:8501)

Start: streamlit run app.py
"""

import streamlit as st
from pathlib import Path
import tempfile
import os

# Seitenkonfiguration
st.set_page_config(
    page_title="Profil-Generator",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ------------------------------------------------------------------
# Session State initialisieren
# ------------------------------------------------------------------
if "profil" not in st.session_state:
    st.session_state.profil = None
if "template_pfad" not in st.session_state:
    st.session_state.template_pfad = None
if "generiertes_docx" not in st.session_state:
    st.session_state.generiertes_docx = None
if "generiertes_pdf" not in st.session_state:
    st.session_state.generiertes_pdf = None


# ------------------------------------------------------------------
# Sidebar Navigation
# ------------------------------------------------------------------
st.sidebar.title("Profil-Generator")
st.sidebar.markdown("---")

seite = st.sidebar.radio(
    "Navigation",
    ["Template verwalten", "Profil erstellen", "Uber das Tool"],
    label_visibility="collapsed",
)

st.sidebar.markdown("---")

# Aktives Template anzeigen
if st.session_state.template_pfad:
    st.sidebar.success(f"Template aktiv:\n`{Path(st.session_state.template_pfad).name}`")
else:
    st.sidebar.warning("Kein Template geladen")


# ==================================================================
# SEITE 1: Template verwalten
# ==================================================================
if seite == "Template verwalten":
    st.title("Template verwalten")
    st.markdown(
        "Lade ein bestehendes Profil als DOCX-Vorlage hoch. "
        "Alle neu erstellten Profile werden in diesem Layout generiert."
    )

    st.info(
        "**Hinweis:** Sobald du ein DOCX-Profil hochlädst, analysiere ich "
        "die Struktur und passe das Template-System entsprechend an. "
        "Das Layout wird dann exakt übernommen."
    )

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("DOCX-Template hochladen")
        template_datei = st.file_uploader(
            "Bestehendes Profil als DOCX hochladen",
            type=["docx"],
            key="template_upload",
        )

        if template_datei:
            # Template speichern
            template_ordner = Path("templates")
            template_ordner.mkdir(exist_ok=True)
            template_ziel = template_ordner / template_datei.name

            with open(template_ziel, "wb") as f:
                f.write(template_datei.getbuffer())

            st.session_state.template_pfad = str(template_ziel)
            st.success(f"Template gespeichert: `{template_datei.name}`")

            # Analyse anzeigen
            with st.expander("Template-Analyse anzeigen", expanded=True):
                try:
                    from src.parser.docx_parser import DocxParser
                    parser = DocxParser(template_ziel)

                    st.markdown("**Dokument-Struktur:**")
                    struktur = parser.extrahiere_struktur()
                    for abschnitt, inhalt in struktur.items():
                        if abschnitt != "_header":
                            st.markdown(f"- **{abschnitt}** ({len(inhalt)} Einträge)")

                    st.markdown("**Style-Informationen:**")
                    styles = parser.extrahiere_style_info()
                    col_a, col_b = st.columns(2)
                    with col_a:
                        st.metric("Tabellen im Dokument", styles["anzahl_tabellen"])
                        st.metric("Abschnitte", styles["anzahl_abschnitte"])
                    with col_b:
                        if styles["schriftarten"]:
                            st.markdown(f"**Schriftart(en):** {', '.join(styles['schriftarten'])}")
                        if styles["seitenraender"]["links_cm"]:
                            st.markdown(
                                f"**Seitenränder:** L {styles['seitenraender']['links_cm']} cm | "
                                f"R {styles['seitenraender']['rechts_cm']} cm"
                            )

                    st.markdown("**Extrahierter Text (Vorschau):**")
                    rohtext = parser.extrahiere_text()
                    st.text_area("Rohtext", rohtext[:1500] + "..." if len(rohtext) > 1500 else rohtext, height=200)

                except Exception as e:
                    st.error(f"Fehler bei der Template-Analyse: {e}")

    with col2:
        st.subheader("Gespeicherte Templates")
        template_ordner = Path("templates")
        if template_ordner.exists():
            templates = list(template_ordner.glob("*.docx"))
            if templates:
                for t in templates:
                    col_name, col_btn = st.columns([3, 1])
                    with col_name:
                        aktiv = "✅ " if str(t) == st.session_state.template_pfad else ""
                        st.markdown(f"{aktiv}`{t.name}`")
                    with col_btn:
                        if st.button("Laden", key=f"load_{t.name}"):
                            st.session_state.template_pfad = str(t)
                            st.rerun()
            else:
                st.info("Noch keine Templates gespeichert.")


# ==================================================================
# SEITE 2: Profil erstellen
# ==================================================================
elif seite == "Profil erstellen":
    st.title("Profil erstellen")

    if not st.session_state.template_pfad:
        st.error("Bitte zuerst ein Template unter **Template verwalten** hochladen.")
        st.stop()

    # Tabs: Modus auswählen
    tab1, tab2 = st.tabs(["1:1 Transfer", "Projekt-Tailoring"])

    # ----------------------------------------------------------------
    # TAB 1: 1:1 Transfer
    # ----------------------------------------------------------------
    with tab1:
        st.subheader("1:1 Transfer")
        st.markdown("Kandidatendaten eingeben → Dokument im Template-Layout generieren.")

        eingabe_methode = st.radio(
            "Wie möchtest du die Daten eingeben?",
            ["Text einfügen (Copy-Paste)", "DOCX/PDF hochladen", "Formular ausfüllen"],
            horizontal=True,
        )

        if eingabe_methode == "Text einfügen (Copy-Paste)":
            profil_text = st.text_area(
                "Profiltext einfügen (LinkedIn, Xing, E-Mail etc.)",
                height=300,
                placeholder="Füge hier den vollständigen Profiltext ein...",
            )

            if st.button("Profil extrahieren und generieren", type="primary", disabled=not profil_text):
                with st.spinner("Claude extrahiert Profildaten..."):
                    try:
                        from src.ai.tailoring import ProfilTailoring
                        from src.generator.docx_generator import DocxGenerator
                        from src.generator.pdf_converter import PdfConverter

                        tailoring = ProfilTailoring()
                        profil = tailoring.extrahiere_profil(profil_text)
                        st.session_state.profil = profil

                        generator = DocxGenerator(st.session_state.template_pfad)
                        docx_pfad = generator.generiere(profil)
                        st.session_state.generiertes_docx = docx_pfad

                        st.success("Profil erfolgreich generiert!")

                    except Exception as e:
                        st.error(f"Fehler: {e}")

        elif eingabe_methode == "DOCX/PDF hochladen":
            kandidaten_datei = st.file_uploader(
                "Kandidatenprofil hochladen",
                type=["docx", "pdf"],
                key="kandidaten_upload",
            )

            if kandidaten_datei and st.button("Profil übertragen", type="primary"):
                with st.spinner("Profil wird verarbeitet..."):
                    try:
                        with tempfile.NamedTemporaryFile(
                            suffix=Path(kandidaten_datei.name).suffix, delete=False
                        ) as tmp:
                            tmp.write(kandidaten_datei.getbuffer())
                            tmp_pfad = tmp.name

                        if kandidaten_datei.name.endswith(".docx"):
                            from src.parser.docx_parser import DocxParser
                            parser = DocxParser(tmp_pfad)
                        else:
                            from src.parser.pdf_parser import PdfParser
                            parser = PdfParser(tmp_pfad)

                        rohtext = parser.extrahiere_text()
                        os.unlink(tmp_pfad)

                        from src.ai.tailoring import ProfilTailoring
                        from src.generator.docx_generator import DocxGenerator

                        tailoring = ProfilTailoring()
                        profil = tailoring.extrahiere_profil(rohtext)
                        st.session_state.profil = profil

                        generator = DocxGenerator(st.session_state.template_pfad)
                        docx_pfad = generator.generiere(profil)
                        st.session_state.generiertes_docx = docx_pfad

                        st.success("Profil erfolgreich übertragen!")

                    except Exception as e:
                        st.error(f"Fehler: {e}")

        elif eingabe_methode == "Formular ausfüllen":
            st.info("Formular-Eingabe wird nach der Template-Analyse finalisiert.")

        # Download-Bereich
        if st.session_state.generiertes_docx:
            _zeige_download_bereich()

    # ----------------------------------------------------------------
    # TAB 2: Projekt-Tailoring
    # ----------------------------------------------------------------
    with tab2:
        st.subheader("Projekt-Tailoring")
        st.markdown(
            "Profil + Projektbeschreibung eingeben → "
            "Claude passt das Profil auf das Projekt an."
        )

        col1, col2 = st.columns([1, 1])

        with col1:
            st.markdown("**Kandidatenprofil**")
            profil_text_t = st.text_area(
                "Profiltext",
                height=250,
                key="profil_tailoring",
                placeholder="Vollständigen Profiltext einfügen...",
            )

        with col2:
            st.markdown("**Projektanforderungen**")
            projekt_titel = st.text_input("Projekttitel", placeholder="z.B. Senior Java Developer bei Kunde XY")
            projekt_text = st.text_area(
                "Projektbeschreibung / Stellenausschreibung",
                height=200,
                key="projekt_tailoring",
                placeholder="Vollständige Projektbeschreibung einfügen...",
            )

        if st.button(
            "Profil zuschneiden und generieren",
            type="primary",
            disabled=not (profil_text_t and projekt_text),
        ):
            with st.spinner("Claude analysiert und schneidet das Profil zu..."):
                try:
                    from src.ai.tailoring import ProfilTailoring
                    from src.models.profile import ProjektAnforderungen
                    from src.generator.docx_generator import DocxGenerator

                    tailoring = ProfilTailoring()
                    profil = tailoring.extrahiere_profil(profil_text_t)

                    anforderungen = ProjektAnforderungen(
                        titel=projekt_titel,
                        rohe_ausschreibung=projekt_text,
                    )

                    profil_tailored = tailoring.tailore_profil(profil, anforderungen)
                    st.session_state.profil = profil_tailored

                    generator = DocxGenerator(st.session_state.template_pfad)
                    docx_pfad = generator.generiere(profil_tailored)
                    st.session_state.generiertes_docx = docx_pfad

                    st.success("Profil erfolgreich auf das Projekt zugeschnitten!")

                    # Änderungen anzeigen
                    with st.expander("Was wurde angepasst?"):
                        st.markdown(f"**Profil-Version:** {profil_tailored.version}")
                        st.markdown(f"**Modus:** {profil_tailored.modus}")
                        if profil_tailored.zusammenfassung:
                            st.markdown("**Angepasste Zusammenfassung:**")
                            st.info(profil_tailored.zusammenfassung)

                except Exception as e:
                    st.error(f"Fehler: {e}")

        if st.session_state.generiertes_docx:
            _zeige_download_bereich()


# ==================================================================
# SEITE 3: Über das Tool
# ==================================================================
elif seite == "Uber das Tool":
    st.title("Uber den Profil-Generator")
    st.markdown("""
    ## Wie funktioniert das Tool?

    ### Modus 1 — 1:1 Transfer
    Ein bestehendes Kandidatenprofil wird in das definierte Layout-Template übertragen.
    Ideal wenn das Profil bereits passt und nur im Corporate-Design dargestellt werden soll.

    ### Modus 2 — Projekt-Tailoring
    Claude AI analysiert das Profil und die Projektanforderungen und passt das Profil
    gezielt an — relevante Skills werden hervorgehoben, die Zusammenfassung wird
    auf das Projekt ausgerichtet, Erfahrungen werden nach Relevanz sortiert.

    **Wichtig:** Es werden keine Fakten erfunden — nur vorhandene Informationen
    werden neu gewichtet und formuliert.

    ---

    ## Setup

    1. `.env` Datei anlegen mit `ANTHROPIC_API_KEY=sk-ant-...`
    2. Template-DOCX hochladen (unter "Template verwalten")
    3. Profil erstellen

    ---

    ## Tech Stack
    - **Streamlit** — UI
    - **python-docx / docxtpl** — DOCX-Generierung
    - **LibreOffice / docx2pdf** — PDF-Export
    - **Claude API (Anthropic)** — AI Tailoring
    """)


# ==================================================================
# Hilfsfunktionen
# ==================================================================
def _zeige_download_bereich():
    """Zeigt DOCX und PDF Download-Buttons an."""
    st.markdown("---")
    st.subheader("Dokument herunterladen")

    docx_pfad = Path(st.session_state.generiertes_docx)

    col1, col2 = st.columns(2)

    with col1:
        if docx_pfad.exists():
            with open(docx_pfad, "rb") as f:
                st.download_button(
                    label="DOCX herunterladen",
                    data=f.read(),
                    file_name=docx_pfad.name,
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )

    with col2:
        if st.button("PDF generieren"):
            with st.spinner("Konvertiere zu PDF..."):
                try:
                    from src.generator.pdf_converter import PdfConverter
                    converter = PdfConverter()
                    pdf_pfad = converter.konvertiere(docx_pfad)
                    st.session_state.generiertes_pdf = pdf_pfad
                    st.success("PDF erstellt!")
                except RuntimeError as e:
                    st.error(str(e))

    if st.session_state.generiertes_pdf:
        pdf_pfad = Path(st.session_state.generiertes_pdf)
        if pdf_pfad.exists():
            with open(pdf_pfad, "rb") as f:
                st.download_button(
                    label="PDF herunterladen",
                    data=f.read(),
                    file_name=pdf_pfad.name,
                    mime="application/pdf",
                )
