"use client";

import React, { useState, useRef, useEffect } from "react";
import { ComplianceItem, OcrData } from "@/lib/types";
import { processDocumentOcr } from "@/lib/ocr";

interface DocumentUploadModalProps {
  item: ComplianceItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, documentName: string, documentUrl: string, ocrData: OcrData) => void;
}

export default function DocumentUploadModal({
  item,
  isOpen,
  onClose,
  onSave,
}: DocumentUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "camera">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ percent: number; label: string }>({
    percent: 0,
    label: "",
  });
  const [ocrResult, setOcrResult] = useState<OcrData | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedFile(null);
      setPreviewUrl(null);
      setOcrResult(null);
      setIsScanning(false);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(err.message || "Unable to access device camera. Please use file attachment.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${item.item_type}_captured_photo.jpg`, { type: "image/jpeg" });
      setSelectedFile(file);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      stopCamera();
      runOcr(file, url);
    }, "image/jpeg");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    runOcr(file, url);
  };

  const runOcr = async (file: File, url: string) => {
    setIsScanning(true);
    setScanProgress({ percent: 10, label: "Reading image data..." });

    try {
      const data = await processDocumentOcr(file, (percent, label) => {
        setScanProgress({ percent, label });
      });

      // Default fallback values if fields missing
      if (!data.reference_number && item.reference_number) {
        data.reference_number = item.reference_number;
      }
      if (!data.expiry_date && item.expiry_date) {
        data.expiry_date = item.expiry_date;
      }
      data.holder_name = data.holder_name || item.operator_name || item.asset_name || "Document Holder";
      data.document_type = data.document_type || item.item_type.replace(/_/g, " ").toUpperCase();

      setOcrResult(data);
    } catch (err) {
      console.error("OCR execution error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) return;

    const docName = selectedFile ? selectedFile.name : `${item.item_type}_scanned_document.jpg`;
    const docUrl = previewUrl || "";
    const finalOcr: OcrData = ocrResult || {
      reference_number: item.reference_number || "REF-PENDING",
      expiry_date: item.expiry_date,
      document_type: item.item_type.replace(/_/g, " "),
      confidence: 85,
    };

    onSave(item.id, docName, docUrl, finalOcr);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-fogDark rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fogDark flex items-center justify-between bg-steelDark/5">
          <div>
            <h2 className="text-lg font-bold font-display text-ink">
              Upload Certificate & Scan OCR
            </h2>
            <p className="text-xs text-steelLight">
              {item.operator_name ? `Operator: ${item.operator_name}` : `Asset: ${item.asset_name}`} ·{" "}
              <span className="font-mono text-ink font-semibold">{item.item_type.replace(/_/g, " ")}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-steelLight hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-fogDark/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-fogDark bg-slate-50 px-6">
          <button
            onClick={() => {
              setActiveTab("file");
              stopCamera();
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "file"
                ? "border-ember text-ember"
                : "border-transparent text-steelLight hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Attach Document File (PDF / Image)
          </button>
          <button
            onClick={() => {
              setActiveTab("camera");
              startCamera();
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "camera"
                ? "border-ember text-ember"
                : "border-transparent text-steelLight hover:text-ink"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" strokeWidth={2} />
            </svg>
            Take Live Camera Photo
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "file" && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-fogDark hover:border-ember/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-amber-500/5 group">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-ember/10 text-ember flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-ink">
                  Click to select file or drag & drop
                </p>
                <p className="text-xs text-steelLight mt-1">
                  Supports JPG, PNG, PDF scanned licences & certificates
                </p>
              </label>
            </div>
          )}

          {activeTab === "camera" && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <p className="font-semibold mb-1">Camera Access Notice</p>
                  <p>{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-3 px-3 py-1.5 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <div className="relative bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full max-h-[300px] object-contain rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {isCameraActive && (
                    <div className="absolute bottom-4 inset-x-0 flex justify-center">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2.5 bg-ember hover:bg-emberDark text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                      >
                        <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                        Capture Document Photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Document Preview & OCR Results */}
          {previewUrl && (
            <div className="border border-fogDark rounded-xl p-4 bg-white space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg border border-fogDark overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">
                    {selectedFile?.name || "Captured Document Photo"}
                  </p>
                  <p className="text-[11px] text-steelLight mt-0.5 font-mono">
                    Ready for OCR processing & manager review
                  </p>

                  {/* Scanning indicator */}
                  {isScanning && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] text-steelLight font-mono">
                        <span>{scanProgress.label}</span>
                        <span>{scanProgress.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ember transition-all duration-300"
                          style={{ width: `${scanProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OCR Extracted Data Panel */}
              {ocrResult && !isScanning && (
                <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      OCR Extractions ({ocrResult.confidence}% confidence)
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Auto-detected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/80 p-2 rounded border border-emerald-200">
                      <p className="text-[10px] text-steelLight uppercase font-mono">Ref / License No.</p>
                      <p className="font-mono font-bold text-ink truncate">
                        {ocrResult.reference_number || "Not detected"}
                      </p>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-200">
                      <p className="text-[10px] text-steelLight uppercase font-mono">Expiry Date</p>
                      <p className="font-mono font-bold text-ink truncate">
                        {ocrResult.expiry_date || "Not detected"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-fogDark bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-steelLight hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl || isScanning}
            onClick={handleFormSubmit}
            className="px-5 py-2 bg-ember hover:bg-emberDark disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-2"
          >
            Submit for Manager Verification
          </button>
        </div>
      </div>
    </div>
  );
}
