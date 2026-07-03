import React, { useState } from "react";
import { Play, Settings, Image as ImageIcon, Loader2 } from "lucide-react";

interface EditorPageProps {
  files: Array<{ name: string; path: string; size: string; preview?: string }>;
  sizeKey: "A4" | "A5" | "A6" | "custom";
  setSizeKey: (key: "A4" | "A5" | "A6" | "custom") => void;
  orientation: "portrait" | "landscape" | "auto";
  setOrientation: (orientation: "portrait" | "landscape" | "auto") => void;
  customW: number;
  setCustomW: (w: number) => void;
  customH: number;
  setCustomH: (h: number) => void;
  scaleMode: "smart" | "crop" | "pad";
  setScaleMode: (mode: "smart" | "crop" | "pad") => void;
  enhance: boolean;
  setEnhance: (val: boolean) => void;
  upscale: boolean;
  setUpscale: (val: boolean) => void;
  faceRestore: boolean;
  setFaceRestore: (val: boolean) => void;
  zipOutput: boolean;
  setZipOutput: (val: boolean) => void;
  isProcessing: boolean;
  onRunPipeline: () => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({
  files,
  sizeKey,
  setSizeKey,
  orientation,
  setOrientation,
  customW,
  setCustomW,
  customH,
  setCustomH,
  scaleMode,
  setScaleMode,
  enhance,
  setEnhance,
  upscale,
  setUpscale,
  faceRestore,
  setFaceRestore,
  zipOutput,
  setZipOutput,
  isProcessing,
  onRunPipeline
}) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const selectedFile = files[selectedFileIdx] || null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", height: "100%", overflow: "hidden" }}>
      {/* Editor Side Controls */}
      <div className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
          <Settings size={16} color="var(--color-primary)" />
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Post-Processing Options</h3>
        </div>

        {/* Size Selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Target Print Size</label>
          <select 
            value={sizeKey} 
            onChange={(e) => setSizeKey(e.target.value as any)}
            style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
          >
            <option value="A4">A4 (2480 x 3508 px)</option>
            <option value="A5">A5 (1748 x 2480 px)</option>
            <option value="A6">A6 (1240 x 1748 px)</option>
            <option value="custom">Custom Dimensions...</option>
          </select>
        </div>

        {/* Custom dimensions fields if active */}
        {sizeKey === "custom" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Width (px)</label>
              <input 
                type="number" 
                value={customW} 
                onChange={(e) => setCustomW(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.8rem", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Height (px)</label>
              <input 
                type="number" 
                value={customH} 
                onChange={(e) => setCustomH(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.8rem", outline: "none" }}
              />
            </div>
          </div>
        )}

        {/* Orientation selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Orientation</label>
          <select 
            value={orientation} 
            onChange={(e) => setOrientation(e.target.value as any)}
            style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
            <option value="auto">Auto-Fit Aspect</option>
          </select>
        </div>

        {/* Fitting Mode dropdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Aspect-Ratio Fitting</label>
          <select 
            value={scaleMode} 
            onChange={(e) => setScaleMode(e.target.value as any)}
            style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
          >
            <option value="smart">Smart Crop / Pad</option>
            <option value="crop">Forced Center Crop</option>
            <option value="pad">Forced Blurred Padding</option>
          </select>
        </div>

        {/* Processing toggle checkboxes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "4px" }}>
          {/* Smart Quality */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>Quality Enhance</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          {/* AI 4x Upscale */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>AI 4x Upscale</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={upscale} onChange={(e) => setUpscale(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          {/* AI Face Restoration */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>Face Restoration</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={faceRestore} onChange={(e) => setFaceRestore(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          {/* Export ZIP */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>Create Output ZIP</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={zipOutput} onChange={(e) => setZipOutput(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Run action button */}
        <button 
          className="btn-primary" 
          disabled={files.length === 0 || isProcessing} 
          onClick={onRunPipeline}
          style={{ width: "100%", marginTop: "auto", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              Export Print Poster
            </>
          )}
        </button>
      </div>

      {/* Editor Main Viewer workspace */}
      <div className="card-glass" style={{ display: "flex", flexDirection: "column", padding: "20px", borderRadius: "12px", overflow: "hidden" }}>
        {files.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-muted)", gap: "10px" }}>
            <ImageIcon size={48} strokeWidth={1} />
            <span style={{ fontSize: "0.85rem" }}>Upload an image on the Home screen to view it here.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Top selectors/tabs of staged files */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)", marginBottom: "16px" }}>
              {files.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFileIdx(idx)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: selectedFileIdx === idx ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.02)",
                    border: selectedFileIdx === idx ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                    color: selectedFileIdx === idx ? "var(--color-primary)" : "#d1d5db",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {file.name}
                </button>
              ))}
            </div>

            {/* Main canvas area */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "16px", minHeight: 0 }}>
              {selectedFile && selectedFile.preview ? (
                <img 
                  src={selectedFile.preview} 
                  alt={selectedFile.name} 
                  style={{ 
                    maxHeight: "100%", 
                    maxWidth: "100%", 
                    objectFit: "contain",
                    borderRadius: "4px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                  }} 
                />
              ) : (
                <div style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>Preview Unavailable</div>
              )}
            </div>

            {/* Metadata info footer */}
            {selectedFile && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                <span>File Path: {selectedFile.path}</span>
                <span>Original Dimensions: {selectedFile.size}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
