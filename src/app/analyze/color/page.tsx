"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeUndertone, type RGB, type Undertone } from "@/lib/colorMath";

type FaceLandmark = { x: number; y: number };
type FaceLandmarkerInstance = {
  detectForVideo(video: HTMLVideoElement, timestamp: number): { faceLandmarks: FaceLandmark[][] };
  close(): void;
};
type MediaPipeVision = {
  FaceLandmarker: {
    createFromOptions(fileset: unknown, options: { baseOptions: { modelAssetPath: string; delegate: "GPU" | "CPU" }; runningMode: "VIDEO"; numFaces: number; }): Promise<FaceLandmarkerInstance>;
  };
  FilesetResolver: { forVisionTasks(wasmPath: string): Promise<unknown>; };
};

declare global {
  interface Window { tasksVision?: MediaPipeVision; Vision?: MediaPipeVision; }
}

const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL = "/face_landmarker.task";
const LIGHTING_WARNING = "Please stand in front of a window or bright, natural light.";
const SAMPLE_CHEEK_LEFT = 117;
const SAMPLE_CHEEK_RIGHT = 346;
const SAMPLE_FOREHEAD = 10;

function samplePatch(context: CanvasRenderingContext2D, width: number, height: number, landmark: FaceLandmark, offsetY = 0): RGB[] {
  const centerX = Math.round(landmark.x * width);
  const centerY = Math.round((landmark.y + offsetY) * height);
  const radius = 4;
  const left = Math.max(0, Math.min(width - 1, centerX - radius));
  const top = Math.max(0, Math.min(height - 1, centerY - radius));
  const patchWidth = Math.min(radius * 2 + 1, width - left);
  const patchHeight = Math.min(radius * 2 + 1, height - top);
  const pixels = context.getImageData(left, top, patchWidth, patchHeight).data;
  const samples: RGB[] = [];
  for (let index = 0; index < pixels.length; index += 4) { samples.push([pixels[index], pixels[index + 1], pixels[index + 2]]); }
  return samples;
}

function getLightingWarning(context: CanvasRenderingContext2D, width: number, height: number): string | null {
  const pixels = context.getImageData(0, 0, width, height).data;
  let luminanceTotal = 0; let clippedPixels = 0;
  const pixelCount = pixels.length / 4;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index]; const green = pixels[index + 1]; const blue = pixels[index + 2];
    luminanceTotal += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    if (red > 248 && green > 248 && blue > 248) clippedPixels += 1;
  }
  const averageLuminance = luminanceTotal / pixelCount;
  return averageLuminance < 70 || averageLuminance > 225 || clippedPixels / pixelCount > 0.35 ? LIGHTING_WARNING : null;
}

function drawSampleMarker(context: CanvasRenderingContext2D, landmark: FaceLandmark, width: number, height: number) {
  context.beginPath(); context.arc(landmark.x * width, landmark.y * height, Math.max(8, width * 0.014), 0, Math.PI * 2);
  context.strokeStyle = "#f7e9cc"; context.lineWidth = Math.max(2, width * 0.003); context.stroke();
  context.beginPath(); context.arc(landmark.x * width, landmark.y * height, Math.max(2, width * 0.004), 0, Math.PI * 2);
  context.fillStyle = "#c6513b"; context.fill();
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
    const vision = window.tasksVision ?? window.Vision;
    if (!vision?.FilesetResolver || !vision.FaceLandmarker) { setErrorMessage("Face analysis could not initialize. Please refresh and try again."); return; }
    window.tasksVision = vision;
    let cancelled = false;
    const initializeLandmarker = async () => {
      try {
        if (!landmarkerInitializationRef.current) {
          landmarkerInitializationRef.current = (async () => {
            const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
            try { return await vision.FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" }, runningMode: "VIDEO", numFaces: 1 }); }
            catch { return vision.FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" }, runningMode: "VIDEO", numFaces: 1 }); }
          })();
        }
        const landmarker = await landmarkerInitializationRef.current;
        if (cancelled) return;
        landmarkerRef.current = landmarker; setFaceLandmarker(landmarker);
      } catch (error) {
        landmarkerInitializationRef.current = null;
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? `Face analysis could not initialize: ${error.message}` : "Face analysis could not initialize. Please refresh and try again.");
      }
    };
    void initializeLandmarker();
    return () => { cancelled = true; };
  }, [isLibraryReady]);

  useEffect(() => () => { landmarkerRef.current?.close(); landmarkerRef.current = null; }, []);

  useEffect(() => {
    if (!cameraActive || !isLibraryReady || !faceLandmarker) return;
    const video = videoRef.current; if (!video) return;
    const renderFrame = () => {
      if (!video.videoWidth || !video.videoHeight) { animationFrameRef.current = requestAnimationFrame(renderFrame); return; }
      const overlay = overlayRef.current; const overlayContext = overlay?.getContext("2d");
      const processingCanvas = processingCanvasRef.current; const processingContext = processingCanvas?.getContext("2d", { willReadFrequently: true });
      if (overlay && overlayContext && processingCanvas && processingContext) {
        if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) { overlay.width = video.videoWidth; overlay.height = video.videoHeight; }
        if (processingCanvas.width !== 320 || processingCanvas.height !== 240) { processingCanvas.width = 320; processingCanvas.height = 240; }
        const now = performance.now();
        if (now - lastDetectionRef.current > 100) {
          processingContext.drawImage(video, 0, 0, processingCanvas.width, processingCanvas.height);
          if (now - lastLightingCheckRef.current > 900) {
            const warning = getLightingWarning(processingContext, processingCanvas.width, processingCanvas.height);
            qualityOkayRef.current = warning === null; setLightingWarning(warning); lastLightingCheckRef.current = now;
          }
          const result = faceLandmarker.detectForVideo(video, now);
          const landmarks = result.faceLandmarks[0];
          setFaceDetected(Boolean(landmarks));
          overlayContext.clearRect(0, 0, overlay.width, overlay.height);
          if (landmarks && landmarks.length > SAMPLE_CHEEK_RIGHT) {
            const leftCheek = landmarks[SAMPLE_CHEEK_LEFT]; const rightCheek = landmarks[SAMPLE_CHEEK_RIGHT]; const forehead = landmarks[SAMPLE_FOREHEAD];
            drawSampleMarker(overlayContext, leftCheek, overlay.width, overlay.height); drawSampleMarker(overlayContext, rightCheek, overlay.width, overlay.height); drawSampleMarker(overlayContext, forehead, overlay.width, overlay.height);
            if (qualityOkayRef.current && now - lastAnalysisRef.current > 2500) {
              const analysis = analyzeUndertone({
                cheeks: [...samplePatch(processingContext, processingCanvas.width, processingCanvas.height, leftCheek), ...samplePatch(processingContext, processingCanvas.width, processingCanvas.height, rightCheek)],
                forehead: samplePatch(processingContext, processingCanvas.width, processingCanvas.height, forehead, 0.035),
              });
              setUndertone(analysis.undertone); lastAnalysisRef.current = now;
            }
          }
          lastDetectionRef.current = now;
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    return () => { if (animationFrameRef.current !== null) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; } };
  }, [cameraActive, faceLandmarker, isLibraryReady]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current !== null) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = overlayRef.current; const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    qualityOkayRef.current = false; setCameraActive(false); setFaceDetected(false); setLightingWarning(null); setUndertone(null); setStatusMessage("Your camera stays on this device.");
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    if (!isLibraryReady || !faceLandmarker) { setErrorMessage("Face analysis is still initializing. Please try again in a moment."); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setErrorMessage("Camera access is not available in this browser."); return; }
    setIsStarting(true); setErrorMessage(null); setStatusMessage("Preparing your camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } } });
      streamRef.current = stream;
      const video = videoRef.current; if (!video) throw new Error("The camera preview could not be initialized.");
      video.srcObject = stream; await video.play();
      setCameraActive(true); setStatusMessage("Center your face in the frame.");
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      const message = error instanceof DOMException && error.name === "NotAllowedError" ? "Allow camera access in your browser settings, then try again." : error instanceof Error ? error.message : "The camera could not be started. Please try again.";
      setErrorMessage(message); setStatusMessage("Camera unavailable");
    } finally { setIsStarting(false); }
  };

  const undertoneLabel = undertone ? `${undertone[0].toUpperCase()}${undertone.slice(1)}` : "Waiting for a face";

  return (
    <>
      <Script src={SCRIPT_URL} strategy="afterInteractive" onReady={() => {
        if (!window.tasksVision && window.Vision) window.tasksVision = window.Vision;
        if (!window.tasksVision) { setErrorMessage("Face analysis could not initialize. Please refresh and try again."); return; }
        setIsLibraryReady(true);
      }} onError={() => setErrorMessage("Face analysis could not load. Check your connection and try again.")} />
      
      <main className="min-h-screen bg-[#151518] px-6 py-12 text-[#E8E6E3] selection:bg-[#B99A6B]/30">
        <div className="mx-auto max-w-6xl">
          <header className="mb-12 flex justify-between items-center">
            <Link href="/" className="text-[20px] font-semibold tracking-[0.1em] drop-shadow-md">
              STYLE<span className="text-[#B99A6B]">.</span>AI
            </Link>
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#55555A]">Color Profile / 01</span>
          </header>

          <div className="mb-12 text-center max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] mb-4">Your Color Story</p>
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4">Meet your <span className="italic text-[#B99A6B]">undertone.</span></h1>
            <p className="text-[15px] text-[#8B8B90] leading-relaxed">Find the colors that feel like you. Face analysis happens right here in your browser.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Camera Column */}
            <div className="relative rounded-[2rem] bg-[#1C1C21] shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_16px_32px_rgba(0,0,0,0.4)] p-6">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.5rem] bg-[#151518] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.6),inset_-4px_-4px_10px_rgba(255,255,255,0.03)] flex items-center justify-center">
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay muted playsInline aria-label="Live camera preview" />
                <canvas ref={overlayRef} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true" />
                <canvas ref={processingCanvasRef} className="hidden" aria-hidden="true" />

                {!cameraActive && (
                  <div className="relative z-10 flex flex-col items-center gap-3 text-[#55555A]">
                    <span className="h-16 w-16 rounded-full border-2 border-dashed border-current flex items-center justify-center text-2xl">+</span>
                    <span className="text-[10px] uppercase tracking-widest">Your portrait, your palette</span>
                  </div>
                )}
                {lightingWarning && cameraActive && <p className="absolute top-4 left-4 right-4 bg-[#1C1C21]/90 px-4 py-2 rounded-xl text-[11px] text-[#B99A6B] text-center shadow-lg backdrop-blur-sm z-20" role="status">{lightingWarning}</p>}
                {cameraActive && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-[#1C1C21]/80 px-3 py-1 backdrop-blur-sm shadow-lg text-[9px] uppercase tracking-widest text-[#B99A6B]">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Live Analysis
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <p className="text-[12px] text-[#8B8B90] flex items-center gap-2" role="status">
                  <span className={`h-2 w-2 rounded-full ${cameraActive ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-[#55555A]"}`} />
                  {cameraActive ? (faceDetected ? "Face detected — reading your color" : statusMessage) : statusMessage}
                </p>
                {cameraActive ? (
                  <button className="w-full rounded-[1.2rem] bg-[#1C1C21] py-4 text-[12px] font-semibold text-[#E8E6E3] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.3)] transition-all hover:bg-[#25252b] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5" onClick={stopCamera} type="button">
                    Turn camera off
                  </button>
                ) : (
                  <button className="w-full rounded-[1.2rem] bg-[#B99A6B] py-4 text-[12px] font-semibold text-[#121214] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(185,154,107,0.3)] transition-all hover:bg-[#C4A77D] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2" disabled={isStarting || !faceLandmarker} onClick={startCamera} type="button">
                    {isStarting ? "Getting things ready..." : faceLandmarker ? "Analyze Tone" : isLibraryReady ? "Preparing face analysis..." : "Loading face analysis..."}
                    {!isStarting && faceLandmarker && <span>↗</span>}
                  </button>
                )}
                {errorMessage && <p className="text-[12px] text-red-400 text-center" role="alert">{errorMessage}</p>}
              </div>
            </div>

            {/* Result Card */}
            <div className="relative rounded-[2rem] bg-[#1C1C21] shadow-[inset_0_2px_4px_rgba(255,255,255,0.06),0_16px_32px_rgba(0,0,0,0.4)] p-8 flex flex-col justify-center" aria-live="polite">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#B99A6B] mb-8 text-center">Your First Impression</p>
              
              <div className="mx-auto mb-8 flex flex-col items-center">
                <div className={`h-32 w-32 rounded-full flex items-center justify-center shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] transition-colors duration-500 ${undertone === "warm" ? "bg-[#3a2a1f]" : undertone === "cool" ? "bg-[#1f2a3a]" : undertone === "neutral" ? "bg-[#2a2a2a]" : "bg-[#151518]"}`}>
                  <span className={`text-5xl font-light ${undertone === "warm" ? "text-[#e3a76b]" : undertone === "cool" ? "text-[#6bb3e3]" : undertone === "neutral" ? "text-[#c9c7c4]" : "text-[#55555A]"}`}>
                    {undertone ? undertoneLabel.slice(0, 1) : "—"}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-[#8B8B90] mb-2">Your Undertone</p>
                <h2 className="text-3xl font-medium mb-4">{undertoneLabel}</h2>
                <p className="text-[13px] text-[#8B8B90] leading-relaxed max-w-xs mx-auto">
                  {undertone ? "A first read on the colors naturally reflected in your skin." : "We'll share your color read once your face is in frame."}
                </p>
              </div>

              <div className="mt-10 pt-6 border-t border-[#151518] text-center">
                <p className="text-[11px] text-[#55555A] flex items-center justify-center gap-2">
                  <span className="text-[#B99A6B]">✓</span> Your image is processed on your device and never saved.
                </p>
              </div>
            </div>
          </div>
          
          <p className="mt-12 text-center text-[11px] text-[#55555A]">
            Natural light gives the most true-to-you result. No photo is captured or uploaded.
          </p>
        </div>
      </main>
    </>
  );
}
