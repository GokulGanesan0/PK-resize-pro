import { Settings, ShieldAlert } from "lucide-react";

interface SettingsPageProps {
  outputDir: string;
  setOutputDir: (dir: string) => void;
  sizeKey: "A4" | "A5" | "A6" | "custom";
  setSizeKey: (key: "A4" | "A5" | "A6" | "custom") => void;
  fileFormat: "PNG" | "JPG";
  setFileFormat: (fmt: "PNG" | "JPG") => void;
  aiSettings: {
    enabled: boolean;
    provider: string;
    api_key: string;
    model_url: string;
  };
  onUpdateSettings: (settings: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  outputDir,
  setOutputDir,
  sizeKey,
  setSizeKey,
  fileFormat,
  setFileFormat,
  aiSettings,
  onUpdateSettings
}) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", height: "100%", overflowY: "auto" }}>
      {/* Basic Settings Card */}
      <div className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
          <Settings size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Application Settings</h2>
        </div>

        {/* Output Directory Field */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Default Output Folder</label>
          <input 
            type="text" 
            value={outputDir} 
            onChange={(e) => setOutputDir(e.target.value)}
            style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.8rem", outline: "none" }}
          />
          <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>Target directory to write processed images and zip archives.</span>
        </div>

        {/* Default size presets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Default Paper Preset</label>
          <select
            value={sizeKey}
            onChange={(e) => setSizeKey(e.target.value as any)}
            style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
          >
            <option value="A4">A4 Preset (Portrait)</option>
            <option value="A5">A5 Preset (Portrait)</option>
            <option value="A6">A6 Preset (Portrait)</option>
            <option value="custom">Custom Canvas Dimensions</option>
          </select>
        </div>

        {/* Default output format */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Default Output Format</label>
          <select
            value={fileFormat}
            onChange={(e) => setFileFormat(e.target.value as any)}
            style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
          >
            <option value="PNG">PNG (High-resolution lossless metadata)</option>
            <option value="JPG">JPG (Standard web compression)</option>
          </select>
        </div>
      </div>

      {/* Online/Offline Mode Configurations Card */}
      <div className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
          <Settings size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>AI Process Mode Switch</h2>
        </div>

        {/* Toggle between Online AI Mode & Offline Mode */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Online Process Mode</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Integrate ComfyUI / SDXL Cloud processing</div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={aiSettings.enabled} 
              onChange={(e) => onUpdateSettings({ enabled: e.target.checked })} 
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* AI Provider configuration parameters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", opacity: aiSettings.enabled ? 1 : 0.5, pointerEvents: aiSettings.enabled ? "auto" : "none" }}>
          {/* Provider Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>AI Provider</label>
            <select
              value={aiSettings.provider}
              onChange={(e) => onUpdateSettings({ provider: e.target.value })}
              style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
            >
              <option value="comfyui">Local / LAN ComfyUI WebSocket API</option>
              <option value="replicate">Replicate Serverless Inference API</option>
              <option value="huggingface">Hugging Face Serverless Inference API</option>
            </select>
          </div>

          {/* API Key credential */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>API Token / Credentials</label>
            <input 
              type="password" 
              placeholder={aiSettings.provider === "comfyui" ? "Not required for local ComfyUI instance" : "Paste API Token..."}
              value={aiSettings.api_key}
              onChange={(e) => onUpdateSettings({ api_key: e.target.value })}
              style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.8rem", outline: "none" }}
            />
          </div>
        </div>

        {/* Offline fallback warning banner */}
        {!aiSettings.enabled && (
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            padding: "12px", 
            borderRadius: "8px", 
            background: "rgba(245,158,11,0.05)", 
            border: "1px solid rgba(245,158,11,0.2)",
            marginTop: "auto"
          }}>
            <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "0.75rem", color: "#f59e0b", lineHeight: "1.4" }}>
              <strong>Offline Mode Activated</strong><br />
              Online AI is unavailable. Basic offline tools (Trimming, CLAHE, resizing, noise reduction, and Lanczos interpolation) are still ready.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
