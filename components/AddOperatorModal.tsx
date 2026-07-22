"use client";

import React, { useState } from "react";
import { Operator } from "@/lib/types";

interface AddOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (operator: Omit<Operator, "id">) => void;
}

const PRESET_AVATARS = [
  { id: "p1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", label: "Driver 1" },
  { id: "p2", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", label: "Driver 2" },
  { id: "p3", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", label: "Operator Female" },
  { id: "p4", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80", label: "Manager Female" },
];

export default function AddOperatorModal({ isOpen, onClose, onSave }: AddOperatorModalProps) {
  const [fullName, setFullName] = useState("");
  const [userNumber, setUserNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"driver" | "site_manager" | "mechanic">("driver");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !userNumber.trim()) return;

    const avatar_url = useCustomAvatar ? customAvatarUrl.trim() : selectedAvatar;

    onSave({
      full_name: fullName.trim(),
      user_number: userNumber.trim(),
      phone: phone.trim() || null,
      role,
      avatar_url: avatar_url || null,
    });

    // Reset fields
    setFullName("");
    setUserNumber("");
    setPhone("");
    setRole("driver");
    setSelectedAvatar(PRESET_AVATARS[0].url);
    setCustomAvatarUrl("");
    setUseCustomAvatar(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-fogDark rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fogDark flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-display font-bold text-lg text-ink">Register Operator / Driver</h3>
            <p className="text-[11px] text-steelLight">Add a new site team member profile</p>
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
            <label className="block text-xs font-semibold text-steel">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Lucas Mokoena"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-steel">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +27 82 123 4567"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">User Number / ID</label>
              <input
                type="text"
                required
                value={userNumber}
                onChange={(e) => setUserNumber(e.target.value)}
                placeholder="e.g. 04"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-steel">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow"
              >
                <option value="driver">Driver</option>
                <option value="site_manager">Site Manager</option>
                <option value="mechanic">Mechanic</option>
              </select>
            </div>
          </div>

          {/* Avatar Presets */}
          <div className="space-y-2 border-t border-fogDark pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-steel">Driver Profile Photo</span>
              <button
                type="button"
                onClick={() => setUseCustomAvatar(!useCustomAvatar)}
                className="text-[10px] text-amber hover:underline font-mono"
              >
                {useCustomAvatar ? "Select From Presets" : "Provide Custom URL"}
              </button>
            </div>

            {useCustomAvatar ? (
              <input
                type="url"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                placeholder="https://example.com/driver-photo.jpg"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-fogDark bg-white text-ink focus:outline-none focus:ring-2 focus:ring-amber/40 transition-shadow font-mono"
              />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AVATARS.map((avatar) => {
                  const isSelected = selectedAvatar === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-105 shrink-0 ${
                        isSelected ? "border-amber shadow" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
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
              Register Operator
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
