import React, { useRef } from "react";
import { Upload, FolderOpen, Image as ImageIcon, Trash2 } from "lucide-react";

interface UploadPageProps {
  files: Array<{ name: string; path: string; size: string; preview?: string }>;
  onAddFiles: (newFiles: FileList) => void;
  onClearFiles: () => void;
  recentOutputs: string[];
  onOpenOutputs: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  files,
  onAddFiles,
  onClearFiles,
  recentOutputs,
  onOpenOutputs
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", overflowY: "auto" }}>
      {/* Drag & Drop zone */}
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "2px dashed var(--color-border)",
          borderRadius: "12px",
          height: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          cursor: "pointer",
          background: "rgba(255, 255, 255, 0.01)",
          transition: "var(--transition-fast)"
        }}
        className="upload-dropzone"
      >
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(239, 68, 68, 0.1)"
        }}>
          <Upload size={24} color="var(--color-primary)" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "4px" }}>Drag & Drop posters here, or click to upload</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Supports PNG, JPG, JPEG, WEBP formats</p>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/*" 
          style={{ display: "none" }} 
          onChange={(e) => e.target.files && onAddFiles(e.target.files)} 
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", flex: 1, minHeight: 0 }}>
        {/* Files list */}
        <div className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", borderRadius: "12px", minHeight: "200px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>Staged Source Posters ({files.length})</h3>
            {files.length > 0 && (
              <button 
                onClick={onClearFiles}
                style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}
              >
                <Trash2 size={12} /> Clear Staging
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {files.length === 0 ? (
              <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--color-muted)", fontSize: "0.85rem" }}>
                No images staged yet. Drag posters above to begin processing.
              </div>
            ) : (
              files.map((file, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                  {file.preview ? (
                    <img src={file.preview} alt={file.name} style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon size={18} color="var(--color-muted)" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>{file.size} • Staged</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Outputs & Action Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Action button */}
          <button 
            className="btn-primary" 
            onClick={onOpenOutputs}
            style={{ width: "100%", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <FolderOpen size={18} />
            Open Output Folder
          </button>

          {/* Recent outputs */}
          <div className="card-glass" style={{ padding: "20px", flex: 1, borderRadius: "12px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, borderBottom: "1px solid var(--color-border)", paddingBottom: "8px", marginBottom: "12px" }}>Recent Outputs</h3>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {recentOutputs.length === 0 ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--color-muted)", fontSize: "0.75rem", textAlign: "center" }}>
                  Exported print posters will be displayed here.
                </div>
              ) : (
                recentOutputs.map((file, idx) => (
                  <div key={idx} style={{ padding: "6px 10px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-success)" }}></span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{file}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
