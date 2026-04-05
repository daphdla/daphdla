"""
PEA-eligible Euronext tickers — 50 stocks across 3 sectors.
Suffix legend: .PA = Paris, .NL = Amsterdam, .BE = Brussels
"""

TICKERS = {
    "Industrie": [
        "AIR.PA",   # Airbus
        "DG.PA",    # Vinci
        "SGO.PA",   # Saint-Gobain
        "RI.PA",    # Pernod Ricard (diversified)
        "VIE.PA",   # Veolia
        "CS.PA",    # AXA
        "SAN.PA",   # Sanofi
        "CAP.PA",   # Capgemini
        "SU.PA",    # Schneider Electric
        "LR.PA",    # Legrand
        "RNO.PA",   # Renault
        "STLAM.MI", # Stellantis (cross-listed)
        "ALO.PA",   # Alstom
        "TNET.BR",  # Telenet (BE)
        "ACKB.BR",  # Ackermans & van Haaren (BE)
        "APAM.AS",  # Aperam (NL)
        "PHIA.AS",  # Philips (NL)
        "ASML.AS",  # ASML (NL)
        "URW.PA",   # Unibail-Rodamco
        "ORA.PA",   # Orange
    ],
    "Luxe": [
        "MC.PA",    # LVMH
        "RMS.PA",   # Hermès
        "KER.PA",   # Kering
        "CFR.SW",   # Richemont (cross-listed proxy)
        "TIT.PA",   # Titan Cement (int'l proxy)
        "MELE.PA",  # Melexis (BE-listed)
        "SOLB.BR",  # Solvay (BE)
        "UCB.BR",   # UCB (BE)
        "ABI.BR",   # AB InBev (BE)
        "COLR.BR",  # Colruyt (BE)
        "AD.AS",    # Ahold Delhaize (NL)
        "HEIA.AS",  # Heineken (NL)
        "UNA.AS",   # Unilever NV (NL)
        "RAND.AS",  # Randstad (NL)
        "WKL.AS",   # Wolters Kluwer (NL)
        "NN.AS",    # NN Group (NL)
        "ADYEN.AS", # Adyen (NL)
        "PRX.AS",   # Prosus (NL)
        "AEX.PA",   # Euronext (PA)
        "OR.PA",    # L'Oréal
    ],
    "Energie": [
        "TTE.PA",   # TotalEnergies
        "ENGI.PA",  # Engie
        "EDF.PA",   # EDF
        "EDEN.PA",  # Edenred
        "SGRE.MC",  # Siemens Gamesa (cross-listed)
        "VESTAS.CO",# Vestas (proxy)
        "ORSTED.CO",# Ørsted (proxy)
        "BN.PA",    # Danone
        "HO.PA",    # Thales
        "DSY.PA",   # Dassault Systèmes
    ],
}

# Flat list for iteration
ALL_TICKERS = [t for sector in TICKERS.values() for t in sector]
