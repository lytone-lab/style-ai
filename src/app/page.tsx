"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { WaitlistForm } from "@/components/waitlist-form";
import styles from "./dashboard.module.css";

type OutfitResult = {
  detected_items: string[];
  dominant_colors: string[];
  harmony_score: number;
};

type HistoryEntry = {
  id: string;
  title: string;
  score: number;
  colors: string[];
  previewUrl: string | null;
  caption: string;
  sampleColors?: [string, string];
};

const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: "sample-1",
    title: "Executive Classic Double-Breasted Blazer",
    score: 84,
    colors: ["#7d8790", "#282a2e", "#c5b7a3"],
    previewUrl: null,
    caption: "Sample look · Yesterday",
    sampleColors: ["#4c5158", "#23252a"],
  },
  {
    id: "sample-2",
    title: "Soft Tailoring & Tonal Layers",
    score: 78,
    colors: ["#c2b9ae", "#7d776d", "#393b3e"],
    previewUrl: null,
    caption: "Sample look · 3 days ago",
    sampleColors: ["#726d66", "#363638"],
  },
  {
    id: "sample-3",
    title: "Modern Minimal Weekend Edit",
    score: 91,
    colors: ["#d0cfc8", "#8d928e", "#27282a"],
    previewUrl: null,
    caption: "Sample look · 5 days ago",
    sampleColors: ["#969992", "#404247"],
  },
];

const METRICS = [
  { name: "Palette Balance", score: 81, hint: "Tonal clarity" },
  { name: "Silhouette Proportion", score: 64, hint: "Room to refine" },
  { name: "Contrast Ratio", score: 73, hint: "Balanced" },
];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const FALLBACK_COLORS = ["#9a9aa3", "#5a5a64", "#d0c4b1", "#777782"];

function isOutfitResult(value: unknown): value is OutfitResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    Array.isArray(result.detected_items) &&
    result.detected_items.every((item) => typeof item === "string") &&
    Array.isArray(result.dominant_colors) &&
    result.dominant_colors.every((color) => typeof color === "string") &&
    typeof result.harmony_score === "number" &&
    Number.isFinite(result.harmony_score) &&
    result.harmony_score >= 0 &&
    result.harmony_score <= 100
  );
}

function colorValue(value: string, index: number) {
  return /^#[\da-f]{6}$/i.test(value) ? value : FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function MetricRing({ name, score, hint }: (typeof METRICS)[number]) {
  return (
    <article className={styles.metricCard}>
      <div
        className={styles.metricRing}
        style={{ "--metric-angle": `${score * 3.6}deg` } as React.CSSProperties}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name}: ${score} out of 100`}
      >
        <div className={styles.metricRingInner}>{score}</div>
      </div>
      <p className={styles.metricName}>{name}</p>
      <p className={styles.metricHint}>{hint}</p>
    </article>
  );
}

export default function Home() {
  const [history, setHistory] = useState(SAMPLE_HISTORY);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(false);
    setUploadMessage("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(true);
      setUploadMessage("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(true);
      setUploadMessage("Choose an image smaller than 4 MB.");
      return;
    }

    setIsAnalyzing(true);
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.push(previewUrl);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/outfit-check", { method: "POST", body: formData });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("The style service returned an unreadable response. Please try again.");
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "We couldn’t analyze this outfit. Please try again.";
        throw new Error(message);
      }
      if (!isOutfitResult(payload)) {
        throw new Error("The style service returned an unexpected result.");
      }

      setHistory((current) => [
        {
          id: `${Date.now()}`,
          title: payload.detected_items.slice(0, 2).join(" + ") || "Outfit analysis",
          score: payload.harmony_score,
          colors: payload.dominant_colors.slice(0, 4).map(colorValue),
          previewUrl,
          caption: "Just now · This session",
        },
        ...current.filter((entry) => !entry.id.startsWith("sample-")),
      ]);
      setUploadMessage("Your style scan was added to this session’s history.");
    } catch (error) {
      setUploadError(true);
      setUploadMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
      URL.revokeObjectURL(previewUrl);
      objectUrls.current = objectUrls.current.filter((url) => url !== previewUrl);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Style AI dashboard">
          <span className={styles.brandMark} aria-hidden="true">S</span>
          <span>Style AI</span>
        </Link>
        <div className={styles.headerActions}>
          <div className={styles.streak} aria-label="Demo style streak: four days">
            <span className={styles.streakIcon} aria-hidden="true">🔥</span>
            <span>4 day streak</span>
            <small>DEMO</small>
          </div>
          <span className={styles.profileLink} aria-label="Style profile">SA</span>
        </div>
      </header>

      <section aria-labelledby="dashboard-title">
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>STYLE INTELLIGENCE</p>
            <h1 id="dashboard-title">Your style pulse</h1>
          </div>
          <span className={styles.dateLabel}>Personal dashboard</span>
        </div>
        <p className={styles.sampleNotice}>Illustrative sample metrics — personalize with your own scans.</p>

        <section className={styles.analyticsCard} aria-label="Style analytics">
          <div className={styles.scorePanel}>
            <p className={styles.scoreLabel}>STYLE HARMONY SCORE</p>
            <div
              className={styles.scoreDial}
              role="progressbar"
              aria-valuenow={72}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Style harmony score: 72 out of 100"
            >
              <div className={styles.scoreDialInner}>
                <span className={styles.scoreValue}>72</span>
                <span className={styles.scoreScale}>/ 100</span>
              </div>
            </div>
            <p className={styles.scoreCaption}>A balanced foundation to build on</p>
          </div>
          <div className={styles.metricGrid} aria-label="Style data layers">
            {METRICS.map((metric) => <MetricRing key={metric.name} {...metric} />)}
          </div>
        </section>
      </section>

      <section aria-labelledby="history-title">
        <div className={styles.sectionHeading}>
          <h2 id="history-title">Recently Uploaded</h2>
          <span className={styles.sectionMeta}>{history.length} looks · sample + this session</span>
        </div>
        <div className={styles.historyCard}>
          {history.map((entry) => (
            <article className={styles.historyRow} key={entry.id}>
              <div className={styles.thumb}>
                {entry.previewUrl ? (
                  <Image
                    className={styles.thumbImage}
                    src={entry.previewUrl}
                    alt={`Uploaded outfit: ${entry.title}`}
                    width={116}
                    height={132}
                    unoptimized
                  />
                ) : (
                  <div
                    className={styles.sampleThumb}
                    style={{
                      "--thumb-a": entry.sampleColors?.[0] ?? "#414149",
                      "--thumb-b": entry.sampleColors?.[1] ?? "#24242a",
                    } as React.CSSProperties}
                    role="img"
                    aria-label="Illustrative outfit thumbnail"
                  >
                    <span className={styles.garmentShape} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className={styles.historyInfo}>
                <p className={styles.historyTitle}>{entry.title}</p>
                <p className={styles.historyCaption}>{entry.caption}</p>
                <div className={styles.swatchRow} aria-label="Dominant colors">
                  {entry.colors.map((color, index) => (
                    <span
                      className={styles.colorChip}
                      key={`${entry.id}-${color}-${index}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <span className={styles.historyScore}>{entry.score}<span aria-hidden="true">/100</span></span>
            </article>
          ))}
        </div>
        {uploadMessage && (
          <p className={`${styles.scanNotice}${uploadError ? ` ${styles.scanError}` : ""}`} role={uploadError ? "alert" : "status"}>
            {uploadMessage}
          </p>
        )}
      </section>

      <div className={styles.lowerGrid}>
        <nav className={styles.quickLinks} aria-label="Style tools">
          <Link className={styles.quickLink} href="/analyze/color">
            <span className={styles.quickIcon} aria-hidden="true">◉</span>
            <strong>Color analysis</strong>
            <span>Find your personal palette ↗</span>
          </Link>
          <Link className={styles.quickLink} href="/analyze/outfit">
            <span className={styles.quickIcon} aria-hidden="true">⌁</span>
            <strong>Outfit check</strong>
            <span>Get a focused second opinion ↗</span>
          </Link>
        </nav>
        <section className={styles.accessCard} aria-labelledby="access-title">
          <h2 id="access-title">Get early access</h2>
          <p>Join the founding list for thoughtful style tools, made personal.</p>
          <WaitlistForm />
        </section>
      </div>

      <footer className={styles.footer}>
        <span>STYLE AI · PERSONAL STYLE INTELLIGENCE</span>
        <span>Images are kept in this tab only.</span>
      </footer>

      <label className={styles.floatingUpload} aria-busy={isAnalyzing}>
        <input
          className={styles.floatingInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          aria-label="Upload an outfit image for analysis"
          disabled={isAnalyzing}
        />
        <span className={styles.floatingIcon} aria-hidden="true">{isAnalyzing ? "…" : "+"}</span>
        <span className={styles.srOnly}>{isAnalyzing ? "Analyzing outfit" : "Upload an outfit"}</span>
      </label>
    </main>
  );
}
