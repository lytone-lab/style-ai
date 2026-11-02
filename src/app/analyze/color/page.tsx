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
    FACE_LANDMARKS_TESSELATION?: number[] | Uint32Array;
  };
  FilesetResolver: { forVisionTasks(wasmPath: string): Promise<unknown>; };
};

declare global { interface Window { tasksVision?: MediaPipeVision; Vision?: MediaPipeVision; } }

const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL = "/face_landmarker.task";
const LIGHTING_WARNING = "Please stand in front of a window or bright, natural light.";
const SAMPLE_CHEEK_LEFT = 117; const SAMPLE_CHEEK_RIGHT = 346; const SAMPLE_FOREHEAD = 10;

function samplePatch(context: CanvasRenderingContext2D, width: number, height: number, landmark: FaceLandmark, offsetY = 0): RGB[] {
  const centerX = Math.round(landmark.x * width); const centerY = Math.round((landmark.y + offsetY) * height);
  const radius = 4; const left = Math.max(0, Math.min(width - 1, centerX - radius)); const top = Math.max(0, Math.min(height - 1, centerY - radius));
  const patchWidth = Math.min(radius * 2 + 1, width - left); const patchHeight = Math.min(radius * 2 + 1, height - top);
  const pixels = context.getImageData(left, top, patchWidth, patchHeight).data; const samples: RGB[] = [];
  for (let index = 0; index < pixels.length; index += 4) { samples.push([pixels[index], pixels[index + 1], pixels[index + 2]]); }
  return samples;
}

function getLightingWarning(context: CanvasRenderingContext2D, width: number, height: number): string | null {
  const pixels = context.getImageData(0, 0, width, height).data; let luminanceTotal = 0; let clippedPixels = 0; const pixelCount = pixels.length / 4;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index]; const green = pixels[index + 1]; const blue = pixels[index + 2];
    luminanceTotal += 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    if (red > 248 && green > 248 && blue > 248) clippedPixels += 1;
  }
  const averageLuminance = luminanceTotal / pixelCount;
  return averageLuminance < 70 || averageLuminance > 225 || clippedPixels / pixelCount > 0.35 ? LIGHTING_WARNING : null;
}

// ===== THE CORRECT CINEMATIC FULL FACE DENSE MESH =====
function drawMesh(context: CanvasRenderingContext2D, landmarks: FaceLandmark[], width: number, height: number) {
  context.clearRect(0, 0, width, height);

  const visionLib = window.tasksVision ?? window.Vision;
  // Retrieve the official tesselation array from the loaded MediaPipe bundle
  const tesselationPairs = visionLib?.FaceLandmarker?.FACE_LANDMARKS_TESSELATION;

  context.strokeStyle = "rgba(255, 255, 255, 0.15)"; // Thin, futuristic wireframe lines
  context.lineWidth = 0.5;
  context.beginPath();

  if (tesselationPairs && tesselationPairs.length > 0) {
    // The tesselation array is a flat list of index pairs: [start1, end1, start2, end2...]
    for (let i = 0; i < tesselationPairs.length; i += 2) {
      const startIdx = tesselationPairs[i];
      const endIdx = tesselationPairs[i + 1];
      
      const startPt = landmarks[startIdx];
      const endPt = landmarks[endIdx];

      if (startPt && endPt) {
        context.moveTo(startPt.x * width, startPt.y * height);
        context.lineTo(endPt.x * width, endPt.y * height);
      }
    }
  } else {
    // Fallback mapping that forces lateral connections across the face (preventing the nose cluster)
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const offsets = [15, 30, 45]; // Skip across index space to connect wider facial regions
      for (const offset of offsets) {
        const nextIdx = (i + offset) % landmarks.length;
        const nextPt = landmarks[nextIdx];
        if (pt && nextPt) {
          context.moveTo(pt.x * width, pt.y * height);
          context.lineTo(nextPt.x * width, nextPt.y * height);
        }
      }
    }
  }
  context.stroke();

  // Draw the bright micro tracking nodes
  context.fillStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < landmarks.length; i += 2) { // Step by 2 to save performance
    const pt = landmarks[i];
    if (pt) {
      context.beginPath();
      context.arc(pt.x * width, pt.y * height, 0.8, 0, Math.PI * 2);
      context.fill();
    }
  }
}

export default function ColorAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null); const overlayRef = useRef<HTMLCanvasElement>(null); const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null); const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null); const landmarkerInitializationRef = useRef<Promise<FaceLandmarkerInstance> | null>(null);
  const animationFrameRef = useRef<number | null>(null); const qualityOkayRef = useRef(false); const lastDetectionRef = useRef(0); const lastLightingCheckRef = useRef(0); const lastAnalysisRef = useRef(0);
  
  const [cameraActive, setCameraActive] = useState(false); const [isStarting, setIsStarting] = useState(false); const [isLibraryReady, setIsLibraryReady] = useState(false);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarkerInstance | null>(null); const [statusMessage, setStatusMessage] = useState("Your camera stays on this device.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null); const [lightingWarning, setLightingWarning] = useState<string | null>(null);
  const [undertone, setUndertone] = useState<Undertone | null>(null); const [faceDetected, setFaceDetected] = useState(false);

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
        if (cancelled) return; landmarkerRef.current = landmarker; setFaceLandmarker(landmarker);
      } catch (error) {
        landmarkerInitializationRef.current = null;
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? `Face analysis could not initialize: ${error.message}` : "Face analysis could not initialize. Please refresh and try again.");
      }
    };
    void initializeLandmarker(); return () => { cancelled = true; };
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
          
          // Suppress TensorFlow log inside detectForVideo
          const origLog = console.log;
          console.log = (...args) => { if (typeof args[0] === 'string' && args[0].includes('TensorFlow')) return; origLog(...args); };
          
          const result = faceLandmarker.detectForVideo(video, now); 
          
          console.log = origLog; // restore
          
          const landmarks = result.faceLandmarks[0];
          setFaceDetected(Boolean(landmarks));
          
          if (landmarks) {
            drawMesh(overlayContext, landmarks, overlay.width, overlay.height);
            
            if (qualityOkayRef.current && now - lastAnalysisRef.current > 2500) {
              const leftCheek = landmarks[SAMPLE_CHEEK_LEFT]; const rightCheek = landmarks[SAMPLE_CHEEK_RIGHT]; const forehead = landmarks[SAMPLE_FOREHEAD];
              const analysis = analyzeUndertone({
                cheeks: [...samplePatch(processingContext, processingCanvas.width, processingCanvas.height, leftCheek), ...samplePatch(processingContext, processingCanvas.width, processingCanvas.height, rightCheek)],
                forehead: samplePatch(processingContext, processingCanvas.width, processingCanvas.height, forehead, 0.035),
              });
              setUndertone(analysis.undertone); lastAnalysisRef.current = now;
            }
          } else {
             overlayContext.clearRect(0, 0, overlay.width, overlay.height);
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
      
      <main className="flex flex-col h-screen bg-[#000000] text-[#FFFFFF] overflow-hidden">
        <header className="flex items-center justify-between px-6 py-6 shrink-0 border-b border-[#222222] z-10 bg-[#000000]">
          <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">
            ← Back
          </Link>
          <span className="text-[14px] font-black uppercase tracking-tighter">Color Profile</span>
          <div className="w-10"></div>
        </header>

        <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
          <h1 className="text-[36px] font-black leading-[1.05] tracking-tighter mb-3">
            Meet your <br />undertone.
          </h1>
          <p className="text-[14px] text-[#888888] mb-8 leading-relaxed">
            Find the colors that feel like you. Face analysis happens right here in your browser.
          </p>

          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border-2 border-[#222222] bg-[#111111] flex items-center justify-center mb-6 shrink-0">
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay muted playsInline aria-label="Live camera preview" />
            <canvas ref={overlayRef} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true" />
            <canvas ref={processingCanvasRef} className="hidden" aria-hidden="true" />

            {!cameraActive && (
              <div className="relative z-10 flex flex-col items-center gap-3 text-[#555555]">
                <span className="text-[14px] font-bold uppercase tracking-widest">Camera Offline</span>
              </div>
            )}
            
            {lightingWarning && cameraActive && <p className="absolute top-4 left-4 right-4 bg-[#111111] border border-[#333333] px-4 py-3 rounded-xl text-[12px] font-bold text-[#FFFFFF] text-center shadow-lg z-20" role="status">{lightingWarning}</p>}
            
            {cameraActive && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-[#111111] border border-[#333333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#FFFFFF]">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Live
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <p className="text-[13px] font-medium text-[#888888] flex items-center gap-2" role="status">
              <span className={`h-2 w-2 rounded-full ${cameraActive ? "bg-[#FFFFFF]" : "bg-[#333333]"}`} />
              {cameraActive ? (faceDetected ? "Biometric mesh locked" : statusMessage) : statusMessage}
            </p>
            {errorMessage && <p className="text-[13px] font-medium text-red-500" role="alert">{errorMessage}</p>}
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-[2rem] p-8 flex flex-col items-center justify-center mb-4" aria-live="polite">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#888888] mb-6">Your Result</p>
            <div className={`h-32 w-32 rounded-full flex items-center justify-center border-4 mb-6 transition-colors duration-500 ${undertone === "warm" ? "border-[#FF8C00]" : undertone === "cool" ? "border-[#00BFFF]" : undertone === "neutral" ? "border-[#FFFFFF]" : "border-[#333333]"}`}>
              <span className="text-5xl font-black tracking-tighter">{undertone ? undertoneLabel.slice(0, 1) : "—"}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">{undertoneLabel}</h2>
            <p className="text-[13px] text-[#888888] text-center max-w-[250px]">
              {undertone ? "A first read on the colors naturally reflected in your skin." : "We'll share your color read once your face is in frame."}
            </p>
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 shrink-0 bg-gradient-to-t from-black via-black to-transparent z-10 relative">
          {cameraActive ? (
            <button className="w-full flex items-center justify-center bg-[#111111] border border-[#222222] text-[#FFFFFF] h-[72px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[16px]" onClick={stopCamera} type="button">
              Stop Camera
            </button>
          ) : (
            <button className="w-full flex items-center justify-center bg-[#FFFFFF] text-[#000000] h-[72px] rounded-full active:scale-[0.96] transition-transform font-black uppercase tracking-widest text-[16px] disabled:opacity-50" disabled={isStarting || !faceLandmarker} onClick={startCamera} type="button">
              {isStarting ? "Starting..." : faceLandmarker ? "Initialize Scan" : "Loading..."}
            </button>
          )}
        </div>
      </main>
    </>
  );
}
