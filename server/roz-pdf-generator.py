#!/usr/bin/env python3
"""
ROZ Huurovereenkomst Kantoorruimte PDF Generator
Model conform ROZ 2015 (aangepast 2024) - artikel 7:230a BW

Automatisch ingevuld met:
- Verhuurder: Mr Green Members BV (vast)
- Huurder: uit member-profiel (SKYNET platform)
- Object: uit resource/unit data
- Financieel: uit staffelprijzen en contractvoorwaarden
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, Frame, PageTemplate
)
from reportlab.pdfgen import canvas
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import json
import sys
import os
import locale


# ── Colors ──────────────────────────────────────────────────────────────
DARK_BG = HexColor('#1a1a1a')
ACCENT_GREEN = HexColor('#22c55e')
ACCENT_AMBER = HexColor('#f59e0b')
DARK_CARD = HexColor('#2a2a2a')
TEXT_WHITE = HexColor('#ffffff')
TEXT_GRAY = HexColor('#9ca3af')
BORDER_COLOR = HexColor('#374151')
ROZ_BLUE = HexColor('#003366')
ROZ_GOLD = HexColor('#C5A55A')
HEADER_BG = HexColor('#003366')
LIGHT_BG = HexColor('#f8f9fa')
LINE_COLOR = HexColor('#dee2e6')


def create_styles():
    """Create all paragraph styles for the ROZ document."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'ROZTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=ROZ_BLUE,
        alignment=TA_CENTER,
        spaceAfter=2*mm,
    ))

    styles.add(ParagraphStyle(
        'ROZSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=ROZ_BLUE,
        alignment=TA_CENTER,
        spaceAfter=4*mm,
    ))

    styles.add(ParagraphStyle(
        'ROZModelRef',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=HexColor('#666666'),
        alignment=TA_CENTER,
        spaceAfter=6*mm,
    ))

    styles.add(ParagraphStyle(
        'ROZSectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=ROZ_BLUE,
        spaceBefore=6*mm,
        spaceAfter=3*mm,
    ))

    styles.add(ParagraphStyle(
        'ROZArticle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=black,
        alignment=TA_JUSTIFY,
        spaceAfter=2*mm,
    ))

    styles.add(ParagraphStyle(
        'ROZArticleBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=black,
        alignment=TA_JUSTIFY,
        spaceAfter=2*mm,
    ))

    styles.add(ParagraphStyle(
        'ROZSmall',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=HexColor('#666666'),
        alignment=TA_LEFT,
        spaceAfter=1*mm,
    ))

    styles.add(ParagraphStyle(
        'ROZFooter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=HexColor('#999999'),
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        'ROZLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=HexColor('#374151'),
    ))

    styles.add(ParagraphStyle(
        'ROZValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=black,
    ))

    styles.add(ParagraphStyle(
        'ROZHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=ROZ_BLUE,
        alignment=TA_CENTER,
        spaceBefore=4*mm,
        spaceAfter=2*mm,
    ))

    return styles


def format_currency(amount):
    """Format amount as Euro currency."""
    return f"\u20ac {amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def format_date_nl(dt):
    """Format date in Dutch style."""
    months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
              'juli', 'augustus', 'september', 'oktober', 'november', 'december']
    return f"{dt.day} {months[dt.month - 1]} {dt.year}"


def number_to_words_nl(n):
    """Convert number to Dutch words (simplified)."""
    ones = ['', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen',
            'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien',
            'zeventien', 'achttien', 'negentien']
    tens = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig',
            'tachtig', 'negentig']

    if n < 20:
        return ones[n]
    elif n < 100:
        t, o = divmod(n, 10)
        return (ones[o] + 'en' if o else '') + tens[t]
    elif n < 1000:
        h, rest = divmod(n, 100)
        return ones[h] + 'honderd' + (number_to_words_nl(rest) if rest else '')
    elif n < 10000:
        t, rest = divmod(n, 1000)
        return number_to_words_nl(t) + 'duizend' + (number_to_words_nl(rest) if rest else '')
    elif n < 1000000:
        t, rest = divmod(n, 1000)
        return number_to_words_nl(t) + 'duizend' + (' ' + number_to_words_nl(rest) if rest else '')
    return str(n)


class ROZHeaderFooter:
    """Add header/footer to each page."""

    def __init__(self, contract_data):
        self.data = contract_data
        self.page_count = 0

    def __call__(self, canvas_obj, doc):
        self.page_count += 1
        canvas_obj.saveState()

        # Header line
        canvas_obj.setStrokeColor(ROZ_BLUE)
        canvas_obj.setLineWidth(1.5)
        canvas_obj.line(20*mm, A4[1] - 15*mm, A4[0] - 20*mm, A4[1] - 15*mm)

        # Header text
        canvas_obj.setFont('Helvetica', 7)
        canvas_obj.setFillColor(ROZ_BLUE)
        canvas_obj.drawString(20*mm, A4[1] - 13*mm,
                              "HUUROVEREENKOMST KANTOORRUIMTE — ROZ Model 2015 (aangepast 2024)")
        canvas_obj.drawRightString(A4[0] - 20*mm, A4[1] - 13*mm,
                                   f"Contract: {self.data.get('contractNumber', 'ROZ-2026-XXXX')}")

        # Footer
        canvas_obj.setStrokeColor(LINE_COLOR)
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(20*mm, 18*mm, A4[0] - 20*mm, 18*mm)

        canvas_obj.setFont('Helvetica', 7)
        canvas_obj.setFillColor(HexColor('#999999'))
        canvas_obj.drawString(20*mm, 13*mm, f"Paraaf Verhuurder: ............")
        canvas_obj.drawRightString(A4[0] - 20*mm, 13*mm, f"Paraaf Huurder: ............")
        canvas_obj.drawCentredString(A4[0] / 2, 13*mm,
                                     f"Pagina {self.page_count}")

        # ROZ watermark (subtle)
        canvas_obj.setFont('Helvetica', 60)
        canvas_obj.setFillColor(HexColor('#f0f0f0'))
        canvas_obj.saveState()
        canvas_obj.translate(A4[0] / 2, A4[1] / 2)
        canvas_obj.rotate(45)
        canvas_obj.drawCentredString(0, 0, "ROZ")
        canvas_obj.restoreState()

        canvas_obj.restoreState()


def generate_roz_contract(data, output_path):
    """
    Generate a complete ROZ huurovereenkomst PDF.

    data = {
        # Verhuurder (vast)
        "verhuurderNaam": "Mr Green Members BV",
        "verhuurderAdres": "Keizersgracht 100, 1015 AA Amsterdam",
        "verhuurderKvK": "12345678",
        "verhuurderVertegenwoordiger": "S. Verwaijen",
        "verhuurderBeheerder": "SKYNET Platform",

        # Huurder (uit member-profiel)
        "huurderNaam": "Tech Startup BV",
        "huurderAdres": "Herengracht 200, 1016 BS Amsterdam",
        "huurderKvK": "87654321",
        "huurderBTW": "NL123456789B01",
        "huurderVertegenwoordiger": "J. de Vries",
        "huurderFunctie": "Directeur",

        # Object (uit resource/unit)
        "objectAdres": "The Hub Amsterdam, Verdieping 3 — Kantoor Suite A",
        "objectPostcode": "1012 AB",
        "objectPlaats": "Amsterdam",
        "objectKadastraal": "Amsterdam AK 12345 A-1",
        "objectOppervlakte": 185,
        "objectBestemming": "kantoorruimte",

        # Contract
        "contractNumber": "ROZ-2026-0042",
        "huurperiodeJaren": 1,
        "ingangsdatum": "2026-05-01",
        "huurprijsPerMaand": 720,      # credits
        "servicekostenPerMaand": 85,    # credits
        "staffelkorting": 15,           # percentage
        "waarborgsom": 2160,            # credits (3 maanden)
        "indexering": "CPI",
        "opzegtermijnMaanden": 3,
        "btwPercentage": 21,
        "belastVerhuur": True,
    }
    """

    styles = create_styles()
    header_footer = ROZHeaderFooter(data)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=22*mm,
        bottomMargin=25*mm,
        title=f"ROZ Huurovereenkomst - {data['contractNumber']}",
        author="SKYNET Platform — Mr Green Members BV",
    )

    story = []

    # Parse dates
    ingangsdatum = datetime.strptime(data['ingangsdatum'], '%Y-%m-%d')
    jaren = data['huurperiodeJaren']
    einddatum = ingangsdatum + relativedelta(years=jaren) - timedelta(days=1)
    eerste_indexering = ingangsdatum + relativedelta(years=1)
    boekjaar_start = datetime(ingangsdatum.year, 1, 1)
    boekjaar_eind = datetime(ingangsdatum.year, 12, 31)

    # Calculate financials
    huur_per_maand = data['huurprijsPerMaand']
    huur_per_jaar = huur_per_maand * 12
    huur_per_kwartaal = huur_per_maand * 3
    sk_per_maand = data['servicekostenPerMaand']
    sk_per_kwartaal = sk_per_maand * 3
    totaal_per_kwartaal = huur_per_kwartaal + sk_per_kwartaal
    waarborgsom = data['waarborgsom']

    # ════════════════════════════════════════════════════════════════
    # PAGE 1: UITGANGSPUNTEN
    # ════════════════════════════════════════════════════════════════

    story.append(Spacer(1, 5*mm))

    # Title block
    story.append(Paragraph("HUUROVEREENKOMST KANTOORRUIMTE", styles['ROZTitle']))
    story.append(Paragraph(
        "en andere bedrijfsruimte in de zin van artikel 7:230a BW",
        styles['ROZSubtitle']
    ))
    story.append(Paragraph(
        "Model door de Raad voor Onroerende Zaken (ROZ) op 30-1-2015 vastgesteld en op 17-2-2015 "
        "gedeponeerd bij de griffie van de rechtbank te Den Haag en aldaar ingeschreven onder nummer "
        "15/20 tevens gepubliceerd op de website www.roz.nl.",
        styles['ROZModelRef']
    ))

    # Decorative line
    story.append(HRFlowable(
        width="100%", thickness=2, color=ROZ_GOLD,
        spaceAfter=4*mm, spaceBefore=2*mm
    ))

    story.append(Paragraph(
        '<font color="#003366"><b>UITGANGSPUNTEN HUUROVEREENKOMST</b></font>',
        styles['ROZHeader']
    ))

    story.append(Spacer(1, 3*mm))

    # Key data table
    col_widths = [55*mm, 5*mm, 110*mm]
    key_data = [
        [Paragraph("<b>Verhuurder</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"<b>{data['verhuurderNaam']}</b>", styles['ROZValue'])],

        [Paragraph("<b>Huurder</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"<b>{data['huurderNaam']}</b>", styles['ROZValue'])],

        [Paragraph("<b>Aanvang Boekjaar Huurder</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(format_date_nl(boekjaar_start), styles['ROZValue'])],

        [Paragraph("", styles['ROZLabel']), Paragraph("", styles['ROZLabel']), Paragraph("", styles['ROZValue'])],

        [Paragraph("<b>Object</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"{data['objectAdres']}", styles['ROZValue'])],

        [Paragraph("<b>Kadastraal</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"{data.get('objectKadastraal', 'Nader vast te stellen')}", styles['ROZValue'])],

        [Paragraph("", styles['ROZLabel']), Paragraph("", styles['ROZLabel']), Paragraph("", styles['ROZValue'])],

        [Paragraph("<b>Huurtermijn</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"{jaren} {'jaar' if jaren != 1 else 'jaar'}", styles['ROZValue'])],

        [Paragraph("<b>Huuringangsdatum</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(format_date_nl(ingangsdatum), styles['ROZValue'])],

        [Paragraph("<b>Einddatum</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(format_date_nl(einddatum), styles['ROZValue'])],

        [Paragraph("<b>Huuropzegtermijn</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"{data['opzegtermijnMaanden']} kalendermaanden", styles['ROZValue'])],

        [Paragraph("<b>Optietermijn</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"telkens {max(1, jaren)} jaar", styles['ROZValue'])],

        [Paragraph("", styles['ROZLabel']), Paragraph("", styles['ROZLabel']), Paragraph("", styles['ROZValue'])],

        [Paragraph("<b>Huurprijs</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"{huur_per_jaar} credits per jaar excl. BTW voor de eerste periode "
                    f"({huur_per_maand} credits/maand)", styles['ROZValue'])],

        [Paragraph("<b>Belaste verhuur</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph("Ja, per datum ingang huurovereenkomst" if data['belastVerhuur'] else "Nee",
                    styles['ROZValue'])],

        [Paragraph("<b>Indexering</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"Jaarlijks ({data['indexering']}), voor het eerst op {format_date_nl(eerste_indexering)}",
                    styles['ROZValue'])],

        [Paragraph("<b>Waarborgsom</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"{waarborgsom} credits", styles['ROZValue'])],

        [Paragraph("<b>Staffelkorting</b>", styles['ROZLabel']),
         Paragraph(":", styles['ROZLabel']),
         Paragraph(f"-{data['staffelkorting']}% (looptijd {jaren} {'jaar' if jaren >= 1 else 'maanden'})",
                    styles['ROZValue'])],
    ]

    t = Table(key_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, LINE_COLOR),
        ('LINEBELOW', (0, 1), (-1, 1), 0.5, LINE_COLOR),
        ('LINEBELOW', (0, 7), (-1, 7), 0.5, LINE_COLOR),
        ('LINEBELOW', (0, 10), (-1, 10), 0.5, LINE_COLOR),
        ('LINEBELOW', (0, 13), (-1, 13), 0.5, LINE_COLOR),
    ]))
    story.append(t)

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "<i>N.B. Alle bedragen zijn in SKYNET credits. 1 credit = 1 EUR excl. BTW. "
        "Facturatie geschiedt via het SKYNET credit-systeem.</i>",
        styles['ROZSmall']
    ))

    story.append(Spacer(1, 6*mm))

    # Contract number badge
    story.append(Paragraph(
        f'<font color="#C5A55A"><b>Contractnummer: {data["contractNumber"]}</b></font>',
        ParagraphStyle('ContractBadge', parent=styles['ROZArticle'],
                       alignment=TA_CENTER, fontSize=10, spaceAfter=4*mm)
    ))

    # ════════════════════════════════════════════════════════════════
    # PAGE 2: ONDERGETEKENDEN + ARTIKELEN 1-3
    # ════════════════════════════════════════════════════════════════
    story.append(PageBreak())

    story.append(Paragraph("ONDERGETEKENDEN", styles['ROZSectionTitle']))

    story.append(Paragraph(
        f"<b>1]</b> {data['verhuurderNaam']}, gevestigd te {data['verhuurderAdres']}, "
        f"hierna te noemen '<b>Verhuurder</b>', ingeschreven in het handelsregister van de Kamers van "
        f"Koophandel onder nummer {data['verhuurderKvK']}, vertegenwoordigd door "
        f"{data['verhuurderVertegenwoordiger']}.",
        styles['ROZArticle']
    ))

    story.append(Paragraph("<b>EN</b>", ParagraphStyle(
        'EN', parent=styles['ROZArticle'], alignment=TA_CENTER, spaceBefore=3*mm, spaceAfter=3*mm
    )))

    story.append(Paragraph(
        f"<b>2]</b> {data['huurderNaam']}, gevestigd te {data['huurderAdres']}, "
        f"hierna te noemen '<b>Huurder</b>', ingeschreven in het handelsregister van de Kamers van "
        f"Koophandel onder nummer {data['huurderKvK']}, "
        f"omzetbelastingnummer {data['huurderBTW']}, "
        f"vertegenwoordigd door {data['huurderVertegenwoordiger']}, "
        f"in de functie van {data['huurderFunctie']}.",
        styles['ROZArticle']
    ))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("<b>ZIJN OVEREENGEKOMEN</b>", ParagraphStyle(
        'Overeengekomen', parent=styles['ROZArticle'], alignment=TA_CENTER,
        spaceBefore=4*mm, spaceAfter=4*mm, fontSize=10
    )))

    # ── Artikel 1: Het gehuurde ──
    story.append(Paragraph("Het gehuurde, bestemming", styles['ROZSectionTitle']))

    story.append(Paragraph(
        f"<b>1.1</b> Verhuurder verhuurt aan Huurder en Huurder huurt van Verhuurder de bedrijfsruimte "
        f"(hierna 'gehuurde'), gelegen aan <b>{data['objectAdres']}</b> te "
        f"({data['objectPostcode']}) {data['objectPlaats']}, "
        f"kadastraal bekend {data.get('objectKadastraal', 'nader vast te stellen')}, "
        f"ter grootte van in totaal circa <b>{data['objectOppervlakte']} m²</b> "
        f"b.v.o. gemeten volgens NEN2580 methode.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        f"<b>1.2</b> Het gehuurde zal door of vanwege Huurder uitsluitend worden bestemd om te worden "
        f"gebruikt als {data['objectBestemming']} ten behoeve van huurder zelf.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>1.3</b> Het is Huurder niet toegestaan zonder voorafgaande schriftelijke toestemming van "
        "Verhuurder een andere bestemming aan het gehuurde te geven dan omschreven in artikel 1.2.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>1.4</b> De hoogst toelaatbare belasting van de vloeren van het gehuurde bedraagt zoveel als "
        "bouwkundig is toegestaan.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>1.5</b> Huurder heeft bij het aangaan van de huurovereenkomst een kopie van het energielabel, "
        "als bedoeld in het Besluit energieprestatie gebouwen, ontvangen ten aanzien van het gehuurde.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>1.6</b> Indien blijkt dat de in artikel 1.1 genoemde oppervlakte niet juist is komen partijen "
        "overeen dat een verschil met de daadwerkelijke grootte (onder- dan wel overmaat) geen verschil "
        "zal hebben voor de huurprijs.",
        styles['ROZArticle']
    ))

    # ── Artikel 2: Voorwaarden ──
    story.append(Paragraph("Voorwaarden", styles['ROZSectionTitle']))

    story.append(Paragraph(
        '<b>2.1</b> Van deze huurovereenkomst maken deel uit de "ALGEMENE BEPALINGEN '
        'HUUROVEREENKOMST KANTOORRUIMTE en andere bedrijfsruimte in de zin van artikel 7:230a BW", '
        'gedeponeerd bij de griffie van de rechtbank te Den Haag op 17-2-2015 en aldaar ingeschreven '
        'onder nummer 15/21, (hierna te noemen "algemene bepalingen"). De inhoud van deze algemene '
        'bepalingen is partijen bekend. Huurder en Verhuurder hebben een exemplaar van de algemene '
        'bepalingen ontvangen.',
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>2.2</b> De algemene bepalingen waarnaar in artikel 2.1 wordt verwezen, zijn van toepassing "
        "behoudens voor zover daarvan in deze huurovereenkomst uitdrukkelijk is afgeweken of toepassing "
        "daarvan ten aanzien van het gehuurde niet mogelijk is.",
        styles['ROZArticle']
    ))

    # ── Artikel 3: Duur, verlenging en opzegging ──
    story.append(Paragraph("Duur, verlenging en opzegging", styles['ROZSectionTitle']))

    verlenging_periode = max(1, jaren)
    verlenging_eind = einddatum + relativedelta(years=verlenging_periode)

    story.append(Paragraph(
        f"<b>3.1</b> Deze huurovereenkomst gaat in op {format_date_nl(ingangsdatum)} (hierna "
        f"'ingangsdatum') en is aangegaan voor een periode van {jaren} "
        f"{'jaar' if jaren >= 1 else 'maanden'} en loopt tot en met {format_date_nl(einddatum)}.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        f"<b>3.2</b> Na het verstrijken van de in artikel 3.1 genoemde periode wordt deze huurovereenkomst "
        f"behoudens beëindiging door opzegging voortgezet voor een aansluitende periode van "
        f"{verlenging_periode} jaar, derhalve tot en met {format_date_nl(verlenging_eind)}. "
        f"Deze huurovereenkomst wordt vervolgens voortgezet voor aansluitende perioden van "
        f"{verlenging_periode} jaar.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        f"<b>3.3</b> Beëindiging van deze huurovereenkomst vindt plaats door opzegging door Huurder aan "
        f"Verhuurder of door Verhuurder aan Huurder tegen het einde van de lopende huurperiode, met "
        f"inachtneming van een termijn van <b>{data['opzegtermijnMaanden']} kalendermaanden</b>.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>3.4</b> Opzegging dient te geschieden bij deurwaardersexploot of per aangetekend schrijven.",
        styles['ROZArticle']
    ))

    # ════════════════════════════════════════════════════════════════
    # PAGE 3: ARTIKELEN 4-6 (Financieel)
    # ════════════════════════════════════════════════════════════════
    story.append(PageBreak())

    story.append(Paragraph(
        "Huurprijs, omzetbelasting, servicekosten, huurprijsaanpassing, "
        "betalingsverplichting, betaalperiode",
        styles['ROZSectionTitle']
    ))

    story.append(Paragraph(
        f"<b>4.1</b> De aanvangshuurprijs van het gehuurde bedraagt op de ingangsdatum op jaarbasis "
        f"<b>{huur_per_jaar} credits</b> "
        f"(zegge: {number_to_words_nl(huur_per_jaar).capitalize()} credits). "
        f"Dit komt overeen met {huur_per_maand} credits per maand.",
        styles['ROZArticle']
    ))

    if data['belastVerhuur']:
        story.append(Paragraph(
            f"<b>4.2</b> Partijen komen overeen dat Verhuurder omzetbelasting ({data['btwPercentage']}%) "
            f"over de huurprijs in rekening brengt.",
            styles['ROZArticle']
        ))

        story.append(Paragraph(
            "<b>4.3</b> Partijen verklaren onder verwijzing naar artikel 11 lid 1 aanhef onder b onderdeel 5 "
            "van de Wet op de omzetbelasting 1968 een met omzetbelasting belaste verhuur te zijn "
            "overeengekomen. Tevens wordt omzetbelasting in rekening gebracht over de vergoeding die "
            "Huurder verschuldigd is voor door of vanwege Verhuurder te verzorgen levering van zaken en "
            "diensten.",
            styles['ROZArticle']
        ))

    story.append(Paragraph(
        f"<b>4.4</b> Het boekjaar van Huurder loopt van {format_date_nl(boekjaar_start)} tot en met "
        f"{format_date_nl(boekjaar_eind)}.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        f"<b>4.5</b> De huurprijs wordt jaarlijks per {ingangsdatum.day} "
        f"{['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'][ingangsdatum.month-1]} "
        f"voor het eerst met ingang van {format_date_nl(eerste_indexering)} aangepast overeenkomstig "
        f"het {data['indexering']} (consumentenprijsindex) conform artikelen 17.1 t/m 17.3 van de "
        f"algemene bepalingen.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>4.6</b> De vergoeding die Huurder verschuldigd is voor de door of vanwege Verhuurder te "
        "verzorgen levering van zaken en diensten wordt bepaald overeenkomstig artikel 18 van de "
        "algemene bepalingen. Op deze vergoeding wordt een systeem van voorschotbetalingen met "
        "latere verrekening toegepast.",
        styles['ROZArticle']
    ))

    # Financial summary table
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f"<b>4.8</b> Per betaalperiode van 1 kalendermaand bedraagt bij huuringangsdatum:",
        styles['ROZArticleBold']
    ))

    btw_huur = round(huur_per_maand * data['btwPercentage'] / 100, 2)
    btw_sk = round(sk_per_maand * data['btwPercentage'] / 100, 2)
    totaal_excl = huur_per_maand + sk_per_maand
    totaal_btw = round(btw_huur + btw_sk, 2)
    totaal_incl = round(totaal_excl + totaal_btw, 2)

    fin_data = [
        [Paragraph("<b>Omschrijving</b>", styles['ROZLabel']),
         Paragraph("<b>Excl. BTW</b>", styles['ROZLabel']),
         Paragraph(f"<b>BTW {data['btwPercentage']}%</b>", styles['ROZLabel']),
         Paragraph("<b>Incl. BTW</b>", styles['ROZLabel'])],
        [Paragraph("Huurprijs", styles['ROZValue']),
         Paragraph(f"{huur_per_maand} credits", styles['ROZValue']),
         Paragraph(f"{btw_huur} credits", styles['ROZValue']),
         Paragraph(f"{huur_per_maand + btw_huur} credits", styles['ROZValue'])],
        [Paragraph("Voorschot servicekosten", styles['ROZValue']),
         Paragraph(f"{sk_per_maand} credits", styles['ROZValue']),
         Paragraph(f"{btw_sk} credits", styles['ROZValue']),
         Paragraph(f"{sk_per_maand + btw_sk} credits", styles['ROZValue'])],
        [Paragraph("<b>Totaal per maand</b>", styles['ROZLabel']),
         Paragraph(f"<b>{totaal_excl} credits</b>", styles['ROZLabel']),
         Paragraph(f"<b>{totaal_btw} credits</b>", styles['ROZLabel']),
         Paragraph(f"<b>{totaal_incl} credits</b>", styles['ROZLabel'])],
    ]

    fin_table = Table(fin_data, colWidths=[60*mm, 40*mm, 35*mm, 40*mm])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e8edf2')),
        ('GRID', (0, 0), (-1, -1), 0.5, LINE_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BACKGROUND', (0, -1), (-1, -1), HexColor('#f0f4f8')),
    ]))
    story.append(fin_table)

    story.append(Spacer(1, 3*mm))

    if data['staffelkorting'] > 0:
        story.append(Paragraph(
            f"<i>N.B. Op bovenstaande huurprijs is een staffelkorting van {data['staffelkorting']}% "
            f"toegepast op basis van de overeengekomen huurperiode van {jaren} "
            f"{'jaar' if jaren >= 1 else 'maanden'}. De basisprijs bedraagt "
            f"{round(huur_per_maand / (1 - data['staffelkorting']/100))} credits/maand.</i>",
            styles['ROZSmall']
        ))

    story.append(Paragraph(
        f"<b>4.10</b> De uit hoofde van deze huurovereenkomst door Huurder aan Verhuurder te verrichten "
        f"periodieke betalingen zijn in één bedrag bij vooruitbetaling verschuldigd in credits en moeten "
        f"vóór of op de eerste dag van de maand waarop de betalingen betrekking hebben volledig zijn "
        f"voldaan via het SKYNET credit-systeem.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>4.11</b> Tenzij anders vermeld, luiden alle bedragen in deze huurovereenkomst en de daarvan "
        "deel uitmakende algemene bepalingen in SKYNET credits (1 credit = 1 EUR excl. omzetbelasting).",
        styles['ROZArticle']
    ))

    # ── Artikel 5: Servicekosten ──
    story.append(Paragraph("Kosten van levering van zaken en diensten", styles['ROZSectionTitle']))

    story.append(Paragraph(
        "<b>5.1</b> Door of vanwege Verhuurder worden de volgende leveringen en diensten verzorgd:",
        styles['ROZArticle']
    ))

    services = [
        "Schoonmaak gemeenschappelijke ruimten",
        "Energie (verwarming, koeling, elektra gemeenschappelijk)",
        "Internet (WiFi 1Gbps)",
        "Beveiliging en toegangscontrole",
        "Onderhoud gemeenschappelijke installaties",
        "Afvalverwerking",
    ]
    for s in services:
        story.append(Paragraph(f"  — {s}", styles['ROZArticle']))

    story.append(Paragraph(
        "<b>5.2</b> Verhuurder is bevoegd na overleg met Huurder de in artikel 5.1 genoemde levering van "
        "zaken en diensten naar soort en omvang te wijzigen of te laten vervallen.",
        styles['ROZArticle']
    ))

    # ── Artikel 6: Zekerheden ──
    story.append(Paragraph("Zekerheden", styles['ROZSectionTitle']))

    story.append(Paragraph(
        f"<b>6.1</b> Huurder zal voor de ingangsdatum een waarborgsom betalen ter grootte van een bedrag "
        f"van <b>{waarborgsom} credits</b> "
        f"(zegge: {number_to_words_nl(int(waarborgsom)).capitalize()} credits). "
        f"De waarborgsom wordt direct afgeschreven van de SKYNET wallet van Huurder bij bevestiging "
        f"van de boeking.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>6.2</b> Over de waarborgsom wordt geen rente vergoed.",
        styles['ROZArticle']
    ))

    # ── Artikel 7: Beheerder ──
    story.append(Paragraph("Beheerder", styles['ROZSectionTitle']))

    story.append(Paragraph(
        f"<b>7.1</b> Totdat Verhuurder anders meedeelt, treedt als beheerder op: "
        f"<b>{data['verhuurderBeheerder']}</b> (platform.skynet.nl).",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>7.2</b> Tenzij schriftelijk anders overeengekomen, dient Huurder voor wat betreft de inhoud en "
        "alle verdere aangelegenheden betreffende deze huurovereenkomst met de beheerder contact op "
        "te nemen via het SKYNET platform.",
        styles['ROZArticle']
    ))

    # ════════════════════════════════════════════════════════════════
    # PAGE 4: ARTIKELEN 8-13 (Bijzondere bepalingen)
    # ════════════════════════════════════════════════════════════════
    story.append(PageBreak())

    story.append(Paragraph("Incentives", styles['ROZSectionTitle']))
    story.append(Paragraph(
        "<b>8</b> Partijen verklaren dat er tussen partijen geen andere incentives zijn overeengekomen dan "
        "in deze huurovereenkomst vermeld.",
        styles['ROZArticle']
    ))

    story.append(Paragraph("Asbest/Milieu", styles['ROZSectionTitle']))
    story.append(Paragraph(
        "<b>9.1</b> Aan Verhuurder is niet bekend dat in het gehuurde asbest is verwerkt. De onbekendheid "
        "van Verhuurder met de aanwezigheid van asbest in het gehuurde houdt uitdrukkelijk geen "
        "garantie in van Verhuurder dat er geen asbest aanwezig is.",
        styles['ROZArticle']
    ))
    story.append(Paragraph(
        "<b>9.2</b> Aan Verhuurder is niet bekend dat in, op of aan het gehuurde een verontreiniging "
        "aanwezig is die van dien aard is dat op grond van geldende wetgeving maatregelen noodzakelijk zijn.",
        styles['ROZArticle']
    ))

    story.append(Paragraph("Duurzaamheid / Green Lease", styles['ROZSectionTitle']))
    story.append(Paragraph(
        "<b>10</b> Partijen onderkennen het belang van duurzaamheid en komen overeen elkaar te "
        "ondersteunen in het behalen van de gezamenlijk geformuleerde doelstellingen en op regelmatige "
        "basis de voortgang te bespreken.",
        styles['ROZArticle']
    ))

    story.append(Paragraph("Bijzondere bepalingen", styles['ROZSectionTitle']))

    story.append(Paragraph(
        "<b>13.1 Verzekeringen</b> — Huurder dient zelf, voor eigen rekening en risico, zorg te dragen voor "
        "het afsluiten van de diverse verzekeringen waaronder in ieder geval begrepen: een "
        "inboedelverzekering, een bedrijfsaansprakelijkheidsverzekering en een bedrijfsrisicoverzekering.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>13.2 Nutsvoorzieningen</b> — Huurder dient direct na oplevering voor eigen rekening en risico "
        "zorg te dragen voor de leveringen en aansluitingen van nutsvoorzieningen voor zover niet "
        "inbegrepen in de servicekosten.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>13.3 Naamsaanduidingen</b> — Indien huurder (licht)reclame en andere aanduidingen aan de "
        "buitengevel wenst aan te brengen dient hij hiertoe een schriftelijk verzoek in bij verhuurder.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>13.5 Het gebruik</b> — Het is huurder nadrukkelijk niet toegestaan een andere bestemming aan "
        "het gehuurde te geven als omschreven in artikel 1.2 van deze huurovereenkomst.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>13.6 Onderverhuur</b> — De overdracht van huurrechten op welke wijze dan ook is nadrukkelijk "
        "niet toegestaan behoudens na uitsluitend schriftelijke toestemming van verhuurder.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>13.8 Onderhoud</b> — In aanvulling van artikel 11.4 van de algemene bepalingen geldt dat het "
        "schilderwerk aan kozijnen, ramen en deuren alsmede eventueel de pui en borstwering voor "
        "rekening en risico van huurder zijn.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>13.9 Persoonsgegevens</b> — Verhuurder verwerkt de persoonsgegevens van (de "
        "vertegenwoordiger van) huurder voor de doeleinden als opgenomen in het privacy statement "
        "van verhuurder, beschikbaar via het SKYNET platform.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>13.10 Elektronische ondertekening</b> — Partijen komen overeen dat de huurovereenkomst "
        "ondertekend zal worden door middel van een elektronische gekwalificeerde handtekening "
        "conform artikel 3:15a Burgerlijk Wetboek, gefaciliteerd via het SKYNET platform.",
        styles['ROZArticle']
    ))

    # ════════════════════════════════════════════════════════════════
    # PAGE 5: CREDIT-SYSTEEM + ONDERTEKENING
    # ════════════════════════════════════════════════════════════════
    story.append(PageBreak())

    story.append(Paragraph("SKYNET Credit-Systeem Bepalingen", styles['ROZSectionTitle']))

    story.append(Paragraph(
        "<b>14.1</b> Alle betalingen uit hoofde van deze huurovereenkomst geschieden via het SKYNET "
        "credit-systeem. Huurder dient te allen tijde een toereikend creditsaldo aan te houden in de "
        "SKYNET wallet.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>14.2</b> De maandelijkse huur en servicekosten worden automatisch afgeschreven op de eerste "
        "dag van iedere kalendermaand. Indien het saldo ontoereikend is, wordt Huurder hiervan per "
        "e-mail op de hoogte gesteld en geldt een betalingstermijn van 5 werkdagen.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>14.3</b> De waarborgsom wordt bij aanvang van de huurovereenkomst direct afgeschreven van "
        "de SKYNET wallet en wordt bij beëindiging van de huurovereenkomst, na verrekening van "
        "eventuele openstaande posten, teruggestort op de wallet.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        f"<b>14.4</b> De staffelkorting van {data['staffelkorting']}% is gebaseerd op de overeengekomen "
        f"huurperiode van {jaren} {'jaar' if jaren >= 1 else 'maanden'}. Bij voortijdige beëindiging door "
        f"Huurder wordt het verschil tussen de basisprijs en de gereduceerde prijs over de reeds "
        f"verstreken periode nabetaald.",
        styles['ROZArticle']
    ))

    story.append(Paragraph(
        "<b>14.5</b> Alle facturen zijn digitaal beschikbaar via het SKYNET platform onder het tabblad "
        "'ROZ Facturatie'. Huurder ontvangt maandelijks een digitale factuur per e-mail.",
        styles['ROZArticle']
    ))

    # ── Ondertekening ──
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ROZ_GOLD, spaceAfter=6*mm))

    story.append(Paragraph(
        "Aldus opgemaakt en ondertekend in tweevoud",
        ParagraphStyle('Ondertekening', parent=styles['ROZArticle'],
                       alignment=TA_CENTER, fontSize=10, fontName='Helvetica-Bold',
                       spaceAfter=6*mm)
    ))

    # Signature table
    sig_data = [
        [Paragraph("<b>Verhuurder</b>", styles['ROZLabel']),
         Paragraph("", styles['ROZLabel']),
         Paragraph("<b>Huurder</b>", styles['ROZLabel'])],

        [Paragraph(f"{data['verhuurderNaam']}", styles['ROZValue']),
         Paragraph("", styles['ROZValue']),
         Paragraph(f"{data['huurderNaam']}", styles['ROZValue'])],

        [Paragraph(f"Plaats: {data['objectPlaats']}", styles['ROZValue']),
         Paragraph("", styles['ROZValue']),
         Paragraph(f"Plaats: ........................", styles['ROZValue'])],

        [Paragraph(f"Datum: {format_date_nl(datetime.now())}", styles['ROZValue']),
         Paragraph("", styles['ROZValue']),
         Paragraph(f"Datum: ........................", styles['ROZValue'])],

        [Paragraph("", styles['ROZValue']),
         Paragraph("", styles['ROZValue']),
         Paragraph("", styles['ROZValue'])],

        [Paragraph("Handtekening:", styles['ROZValue']),
         Paragraph("", styles['ROZValue']),
         Paragraph("Handtekening:", styles['ROZValue'])],

        [Paragraph("", styles['ROZValue']),
         Paragraph("", styles['ROZValue']),
         Paragraph("", styles['ROZValue'])],

        [Paragraph("________________________", styles['ROZValue']),
         Paragraph("", styles['ROZValue']),
         Paragraph("________________________", styles['ROZValue'])],

        [Paragraph(f"{data['verhuurderVertegenwoordiger']}", styles['ROZSmall']),
         Paragraph("", styles['ROZSmall']),
         Paragraph(f"{data['huurderVertegenwoordiger']}", styles['ROZSmall'])],
    ]

    sig_table = Table(sig_data, colWidths=[75*mm, 20*mm, 75*mm])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LINEBELOW', (0, 0), (0, 0), 0.5, ROZ_BLUE),
        ('LINEBELOW', (2, 0), (2, 0), 0.5, ROZ_BLUE),
    ]))
    story.append(sig_table)

    # ── Bijlagen ──
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("<b>Bijlagen:</b>", styles['ROZArticleBold']))

    bijlagen = [
        "Plattegrond/tekening van het gehuurde",
        "Proces-verbaal van oplevering (toe te voegen ten tijde van oplevering)",
        "Meting volgens de NEN2580 methode",
        "Energielabel",
        "Algemene bepalingen huurovereenkomst kantoorruimte (ROZ 2015)",
        "Uittreksel handelsregister KvK Verhuurder",
        "Uittreksel handelsregister KvK Huurder",
    ]
    for b in bijlagen:
        story.append(Paragraph(f"  [X]  {b}", styles['ROZArticle']))

    # ── Ontvangstbevestiging ──
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(
        "Afzonderlijke handtekening van Huurder voor de ontvangst van een eigen exemplaar van de "
        "'ALGEMENE BEPALINGEN HUUROVEREENKOMST KANTOORRUIMTE en andere bedrijfsruimte in "
        "de zin van artikel 7:230a BW' als genoemd in artikel 2.1.",
        styles['ROZSmall']
    ))

    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("Handtekening Huurder: ________________________", styles['ROZArticle']))

    # Build the PDF
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    return output_path


# ── CLI Usage ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    # Example: generate with demo data
    demo_data = {
        "verhuurderNaam": "Mr Green Members BV",
        "verhuurderAdres": "Keizersgracht 100, 1015 AA Amsterdam",
        "verhuurderKvK": "90123456",
        "verhuurderVertegenwoordiger": "S. Verwaijen",
        "verhuurderBeheerder": "SKYNET Platform",

        "huurderNaam": "Tech Innovators BV",
        "huurderAdres": "Herengracht 200, 1016 BS Amsterdam",
        "huurderKvK": "87654321",
        "huurderBTW": "NL987654321B01",
        "huurderVertegenwoordiger": "J. de Vries",
        "huurderFunctie": "Directeur",

        "objectAdres": "The Hub Amsterdam, Verdieping 3 — Kantoor Suite A",
        "objectPostcode": "1012 AB",
        "objectPlaats": "Amsterdam",
        "objectKadastraal": "Amsterdam AK 12345 A-1",
        "objectOppervlakte": 185,
        "objectBestemming": "kantoorruimte",

        "contractNumber": "ROZ-2026-0042",
        "huurperiodeJaren": 1,
        "ingangsdatum": "2026-05-01",
        "huurprijsPerMaand": 720,
        "servicekostenPerMaand": 85,
        "staffelkorting": 15,
        "waarborgsom": 2160,
        "indexering": "CPI",
        "opzegtermijnMaanden": 3,
        "btwPercentage": 21,
        "belastVerhuur": True,
    }

    if len(sys.argv) > 1:
        # Load data from JSON file
        with open(sys.argv[1], 'r') as f:
            demo_data.update(json.load(f))

    output = sys.argv[2] if len(sys.argv) > 2 else '/home/ubuntu/skynet-platform2/roz-demo/roz-contract-demo.pdf'
    result = generate_roz_contract(demo_data, output)
    print(f"ROZ Contract PDF generated: {result}")
