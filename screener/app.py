"""
Stock Screener — Streamlit app
US + EU stocks with PEA filter, fundamental ratios and composite score 1-100.
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from stocks import ALL_STOCKS, is_pea_eligible
from fetcher import fetch_all
from scorer import compute_scores

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Stock Screener",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .metric-card {
        background: #1e2130;
        border-radius: 10px;
        padding: 1rem;
        border-left: 4px solid #4c9aff;
    }
    .score-high  { color: #00d26a; font-weight: bold; }
    .score-mid   { color: #f5a623; font-weight: bold; }
    .score-low   { color: #e05c5c; font-weight: bold; }
    .stDataFrame { font-size: 0.85rem; }
</style>
""", unsafe_allow_html=True)

# ── Sidebar — Filters ─────────────────────────────────────────────────────────
with st.sidebar:
    st.image("https://img.icons8.com/color/96/combo-chart--v1.png", width=60)
    st.title("Stock Screener")
    st.caption("US & Europe · PEA · Fondamentaux")
    st.divider()

    st.subheader("Univers")
    universe = st.multiselect(
        "Marchés",
        ["US", "Europe"],
        default=["US", "Europe"],
    )
    pea_only = st.checkbox("PEA uniquement", value=False)

    sectors_all = sorted({s["sector"] for s in ALL_STOCKS})
    sectors_sel = st.multiselect("Secteurs", sectors_all, default=sectors_all)

    st.divider()
    st.subheader("Filtres fondamentaux")

    pe_max = st.slider("P/E max", 0, 100, 40, step=1,
                        help="Price-to-Earnings trailing 12m")
    roe_min = st.slider("ROE min (%)", 0, 50, 10, step=1,
                         help="Return on Equity")
    debt_ebitda_max = st.slider("Dette / EBITDA max", 0.0, 10.0, 3.0, step=0.5,
                                 help="Levier financier — recommandé < 3×")
    fcf_yield_min = st.slider("FCF Yield min (%)", 0.0, 20.0, 5.0, step=0.5,
                               help="Free Cash Flow Yield")

    st.divider()
    st.subheader("Score minimum")
    score_min = st.slider("Score composite (1-100)", 0, 100, 40, step=5)

    st.divider()
    col_load, _ = st.columns([2, 1])
    load_btn = col_load.button("Charger / Actualiser", type="primary", use_container_width=True)

# ── Build ticker list based on universe selection ─────────────────────────────
def build_ticker_list():
    result = []
    for s in ALL_STOCKS:
        market = "US" if s["country"] == "US" else "Europe"
        if market not in universe:
            continue
        if s["sector"] not in sectors_sel:
            continue
        if pea_only and not is_pea_eligible(s["country"]):
            continue
        result.append(s["ticker"])
    return result

# ── Session state ─────────────────────────────────────────────────────────────
if "df_raw" not in st.session_state:
    st.session_state.df_raw = pd.DataFrame()

# ── Load data ─────────────────────────────────────────────────────────────────
if load_btn or st.session_state.df_raw.empty:
    tickers = build_ticker_list()
    if not tickers:
        st.warning("Aucun ticker sélectionné. Vérifiez les filtres d'univers.")
        st.stop()

    bar = st.progress(0, text="Chargement des données…")

    def progress_cb(pct, msg):
        bar.progress(pct, text=msg)

    df_raw = fetch_all(tickers, progress_callback=progress_cb)
    st.session_state.df_raw = df_raw
    bar.empty()

df_raw = st.session_state.df_raw

if df_raw.empty:
    st.info("Cliquez sur **Charger / Actualiser** pour récupérer les données.")
    st.stop()

# ── Scoring ───────────────────────────────────────────────────────────────────
df = compute_scores(df_raw)

# ── Apply filters ─────────────────────────────────────────────────────────────
mask = pd.Series([True] * len(df))

if pe_max < 100:
    mask &= (df["pe"].isna() | (df["pe"] <= pe_max)) & (df["pe"].notna())
if roe_min > 0:
    mask &= df["roe"].fillna(0) >= roe_min
if debt_ebitda_max < 10:
    mask &= df["debt_ebitda"].fillna(0) <= debt_ebitda_max
if fcf_yield_min > 0:
    mask &= df["fcf_yield"].fillna(0) >= fcf_yield_min
if score_min > 0:
    mask &= df["score"] >= score_min

df_filtered = df[mask].sort_values("score", ascending=False).reset_index(drop=True)

# ── KPI Header ───────────────────────────────────────────────────────────────
st.markdown("## 📊 Stock Screener")
k1, k2, k3, k4, k5 = st.columns(5)
k1.metric("Actions dans l'univers", len(df))
k2.metric("Après filtres", len(df_filtered))
k3.metric("Score moyen", f"{df_filtered['score'].mean():.1f}" if not df_filtered.empty else "—")
k4.metric("Score max", f"{df_filtered['score'].max():.0f}" if not df_filtered.empty else "—")
k5.metric("PEA éligibles", int(df_filtered["pea"].sum()) if not df_filtered.empty else 0)

st.divider()

if df_filtered.empty:
    st.warning("Aucune action ne correspond aux critères. Élargissez les filtres.")
    st.stop()

# ── Tabs ──────────────────────────────────────────────────────────────────────
tab1, tab2, tab3 = st.tabs(["Tableau interactif", "Graphiques", "Détail score"])

# ════════════════════════════════════════════════════════════════════════════
# TAB 1 — Interactive Table
# ════════════════════════════════════════════════════════════════════════════
with tab1:
    col_opt1, col_opt2 = st.columns([3, 1])
    with col_opt2:
        show_pea = st.checkbox("Afficher label PEA", value=True)

    def fmt_pea(v):
        return "✅ PEA" if v else "❌"

    def score_color(s):
        if s >= 70:
            return "background-color: #1a3a2a; color: #00d26a"
        elif s >= 45:
            return "background-color: #3a3010; color: #f5a623"
        else:
            return "background-color: #3a1a1a; color: #e05c5c"

    display_cols = {
        "ticker":       "Ticker",
        "name":         "Société",
        "sector":       "Secteur",
        "country":      "Pays",
        "score":        "Score",
        "pe":           "P/E",
        "roe":          "ROE %",
        "debt_ebitda":  "Dette/EBITDA",
        "fcf_yield":    "FCF Yield %",
        "ev_ebitda":    "EV/EBITDA",
        "op_margin":    "Marge Op. %",
        "div_yield":    "Div. Yield %",
        "market_cap":   "Capitalisation",
        "price":        "Prix",
        "currency":     "Devise",
    }
    if show_pea:
        display_cols["pea"] = "PEA"

    df_display = df_filtered[list(display_cols.keys())].rename(columns=display_cols)
    if show_pea:
        df_display["PEA"] = df_display["PEA"].apply(fmt_pea)

    def fmt_market_cap(v):
        if pd.isna(v):
            return "—"
        if v >= 1e12:
            return f"{v/1e12:.1f}T"
        if v >= 1e9:
            return f"{v/1e9:.1f}B"
        return f"{v/1e6:.0f}M"

    df_display["Capitalisation"] = df_filtered["market_cap"].apply(fmt_market_cap)
    df_display["Prix"] = df_filtered.apply(
        lambda r: f"{r['price']:.2f} {r.get('currency','')}" if pd.notna(r["price"]) else "—", axis=1
    )
    df_display["Devise"] = df_filtered["currency"]

    # Format numeric columns
    float_fmts = {
        "P/E": "{:.1f}", "ROE %": "{:.1f}", "Dette/EBITDA": "{:.2f}",
        "FCF Yield %": "{:.1f}", "EV/EBITDA": "{:.1f}", "Marge Op. %": "{:.1f}",
        "Div. Yield %": "{:.2f}", "Score": "{:.0f}",
    }
    styled = df_display.style
    for col, fmt in float_fmts.items():
        if col in df_display.columns:
            styled = styled.format(fmt, subset=[col], na_rep="—")

    styled = styled.applymap(score_color, subset=["Score"])

    st.dataframe(styled, use_container_width=True, height=520)

    # Download
    csv = df_filtered.to_csv(index=False).encode("utf-8")
    st.download_button(
        "Télécharger CSV",
        csv,
        "screener_results.csv",
        "text/csv",
        use_container_width=False,
    )

# ════════════════════════════════════════════════════════════════════════════
# TAB 2 — Charts
# ════════════════════════════════════════════════════════════════════════════
with tab2:
    c1, c2 = st.columns(2)

    with c1:
        st.markdown("### Distribution des scores")
        fig_hist = px.histogram(
            df_filtered, x="score", nbins=20,
            color_discrete_sequence=["#4c9aff"],
            labels={"score": "Score"},
            template="plotly_dark",
        )
        fig_hist.update_layout(showlegend=False, margin=dict(t=20, b=20))
        st.plotly_chart(fig_hist, use_container_width=True)

    with c2:
        st.markdown("### FCF Yield vs P/E")
        fig_scatter = px.scatter(
            df_filtered.dropna(subset=["pe", "fcf_yield"]),
            x="pe", y="fcf_yield",
            size="score", color="sector",
            hover_name="name",
            hover_data={"ticker": True, "score": True, "roe": ":.1f", "debt_ebitda": ":.2f"},
            labels={"pe": "P/E", "fcf_yield": "FCF Yield (%)"},
            template="plotly_dark",
            size_max=30,
        )
        fig_scatter.update_layout(margin=dict(t=20))
        st.plotly_chart(fig_scatter, use_container_width=True)

    st.markdown("### Top 20 par score")
    top20 = df_filtered.head(20)
    colors = ["#00d26a" if s >= 70 else "#f5a623" if s >= 45 else "#e05c5c"
              for s in top20["score"]]
    fig_bar = go.Figure(go.Bar(
        x=top20["ticker"],
        y=top20["score"],
        marker_color=colors,
        text=top20["score"].round(0).astype(int),
        textposition="outside",
        hovertemplate="<b>%{x}</b><br>Score: %{y}<br>" +
                      "P/E: %{customdata[0]:.1f}<br>ROE: %{customdata[1]:.1f}%<extra></extra>",
        customdata=top20[["pe", "roe"]].values,
    ))
    fig_bar.update_layout(
        template="plotly_dark",
        yaxis_range=[0, 105],
        xaxis_tickangle=-30,
        margin=dict(t=10, b=10),
        height=360,
    )
    st.plotly_chart(fig_bar, use_container_width=True)

    # Sector breakdown
    c3, c4 = st.columns(2)
    with c3:
        st.markdown("### Actions par secteur")
        sec_count = df_filtered["sector"].value_counts().reset_index()
        sec_count.columns = ["Secteur", "Nb"]
        fig_pie = px.pie(sec_count, names="Secteur", values="Nb",
                         template="plotly_dark", hole=0.4)
        fig_pie.update_layout(margin=dict(t=10))
        st.plotly_chart(fig_pie, use_container_width=True)

    with c4:
        st.markdown("### Score moyen par secteur")
        sec_score = (
            df_filtered.groupby("sector")["score"].mean()
            .sort_values(ascending=True).reset_index()
        )
        fig_hbar = px.bar(sec_score, x="score", y="sector", orientation="h",
                          color="score",
                          color_continuous_scale=["#e05c5c", "#f5a623", "#00d26a"],
                          template="plotly_dark",
                          labels={"score": "Score moyen", "sector": ""})
        fig_hbar.update_layout(coloraxis_showscale=False, margin=dict(t=10))
        st.plotly_chart(fig_hbar, use_container_width=True)

# ════════════════════════════════════════════════════════════════════════════
# TAB 3 — Score Breakdown
# ════════════════════════════════════════════════════════════════════════════
with tab3:
    st.markdown("### Décomposition du score composite")
    st.caption(
        "Score total (1–100) = FCF Yield (25 pts) + ROE (20 pts) + P/E (20 pts) "
        "+ Dette/EBITDA (20 pts) + EV/EBITDA (15 pts)"
    )

    score_cols = {
        "ticker": "Ticker",
        "name": "Société",
        "score": "Score total",
        "score_fcf": "FCF (25)",
        "score_roe": "ROE (20)",
        "score_pe":  "P/E (20)",
        "score_debt": "Dette (20)",
        "score_ev":  "EV/EBITDA (15)",
    }
    df_score = df_filtered[list(score_cols.keys())].rename(columns=score_cols)

    def highlight_total(val):
        if val >= 70:
            return "background-color: #1a3a2a; color: #00d26a; font-weight:bold"
        elif val >= 45:
            return "background-color: #3a3010; color: #f5a623; font-weight:bold"
        return "background-color: #3a1a1a; color: #e05c5c"

    styled2 = (
        df_score.style
        .format("{:.1f}", subset=df_score.columns[2:], na_rep="—")
        .applymap(highlight_total, subset=["Score total"])
    )
    st.dataframe(styled2, use_container_width=True, height=520)

    # Radar chart for selected ticker
    st.divider()
    st.markdown("### Radar — analyse d'un titre")
    ticker_choice = st.selectbox(
        "Choisir un titre",
        options=df_filtered["ticker"].tolist(),
        format_func=lambda t: f"{t} — {df_filtered.loc[df_filtered['ticker']==t,'name'].values[0]}",
    )
    if ticker_choice:
        row = df_filtered[df_filtered["ticker"] == ticker_choice].iloc[0]
        cats  = ["FCF Yield\n(25)", "ROE\n(20)", "P/E\n(20)", "Dette\n(20)", "EV/EBITDA\n(15)"]
        vals  = [row["score_fcf"], row["score_roe"], row["score_pe"],
                 row["score_debt"], row["score_ev"]]
        maxes = [25, 20, 20, 20, 15]
        pcts  = [v / m * 100 for v, m in zip(vals, maxes)]
        pcts_closed = pcts + [pcts[0]]
        cats_closed  = cats + [cats[0]]

        fig_radar = go.Figure(go.Scatterpolar(
            r=pcts_closed, theta=cats_closed,
            fill="toself",
            line_color="#4c9aff",
            fillcolor="rgba(76,154,255,0.2)",
            name=ticker_choice,
        ))
        fig_radar.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
            template="plotly_dark",
            showlegend=False,
            height=420,
        )

        rc1, rc2 = st.columns([2, 1])
        with rc1:
            st.plotly_chart(fig_radar, use_container_width=True)
        with rc2:
            st.markdown(f"**{row['name']} ({ticker_choice})**")
            st.markdown(f"Score total : **{row['score']:.0f} / 100**")
            st.markdown("---")
            metrics = [
                ("P/E",          f"{row['pe']:.1f}"          if pd.notna(row['pe'])          else "N/D"),
                ("ROE",          f"{row['roe']:.1f} %"        if pd.notna(row['roe'])         else "N/D"),
                ("Dette/EBITDA", f"{row['debt_ebitda']:.2f}x" if pd.notna(row['debt_ebitda'])else "N/D"),
                ("FCF Yield",    f"{row['fcf_yield']:.1f} %"  if pd.notna(row['fcf_yield'])  else "N/D"),
                ("EV/EBITDA",    f"{row['ev_ebitda']:.1f}"    if pd.notna(row['ev_ebitda'])  else "N/D"),
                ("Marge opé.",   f"{row['op_margin']:.1f} %"  if pd.notna(row['op_margin'])  else "N/D"),
                ("Div. Yield",   f"{row['div_yield']:.2f} %"  if pd.notna(row['div_yield'])  else "N/D"),
            ]
            for label, val in metrics:
                st.markdown(f"- **{label}**: {val}")
            if row["pea"]:
                st.success("Éligible PEA")
            else:
                st.error("Non éligible PEA")

# ── Footer ────────────────────────────────────────────────────────────────────
st.divider()
st.caption(
    "Données : Yahoo Finance via yfinance · Mise à jour : cache 1h · "
    "Les scores sont indicatifs et ne constituent pas un conseil en investissement."
)
