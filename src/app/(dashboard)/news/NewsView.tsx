"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NewsCategory =
  | "Tous"
  | "Deals & Transactions"
  | "Fundraising"
  | "Personnel"
  | "Macro"
  | "Financement";

type TrendDir = "up" | "down" | "stable";

// ─── Data ────────────────────────────────────────────────────────────────────

const NEWS_CATEGORIES: NewsCategory[] = [
  "Tous",
  "Deals & Transactions",
  "Fundraising",
  "Personnel",
  "Macro",
  "Financement",
];

const newsArticles = [
  {
    id: 1,
    title: "KKR finalise l'acquisition de Corialis Group pour €1.2Md",
    source: "PE News",
    date: "02 Apr 2025",
    category: "Deals & Transactions" as NewsCategory,
    summary:
      "KKR a annoncé la finalisation de son acquisition du fabricant belge de profilés en aluminium Corialis Group, valorisé à environ €1.2 milliard. L'opération représente un multiple d'environ 11x l'EBITDA.",
  },
  {
    id: 2,
    title: "Blackstone lève $30Md pour son nouveau fonds immobilier BREP X",
    source: "Bloomberg",
    date: "28 Mar 2025",
    category: "Fundraising" as NewsCategory,
    summary:
      "Blackstone Real Estate Partners X a réalisé son closing final à 30 milliards de dollars, dépassant son objectif initial de 25 milliards. Il s'agit du plus grand fonds immobilier jamais levé.",
  },
  {
    id: 3,
    title: "CVC Capital nomme Javier de Jaime comme co-CEO pour l'Europe",
    source: "Financial Times",
    date: "25 Mar 2025",
    category: "Personnel" as NewsCategory,
    summary:
      "CVC Capital Partners a annoncé la nomination de Javier de Jaime en tant que co-CEO pour la région Europe. Il supervisera les activités d'investissement du fonds dans plus de 15 pays européens.",
  },
  {
    id: 4,
    title: "La BCE maintient ses taux directeurs à 3.40% en mars 2025",
    source: "Reuters",
    date: "20 Mar 2025",
    category: "Macro" as NewsCategory,
    summary:
      "Le conseil des gouverneurs de la BCE a décidé de maintenir le taux de dépôt à 3.40%, mettant en pause le cycle de baisses entamé en 2024. Les anticipations du marché tablent désormais sur une baisse en juin.",
  },
  {
    id: 5,
    title: "EQT acquiert IFS, éditeur de logiciels industriels, pour €4.5Md",
    source: "Mergermarket",
    date: "18 Mar 2025",
    category: "Deals & Transactions" as NewsCategory,
    summary:
      "EQT a signé un accord définitif pour l'acquisition d'IFS, leader mondial des logiciels ERP pour les secteurs industriels et de la défense, valorisé à environ 4.5 milliards d'euros, soit 18x l'EBITDA.",
  },
  {
    id: 6,
    title: "PAI Partners cède Europastry à Advent International pour €800M",
    source: "L'Agefi",
    date: "15 Mar 2025",
    category: "Deals & Transactions" as NewsCategory,
    summary:
      "PAI Partners a conclu la cession du groupe boulangerie industrielle Europastry à Advent International pour une valeur d'entreprise de 800 millions d'euros après cinq années de détention et une forte croissance organique.",
  },
  {
    id: 7,
    title: "Eurazeo lance son quatrième fonds mid-market à €3Md",
    source: "Option Finance",
    date: "12 Mar 2025",
    category: "Fundraising" as NewsCategory,
    summary:
      "Eurazeo a lancé officiellement la levée de son quatrième fonds mid-market européen, avec un objectif de 3 milliards d'euros. Le premier closing est attendu au deuxième trimestre 2025 autour de 1.5 milliard.",
  },
  {
    id: 8,
    title: "Le marché HY européen affiche un spread de 387bps, au plus bas depuis 2 ans",
    source: "Bloomberg",
    date: "10 Mar 2025",
    category: "Financement" as NewsCategory,
    summary:
      "Les spreads High Yield européens ont atteint 387bps, leur niveau le plus bas depuis début 2023, reflétant un appétit renouvelé des investisseurs pour le risque de crédit dans un contexte de stabilisation macroéconomique.",
  },
  {
    id: 9,
    title: "Ardian finalise la levée d'ASF IX à €16Md, un record pour le secondaire",
    source: "PE International",
    date: "07 Mar 2025",
    category: "Fundraising" as NewsCategory,
    summary:
      "Ardian a annoncé le closing final de son fonds secondaire ASF IX à 16 milliards de dollars, dépassant son objectif de 14 milliards. Il devient le plus grand fonds secondaire de l'histoire d'Ardian.",
  },
  {
    id: 10,
    title: "Tikehau Capital renforce son équipe dette privée avec 5 recrues senior",
    source: "L'Agefi",
    date: "05 Mar 2025",
    category: "Personnel" as NewsCategory,
    summary:
      "Tikehau Capital a recruté cinq professionnels seniors pour renforcer son équipe de dette privée en Europe. Ces recrutements s'inscrivent dans la stratégie de croissance du fonds visant à atteindre €15Md sous gestion dans cette stratégie.",
  },
  {
    id: 11,
    title: "Apax Partners entre en exclusivité pour l'acquisition de Docaposte",
    source: "Le Monde",
    date: "28 Feb 2025",
    category: "Deals & Transactions" as NewsCategory,
    summary:
      "Apax Partners a été sélectionné en exclusivité pour l'acquisition de Docaposte, la filiale numérique de La Poste, pour un montant estimé entre 1.5 et 2 milliards d'euros, dans le cadre d'une opération de carve-out.",
  },
  {
    id: 12,
    title: "L'Euribor 3 mois repasse sous 3.15%, facilitant les opérations LBO",
    source: "Reuters",
    date: "25 Feb 2025",
    category: "Financement" as NewsCategory,
    summary:
      "L'Euribor 3 mois s'est établi à 3.12%, son niveau le plus bas depuis 18 mois, ce qui améliore significativement la charge d'intérêt des structures LBO à taux variable et redonne de la visibilité aux sponsors.",
  },
  {
    id: 13,
    title: "Bridgepoint signe un accord pour acquérir le groupe Kereis",
    source: "Mergermarket",
    date: "22 Feb 2025",
    category: "Deals & Transactions" as NewsCategory,
    summary:
      "Bridgepoint a annoncé l'acquisition de Kereis, courtier grossiste en assurance de personnes, pour environ €650M. La transaction valorise la société à 12x l'EBITDA 2024 et illustre l'appétit des fonds pour les services financiers spécialisés.",
  },
  {
    id: 14,
    title: "Carlyle et Apollo s'associent pour financer la transition énergétique en Europe",
    source: "Financial Times",
    date: "18 Feb 2025",
    category: "Macro" as NewsCategory,
    summary:
      "Carlyle Group et Apollo Global Management ont annoncé la création d'une plateforme commune dédiée au financement des infrastructures de transition énergétique en Europe, avec un engagement initial de 8 milliards d'euros.",
  },
  {
    id: 15,
    title: "Cinven et Bain Capital lancent un processus dual-track sur leur participation dans Ineos Styrolution",
    source: "Bloomberg",
    date: "14 Feb 2025",
    category: "Deals & Transactions" as NewsCategory,
    summary:
      "Cinven et Bain Capital ont mandaté des banques pour lancer un processus dual-track (IPO / cession) sur leur participation conjointe dans Ineos Styrolution, valorisée entre €900M et €1.1Md selon les estimations des analystes.",
  },
];

const dealTrackerData = [
  {
    cible: "Corialis Group",
    sponsor: "KKR",
    secteur: "Industrie",
    ev: 1200,
    evEbitda: 11.0,
    type: "LBO",
    pays: "Belgique",
    date: "Avr 2025",
  },
  {
    cible: "IFS",
    sponsor: "EQT",
    secteur: "Tech/SaaS",
    ev: 4500,
    evEbitda: 18.0,
    type: "LBO",
    pays: "Suède",
    date: "Mar 2025",
  },
  {
    cible: "Europastry",
    sponsor: "Advent",
    secteur: "Consumer",
    ev: 800,
    evEbitda: 9.5,
    type: "Secondaire",
    pays: "Espagne",
    date: "Mar 2025",
  },
  {
    cible: "Kereis",
    sponsor: "Bridgepoint",
    secteur: "Services",
    ev: 650,
    evEbitda: 12.0,
    type: "LBO",
    pays: "France",
    date: "Fév 2025",
  },
  {
    cible: "Docaposte",
    sponsor: "Apax",
    secteur: "Tech/SaaS",
    ev: 1750,
    evEbitda: 14.2,
    type: "Carve-out",
    pays: "France",
    date: "Fév 2025",
  },
  {
    cible: "Ineos Styrolution",
    sponsor: "Cinven / Bain",
    secteur: "Industrie",
    ev: 1000,
    evEbitda: 7.8,
    type: "Cession",
    pays: "Allemagne",
    date: "Fév 2025",
  },
  {
    cible: "Median Technologies",
    sponsor: "PAI Partners",
    secteur: "Santé",
    ev: 420,
    evEbitda: 11.5,
    type: "LBO",
    pays: "France",
    date: "Jan 2025",
  },
  {
    cible: "Infravia Infra",
    sponsor: "Permira",
    secteur: "Énergie",
    ev: 850,
    evEbitda: 8.2,
    type: "LBO",
    pays: "France",
    date: "Jan 2025",
  },
  {
    cible: "Azalea Health",
    sponsor: "Carlyle",
    secteur: "Santé",
    ev: 680,
    evEbitda: 12.5,
    type: "Growth",
    pays: "USA",
    date: "Déc 2024",
  },
  {
    cible: "Nuvei Corporation",
    sponsor: "Advent / Eurazeo",
    secteur: "Fintech",
    ev: 6300,
    evEbitda: 16.8,
    type: "P-to-P",
    pays: "Canada",
    date: "Déc 2024",
  },
  {
    cible: "Baxter Infusion",
    sponsor: "Blackstone",
    secteur: "Santé",
    ev: 3800,
    evEbitda: 10.2,
    type: "Carve-out",
    pays: "USA",
    date: "Nov 2024",
  },
  {
    cible: "StandardAero",
    sponsor: "Apollo",
    secteur: "Industrie",
    ev: 4200,
    evEbitda: 9.8,
    type: "LBO",
    pays: "USA",
    date: "Oct 2024",
  },
];

const multiplesData = [
  {
    secteur: "Tech/SaaS",
    current: 14.2,
    avg1y: 15.1,
    avg3y: 16.8,
    avg5y: 17.4,
    trend: "down" as TrendDir,
  },
  {
    secteur: "Santé",
    current: 11.8,
    avg1y: 11.2,
    avg3y: 10.9,
    avg5y: 10.3,
    trend: "up" as TrendDir,
  },
  {
    secteur: "Industrie",
    current: 8.5,
    avg1y: 8.8,
    avg3y: 9.1,
    avg5y: 8.9,
    trend: "down" as TrendDir,
  },
  {
    secteur: "Consumer",
    current: 9.2,
    avg1y: 9.2,
    avg3y: 9.7,
    avg5y: 10.1,
    trend: "stable" as TrendDir,
  },
  {
    secteur: "Services",
    current: 10.1,
    avg1y: 9.6,
    avg3y: 9.2,
    avg5y: 8.8,
    trend: "up" as TrendDir,
  },
  {
    secteur: "Énergie",
    current: 7.8,
    avg1y: 7.5,
    avg3y: 7.2,
    avg5y: 6.9,
    trend: "up" as TrendDir,
  },
  {
    secteur: "Fintech",
    current: 13.5,
    avg1y: 14.8,
    avg3y: 17.2,
    avg5y: 15.6,
    trend: "down" as TrendDir,
  },
];

const fundraisingData = [
  {
    fonds: "Eurazeo Mid-Market IV",
    gp: "Eurazeo",
    strategie: "Buyout Mid-Market",
    tailleCible: "€3.0Md",
    premierClosing: "Q2 2025",
    statut: "En cours",
    geo: "Europe",
  },
  {
    fonds: "Ardian Buy-Out VIII",
    gp: "Ardian",
    strategie: "Large Buyout",
    tailleCible: "€10.0Md",
    premierClosing: "Q3 2025",
    statut: "Pré-marketing",
    geo: "Europe / Global",
  },
  {
    fonds: "Tikehau Private Debt VI",
    gp: "Tikehau",
    strategie: "Dette Privée",
    tailleCible: "€5.0Md",
    premierClosing: "Q1 2025",
    statut: "Closing final",
    geo: "Europe",
  },
  {
    fonds: "PAI Mid-Market III",
    gp: "PAI Partners",
    strategie: "Buyout Mid-Market",
    tailleCible: "€2.5Md",
    premierClosing: "Q4 2025",
    statut: "Pré-marketing",
    geo: "France / Europe",
  },
  {
    fonds: "Bridgepoint Europe VII",
    gp: "Bridgepoint",
    strategie: "Buyout",
    tailleCible: "€7.5Md",
    premierClosing: "Q2 2025",
    statut: "En cours",
    geo: "Europe",
  },
  {
    fonds: "Apax XI",
    gp: "Apax Partners",
    strategie: "Large Buyout",
    tailleCible: "€12.0Md",
    premierClosing: "Q3 2025",
    statut: "En cours",
    geo: "Global",
  },
  {
    fonds: "Permira VIII",
    gp: "Permira",
    strategie: "Large Buyout",
    tailleCible: "€16.0Md",
    premierClosing: "Q4 2025",
    statut: "Pré-marketing",
    geo: "Global",
  },
  {
    fonds: "Cinven Fund IX",
    gp: "Cinven",
    strategie: "Large Buyout",
    tailleCible: "€12.0Md",
    premierClosing: "Q1 2026",
    statut: "Pré-marketing",
    geo: "Europe",
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

const CategoryBadge = ({ category }: { category: string }) => {
  const map: Record<string, string> = {
    "Deals & Transactions": "bg-blue-100 text-blue-800",
    Fundraising: "bg-green-100 text-green-800",
    Personnel: "bg-purple-100 text-purple-800",
    Macro: "bg-orange-100 text-orange-800",
    Financement: "bg-amber-100 text-amber-800",
  };
  const cls = map[category] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {category}
    </span>
  );
};

const SourceBadge = ({ source }: { source: string }) => (
  <span className="inline-block rounded bg-[#1e3a5f] px-2 py-0.5 text-xs font-semibold text-white">
    {source}
  </span>
);

const TrendIcon = ({ trend }: { trend: TrendDir }) => {
  if (trend === "up")
    return <span className="font-bold text-emerald-500">↑</span>;
  if (trend === "down")
    return <span className="font-bold text-red-500">↓</span>;
  return <span className="font-bold text-gray-400">→</span>;
};

const DealTypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    LBO: "bg-blue-100 text-blue-800",
    Secondaire: "bg-violet-100 text-violet-800",
    "Carve-out": "bg-orange-100 text-orange-800",
    Cession: "bg-red-100 text-red-800",
    Growth: "bg-emerald-100 text-emerald-800",
    "P-to-P": "bg-amber-100 text-amber-800",
  };
  const cls = map[type] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
};

const StatutBadge = ({ statut }: { statut: string }) => {
  const map: Record<string, string> = {
    "En cours": "bg-emerald-100 text-emerald-800",
    "Pré-marketing": "bg-blue-100 text-blue-800",
    "Closing final": "bg-amber-100 text-amber-800",
  };
  const cls = map[statut] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {statut}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function NewsView() {
  const [activeTab, setActiveTab] = useState<
    "actualites" | "dealtracker" | "multiples" | "fundraising"
  >("actualites");
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("Tous");
  const [search, setSearch] = useState("");

  const tabs = [
    { key: "actualites", label: "Actualités" },
    { key: "dealtracker", label: "Deal Tracker" },
    { key: "multiples", label: "Multiples de Marché" },
    { key: "fundraising", label: "Fundraising" },
  ] as const;

  const filteredNews = newsArticles.filter((a) => {
    const matchCat =
      activeCategory === "Tous" || a.category === activeCategory;
    const matchSearch =
      search === "" ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.source.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Deal tracker stats
  const totalDeals = dealTrackerData.length;
  const totalVolume = dealTrackerData.reduce((s, d) => s + d.ev, 0);
  const avgMultiple =
    dealTrackerData.reduce((s, d) => s + d.evEbitda, 0) / dealTrackerData.length;

  // Fundraising stats
  const enCours = fundraisingData.filter((f) => f.statut === "En cours").length;
  const preMarketing = fundraisingData.filter(
    (f) => f.statut === "Pré-marketing"
  ).length;
  const totalTargetSize = fundraisingData
    .reduce((s, f) => {
      const n = parseFloat(f.tailleCible.replace("€", "").replace("Md", ""));
      return s + n;
    }, 0)
    .toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Actualités & Intelligence de Marché
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Suivi en temps réel du marché PE / LBO européen
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "border-b-2 border-amber-500 text-amber-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB 1: Actualités ─────────────────────────────────────────────── */}
      {activeTab === "actualites" && (
        <div>
          {/* Filters row */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {NEWS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* News cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredNews.map((article) => (
              <div
                key={article.id}
                className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <SourceBadge source={article.source} />
                  <span className="text-xs text-gray-400">{article.date}</span>
                </div>
                <h3 className="text-sm font-semibold leading-snug text-[#1e3a5f]">
                  {article.title}
                </h3>
                <CategoryBadge category={article.category} />
                <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {article.summary}
                </p>
              </div>
            ))}
            {filteredNews.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-gray-400">
                Aucun résultat pour ces filtres.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Deal Tracker ───────────────────────────────────────────── */}
      {activeTab === "dealtracker" && (
        <div className="flex flex-col gap-6">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center">
              <p className="text-2xl font-bold text-[#1e3a5f]">{totalDeals}</p>
              <p className="mt-1 text-xs text-gray-500">Deals suivis</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center">
              <p className="text-2xl font-bold text-[#1e3a5f]">
                €{(totalVolume / 1000).toFixed(1)}Md
              </p>
              <p className="mt-1 text-xs text-gray-500">Volume total</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center">
              <p className="text-2xl font-bold text-amber-500">
                {avgMultiple.toFixed(1)}x
              </p>
              <p className="mt-1 text-xs text-gray-500">Multiple moyen EV/EBITDA</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-[#1e3a5f]">
                <tr>
                  {[
                    "Cible",
                    "Sponsor",
                    "Secteur",
                    "EV (€M)",
                    "EV/EBITDA",
                    "Type",
                    "Pays",
                    "Date",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dealTrackerData.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#1e3a5f]">
                      {d.cible}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {d.sponsor}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {d.secteur}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                      {d.ev.toLocaleString("fr-FR")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-amber-600">
                      {d.evEbitda.toFixed(1)}x
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <DealTypeBadge type={d.type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {d.pays}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {d.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Multiples de Marché ────────────────────────────────────── */}
      {activeTab === "multiples" && (
        <div className="flex flex-col gap-6">
          {/* Macro indicators */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Taux BCE
              </p>
              <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">3.40%</p>
              <p className="mt-1 text-xs text-gray-500">
                Taux de dépôt — stable depuis Mar 2025
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Euribor 3M
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">3.12%</p>
              <p className="mt-1 text-xs text-gray-500">
                Niveau le plus bas depuis 18 mois
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                HY Spread (EUR)
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-500">387 bps</p>
              <p className="mt-1 text-xs text-gray-500">
                Compression de 40bps sur 3 mois
              </p>
            </div>
          </div>

          {/* Leveraged finance stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Senior Debt / EBITDA (avg)", value: "4.8x" },
              { label: "Total Leverage (avg)", value: "6.1x" },
              { label: "Equity cushion (avg)", value: "38%" },
              { label: "Nb deals LevFin YTD", value: "47" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center"
              >
                <p className="text-xl font-bold text-[#1e3a5f]">{s.value}</p>
                <p className="mt-1 text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Multiples table */}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-[#1e3a5f]">
                <tr>
                  {[
                    "Secteur",
                    "Multiple actuel",
                    "Moy. 1 an",
                    "Moy. 3 ans",
                    "Moy. 5 ans",
                    "Tendance",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {multiplesData.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#1e3a5f]">
                      {m.secteur}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-amber-600">
                      {m.current.toFixed(1)}x
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {m.avg1y.toFixed(1)}x
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {m.avg3y.toFixed(1)}x
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {m.avg5y.toFixed(1)}x
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <TrendIcon trend={m.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Fundraising ────────────────────────────────────────────── */}
      {activeTab === "fundraising" && (
        <div className="flex flex-col gap-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center">
              <p className="text-2xl font-bold text-[#1e3a5f]">
                {fundraisingData.length}
              </p>
              <p className="mt-1 text-xs text-gray-500">Fonds en marché</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center">
              <p className="text-2xl font-bold text-emerald-600">{enCours}</p>
              <p className="mt-1 text-xs text-gray-500">En cours de levée</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center">
              <p className="text-2xl font-bold text-blue-600">{preMarketing}</p>
              <p className="mt-1 text-xs text-gray-500">Pré-marketing</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 text-center">
              <p className="text-2xl font-bold text-amber-500">
                €{totalTargetSize}Md
              </p>
              <p className="mt-1 text-xs text-gray-500">Taille cible cumulée</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-[#1e3a5f]">
                <tr>
                  {[
                    "Fonds",
                    "GP",
                    "Stratégie",
                    "Taille cible",
                    "Premier closing",
                    "Statut",
                    "Géographie",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fundraisingData.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#1e3a5f]">
                      {f.fonds}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {f.gp}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {f.strategie}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-amber-600">
                      {f.tailleCible}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {f.premierClosing}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatutBadge statut={f.statut} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {f.geo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
