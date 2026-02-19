"""
Profil-Datenmodelle

Flexibel aufgebaut — Felder werden nach der Template-Analyse
der hochgeladenen Profile angepasst.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class Erfahrung(BaseModel):
    """Einzelner Erfahrungseintrag (Berufserfahrung oder Projekt)"""
    titel: str
    unternehmen: Optional[str] = None
    zeitraum: Optional[str] = None          # z.B. "2020 – 2023" oder "seit 2023"
    beschreibung: Optional[str] = None
    technologien: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)  # Bullet Points


class Ausbildung(BaseModel):
    """Ausbildungs- oder Studiumseintrag"""
    abschluss: str
    institution: str
    zeitraum: Optional[str] = None
    zusatz: Optional[str] = None            # z.B. Schwerpunkt, Note


class Sprache(BaseModel):
    """Sprachkenntnisse"""
    sprache: str
    niveau: str                             # z.B. "Muttersprache", "C1", "B2"


class Zertifikat(BaseModel):
    """Zertifikat oder Weiterbildung"""
    name: str
    aussteller: Optional[str] = None
    jahr: Optional[str] = None


class Kandidatenprofil(BaseModel):
    """
    Vollständiges Kandidatenprofil.
    Alle Felder optional — wird nach Template-Analyse verfeinert.
    """

    # Persönliche Daten
    vorname: str = ""
    nachname: str = ""
    titel: Optional[str] = None             # z.B. "Senior Software Engineer"
    standort: Optional[str] = None
    verfuegbarkeit: Optional[str] = None    # z.B. "Ab sofort", "Ab 01.03.2026"
    stundensatz: Optional[str] = None       # Optional, je nach Profil-Format

    # Zusammenfassung / Profil-Text
    zusammenfassung: Optional[str] = None

    # Kernkompetenzen / Skills
    kernkompetenzen: list[str] = Field(default_factory=list)
    technische_skills: dict[str, list[str]] = Field(default_factory=dict)
    # z.B. {"Programmiersprachen": ["Python", "Java"], "Cloud": ["AWS", "Azure"]}

    # Erfahrung
    berufserfahrung: list[Erfahrung] = Field(default_factory=list)
    projekte: list[Erfahrung] = Field(default_factory=list)

    # Ausbildung & Zertifikate
    ausbildung: list[Ausbildung] = Field(default_factory=list)
    zertifikate: list[Zertifikat] = Field(default_factory=list)

    # Sprachen
    sprachen: list[Sprache] = Field(default_factory=list)

    # Metadaten (intern, nicht im Dokument)
    erstellt_am: Optional[str] = None
    version: str = "1.0"
    modus: str = "standard"                 # "standard" oder "tailored"
    projekt_referenz: Optional[str] = None  # Welches Projekt war Basis für Tailoring

    def vollname(self) -> str:
        return f"{self.vorname} {self.nachname}".strip()


class ProjektAnforderungen(BaseModel):
    """
    Projektbeschreibung für das AI-Tailoring.
    Recruiter fügt diese ein → Claude passt das Profil an.
    """
    titel: str = ""
    beschreibung: str = ""
    pflicht_skills: list[str] = Field(default_factory=list)   # Must-have
    wunsch_skills: list[str] = Field(default_factory=list)    # Nice-to-have
    branche: Optional[str] = None
    dauer: Optional[str] = None
    rohe_ausschreibung: str = ""    # Volltext der Projektbeschreibung (für Claude)
