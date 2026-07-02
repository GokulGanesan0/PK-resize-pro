import React, { useState, useEffect, useRef } from "react";
import logo from "./assets/logo.png";
import { 
  Upload, 
  Image as ImageIcon, 
  Settings, 
  Play, 
  FolderOpen, 
  FileArchive, 
  Trash2, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Loader2 
} from "lucide-react";

// Check if running inside Tauri
const isTauriAvailable = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;

// Dynamic imports for Tauri APIs
let TauriCore: any = null;
let TauriShell: any = null;

if (isTauriAvailable) {
  // Synchronously bind references if possible, or load on mount
  import("@tauri-apps/api/core").then(m => { TauriCore = m; });
  import("@tauri-apps/plugin-shell").then(m => { TauriShell = m; });
}

interface ImageFile {
  id: string;
  name: string;
  size: number;
  path: string;
  previewUrl: string;
  status: "pending" | "processing" | "done" | "failed";
  error?: string;
}

export default function App() {
  // App states
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [sizeKey, setSizeKey] = useState<"A4" | "A5" | "A6">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("portrait");
  const [upscale, setUpscale] = useState(true);
  const [enhance, setEnhance] = useState(true);
  const [faceRestore, setFaceRestore] = useState(false);
  const [scaleMode, setScaleMode] = useState<"smart" | "crop" | "pad">("smart");
  const [zipOutput, setZipOutput] = useState(true);
  
  // Custom directory configurations
  const [outputDir, setOutputDir] = useState("");
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize directory paths on mount
  useEffect(() => {
    // Default directories based on current folder
    setOutputDir("./output");
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${message}`]);
  };

  // Convert File object to local path and preview url
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processHtmlFileList(e.target.files);
  };

  const processHtmlFileList = (fileList: FileList) => {
    const newFiles: ImageFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Skip duplicate names
      if (files.some(f => f.name === file.name)) continue;

      // Extract absolute path if running in Tauri, otherwise use a placeholder
      // WebkitRelativePath is empty for normal inputs, but we can access path property in Tauri
      const rawPath = (file as any).path || `./input/${file.name}`;
      
      // Local preview URL
      let previewUrl = "";
      if (isTauriAvailable && (file as any).path) {
        // Use Tauri convertFileSrc to render local file safely
        try {
          previewUrl = TauriCore.convertFileSrc((file as any).path);
        } catch (e) {
          previewUrl = URL.createObjectURL(file);
        }
      } else {
        previewUrl = URL.createObjectURL(file);
      }

      newFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        path: rawPath,
        previewUrl: previewUrl,
        status: "pending"
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    addLog(`Added ${newFiles.length} file(s).`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processHtmlFileList(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setProgress(0);
    setLogs([]);
    addLog("Cleared all files from workspace.");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Launch Python backend sidecar or fallback to CLI python process
  const startProcessing = async () => {
    if (files.length === 0) {
      addLog("Error: No files selected to process.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    addLog("Starting image processing pipeline...");
    
    // Set all file statuses to pending first
    setFiles(prev => prev.map(f => ({ ...f, status: "pending" })));

    // Prepare arguments
    const filePaths = files.map(f => f.path).join(",");
    const args = [
      "--input", filePaths,
      "--output", outputDir,
      "--size", sizeKey,
      "--orientation", orientation,
      "--upscale", upscale ? "true" : "false",
      "--enhance", enhance ? "true" : "false",
      "--face-restore", faceRestore ? "true" : "false",
      "--scale-mode", scaleMode,
      "--zip", zipOutput ? "true" : "false"
    ];

    addLog(`Command arguments: ${args.join(" ")}`);

    if (!isTauriAvailable) {
      // Browser Mock Simulation
      addLog("Tauri API not detected. Simulating processing pipeline...");
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIdx(i);
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "processing" } : f));
        addLog(`[AI] Processing border removal for ${file.name}...`);
        await new Promise(r => setTimeout(r, 1000));
        
        if (upscale) {
          addLog(`[AI] Running 4x Real-ESRGAN super-resolution for ${file.name}...`);
          await new Promise(r => setTimeout(r, 1500));
        }
        
        if (faceRestore) {
          addLog(`[AI] Rebuilding facial vectors with GFPGAN for ${file.name}...`);
          await new Promise(r => setTimeout(r, 1000));
        }
        
        addLog(`[AI] Resizing and exporting print-ready PNG with 300 DPI...`);
        await new Promise(r => setTimeout(r, 800));

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
        setProgress(Math.round(((i + 1) / files.length) * 100));
        addLog(`Finished processing ${file.name}.`);
      }
      
      if (zipOutput) {
        addLog("Compiling files into zip archive: PosterResizePro_Output.zip...");
        await new Promise(r => setTimeout(r, 1000));
      }
      addLog("Pipeline completed successfully! (Simulation)");
      setIsProcessing(false);
      return;
    }

    // Tauri Real Execution
    try {
      let command: any = null;
      
      try {
        // Try executing PyInstaller sidecar binary
        addLog("Initializing PyInstaller sidecar binary...");
        command = TauriShell.Command.sidecar("binaries/poster-resize-backend", args);
      } catch (sidecarErr) {
        // Fall back to executing local python code (extremely useful in development mode)
        addLog("Sidecar failed or in development. Falling back to local python process...");
        command = new TauriShell.Command("python", ["backend/main.py", ...args]);
      }

      let jsonResponse = "";

      // Setup standard output listener
      command.stdout.on("data", (line: string) => {
        // Clean line endlines
        const cleanLine = line.trim();
        if (cleanLine.startsWith("{") && cleanLine.endsWith("}")) {
          // Final JSON result
          jsonResponse = cleanLine;
        } else {
          addLog(cleanLine);
          // Simple parsing of file indexes to update statuses
          if (cleanLine.includes("Processing [")) {
            // Format: "Processing [1/3]: filename.jpg"
            const match = cleanLine.match(/Processing \[(\d+)\/(\d+)\]:\s*(.*)/);
            if (match) {
              const currentIdx = parseInt(match[1]) - 1;
              setCurrentFileIdx(currentIdx);
              setFiles(prev => prev.map((f, i) => {
                if (i === currentIdx) return { ...f, status: "processing" };
                if (i < currentIdx && f.status === "processing") return { ...f, status: "done" };
                return f;
              }));
              setProgress(Math.round((currentIdx / files.length) * 100));
            }
          }
        }
      });

      // Setup standard error listener
      command.stderr.on("data", (line: string) => {
        addLog(`[Error] ${line.trim()}`);
      });

      // Handle close event
      command.on("close", (data: any) => {
        addLog(`Backend process exited with code ${data.code}.`);
        setIsProcessing(false);
        setProgress(100);

        if (data.code === 0) {
          // Parse JSON response
          try {
            if (jsonResponse) {
              const res = JSON.parse(jsonResponse);
              addLog(`Pipeline result: Processed=${res.processed}, Failed=${res.failed}`);
              
              // Set all files to done or failed
              setFiles(prev => prev.map((f, idx) => {
                if (idx < res.processed) return { ...f, status: "done" };
                return { ...f, status: "failed", error: "Failed to process" };
              }));
            } else {
              setFiles(prev => prev.map(f => f.status === "processing" ? { ...f, status: "done" } : f));
            }
          } catch (e) {
            addLog("Failed to parse backend results summary.");
          }
          addLog("Processing pipeline complete!");
        } else {
          addLog("Pipeline terminated with errors.");
          setFiles(prev => prev.map(f => f.status === "processing" ? { ...f, status: "failed", error: "Crash" } : f));
        }
      });

      // Spawn process asynchronously
      addLog("Spawning image pipeline child process...");
      await command.spawn();

    } catch (err: any) {
      addLog(`Failed to run pipeline command: ${err.message || err}`);
      setIsProcessing(false);
    }
  };

  const openOutputFolder = async () => {
    if (!isTauriAvailable) {
      alert(`Simulation: Output directory would open: ${outputDir}`);
      return;
    }
    
    try {
      addLog(`Opening output folder: ${outputDir}`);
      // Tauri Shell plugin open opens folders/urls in default system handler
      await TauriShell.open(outputDir);
    } catch (err: any) {
      addLog(`Failed to open output directory: ${err.message || err}`);
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="card-glass" style={{ margin: "12px", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gridRow: "1", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logo} alt="Logo" style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover", boxShadow: "0 0 10px rgba(239,68,68,0.4)" }} />
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.5px" }}>Poster Resize Pro</h1>
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Antigravity & Codex Engine</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isTauriAvailable ? "var(--color-success)" : "var(--color-warning)" }}></span>
            {isTauriAvailable ? "Tauri Desktop Environment" : "Browser Sim Mode"}
          </div>
        </div>
      </header>

      {/* BODY WORKSPACE */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "16px", padding: "0 12px 12px 12px", overflow: "hidden", height: "100%" }}>
        
        {/* SIDEBAR PANEL: SETTINGS */}
        <aside className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
            <Settings size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Pipeline Parameters</h2>
          </div>

          {/* Target Dimensions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Target Size</label>
            <select 
              value={sizeKey} 
              onChange={(e) => setSizeKey(e.target.value as any)}
              style={{ width: "100%", padding: "10px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "#fff", outline: "none", fontSize: "0.875rem" }}
            >
              <option value="A4">A4 (2480 x 3508 px)</option>
              <option value="A5">A5 (1748 x 2480 px)</option>
              <option value="A6">A6 (1240 x 1748 px)</option>
            </select>
          </div>

          {/* Orientation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Orientation</label>
            <select 
              value={orientation} 
              onChange={(e) => setOrientation(e.target.value as any)}
              style={{ width: "100%", padding: "10px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "#fff", outline: "none", fontSize: "0.875rem" }}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
              <option value="auto">Auto-Fit Ratio</option>
            </select>
          </div>

          {/* Directory Paths */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-muted)" }}>Output Directory</label>
            <input 
              type="text" 
              value={outputDir} 
              onChange={(e) => setOutputDir(e.target.value)}
              style={{ width: "100%", padding: "10px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "#fff", outline: "none", fontSize: "0.85rem" }}
            />
          </div>

          {/* AI toggles list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
            
            {/* Enhance */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Smart Quality Enhance</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Sharpen, denoise, adjust colors</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            {/* AI Upscale */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>AI 4x Upscale</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Super-resolution Real-ESRGAN</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={upscale} onChange={(e) => setUpscale(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            {/* Face Restore */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>AI Face Restoration</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>GFPGAN details (subtle blend)</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={faceRestore} onChange={(e) => setFaceRestore(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            {/* Scale Mode */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Fitting & Cropping Mode</span>
              </div>
              <select 
                value={scaleMode} 
                onChange={(e) => setScaleMode(e.target.value as any)}
                style={{ width: "100%", padding: "10px", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "#fff", outline: "none", fontSize: "0.875rem" }}
              >
                <option value="smart">Smart Fit (Crop if close, else Pad)</option>
                <option value="crop">Crop to Fit (Always crop edge-to-edge)</option>
                <option value="pad">Blurred Pad (Always show full image)</option>
              </select>
            </div>

            {/* Export ZIP */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Create Output ZIP</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>Compile print files into ZIP</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={zipOutput} onChange={(e) => setZipOutput(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

          </div>
        </aside>

        {/* WORKSPACE & CONSOLE LOGS */}
        <main style={{ display: "grid", gridTemplateRows: "1fr 180px auto", gap: "16px", overflow: "hidden" }}>
          
          {/* FILE LIST WORKSPACE */}
          <div className="card-glass" style={{ padding: "20px", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "12px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                <ImageIcon size={18} color="var(--color-primary)" />
                Workspace Files ({files.length})
              </h2>
              {files.length > 0 && (
                <button 
                  onClick={clearAllFiles} 
                  disabled={isProcessing}
                  style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", fontWeight: 500 }}
                >
                  <Trash2 size={14} /> Clear All
                </button>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            {files.length === 0 ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", cursor: "pointer", transition: "var(--transition-fast)", background: "rgba(255,255,255,0.01)" }}
                className="upload-dropzone"
              >
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                  <Upload size={28} color="var(--color-primary)" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 600, marginBottom: "4px" }}>Drag & Drop files here, or click to upload</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Supports PNG, JPG, JPEG, WEBP</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            ) : (
              // Files Grid
              <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", alignContent: "start", paddingRight: "4px" }}>
                {files.map((file, idx) => (
                  <div 
                    key={file.id} 
                    style={{ position: "relative", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "10px", display: "flex", flexDirection: "column", gap: "8px", transition: "var(--transition-fast)", opacity: isProcessing && currentFileIdx !== idx && file.status === "pending" ? 0.5 : 1 }}
                  >
                    {/* Image Preview Container */}
                    <div style={{ width: "100%", height: "120px", borderRadius: "var(--radius-sm)", overflow: "hidden", position: "relative", background: "#000" }}>
                      <img 
                        src={file.previewUrl} 
                        alt={file.name} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                      {/* Badge overlay status */}
                      <div style={{ position: "absolute", top: "6px", right: "6px" }}>
                        {file.status === "done" && <CheckCircle size={18} color="var(--color-success)" style={{ filter: "drop-shadow(0px 1px 3px rgba(0,0,0,0.5))" }} />}
                        {file.status === "failed" && <XCircle size={18} color="#ef4444" style={{ filter: "drop-shadow(0px 1px 3px rgba(0,0,0,0.5))" }} />}
                        {file.status === "processing" && (
                          <div style={{ backgroundColor: "rgba(0,0,0,0.6)", padding: "4px", borderRadius: "50%" }}>
                            <Loader2 size={14} className="animate-spin" color="var(--color-primary)" />
                          </div>
                        )}
                      </div>
                      <div style={{ position: "absolute", bottom: "4px", left: "6px", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px", backgroundColor: "rgba(0,0,0,0.7)", fontWeight: 500 }}>
                        {idx + 1}
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={file.name}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>
                        {formatSize(file.size)}
                      </div>
                    </div>

                    {/* Trash Button */}
                    {!isProcessing && (
                      <button 
                        onClick={() => removeFile(file.id)}
                        style={{ position: "absolute", bottom: "8px", right: "8px", background: "transparent", border: "none", color: "var(--color-muted)", cursor: "pointer", transition: "var(--transition-fast)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-muted)"}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REALTIME LOG PANEL */}
          <div className="card-glass" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
              <Terminal size={14} color="var(--color-primary)" />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Pipeline Logs</span>
            </div>
            <div style={{ flex: 1, backgroundColor: "#04060b", border: "1px solid #111827", borderRadius: "var(--radius-sm)", padding: "10px", overflowY: "auto", fontFamily: "Courier New, monospace", fontSize: "0.75rem", color: "#34d399", display: "flex", flexDirection: "column", gap: "4px" }}>
              {logs.length === 0 ? (
                <span style={{ color: "var(--color-muted-dark)" }}>Console idle. Awaiting action...</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} style={{ lineBreak: "anywhere" }}>{log}</div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* LOWER ACTIONS AND PROGRESS BAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Progress Bar */}
            {isProcessing && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-muted)" }}>
                  <span>Processing file [{currentFileIdx + 1}/{files.length}]</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "var(--color-border)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "var(--color-primary)", transition: "width var(--transition-fast)", boxShadow: "0 0 8px rgba(239,68,68,0.5)" }}></div>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
              {/* Start Processing */}
              <button 
                onClick={startProcessing} 
                disabled={isProcessing || files.length === 0}
                style={{ 
                  backgroundColor: isProcessing || files.length === 0 ? "rgba(239, 68, 68, 0.15)" : "var(--color-primary)", 
                  color: isProcessing || files.length === 0 ? "var(--color-muted-dark)" : "#fff", 
                  border: "none", 
                  borderRadius: "var(--radius-md)", 
                  padding: "14px 20px", 
                  fontWeight: 600, 
                  cursor: isProcessing || files.length === 0 ? "not-allowed" : "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "8px", 
                  transition: "var(--transition-fast)",
                  boxShadow: isProcessing || files.length === 0 ? "none" : "var(--shadow-glow)"
                }}
                className={!isProcessing && files.length > 0 ? "glow-active" : ""}
                onMouseEnter={(e) => {
                  if (!isProcessing && files.length > 0) {
                    e.currentTarget.style.backgroundColor = "var(--color-primary-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing && files.length > 0) {
                    e.currentTarget.style.backgroundColor = "var(--color-primary)";
                  }
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing images...
                  </>
                ) : (
                  <>
                    <Play size={18} fill="#fff" /> Start Resize Pipeline
                  </>
                )}
              </button>

              {/* Open output */}
              <button 
                onClick={openOutputFolder} 
                disabled={isProcessing}
                style={{ backgroundColor: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 16px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "var(--transition-fast)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <FolderOpen size={16} /> Open Output
              </button>

              {/* Output Zip status/button */}
              <button 
                onClick={openOutputFolder}
                disabled={isProcessing || !zipOutput}
                style={{ backgroundColor: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 16px", color: zipOutput ? "#fff" : "var(--color-muted-dark)", cursor: zipOutput ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "var(--transition-fast)" }}
                onMouseEnter={(e) => {
                  if (zipOutput) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (zipOutput) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FileArchive size={16} /> Export ZIP
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
