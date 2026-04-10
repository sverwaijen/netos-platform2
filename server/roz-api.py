#!/usr/bin/env python3
"""
ROZ PDF API Server
Generates ROZ huurovereenkomst PDFs on demand via REST API.
Used by the SKYNET platform to auto-generate contracts at booking time.
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import tempfile
import os
import json
import sys

# Import the PDF generator
sys.path.insert(0, os.path.dirname(__file__))
from importlib import import_module

app = Flask(__name__)
CORS(app)

# Pre-import the generator
import importlib.util
spec = importlib.util.spec_from_file_location("roz_pdf", os.path.join(os.path.dirname(__file__), "roz-pdf-generator.py"))
roz_pdf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(roz_pdf)


# Default verhuurder data (Mr Green Members BV)
VERHUURDER_DEFAULTS = {
    "verhuurderNaam": "Mr Green Members BV",
    "verhuurderAdres": "Keizersgracht 100, 1015 AA Amsterdam",
    "verhuurderKvK": "90123456",
    "verhuurderVertegenwoordiger": "S. Verwaijen",
    "verhuurderBeheerder": "SKYNET Platform",
}


@app.route('/api/roz/generate-contract', methods=['POST'])
def generate_contract():
    """
    Generate a ROZ contract PDF.
    Expects JSON body with huurder + object + contract data.
    Verhuurder data is pre-filled with Mr Green Members BV.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Merge with verhuurder defaults
        contract_data = {**VERHUURDER_DEFAULTS, **data}

        # Validate required fields
        required = ['huurderNaam', 'huurderAdres', 'huurderKvK', 'huurderBTW',
                     'huurderVertegenwoordiger', 'objectAdres', 'objectOppervlakte',
                     'huurperiodeJaren', 'ingangsdatum', 'huurprijsPerMaand']
        missing = [f for f in required if f not in contract_data]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        # Set defaults for optional fields
        contract_data.setdefault('huurderFunctie', 'Directeur')
        contract_data.setdefault('objectPostcode', '1012 AB')
        contract_data.setdefault('objectPlaats', 'Amsterdam')
        contract_data.setdefault('objectKadastraal', 'Nader vast te stellen')
        contract_data.setdefault('objectBestemming', 'kantoorruimte')
        contract_data.setdefault('servicekostenPerMaand', 85)
        contract_data.setdefault('staffelkorting', 0)
        contract_data.setdefault('waarborgsom', contract_data['huurprijsPerMaand'] * 3)
        contract_data.setdefault('indexering', 'CPI')
        contract_data.setdefault('opzegtermijnMaanden', 3)
        contract_data.setdefault('btwPercentage', 21)
        contract_data.setdefault('belastVerhuur', True)

        # Generate contract number if not provided
        if 'contractNumber' not in contract_data:
            import random
            contract_data['contractNumber'] = f"ROZ-2026-{random.randint(1000, 9999)}"

        # Generate PDF to temp file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            output_path = tmp.name

        roz_pdf.generate_roz_contract(contract_data, output_path)

        return send_file(
            output_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"ROZ-Huurovereenkomst-{contract_data['contractNumber']}.pdf"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/roz/preview-contract', methods=['POST'])
def preview_contract():
    """
    Generate a ROZ contract PDF for inline preview (not download).
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        contract_data = {**VERHUURDER_DEFAULTS, **data}

        # Set all defaults
        contract_data.setdefault('huurderFunctie', 'Directeur')
        contract_data.setdefault('objectPostcode', '1012 AB')
        contract_data.setdefault('objectPlaats', 'Amsterdam')
        contract_data.setdefault('objectKadastraal', 'Nader vast te stellen')
        contract_data.setdefault('objectBestemming', 'kantoorruimte')
        contract_data.setdefault('servicekostenPerMaand', 85)
        contract_data.setdefault('staffelkorting', 0)
        contract_data.setdefault('waarborgsom', contract_data.get('huurprijsPerMaand', 720) * 3)
        contract_data.setdefault('indexering', 'CPI')
        contract_data.setdefault('opzegtermijnMaanden', 3)
        contract_data.setdefault('btwPercentage', 21)
        contract_data.setdefault('belastVerhuur', True)
        contract_data.setdefault('huurprijsPerMaand', 720)
        contract_data.setdefault('huurperiodeJaren', 1)
        contract_data.setdefault('ingangsdatum', '2026-05-01')

        if 'contractNumber' not in contract_data:
            import random
            contract_data['contractNumber'] = f"ROZ-2026-{random.randint(1000, 9999)}"

        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            output_path = tmp.name

        roz_pdf.generate_roz_contract(contract_data, output_path)

        return send_file(
            output_path,
            mimetype='application/pdf',
            as_attachment=False,
            download_name=f"ROZ-Preview-{contract_data['contractNumber']}.pdf"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/roz/demo-contract', methods=['GET'])
def demo_contract():
    """
    Generate a demo ROZ contract with sample data.
    Used for the showcase page.
    """
    demo_data = {
        **VERHUURDER_DEFAULTS,
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

    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        output_path = tmp.name

    roz_pdf.generate_roz_contract(demo_data, output_path)

    return send_file(
        output_path,
        mimetype='application/pdf',
        as_attachment=False,
        download_name="ROZ-Huurovereenkomst-DEMO-ROZ-2026-0042.pdf"
    )


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "ROZ PDF Generator API"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)
