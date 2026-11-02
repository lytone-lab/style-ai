"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./color-camera.module.css";
import { analyzeUndertone, type RGB, type Undertone } from "@/lib/colorMath";

type FaceLandmark = { x: number; y: number };
type FaceLandmarkerInstance = {
  detectForVideo(video: HTMLVideoElement, timestamp: number): {
    faceLandmarks: FaceLandmark[][];
  };
  close(): void;
};
type MediaPipeVision = {
  FaceLandmarker: {
    createFromOptions(
      fileset: unknown,
      options: {
        baseOptions: { modelAssetPath: string; delegate: "GPU" | "CPU" };
        runningMode: "VIDEO";
        numFaces: number;
      },
    ): Promise<FaceLandmarkerInstance>;
  };
  FilesetResolver: {
    forVisionTasks(wasmPath: string): Promise<unknown>;
  };
};

declare global {
  interface Window {
    tasksVision?: MediaPipeVision;
    Vision?: MediaPipeVision;
  }
}

const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL = "/face_landmarker.task";
const LIGHTING_WARNING =
  "Please stand in front of a window or bright, natural light.";
const SAMPLE_CHEEK_LEFT = 117;
const SAMPLE_CHEEK_RIGHT = 346;
const SAMPLE_FOREHEAD = 10;

function samplePatch(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmark: FaceLandmark,
  offsetY = 0,
): RGB[] {
  const centerX = Math.round(landmark.x * width);
  const centerY = Math.round((landmark.y + offsetY) * height);
  const radius = 4;
  const left = Math.max(0, Math.min(width - 1, centerX - radius));
  const top = Math.max(0, Math.min(height - 1, centerY - radius));
  const patchWidth = Math.min(radius * 2 + 1, width - left);
  const patchHeight = Math.min(radius * 2 + 1, height - top);
  const pixels = context.getImageData(left, top, patchWidth, patchHeight).data;
  const samples: RGB[] = [];

  for (let index = 0; index < pixels.length; index += 4) {
    samples.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
  }

  return samples;
}

function getLightingWarning(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): string | null {
  const pixels = context.getImageData(0, 0, width, height).data;
  let luminanceTotal = 0;
  let clippedPixels = 0;
  const pixelCount = pixels.length / 4;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    luminanceTotal += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    if (red > 248 && green > 248 && blue > 248) clippedPixels += 1;
  }

  const averageLuminance = luminanceTotal / pixelCount;
  return averageLuminance < 70 || averageLuminance > 225 || clippedPixels / pixelCount > 0.35
    ? LIGHTING_WARNING
    : null;
}

function drawSampleMarker(
  context: CanvasRenderingContext2D,
  landmark: FaceLandmark,
  width: number,
  height: number,
) {
  context.beginPath();
  context.arc(
    landmark.x * width,
    landmark.y * height,
    Math.max(8, width * 0.014),
    0,
    Math.PI * 2,
  );
  context.strokeStyle = "#f7e9cc";
  context.lineWidth = Math.max(2, width * 0.003);
  context.stroke();
  context.beginPath();
  context.arc(
    landmark.x * width,
    landmark.y * height,
    Math.max(2, width * 0.004),
    0,
    Math.PI * 2,
  );
  context.fillStyle = "#c6513b";
  context.fill();
}

export default function ColorAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const landmarkerInitializationRef = useRef<Promise<FaceLandmarkerInstance> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const qualityOkayRef = useRef(false);
  const lastDetectionRef = useRef(0);
  const lastLightingCheckRef = useRef(0);
  const lastAnalysisRef = useRef(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLibraryReady, setIsLibraryReady] = useState(false);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarkerInstance | null>(null);
  const [statusMessage, setStatusMessage] = useState("Your camera stays on this device.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lightingWarning, setLightingWarning] = useState<string | null>(null);
  const [undertone, setUndertone] = useState<Undertone | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    if (!isLibraryReady) return;

    console.log("1. CDN ready status updated");
    const vision = window.tasksVision ?? window.Vision;
    if (!vision?.FilesetResolver || !vision.FaceLandmarker) {
      setErrorMessage("Face analysis could not initialize. Please refresh and try again.");
      return;
    }
    window.tasksVision = vision;

    let cancelled = false;
    const initializeLandmarker = async () => {
      try {
        if (!landmarkerInitializationRef.current) {
          console.log("2. Starting local model compilation");
          landmarkerInitializationRef.current = (async () => {
            const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
            try {
              return await vision.FaceLandmarker.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
                runningMode: "VIDEO",
                numFaces: 1,
              });
            } catch {
              return vision.FaceLandmarker.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
                runningMode: "VIDEO",
                numFaces: 1,
              });
            }
          })();
        }

        const landmarker = await landmarkerInitializationRef.current;
        if (cancelled) return;
        landmarkerRef.current = landmarker;
        setFaceLandmarker(landmarker);
      } catch (error) {
        landmarkerInitializationRef.current = null;
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? `Face analysis could not initialize: ${error.message}`
            : "Face analysis could not initialize. Please refresh and try again.",
        );
      }
    };

    void initializeLandmarker();
    return () => {
      cancelled = true;
    };
  }, [isLibraryReady]);

  useEffect(
    () => () => {
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!cameraActive || !isLibraryReady || !faceLandmarker) return;

    const video = videoRef.current;
    if (!video) return;

    console.log("3. Tracking active");
    const renderFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const overlay = overlayRef.current;
      const overlayContext = overlay?.getContext("2d");
      const processingCanvas = processingCanvasRef.current;
      const processingContext = processingCanvas?.getContext("2d", {
        willReadFrequently: true,
      });

      if (overlay && overlayContext && processingCanvas && processingContext) {
        if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
          overlay.width = video.videoWidth;
          overlay.height = video.videoHeight;
        }
        if (processingCanvas.width !== 320 || processingCanvas.height !== 240) {
          processingCanvas.width = 320;
          processingCanvas.height = 240;
        }

        const now = performance.now();
        if (now - lastDetectionRef.current > 100) {
          processingContext.drawImage(
            video,
            0,
            0,
            processingCanvas.width,
            processingCanvas.height,
          );

          if (now - lastLightingCheckRef.current > 900) {
            const warning = getLightingWarning(
              processingContext,
              processingCanvas.width,
              processingCanvas.height,
            );
            qualityOkayRef.current = warning === null;
            setLightingWarning(warning);
            lastLightingCheckRef.current = now;
          }

          const result = faceLandmarker.detectForVideo(video, now);
          const landmarks = result.faceLandmarks[0];
          setFaceDetected(Boolean(landmarks));
          overlayContext.clearRect(0, 0, overlay.width, overlay.height);

          if (landmarks && landmarks.length > SAMPLE_CHEEK_RIGHT) {
            const leftCheek = landmarks[SAMPLE_CHEEK_LEFT];
            const rightCheek = landmarks[SAMPLE_CHEEK_RIGHT];
            const forehead = landmarks[SAMPLE_FOREHEAD];

            drawSampleMarker(overlayContext, leftCheek, overlay.width, overlay.height);
            drawSampleMarker(overlayContext, rightCheek, overlay.width, overlay.height);
            drawSampleMarker(overlayContext, forehead, overlay.width, overlay.height);

            if (qualityOkayRef.current && now - lastAnalysisRef.current > 2500) {
              const analysis = analyzeUndertone({
                cheeks: [
                  ...samplePatch(
                    processingContext,
                    processingCanvas.width,
                    processingCanvas.height,
                    leftCheek,
                  ),
                  ...samplePatch(
                    processingContext,
                    processingCanvas.width,
                    processingCanvas.height,
                    rightCheek,
                  ),
                ],
                forehead: samplePatch(
                  processingContext,
                  processingCanvas.width,
                  processingCanvas.height,
                  forehead,
                  0.035,
                ),
              });
              setUndertone(analysis.undertone);
              lastAnalysisRef.current = now;
            }
          }

          lastDetectionRef.current = now;
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cameraActive, faceLandmarker, isLibraryReady]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = overlayRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);

    qualityOkayRef.current = false;
    setCameraActive(false);
    setFaceDetected(false);
    setLightingWarning(null);
    setUndertone(null);
    setStatusMessage("Your camera stays on this device.");
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    if (!isLibraryReady || !faceLandmarker) {
      setErrorMessage("Face analysis is still initializing. Please try again in a moment.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Camera access is not available in this browser.");
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);
    setStatusMessage("Preparing your camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error("The camera preview could not be initialized.");
      video.srcObject = stream;
      await video.play();

      setCameraActive(true);
      setStatusMessage("Center your face in the frame.");
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Allow camera access in your browser settings, then try again."
          : error instanceof Error
            ? error.message
            : "The camera could not be started. Please try again.";
      setErrorMessage(message);
      setStatusMessage("Camera unavailable");
    } finally {
      setIsStarting(false);
    }
  };

  const undertoneLabel = undertone
    ? `${undertone[0].toUpperCase()}${undertone.slice(1)}`
    : "Waiting for a face";

  return (
    <>
      <Script
        src={SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => {
          if (!window.tasksVision && window.Vision) {
            window.tasksVision = window.Vision;
          }
          if (!window.tasksVision) {
            setErrorMessage("Face analysis could not initialize. Please refresh and try again.");
            return;
          }
          setIsLibraryReady(true);
        }}
        onError={() =>
          setErrorMessage("Face analysis could not load. Check your connection and try again.")
        }
      />
      <main className={styles.page}>
        <header className={styles.header}>
          <Link className={styles.wordmark} href="/" aria-label="STYLE.AI home">
            STYLE<span>.</span>AI
          </Link>
          <span className={styles.headerLabel}>COLOR PROFILE / 01</span>
        </header>

        <section className={styles.content} aria-labelledby="page-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>YOUR COLOR STORY</p>
          <h1 id="page-title">Meet your <em>undertone.</em></h1>
          <p className={styles.description}>
            Find the colors that feel like you. Face analysis happens right here in your browser.
          </p>
        </div>

        <div className={styles.analysisLayout}>
          <div className={styles.cameraColumn}>
            <div className={styles.cameraFrame} aria-label="Camera preview">
              <video
                ref={videoRef}
                className={styles.video}
                autoPlay
                muted
                playsInline
                aria-label="Live camera preview"
              />
              <canvas ref={overlayRef} className={styles.overlay} aria-hidden="true" />
              <canvas
                ref={processingCanvasRef}
                className={styles.hiddenCanvas}
                aria-hidden="true"
              />

              {!cameraActive && (
                <div className={styles.cameraPlaceholder}>
                  <span className={styles.faceOutline} aria-hidden="true">
                    <span />
                  </span>
                  <span>YOUR PORTRAIT, YOUR PALETTE</span>
                </div>
              )}

              {lightingWarning && cameraActive && (
                <p className={styles.lightingWarning} role="status">{lightingWarning}</p>
              )}

              {cameraActive && (
                <div className={styles.liveBadge}>
                  <span />
                  LIVE ANALYSIS
                </div>
              )}
            </div>

            <div className={styles.cameraControls}>
              <p className={styles.cameraStatus} role="status">
                <span className={cameraActive ? styles.statusActive : styles.statusDot} />
                {cameraActive
                  ? faceDetected
                    ? "Face detected — reading your color"
                    : statusMessage
                  : statusMessage}
              </p>
              {cameraActive ? (
                <button className={styles.secondaryButton} onClick={stopCamera} type="button">
                  Turn camera off
                </button>
              ) : (
                <button
                  className={styles.primaryButton}
                  disabled={isStarting || !faceLandmarker}
                  onClick={startCamera}
                  type="button"
                >
                  {isStarting
                    ? "Getting things ready..."
                    : faceLandmarker
                      ? "Analyze Tone"
                      : isLibraryReady
                        ? "Preparing face analysis..."
                        : "Loading face analysis..."}
                  {!isStarting && faceLandmarker && <span aria-hidden="true">↗</span>}
                </button>
              )}
              {errorMessage && <p className={styles.errorMessage} role="alert">{errorMessage}</p>}
            </div>
          </div>

          <aside className={styles.resultCard} aria-live="polite">
            <p className={styles.resultEyebrow}>YOUR FIRST IMPRESSION</p>
            <div className={styles.resultSwatch} data-undertone={undertone ?? "waiting"}>
              {undertone ? <span>{undertoneLabel.slice(0, 1)}</span> : <span>—</span>}
            </div>
            <p className={styles.resultLabel}>YOUR UNDERTONE</p>
            <h2>{undertoneLabel}</h2>
            <p className={styles.resultDescription}>
              {undertone
                ? "A first read on the colors naturally reflected in your skin."
                : "We'll share your color read once your face is in frame."}
            </p>
            <div className={styles.resultRule} />
            <p className={styles.privacyNote}>
              <span aria-hidden="true">✓</span> Your image is processed on your device and never saved.
            </p>
          </aside>
        </div>

        <p className={styles.footerNote}>
          Natural light gives the most true-to-you result. No photo is captured or uploaded.
        </p>
        </section>
      </main>
    </>
  );
}
