"use client";

import React, { useState } from "react";
import { Asset, AssetType } from "@/lib/types";

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Omit<Asset, "id" | "status">) => void;
}

const STOCK_PHOTOS: Record<AssetType, string> = {
  truck: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=350&q=80",
  excavator: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=350&q=80",
  tlb: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=350&q=80",
  trailer: "https://images.unsplash.com/photo-1501535033-a59396af2302?auto=format&fit=crop&w=350&q=80",
  drill_rig: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=350&q=80",
  generator: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=350&q=80",
  other: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=350&q=80",
};

export default function AddAssetModal({ isOpen, onClose, onSave }: AddAssetModalProps) {
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("truck");
  const [odometer, setOdometer] = useState("");
  const [customPhotoUrl, setCustomPhotoUrl] = useState("");
  const [useCustomPhoto, setUseCustomPhoto] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const photo_url = useCustomPhoto ? customPhotoUrl.trim() : STOCK_PHOTOS[assetType];

    onSave({
      name: name.trim(),
      registration: registration.trim() || null,
      asset_type: assetType,
      odometer_or_hours: odometer ? Number(odometer) : 0,
      photo_url: photo_url || null,
    });

    // Reset fields
    setName("");
    setRegistration("");
    setAssetType("truck");
    setOdometer("");
    setCustomPhotoUrl("");
    setUseCustomPhoto(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-fogDark rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fogDark flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-display font-bold text-lg text-ink">Register Fleet Asset</h3>
            <p className="text-[11px] text-steelLight">Add a new machine or vehicle to tracking</p>
          </div>
          <button
            onClick={onClose}
            className="text-steelLight hover:text-ink hover:bg-slate-200/50 p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-steel">Asset Name / Label</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Scania R500 — Fleet 12"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">Registration / Tag</label>
              <input
                type="text"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="e.g. ND 88 ZN"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow"
              >
                <option value="truck">Truck</option>
                <option value="trailer">Trailer</option>
                <option value="excavator">Excavator</option>
                <option value="tlb">TLB Backhoe</option>
                <option value="drill_rig">Drill Rig</option>
                <option value="generator">Generator</option>
                <option value="other">Other Machine</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-steel">
              Current Odometer / Engine Hours
            </label>
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder={assetType === "truck" || assetType === "trailer" ? "Odometer (km)" : "Engine hours (hrs)"}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow font-mono"
            />
          </div>

          {/* Photo Selector */}
          <div className="space-y-2 border-t border-fogDark pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-steel">Asset Photograph</span>
              <button
                type="button"
                onClick={() => setUseCustomPhoto(!useCustomPhoto)}
                className="text-[10px] text-amber hover:underline font-mono"
              >
                {useCustomPhoto ? "Use Default Stock Preset" : "Provide Custom URL"}
              </button>
            </div>

            {useCustomPhoto ? (
              <input
                type="url"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="https://example.com/your-truck.jpg"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow font-mono"
              />
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 p-2 border border-fogDark rounded-lg">
                <img
                  src={STOCK_PHOTOS[assetType]}
                  alt="Stock Preset"
                  className="w-16 h-12 rounded object-cover border border-fogDark shrink-0 shadow-sm"
                />
                <div>
                  <p className="text-[10px] font-semibold text-ink uppercase tracking-wider">{assetType} Preset</p>
                  <p className="text-[9px] text-steelLight">High-resolution stock image will be assigned automatically</p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-fogDark text-xs font-bold rounded-xl text-steel hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-ink hover:bg-steelDark text-white text-xs font-bold rounded-xl transition-all active:scale-98"
            >
              Register Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
