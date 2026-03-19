import { useState } from "react";

const screens = ["Feed", "Card Expanded", "Earnings Card", "Digest", "Onboarding"];

const colors = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#1a1a1a",
  textSecondary: "#6b6b6b",
  textMuted: "#9a9a9a",
  border: "#E8E8E8",
  borderLight: "#F0F0F0",
  buy: "#1B8C5A",
  sell: "#C4342D",
  hold: "#8B7300",
  accent: "#1a1a1a",
  link: "#2563EB",
  earnings: "#6B5B95",
};

function Logo() {
  return (
    <span
      style={{
        fontFamily: "'Noto Serif', Georgia, serif",
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: "22px",
        color: colors.text,
        letterSpacing: "-0.02em",
      }}
    >
      tickr
    </span>
  );
}

function TopNav({ activeTab = "For You" }) {
  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface,
        padding: "0 32px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0 0 0",
        }}
      >
        <Logo />
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span
            style={{
              color: colors.textMuted,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Watchlist
          </span>
          <span
            style={{
              color: colors.textMuted,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Profile
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "24px", marginTop: "14px" }}>
        {["For You", "Digest", "Saved", "Dismissed"].map((t) => (
          <span
            key={t}
            style={{
              paddingBottom: "10px",
              borderBottom:
                t === activeTab
                  ? `2px solid ${colors.text}`
                  : "2px solid transparent",
              color: t === activeTab ? colors.text : colors.textMuted,
              fontSize: "14px",
              fontWeight: t === activeTab ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Feed() {
  const ideas = [
    {
      type: "trade",
      dir: "BUY",
      ticker: "AAPL",
      price: "187.42",
      change: "+2.3%",
      up: true,
      headline:
        "Apple's AI expansion to 8 markets could trigger iPhone upgrade supercycle",
      time: "2h ago",
    },
    {
      type: "earnings",
      ticker: "MSFT",
      price: "378.55",
      change: "+0.4%",
      up: true,
      headline:
        "Microsoft beat expectations — Azure growth and AI momentum are the story",
      time: "5h ago",
      quarter: "Q1 2026",
    },
    {
      type: "trade",
      dir: "SELL",
      ticker: "NFLX",
      price: "412.18",
      change: "-1.8%",
      up: false,
      headline:
        "Netflix ad-tier growth decelerating as Amazon and Disney close the gap",
      time: "6h ago",
    },
  ];

  const dirColor = (d) =>
    d === "BUY" ? colors.buy : d === "SELL" ? colors.sell : colors.hold;

  return (
    <div style={{ height: "100%", background: colors.bg }}>
      <TopNav />
      <div
        style={{ maxWidth: "620px", margin: "0 auto", padding: "24px 20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>
            AI-generated ideas · not financial advice
          </div>
          <button
            style={{
              padding: "8px 18px",
              background: colors.text,
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Generate Ideas
          </button>
        </div>

        {ideas.map((c, i) => (
          <div
            key={i}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "20px 22px",
              marginBottom: "12px",
              cursor: "pointer",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
              {c.type === "trade" ? (
                <span
                  style={{
                    color: dirColor(c.dir),
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    padding: "4px 8px",
                    background: `${dirColor(c.dir)}08`,
                    border: `1px solid ${dirColor(c.dir)}20`,
                    borderRadius: "6px",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                >
                  {c.dir}
                </span>
              ) : (
                <span
                  style={{
                    color: colors.earnings,
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    padding: "4px 8px",
                    background: `${colors.earnings}08`,
                    border: `1px solid ${colors.earnings}20`,
                    borderRadius: "6px",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                >
                  EARNINGS
                </span>
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: colors.text,
                    fontSize: "15px",
                    fontWeight: 600,
                    lineHeight: "1.45",
                  }}
                >
                  {c.headline}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "10px",
                  }}
                >
                  <span
                    style={{
                      color: colors.text,
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {c.ticker}
                  </span>
                  <span
                    style={{
                      color: colors.textSecondary,
                      fontSize: "12px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ${c.price}
                  </span>
                  <span
                    style={{
                      color: c.up ? colors.buy : colors.sell,
                      fontSize: "12px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {c.change}
                  </span>
                  {c.quarter && (
                    <span
                      style={{
                        color: colors.textMuted,
                        fontSize: "10px",
                        padding: "2px 6px",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "4px",
                      }}
                    >
                      {c.quarter}
                    </span>
                  )}
                  <span style={{ color: colors.textMuted, fontSize: "11px" }}>
                    ·
                  </span>
                  <span style={{ color: colors.textMuted, fontSize: "11px" }}>
                    {c.time}
                  </span>
                  <div
                    style={{
                      marginLeft: "auto",
                      display: "flex",
                      gap: "12px",
                    }}
                  >
                    {["☐", "↑", "↓"].map((a, j) => (
                      <span
                        key={j}
                        style={{
                          color: colors.textMuted,
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardExpanded() {
  const dirColor = colors.buy;
  return (
    <div style={{ height: "100%", background: colors.bg }}>
      <TopNav />
      <div
        style={{ maxWidth: "620px", margin: "0 auto", padding: "24px 20px" }}
      >
        <div
          style={{
            background: colors.surface,
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
            padding: "28px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                color: dirColor,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "4px 8px",
                background: `${dirColor}08`,
                border: `1px solid ${dirColor}20`,
                borderRadius: "6px",
              }}
            >
              BUY
            </span>
            <span
              style={{
                color: colors.text,
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              AAPL
            </span>
            <span
              style={{
                color: colors.textSecondary,
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              $187.42
            </span>
            <span
              style={{
                color: colors.buy,
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              +2.3%
            </span>
            <div
              style={{ marginLeft: "auto", display: "flex", gap: "12px" }}
            >
              {["☐", "↑", "↓", "✕"].map((a, j) => (
                <span
                  key={j}
                  style={{
                    color: colors.textMuted,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <h2
            style={{
              color: colors.text,
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: "1.35",
              margin: "12px 0 20px 0",
              fontFamily: "'Noto Serif', Georgia, serif",
            }}
          >
            Apple's AI expansion to 8 markets could trigger iPhone upgrade
            supercycle
          </h2>

          <div
            style={{
              color: colors.textSecondary,
              fontSize: "13px",
              lineHeight: "1.6",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: `1px solid ${colors.borderLight}`,
            }}
          >
            Apple announced Apple Intelligence expansion to 8 new countries
            at WWDC
            <a
              href="#"
              style={{
                color: colors.link,
                fontSize: "10px",
                verticalAlign: "super",
                marginLeft: "2px",
                textDecoration: "none",
              }}
            >
              [1]
            </a>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "8px",
              }}
            >
              WHY IT MATTERS
            </div>
            {[
              [
                "Wider AI rollout targets 400M+ older iPhones due for upgrades",
                "[1]",
              ],
              [
                "Services revenue already up 14% YoY — AI features deepen lock-in",
                "[2]",
              ],
              [
                "Aligns with your long-term tech thesis on compounding moats",
                "",
              ],
            ].map(([text, ref], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  paddingLeft: "2px",
                }}
              >
                <span
                  style={{
                    color: colors.textMuted,
                    fontSize: "12px",
                    marginTop: "1px",
                  }}
                >
                  —
                </span>
                <span
                  style={{
                    color: colors.text,
                    fontSize: "13px",
                    lineHeight: "1.55",
                  }}
                >
                  {text}
                  {ref && (
                    <a
                      href="#"
                      style={{
                        color: colors.link,
                        fontSize: "10px",
                        verticalAlign: "super",
                        marginLeft: "2px",
                        textDecoration: "none",
                      }}
                    >
                      {ref}
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              RISKS
            </div>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              AI features may underdeliver vs. hype · Antitrust pressure on
              App Store
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              WATCH FOR
            </div>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              iPhone 17 pre-order numbers in September
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              paddingTop: "16px",
              borderTop: `1px solid ${colors.borderLight}`,
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                padding: "3px 10px",
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
              }}
            >
              Weeks
            </span>
            <span style={{ color: colors.textMuted, fontSize: "11px" }}>
              High confidence
            </span>
            <span style={{ color: colors.textMuted, fontSize: "11px" }}>
              2h ago
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <a
              href="#"
              style={{
                color: colors.link,
                fontSize: "11px",
                textDecoration: "none",
              }}
            >
              [1] Reuters ↗
            </a>
            <a
              href="#"
              style={{
                color: colors.link,
                fontSize: "11px",
                textDecoration: "none",
              }}
            >
              [2] Bloomberg ↗
            </a>
          </div>

          <div
            style={{ color: colors.textMuted, fontSize: "10px", marginTop: "12px" }}
          >
            AI-generated idea · not financial advice
          </div>
        </div>
      </div>
    </div>
  );
}

function EarningsCard() {
  return (
    <div style={{ height: "100%", background: colors.bg }}>
      <TopNav />
      <div
        style={{ maxWidth: "620px", margin: "0 auto", padding: "24px 20px" }}
      >
        <div
          style={{
            background: colors.surface,
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
            padding: "28px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                color: colors.earnings,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "4px 8px",
                background: `${colors.earnings}08`,
                border: `1px solid ${colors.earnings}20`,
                borderRadius: "6px",
              }}
            >
              EARNINGS
            </span>
            <span
              style={{
                color: colors.text,
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              MSFT
            </span>
            <span
              style={{
                color: colors.textSecondary,
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              $378.55
            </span>
            <span
              style={{
                color: colors.buy,
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              +0.4%
            </span>
            <span
              style={{
                color: colors.textMuted,
                fontSize: "10px",
                padding: "2px 8px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
              }}
            >
              Q1 2026
            </span>
            <div
              style={{ marginLeft: "auto", display: "flex", gap: "12px" }}
            >
              {["☐", "↑", "↓", "✕"].map((a, j) => (
                <span
                  key={j}
                  style={{
                    color: colors.textMuted,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <h2
            style={{
              color: colors.text,
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: "1.35",
              margin: "12px 0 20px 0",
              fontFamily: "'Noto Serif', Georgia, serif",
            }}
          >
            Microsoft beat expectations — Azure growth and AI momentum are
            the story
          </h2>

          <div
            style={{
              color: colors.textSecondary,
              fontSize: "14px",
              lineHeight: "1.7",
              marginBottom: "20px",
              paddingBottom: "16px",
              borderBottom: `1px solid ${colors.borderLight}`,
            }}
          >
            Microsoft brought in $62 billion in revenue this quarter (up
            13% from last year), beating what Wall Street expected.
            The big driver was Azure, their cloud business, which grew 31%
            — partly thanks to companies paying for AI features
            <a
              href="#"
              style={{
                color: colors.link,
                fontSize: "10px",
                verticalAlign: "super",
                marginLeft: "2px",
                textDecoration: "none",
              }}
            >
              [1]
            </a>
            .
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "8px",
              }}
            >
              KEY HIGHLIGHTS
            </div>
            {[
              "Azure cloud revenue up 31% — AI services are a growing piece of that",
              "Office 365 subscriptions hit 400M, with Copilot AI driving upgrades",
              "They're spending big on data centers — $14B this quarter alone",
            ].map((text, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    color: colors.textMuted,
                    fontSize: "12px",
                    marginTop: "1px",
                  }}
                >
                  —
                </span>
                <span
                  style={{
                    color: colors.text,
                    fontSize: "13px",
                    lineHeight: "1.55",
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              MANAGEMENT TONE
            </div>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              CEO Satya Nadella sounded very bullish on AI — used the word
              "inflection" three times. CFO was more measured about margins,
              noting data center spending will stay elevated.
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              WHAT WALL STREET THINKS
            </div>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              38 out of 42 analysts say buy. Average price target is $420
              — about 11% above today's price. Two analysts upgraded after
              earnings
              <a
                href="#"
                style={{
                  color: colors.link,
                  fontSize: "10px",
                  verticalAlign: "super",
                  marginLeft: "2px",
                  textDecoration: "none",
                }}
              >
                [2]
              </a>
              .
            </div>
          </div>

          <div
            style={{
              background: colors.bg,
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                color: colors.textMuted,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              YOUR THESIS
            </div>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              Fits your long-term tech + AI thesis — Azure's AI growth
              validates the "picks and shovels" play you're watching.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              paddingTop: "16px",
              borderTop: `1px solid ${colors.borderLight}`,
            }}
          >
            <a
              href="#"
              style={{
                color: colors.link,
                fontSize: "11px",
                textDecoration: "none",
              }}
            >
              [1] Earnings Transcript ↗
            </a>
            <a
              href="#"
              style={{
                color: colors.link,
                fontSize: "11px",
                textDecoration: "none",
              }}
            >
              [2] CNBC ↗
            </a>
          </div>

          <div
            style={{
              color: colors.textMuted,
              fontSize: "10px",
              marginTop: "12px",
            }}
          >
            AI-generated digest · not financial advice
          </div>
        </div>
      </div>
    </div>
  );
}

function DigestView() {
  return (
    <div style={{ height: "100%", background: colors.bg }}>
      <TopNav activeTab="Digest" />
      <div
        style={{ maxWidth: "620px", margin: "0 auto", padding: "24px 20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ color: colors.textMuted, fontSize: "12px" }}>
            Today at 7:00 AM ET
          </div>
          <button
            style={{
              padding: "5px 14px",
              background: "transparent",
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              color: colors.textMuted,
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        <div
          style={{
            background: colors.surface,
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
            padding: "28px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <p
            style={{
              color: colors.text,
              fontSize: "17px",
              fontWeight: 600,
              lineHeight: "1.5",
              margin: "0 0 24px 0",
              fontFamily: "'Noto Serif', Georgia, serif",
            }}
          >
            Big day for your tech watchlist — Apple made moves and
            semiconductors are heating up.
          </p>

          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginBottom: "8px",
              }}
            >
              YOUR TECH WATCHLIST
            </div>
            <p
              style={{
                color: colors.textSecondary,
                fontSize: "14px",
                lineHeight: "1.75",
                margin: 0,
              }}
            >
              Apple expanded its AI features to 8 new markets, which could
              accelerate the iPhone upgrade cycle you've been tracking
              <a
                href="#"
                style={{
                  color: colors.link,
                  fontSize: "10px",
                  verticalAlign: "super",
                  textDecoration: "none",
                }}
              >
                {" "}
                [1]
              </a>
              . Meanwhile, TSMC reported stronger-than-expected Q2 guidance,
              lifting the broader chip sector
              <a
                href="#"
                style={{
                  color: colors.link,
                  fontSize: "10px",
                  verticalAlign: "super",
                  textDecoration: "none",
                }}
              >
                {" "}
                [2]
              </a>
              . NVDA and AMD both rose 3%+ on the news.
            </p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginBottom: "8px",
              }}
            >
              ENERGY
            </div>
            <p
              style={{
                color: colors.textSecondary,
                fontSize: "14px",
                lineHeight: "1.75",
                margin: 0,
              }}
            >
              Oil dipped 2% after OPEC+ signaled a possible August production
              increase
              <a
                href="#"
                style={{
                  color: colors.link,
                  fontSize: "10px",
                  verticalAlign: "super",
                  textDecoration: "none",
                }}
              >
                {" "}
                [3]
              </a>
              . Could create entry points for the energy names on your
              watchlist if the pullback continues.
            </p>
          </div>

          <div
            style={{
              background: colors.bg,
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                color: colors.hold,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              WORTH WATCHING
            </div>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              Fed minutes at 2 PM ET — markets expect hawkish tone.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              paddingTop: "16px",
              borderTop: `1px solid ${colors.borderLight}`,
              marginBottom: "16px",
            }}
          >
            {["[1] Reuters ↗", "[2] CNBC ↗", "[3] FT ↗"].map((s, i) => (
              <a
                key={i}
                href="#"
                style={{
                  color: colors.link,
                  fontSize: "11px",
                  textDecoration: "none",
                }}
              >
                {s}
              </a>
            ))}
          </div>

          {/* Digest feedback */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              paddingTop: "16px",
              borderTop: `1px solid ${colors.borderLight}`,
            }}
          >
            <span
              style={{
                color: colors.textMuted,
                fontSize: "12px",
              }}
            >
              Was this helpful?
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                style={{
                  padding: "4px 12px",
                  background: "transparent",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  color: colors.textMuted,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                ↑ Yes
              </button>
              <button
                style={{
                  padding: "4px 12px",
                  background: "transparent",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  color: colors.textMuted,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                ↓ No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingView() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "What are your investment goals?",
      sub: "Select all that apply",
      content: (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          {[
            "Growth",
            "Income",
            "Capital Preservation",
            "Speculation",
            "Learning",
          ].map((g, i) => (
            <button
              key={i}
              style={{
                padding: "10px 20px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                background: i <= 1 ? colors.text : "transparent",
                border:
                  i <= 1
                    ? `1px solid ${colors.text}`
                    : `1px solid ${colors.border}`,
                color: i <= 1 ? "#fff" : colors.textSecondary,
              }}
            >
              {g}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What sectors interest you?",
      sub: "Select all that apply",
      content: (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          {[
            "Technology",
            "Healthcare",
            "Energy",
            "Finance",
            "Consumer",
            "Real Estate",
            "Industrials",
            "Materials",
            "Utilities",
            "Communication",
          ].map((s, i) => (
            <button
              key={i}
              style={{
                padding: "10px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                background:
                  i === 0 || i === 2 ? colors.text : "transparent",
                border:
                  i === 0 || i === 2
                    ? `1px solid ${colors.text}`
                    : `1px solid ${colors.border}`,
                color:
                  i === 0 || i === 2 ? "#fff" : colors.textSecondary,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What industries or topics do you follow?",
      sub: "Get more specific — select all that apply",
      content: (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          {[
            "AI / Machine Learning",
            "Electric Vehicles",
            "Biotech / Pharma",
            "Semiconductors",
            "Cloud Computing",
            "Renewable Energy",
            "Fintech",
            "E-commerce",
            "Cybersecurity",
            "Gaming",
            "Space / Aerospace",
            "Blockchain / Web3",
          ].map((t, i) => (
            <button
              key={i}
              style={{
                padding: "10px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                background:
                  i === 0 || i === 3 ? colors.text : "transparent",
                border:
                  i === 0 || i === 3
                    ? `1px solid ${colors.text}`
                    : `1px solid ${colors.border}`,
                color:
                  i === 0 || i === 3 ? "#fff" : colors.textSecondary,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What's your experience level?",
      sub: "This helps us tailor how ideas are written",
      content: (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "24px",
          }}
        >
          {[
            ["Beginner", "Just getting started"],
            ["Intermediate", "Understand basics, made some trades"],
            ["Advanced", "Regularly trade, know technical analysis"],
          ].map(([label, sub], i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "20px",
                borderRadius: "14px",
                cursor: "pointer",
                textAlign: "center",
                background: i === 1 ? colors.text : colors.surface,
                border:
                  i === 1
                    ? `1px solid ${colors.text}`
                    : `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  color: i === 1 ? "#fff" : colors.text,
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  color: i === 1 ? "#ffffff90" : colors.textMuted,
                  fontSize: "11px",
                  marginTop: "6px",
                  lineHeight: "1.4",
                }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Any tickers you're watching?",
      sub: "Search US stocks — optional",
      content: (
        <div style={{ marginTop: "24px" }}>
          <div style={{ position: "relative" }}>
            <input
              placeholder="Search tickers..."
              defaultValue="APP"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                color: colors.text,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                zIndex: 1,
              }}
            >
              {[
                ["AAPL", "Apple Inc."],
                ["APPF", "AppFolio Inc."],
                ["APP", "AppLovin Corp."],
              ].map(([t, n], i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}
                >
                  <span
                    style={{
                      color: colors.text,
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {t}
                  </span>
                  <span
                    style={{ color: colors.textMuted, fontSize: "12px" }}
                  >
                    {n}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "6px", marginTop: "56px" }}
          >
            {["AAPL", "TSLA", "NVDA"].map((t, i) => (
              <span
                key={i}
                style={{
                  padding: "6px 12px",
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "20px",
                  color: colors.text,
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {t}{" "}
                <span
                  style={{
                    color: colors.textMuted,
                    cursor: "pointer",
                    marginLeft: "4px",
                  }}
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const totalSteps = 11;
  const current = steps[step];

  return (
    <div
      style={{
        height: "100%",
        background: colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ marginBottom: "40px" }}>
        <Logo />
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "40px",
          width: "360px",
        }}
      >
        {[...Array(totalSteps)].map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "2px",
              borderRadius: "1px",
              background: i <= step ? colors.text : colors.border,
            }}
          />
        ))}
      </div>

      <div style={{ width: "480px" }}>
        <div
          style={{
            color: colors.text,
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "6px",
            fontFamily: "'Noto Serif', Georgia, serif",
          }}
        >
          {current.title}
        </div>
        <div style={{ color: colors.textMuted, fontSize: "13px" }}>
          {current.sub}
        </div>
        {current.content}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "40px" }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          style={{
            padding: "10px 24px",
            background: "transparent",
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            color: colors.textSecondary,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          style={{
            padding: "10px 32px",
            background: colors.text,
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {step === steps.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default function TickrWireframesV3() {
  const [active, setActive] = useState(0);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: colors.bg,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          display: "flex",
          gap: "2px",
          padding: "6px 12px",
          background: "#fff",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {screens.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: "7px 14px",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              background: active === i ? colors.bg : "transparent",
              color: active === i ? colors.text : colors.textMuted,
            }}
          >
            {s}
          </button>
        ))}
        <div
          style={{
            marginLeft: "auto",
            color: colors.textMuted,
            fontSize: "10px",
            padding: "7px 12px",
          }}
        >
          wireframes · not final design
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {active === 0 && <Feed />}
        {active === 1 && <CardExpanded />}
        {active === 2 && <EarningsCard />}
        {active === 3 && <DigestView />}
        {active === 4 && <OnboardingView />}
      </div>
    </div>
  );
}
