import { useState, useEffect, useRef } from "react";
import { 
  Home,
  Image as ImageIcon, 
  Sparkles,
  Layers,
  Settings as SettingsIcon,
  Terminal
} from "lucide-react";

import logo from "./assets/logo.png";
import { UploadPage } from "./components/UploadPage";
import { EditorPage } from "./components/EditorPage";
import { AIToolsPage } from "./components/AIToolsPage";
import { BatchPage } from "./components/BatchPage";
import { SettingsPage } from "./components/SettingsPage";

// Check if running inside Tauri
const isTauriAvailable = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;

// Dynamic imports for Tauri APIs
let TauriCore: any = null;
let TauriShell: any = null;

if (isTauriAvailable) {
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
  // Navigation
  const [activeTab, setActiveTab] = useState<"home" | "editor" | "ai" | "batch" | "settings">("home");

  // Global Pipeline State
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [sizeKey, setSizeKey] = useState<"A4" | "A5" | "A6" | "custom">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("portrait");
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [scaleMode, setScaleMode] = useState<"smart" | "crop" | "pad">("smart");
  const [enhance, setEnhance] = useState(true);
  const [upscale, setUpscale] = useState(true);
  const [faceRestore, setFaceRestore] = useState(false);
  const [zipOutput, setZipOutput] = useState(true);
  const [fileFormat, setFileFormat] = useState<"PNG" | "JPG">("PNG");
  
  // Output and log settings
  const [outputDir, setOutputDir] = useState("./output");
  const [recentOutputs, setRecentOutputs] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIdx, setCurrentFileIdx] = useState(0);

  // AI settings
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    provider: "comfyui",
    api_key: "",
    model_url: "http://127.0.0.1:8188",
    upscale_factor: 4,
    face_restore_strength: 0.35
  });

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${message}`]);
  };

  const processHtmlFileList = (fileList: FileList) => {
    const newFiles: ImageFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (files.some(f => f.name === file.name)) continue;

      const rawPath = (file as any).path || `./input/${file.name}`;
      
      let previewUrl = "";
      if (isTauriAvailable && (file as any).path) {
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
    addLog(`Staged ${newFiles.length} file(s).`);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setProgress(0);
    addLog("Staged poster files cleared.");
  };

  const updateAiSettings = (newSettings: any) => {
    setAiSettings(prev => ({ ...prev, ...newSettings }));
  };

  const testAIConnection = async () => {
    addLog(`Testing AI connection to ${aiSettings.provider}...`);
    if (!isTauriAvailable) {
      await new Promise(r => setTimeout(r, 1200));
      return { success: true, message: `Mock check: Connected to ${aiSettings.provider} URL ${aiSettings.model_url}` };
    }

    try {
      // If Tauri is available, we call the backend API or run a direct curl-like check
      // For simplicity, we query the backend API route if the server is running, or do fetch
      const res = await fetch(`${aiSettings.model_url}/system_info`, { method: "GET" });
      if (res.status === 200) {
        return { success: true, message: "ComfyUI Server is active and connected!" };
      }
      return { success: false, message: `Connection failed with status: ${res.status}` };
    } catch (e: any) {
      return { success: false, message: `Server unreachable: ${e.message || e}` };
    }
  };

  const startProcessing = async () => {
    if (files.length === 0) {
      addLog("Error: No posters staged in workspace.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    addLog("Initiating image processing pipeline...");
    setFiles(prev => prev.map(f => ({ ...f, status: "pending" })));

    // Format CLI args
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

    addLog(`Executing sidecar arguments: ${args.join(" ")}`);

    if (!isTauriAvailable) {
      // Simulated browser workflow
      addLog("Tauri unavailable. Simulating process execution...");
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIdx(i);
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "processing" } : f));
        addLog(`[Step 1/4] Scanning white border trim for ${file.name}...`);
        await new Promise(r => setTimeout(r, 600));
        
        if (upscale) {
          addLog(`[Step 2/4] Running 4x Real-ESRGAN super-resolution for ${file.name}...`);
          await new Promise(r => setTimeout(r, 1000));
        }
        
        if (faceRestore) {
          addLog(`[Step 3/4] Blending facial restoration details for ${file.name}...`);
          await new Promise(r => setTimeout(r, 800));
        }

        addLog(`[Step 4/4] Resizing canvas and injecting 300 DPI headers...`);
        await new Promise(r => setTimeout(r, 600));

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done" } : f));
        setProgress(Math.round(((i + 1) / files.length) * 100));
        const outName = `Image_${String(i + 1).padStart(2, "0")}.png`;
        setRecentOutputs(prev => [outName, ...prev]);
        addLog(`Successfully processed ${file.name} -> saved as ${outName}.`);
      }
      
      if (zipOutput) {
        addLog("Bundling all output posters into ZIP archive...");
        await new Promise(r => setTimeout(r, 800));
        addLog("ZIP archive created successfully.");
      }
      
      addLog("Processing batch completed successfully!");
      setIsProcessing(false);
      return;
    }

    // Tauri Sidecar Execution
    try {
      let command: any = null;
      try {
        command = TauriShell.Command.sidecar("binaries/poster-resize-backend", args);
      } catch (e) {
        // Dev mode python execution fallback
        command = new TauriShell.Command("python", ["backend/main.py", ...args]);
      }

      let jsonResponse = "";

      command.stdout.on("data", (line: string) => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith("{") && cleanLine.endsWith("}")) {
          jsonResponse = cleanLine;
        } else {
          addLog(cleanLine);
          
          if (cleanLine.includes("Processing image")) {
            // Processing image 1/3: filename.png
            const match = cleanLine.match(/Processing image (\d+)\/(\d+):\s*(.*)/);
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

      command.stderr.on("data", (line: string) => {
        addLog(`[Error] ${line.trim()}`);
      });

      command.on("close", (data: any) => {
        setIsProcessing(false);
        setProgress(100);
        addLog(`Process terminated with status code ${data.code}.`);

        if (data.code === 0) {
          try {
            if (jsonResponse) {
              const res = JSON.parse(jsonResponse);
              addLog(`Batch Process Successful. Processed: ${res.processed}, Failed: ${res.failed}`);
              setRecentOutputs(prev => [...res.outputs, ...prev]);
              setFiles(prev => prev.map((f, idx) => {
                if (idx < res.processed) return { ...f, status: "done" };
                return { ...f, status: "failed", error: "Process error" };
              }));
            }
          } catch (e) {
            addLog("Failed to parse response payload.");
          }
        } else {
          setFiles(prev => prev.map(f => f.status === "processing" ? { ...f, status: "failed", error: "Crash" } : f));
        }
      });

      await command.spawn();

    } catch (err: any) {
      addLog(`Execution error: ${err.message || err}`);
      setIsProcessing(false);
    }
  };

  const openOutputFolder = async () => {
    if (!isTauriAvailable) {
      alert(`Simulator mode: Folder would open: ${outputDir}`);
      return;
    }
    try {
      await TauriShell.open(outputDir);
    } catch (err: any) {
      addLog(`Failed to open output: ${err.message || err}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentFile = files[currentFileIdx]?.name || "";

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="card-glass" style={{ margin: "12px", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gridRow: "1", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logo} alt="Logo" style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover", boxShadow: "0 0 10px rgba(239,68,68,0.4)" }} />
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.5px" }}>Poster Resize Pro</h1>
            <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Hybrid Processing Workspace</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isTauriAvailable ? "var(--color-success)" : "var(--color-warning)" }}></span>
            {isTauriAvailable ? "Tauri Desktop Host" : "Browser Simulator Mode"}
          </div>
        </div>
      </header>

      {/* TOP NAVIGATION BAR */}
      <nav style={{ display: "flex", gap: "12px", margin: "0 12px 12px 12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
        <button 
          onClick={() => setActiveTab("home")} 
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
            background: activeTab === "home" ? "var(--color-primary)" : "rgba(255,255,255,0.02)",
            color: activeTab === "home" ? "#fff" : "var(--color-muted)",
            fontSize: "0.85rem", fontWeight: 600, transition: "var(--transition-fast)"
          }}
        >
          <Home size={16} /> Home Staging
        </button>

        <button 
          onClick={() => setActiveTab("editor")} 
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
            background: activeTab === "editor" ? "var(--color-primary)" : "rgba(255,255,255,0.02)",
            color: activeTab === "editor" ? "#fff" : "var(--color-muted)",
            fontSize: "0.85rem", fontWeight: 600, transition: "var(--transition-fast)"
          }}
        >
          <ImageIcon size={16} /> Editor View
        </button>

        <button 
          onClick={() => setActiveTab("ai")} 
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
            background: activeTab === "ai" ? "var(--color-primary)" : "rgba(255,255,255,0.02)",
            color: activeTab === "ai" ? "#fff" : "var(--color-muted)",
            fontSize: "0.85rem", fontWeight: 600, transition: "var(--transition-fast)"
          }}
        >
          <Sparkles size={16} /> AI Parameters
        </button>

        <button 
          onClick={() => setActiveTab("batch")} 
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
            background: activeTab === "batch" ? "var(--color-primary)" : "rgba(255,255,255,0.02)",
            color: activeTab === "batch" ? "#fff" : "var(--color-muted)",
            fontSize: "0.85rem", fontWeight: 600, transition: "var(--transition-fast)"
          }}
        >
          <Layers size={16} /> Batch Processing
        </button>

        <button 
          onClick={() => setActiveTab("settings")} 
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer",
            background: activeTab === "settings" ? "var(--color-primary)" : "rgba(255,255,255,0.02)",
            color: activeTab === "settings" ? "#fff" : "var(--color-muted)",
            fontSize: "0.85rem", fontWeight: 600, transition: "var(--transition-fast)"
          }}
        >
          <SettingsIcon size={16} /> settings
        </button>
      </nav>

      {/* BODY WORKSPACE */}
      <div style={{ display: "grid", gridTemplateRows: "1fr 160px", gap: "16px", padding: "0 12px 12px 12px", overflow: "hidden", height: "calc(100vh - 160px)" }}>
        
        {/* ACTIVE SCREEN WORKSPACE */}
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          {activeTab === "home" && (
            <UploadPage 
              files={files.map(f => ({ name: f.name, path: f.path, size: formatSize(f.size), preview: f.previewUrl }))} 
              onAddFiles={processHtmlFileList} 
              onClearFiles={clearAllFiles} 
              recentOutputs={recentOutputs} 
              onOpenOutputs={openOutputFolder} 
            />
          )}

          {activeTab === "editor" && (
            <EditorPage 
              files={files.map(f => ({ name: f.name, path: f.path, size: formatSize(f.size), preview: f.previewUrl }))} 
              sizeKey={sizeKey} 
              setSizeKey={setSizeKey} 
              orientation={orientation} 
              setOrientation={setOrientation} 
              customW={customW} 
              setCustomW={setCustomW} 
              customH={customH} 
              setCustomH={setCustomH} 
              scaleMode={scaleMode} 
              setScaleMode={setScaleMode} 
              enhance={enhance} 
              setEnhance={setEnhance} 
              upscale={upscale} 
              setUpscale={setUpscale} 
              faceRestore={faceRestore} 
              setFaceRestore={setFaceRestore} 
              zipOutput={zipOutput} 
              setZipOutput={setZipOutput} 
              isProcessing={isProcessing} 
              onRunPipeline={startProcessing} 
            />
          )}

          {activeTab === "ai" && (
            <AIToolsPage 
              aiSettings={aiSettings} 
              onUpdateSettings={updateAiSettings} 
              onTestConnection={testAIConnection} 
            />
          )}

          {activeTab === "batch" && (
            <BatchPage 
              files={files.map(f => ({ name: f.name, path: f.path, size: formatSize(f.size), preview: f.previewUrl }))} 
              sizeKey={sizeKey} 
              orientation={orientation} 
              scaleMode={scaleMode} 
              enhance={enhance} 
              upscale={upscale} 
              faceRestore={faceRestore} 
              zipOutput={zipOutput} 
              isProcessing={isProcessing} 
              progress={progress} 
              currentFile={currentFile} 
              onRunPipeline={startProcessing} 
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage 
              outputDir={outputDir} 
              setOutputDir={setOutputDir} 
              sizeKey={sizeKey} 
              setSizeKey={setSizeKey} 
              fileFormat={fileFormat} 
              setFileFormat={setFileFormat} 
              aiSettings={aiSettings} 
              onUpdateSettings={updateAiSettings} 
            />
          )}
        </div>

        {/* REALTIME LOG PANEL */}
        <div className="card-glass" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            <Terminal size={14} color="var(--color-primary)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--color-muted)" }}>Pipeline Console Logs</span>
          </div>
          <div style={{ flex: 1, backgroundColor: "#04060b", border: "1px solid #111827", borderRadius: "4px", padding: "10px", overflowY: "auto", fontFamily: "Courier New, monospace", fontSize: "0.75rem", color: "#34d399", display: "flex", flexDirection: "column", gap: "4px" }}>
            {logs.length === 0 ? (
              <span style={{ color: "var(--color-muted-dark)" }}>Console idle. Awaiting user actions...</span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{ lineBreak: "anywhere" }}>{log}</div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
