import { useState } from "react";
import { Sparkles, Activity, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AIToolsPageProps {
  aiSettings: {
    enabled: boolean;
    provider: string;
    api_key: string;
    model_url: string;
    upscale_factor: number;
    face_restore_strength: number;
  };
  onUpdateSettings: (settings: any) => void;
  onTestConnection: () => Promise<{ success: boolean; message: string }>;
}

export const AIToolsPage: React.FC<AIToolsPageProps> = ({
  aiSettings,
  onUpdateSettings,
  onTestConnection
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTestConnection();
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || "Failed to query server." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", height: "100%", overflowY: "auto" }}>
      {/* AI Controls Card */}
      <div className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
          <Sparkles size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Advanced AI Integrations</h2>
        </div>

        {/* Enable AI Mode */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>Online AI Processing Mode</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Use cloud APIs or local server GPU processing</div>
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

        {/* AI Parameters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", opacity: aiSettings.enabled ? 1 : 0.5, pointerEvents: aiSettings.enabled ? "auto" : "none" }}>
          
          {/* Upscale Factor */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Real-ESRGAN Upscale Multiplier</label>
            <select
              value={aiSettings.upscale_factor}
              onChange={(e) => onUpdateSettings({ upscale_factor: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
            >
              <option value={2}>2x Super-Resolution</option>
              <option value={4}>4x High-Fidelity Print (Standard)</option>
              <option value={8}>8x Ultra-High Resolution (Needs powerful GPU)</option>
            </select>
          </div>

          {/* GFPGAN blend strength */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>GFPGAN Face Detail Blend Strength</label>
              <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{(aiSettings.face_restore_strength * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={aiSettings.face_restore_strength}
              onChange={(e) => onUpdateSettings({ face_restore_strength: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "var(--color-primary)" }}
            />
            <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>Recommended: 35%. Keeps original features and skin textures unchanged.</span>
          </div>

          {/* Connection Settings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>ComfyUI API Server URL</label>
            <input 
              type="text" 
              value={aiSettings.model_url}
              onChange={(e) => onUpdateSettings({ model_url: e.target.value })}
              style={{ width: "100%", padding: "8px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "6px", color: "#fff", fontSize: "0.8rem", outline: "none" }}
            />
          </div>

          <button 
            className="btn-primary" 
            onClick={handleTest} 
            disabled={testing}
            style={{ width: "100%", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {testing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Activity size={14} />
                Test API Server Connection
              </>
            )}
          </button>

          {/* Test results indicator */}
          {testResult && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "10px", 
              borderRadius: "6px", 
              border: testResult.success ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)",
              background: testResult.success ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
              fontSize: "0.75rem"
            }}>
              {testResult.success ? (
                <CheckCircle size={14} color="#10b981" />
              ) : (
                <XCircle size={14} color="#ef4444" />
              )}
              <span style={{ color: testResult.success ? "#10b981" : "#ef4444" }}>{testResult.message}</span>
            </div>
          )}

        </div>
      </div>

      {/* AI Capabilities list card */}
      <div className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
          <Sparkles size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Modular Pipeline Tasks</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Upscale */}
          <div style={{ padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", background: "rgba(255,255,255,0.01)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "4px" }}>AI 4x Upscaling</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Uses Real-ESRGAN to multiply resolution for crisp print details, with Lanczos interpolation fallback.</div>
          </div>

          {/* Outpaint */}
          <div style={{ padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", background: "rgba(255,255,255,0.01)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "4px" }}>AI Background Extension</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Feeds mask coordinates to local ComfyUI WebSocket prompts. Falls back to a local blurred padding background if offline.</div>
          </div>

          {/* Face restore */}
          <div style={{ padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", background: "rgba(255,255,255,0.01)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "4px" }}>Identity Preservation</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Applies GFPGAN to blurry faces in historical or low-res images, blending details back at 35% opacity to avoid artificial modifications.</div>
          </div>

          {/* Smart Crop */}
          <div style={{ padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", background: "rgba(255,255,255,0.01)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "4px" }}>Aspect-Ratio Smart Fit</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Checks aspect-ratio variance. If deviation is under 15%, center-crops. If larger, performs background outpainting.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
