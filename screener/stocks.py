"""
Stock universe: US + EU stocks with PEA eligibility flag.
PEA = Plan d'Épargne en Actions (French equity savings plan).
Eligible: companies headquartered in EU/EEA countries.
"""

# ── US stocks ────────────────────────────────────────────────────────────────
US_STOCKS = [
    {"ticker": "AAPL",  "name": "Apple",               "sector": "Technology",    "country": "US"},
    {"ticker": "MSFT",  "name": "Microsoft",            "sector": "Technology",    "country": "US"},
    {"ticker": "GOOGL", "name": "Alphabet",             "sector": "Technology",    "country": "US"},
    {"ticker": "AMZN",  "name": "Amazon",               "sector": "Consumer",      "country": "US"},
    {"ticker": "META",  "name": "Meta Platforms",       "sector": "Technology",    "country": "US"},
    {"ticker": "NVDA",  "name": "NVIDIA",               "sector": "Technology",    "country": "US"},
    {"ticker": "BRK-B", "name": "Berkshire Hathaway",  "sector": "Financials",    "country": "US"},
    {"ticker": "JPM",   "name": "JPMorgan Chase",       "sector": "Financials",    "country": "US"},
    {"ticker": "V",     "name": "Visa",                 "sector": "Financials",    "country": "US"},
    {"ticker": "JNJ",   "name": "Johnson & Johnson",    "sector": "Healthcare",    "country": "US"},
    {"ticker": "UNH",   "name": "UnitedHealth",         "sector": "Healthcare",    "country": "US"},
    {"ticker": "PG",    "name": "Procter & Gamble",     "sector": "Consumer",      "country": "US"},
    {"ticker": "XOM",   "name": "ExxonMobil",           "sector": "Energy",        "country": "US"},
    {"ticker": "HD",    "name": "Home Depot",           "sector": "Consumer",      "country": "US"},
    {"ticker": "MA",    "name": "Mastercard",           "sector": "Financials",    "country": "US"},
    {"ticker": "ABBV",  "name": "AbbVie",               "sector": "Healthcare",    "country": "US"},
    {"ticker": "BAC",   "name": "Bank of America",      "sector": "Financials",    "country": "US"},
    {"ticker": "KO",    "name": "Coca-Cola",            "sector": "Consumer",      "country": "US"},
    {"ticker": "COST",  "name": "Costco",               "sector": "Consumer",      "country": "US"},
    {"ticker": "AVGO",  "name": "Broadcom",             "sector": "Technology",    "country": "US"},
    {"ticker": "WMT",   "name": "Walmart",              "sector": "Consumer",      "country": "US"},
    {"ticker": "MRK",   "name": "Merck",                "sector": "Healthcare",    "country": "US"},
    {"ticker": "CVX",   "name": "Chevron",              "sector": "Energy",        "country": "US"},
    {"ticker": "LLY",   "name": "Eli Lilly",            "sector": "Healthcare",    "country": "US"},
    {"ticker": "TMO",   "name": "Thermo Fisher",        "sector": "Healthcare",    "country": "US"},
    {"ticker": "ORCL",  "name": "Oracle",               "sector": "Technology",    "country": "US"},
    {"ticker": "CSCO",  "name": "Cisco",                "sector": "Technology",    "country": "US"},
    {"ticker": "ACN",   "name": "Accenture",            "sector": "Technology",    "country": "US"},
    {"ticker": "DHR",   "name": "Danaher",              "sector": "Healthcare",    "country": "US"},
    {"ticker": "VZ",    "name": "Verizon",              "sector": "Telecom",       "country": "US"},
]

# ── European stocks (PEA-eligible) ──────────────────────────────────────────
# Tickers with Euronext/Xetra suffix for yfinance
EU_STOCKS = [
    # France – CAC 40
    {"ticker": "AIR.PA",  "name": "Airbus",            "sector": "Industrials",   "country": "FR"},
    {"ticker": "OR.PA",   "name": "L'Oréal",           "sector": "Consumer",      "country": "FR"},
    {"ticker": "MC.PA",   "name": "LVMH",              "sector": "Consumer",      "country": "FR"},
    {"ticker": "SAN.PA",  "name": "Sanofi",            "sector": "Healthcare",    "country": "FR"},
    {"ticker": "TTE.PA",  "name": "TotalEnergies",     "sector": "Energy",        "country": "FR"},
    {"ticker": "BNP.PA",  "name": "BNP Paribas",       "sector": "Financials",    "country": "FR"},
    {"ticker": "ACA.PA",  "name": "Crédit Agricole",   "sector": "Financials",    "country": "FR"},
    {"ticker": "RI.PA",   "name": "Pernod Ricard",     "sector": "Consumer",      "country": "FR"},
    {"ticker": "DSY.PA",  "name": "Dassault Systèmes", "sector": "Technology",    "country": "FR"},
    {"ticker": "KER.PA",  "name": "Kering",            "sector": "Consumer",      "country": "FR"},
    {"ticker": "RMS.PA",  "name": "Hermès",            "sector": "Consumer",      "country": "FR"},
    {"ticker": "CAP.PA",  "name": "Capgemini",         "sector": "Technology",    "country": "FR"},
    {"ticker": "SGO.PA",  "name": "Saint-Gobain",      "sector": "Materials",     "country": "FR"},
    {"ticker": "SU.PA",   "name": "Schneider Electric","sector": "Industrials",   "country": "FR"},
    {"ticker": "VIE.PA",  "name": "Veolia",            "sector": "Utilities",     "country": "FR"},
    {"ticker": "ENX.PA",  "name": "Euronext",          "sector": "Financials",    "country": "FR"},
    {"ticker": "PUB.PA",  "name": "Publicis",          "sector": "Communication", "country": "FR"},
    {"ticker": "SW.PA",   "name": "Sodexo",            "sector": "Industrials",   "country": "FR"},
    # Germany – DAX
    {"ticker": "SAP.DE",  "name": "SAP",               "sector": "Technology",    "country": "DE"},
    {"ticker": "SIE.DE",  "name": "Siemens",           "sector": "Industrials",   "country": "DE"},
    {"ticker": "ALV.DE",  "name": "Allianz",           "sector": "Financials",    "country": "DE"},
    {"ticker": "BAYN.DE", "name": "Bayer",             "sector": "Healthcare",    "country": "DE"},
    {"ticker": "BASF.DE", "name": "BASF",              "sector": "Materials",     "country": "DE"},
    {"ticker": "BMW.DE",  "name": "BMW",               "sector": "Consumer",      "country": "DE"},
    {"ticker": "VOW3.DE", "name": "Volkswagen",        "sector": "Consumer",      "country": "DE"},
    {"ticker": "MUV2.DE", "name": "Munich Re",         "sector": "Financials",    "country": "DE"},
    {"ticker": "DTE.DE",  "name": "Deutsche Telekom",  "sector": "Telecom",       "country": "DE"},
    {"ticker": "EOAN.DE", "name": "E.ON",              "sector": "Utilities",     "country": "DE"},
    {"ticker": "RWE.DE",  "name": "RWE",               "sector": "Utilities",     "country": "DE"},
    {"ticker": "DB1.DE",  "name": "Deutsche Börse",    "sector": "Financials",    "country": "DE"},
    # Netherlands
    {"ticker": "ASML.AS", "name": "ASML",              "sector": "Technology",    "country": "NL"},
    {"ticker": "HEIA.AS", "name": "Heineken",          "sector": "Consumer",      "country": "NL"},
    {"ticker": "INGA.AS", "name": "ING Group",         "sector": "Financials",    "country": "NL"},
    {"ticker": "PHIA.AS", "name": "Philips",           "sector": "Healthcare",    "country": "NL"},
    {"ticker": "NN.AS",   "name": "NN Group",          "sector": "Financials",    "country": "NL"},
    # Spain
    {"ticker": "ITX.MC",  "name": "Inditex",           "sector": "Consumer",      "country": "ES"},
    {"ticker": "SAN.MC",  "name": "Banco Santander",   "sector": "Financials",    "country": "ES"},
    {"ticker": "IBE.MC",  "name": "Iberdrola",         "sector": "Utilities",     "country": "ES"},
    {"ticker": "TEF.MC",  "name": "Telefónica",        "sector": "Telecom",       "country": "ES"},
    {"ticker": "BBVA.MC", "name": "BBVA",              "sector": "Financials",    "country": "ES"},
    # Italy
    {"ticker": "ENI.MI",  "name": "ENI",               "sector": "Energy",        "country": "IT"},
    {"ticker": "RACE.MI", "name": "Ferrari",           "sector": "Consumer",      "country": "IT"},
    {"ticker": "G.MI",    "name": "Generali",          "sector": "Financials",    "country": "IT"},
    {"ticker": "ENEL.MI", "name": "Enel",              "sector": "Utilities",     "country": "IT"},
    # Switzerland (not EU but yfinance lists)
    {"ticker": "NESN.SW", "name": "Nestlé",            "sector": "Consumer",      "country": "CH"},
    {"ticker": "ROG.SW",  "name": "Roche",             "sector": "Healthcare",    "country": "CH"},
    {"ticker": "NOVN.SW", "name": "Novartis",          "sector": "Healthcare",    "country": "CH"},
    # Denmark
    {"ticker": "NOVO-B.CO", "name": "Novo Nordisk",   "sector": "Healthcare",    "country": "DK"},
]

# PEA-eligible countries (EU + EEA)
PEA_ELIGIBLE_COUNTRIES = {"FR", "DE", "NL", "ES", "IT", "BE", "PT", "AT", "FI",
                           "IE", "LU", "GR", "DK", "SE", "NO", "IS", "LI", "PL",
                           "CZ", "HU", "RO", "SK", "SI", "HR", "BG", "EE", "LV",
                           "LT", "CY", "MT"}

ALL_STOCKS = US_STOCKS + EU_STOCKS

def is_pea_eligible(country: str) -> bool:
    return country in PEA_ELIGIBLE_COUNTRIES
