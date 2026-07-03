import { Play, Loader2 } from "lucide-react";

interface BatchPageProps {
  files: Array<{ name: string; path: string; size: string; preview?: string }>;
  sizeKey: "A4" | "A5" | "A6" | "custom";
  orientation: "portrait" | "landscape" | "auto";
  scaleMode: "smart" | "crop" | "pad";
  enhance: boolean;
  upscale: boolean;
  faceRestore: boolean;
  zipOutput: boolean;
  isProcessing: boolean;
  progress: number;
  currentFile: string;
  onRunPipeline: () => void;
}

export const BatchPage: React.FC<BatchPageProps> = ({
  files,
  sizeKey,
  orientation,
  scaleMode,
  enhance,
  upscale,
  faceRestore,
  zipOutput,
  isProcessing,
  progress,
  currentFile,
  onRunPipeline
}) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", height: "100%", overflow: "hidden" }}>
      {/* Batch Staging Area */}
      <div className="card-glass" style={{ display: "flex", flexDirection: "column", padding: "20px", borderRadius: "12px", overflow: "hidden" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, borderBottom: "1px solid var(--color-border)", paddingBottom: "8px", marginBottom: "16px" }}>
          Batch Processing queue ({files.length} Posters staged)
        </h3>

        {files.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)", fontSize: "0.85rem" }}>
            No images staged. Go to the Home tab and upload posters first.
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", contentVisibility: "auto" }}>
            {files.map((file, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: "rgba(255,255,255,0.01)", 
                  border: "1px solid var(--color-border)", 
                  borderRadius: "8px", 
                  padding: "8px", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "6px",
                  alignItems: "center",
                  textAlign: "center"
                }}
              >
                {file.preview ? (
                  <img src={file.preview} alt={file.name} style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px" }} />
                ) : (
                  <div style={{ width: "100%", height: "100px", borderRadius: "6px", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }} />
                )}
                <div style={{ fontSize: "0.75rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {file.name}
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>
                  {file.size}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Summary Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Settings Replica card */}
        <div className="card-glass" style={{ padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>Pipeline Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-muted)" }}>Target Format:</span>
              <span style={{ fontWeight: 600 }}>{sizeKey.toUpperCase()} ({orientation})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-muted)" }}>Fitting Option:</span>
              <span style={{ fontWeight: 600 }}>{scaleMode.toUpperCase()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-muted)" }}>Enhance Steps:</span>
              <span style={{ fontWeight: 600 }}>{enhance ? "Active" : "Bypassed"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-muted)" }}>AI 4x Upscaling:</span>
              <span style={{ fontWeight: 600 }}>{upscale ? "Active" : "Bypassed"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-muted)" }}>Face restoration:</span>
              <span style={{ fontWeight: 600 }}>{faceRestore ? "Active" : "Bypassed"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-muted)" }}>Output ZIP Bundle:</span>
              <span style={{ fontWeight: 600 }}>{zipOutput ? "Yes" : "No"}</span>
            </div>
          </div>

          <button 
            className="btn-primary" 
            disabled={files.length === 0 || isProcessing}
            onClick={onRunPipeline}
            style={{ width: "100%", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing Batch...
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                Run Batch Pipeline
              </>
            )}
          </button>
        </div>

        {/* Progress bar card */}
        {isProcessing && (
          <div className="card-glass" style={{ padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600 }}>Batch Processing Status</h3>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--color-primary)", transition: "width 0.3s ease" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-muted)" }}>
              <span>Progress: {progress}%</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>
                {currentFile || "Starting..."}
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
