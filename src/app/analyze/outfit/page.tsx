"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, CSSProperties, DragEvent, useEffect, useState } from "react";
import ShareCard from "@/components/ShareCard";
import styles from "./outfit-check.module.css";

type OutfitCheckResult = {
  detected_items: string[];
  dominant_colors: string[];
  harmony_score: number;
  occasion_fit: string;
  three_fixes: [string, string, string];
};

const LOADING_MESSAGES = [
  "Scanning colors...",
  "Checking contrast harmony...",
  "Writing styling tips...",
];
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function isOutfitCheckResult(value: unknown): value is OutfitCheckResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    Array.isArray(result.detected_items) &&
    result.detected_items.every((item) => typeof item === "string") &&
    Array.isArray(result.dominant_colors) &&
    result.dominant_colors.every((color) => typeof color === "string") &&
    typeof result.harmony_score === "number" &&
    Number.isFinite(result.harmony_score) &&
    result.harmony_score >= 0 &&
    result.harmony_score <= 100 &&
    typeof result.occasion_fit === "string" &&
    Array.isArray(result.three_fixes) &&
    result.three_fixes.length === 3 &&
    result.three_fixes.every((fix) => typeof fix === "string")
  );
}

export default function OutfitAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitCheckResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    }, 1700);
    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  const selectFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    setErrorMessage(null);
    setResult(null);

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setErrorMessage("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setFile(null);
      setErrorMessage("Choose an image smaller than 4 MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const analyzeOutfit = async () => {
    if (!file || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/outfit-check", {
        method: "POST",
        body: formData,
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "We couldn't analyze that outfit. Please try again.";
        throw new Error(message);
      }

      if (!isOutfitCheckResult(payload)) {
        throw new Error("The outfit analysis returned an unexpected response.");
      }
      setResult(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scoreStyle = result
    ? ({ "--score": `${result.harmony_score}%` } as CSSProperties)
    : undefined;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="The AI Style App home">
          STYLE<span>.</span>AI
        </Link>
        <Link className={styles.backLink} href="/analyze/color">
          Color analysis <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.content} aria-labelledby="outfit-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>YOUR OUTFIT CHECK</p>
          <h1 id="outfit-title">A second opinion,<br /><em>with style.</em></h1>
          <p className={styles.description}>
            Share a look and get thoughtful, clothing-focused notes on color, harmony, and easy ways
            to make it yours.
          </p>
        </div>

        <div className={styles.workspace}>
          <section className={styles.uploadCard} aria-label="Upload an outfit image">
            <div className={styles.cardHeading}>
              <span className={styles.step}>01</span>
              <div>
                <h2>Your look</h2>
                <p>One outfit, one honest opinion.</p>
              </div>
            </div>

            <div
              className={`relative ${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""} ${file ? styles.dropzoneSelected : ""}`}              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <Image
                  className={styles.preview}
                  src={previewUrl}
                  alt="Selected outfit preview"
                  width={720}
                  height={900}
                  unoptimized
                />
              ) : (
                <span className={styles.uploadPrompt}>
                  <span className={styles.uploadIcon} aria-hidden="true">↑</span>
                  <strong>Drop your outfit photo here</strong>
                  <span>or tap to choose from your camera roll</span>
                  <span className={styles.fileHint}>JPEG, PNG or WebP · up to 4 MB</span>
                </span>
              )}
              {previewUrl && <span className={styles.changePhoto}>Change photo</span>}
              <input
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                aria-label={file ? `Selected image: ${file.name}. Choose a different image` : "Choose or drop an outfit photo"}
              />
            </div>

            {file && <p className={styles.fileName}>{file.name}</p>}

            <button
              className={styles.analyzeButton}
              type="button"
              disabled={!file || isLoading}
              onClick={analyzeOutfit}
            >
              {isLoading ? "Putting the look together..." : "Analyze Outfit"}
              {!isLoading && <span aria-hidden="true">↗</span>}
            </button>

            {isLoading && (
              <p className={styles.loadingMessage} role="status" aria-live="polite">
                <span className={styles.loadingDot} />
                {LOADING_MESSAGES[loadingIndex]}
              </p>
            )}
            {errorMessage && <p className={styles.errorMessage} role="alert">{errorMessage}</p>}
            <p className={styles.privacyNote}>
              Your photo is analyzed for clothing and styling only.
            </p>
          </section>

          <section className={styles.results} aria-label="Outfit analysis results" aria-live="polite">
            {result ? (
              <>
                <div className={styles.resultHeader}>
                  <p className={styles.eyebrow}>THE STYLE NOTES</p>
                  <h2>Here&#39;s the read.</h2>
                </div>

                <div className={styles.summaryGrid}>
                  <article className={styles.scoreCard}>
                    <div className={styles.scoreDial} style={scoreStyle} aria-label={`Harmony score ${result.harmony_score} out of 100`}>                      <div className={styles.scoreInner}>
                        <strong>{result.harmony_score}</strong>
                        <span>HARMONY</span>
                      </div>
                    </div>
                    <p className={styles.scoreCaption}>How the pieces work together</p>
                  </article>

                  <article className={styles.detailCard}>
                    <p className={styles.blockLabel}>THE PIECES</p>
                    <ul className={styles.itemList}>
                      {result.detected_items.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                    <div className={styles.colorBlock}>
                      <p className={styles.blockLabel}>COLOR STORY</p>
                      <div className={styles.colorList}>
                        {result.dominant_colors.map((color, index) => (
                          <span className={styles.colorTag} key={`${color}-${index}`}>{color}</span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.occasionBlock}>
                      <p className={styles.blockLabel}>OCCASION FIT</p>
                      <p>{result.occasion_fit}</p>
                    </div>
                  </article>
                </div>

                <div className={styles.fixesSection}>
                  <div className={styles.fixesHeading}>
                    <p className={styles.eyebrow}>SMALL MOVES, BIG DIFFERENCE</p>
                    <h2>Three ways to take it further.</h2>
                  </div>
                  <ol className={styles.fixesList}>
                    {result.three_fixes.map((fix, index) => (
                      <li className={styles.fixCard} key={`${fix}-${index}`}>
                        <span className={styles.fixNumber}>0{index + 1}</span>
                        <p>{fix}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={styles.shareCardBlock}>
                  <ShareCard
                    undertone="Personal style"
                    harmonyScore={result.harmony_score}
                    dominantColors={result.dominant_colors}
                  />
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyMark} aria-hidden="true">S<span>.</span></div>
                <p className={styles.eyebrow}>YOUR STYLE, YOUR CALL</p>
                <h2>A little clarity<br />goes a long way.</h2>
                <p>Upload a look to see its color harmony, the pieces that make it, and three ideas to try next.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
