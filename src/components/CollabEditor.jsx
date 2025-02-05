import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import Peer from "peerjs";
import {
  Users,
  Phone,
  Check,
  Loader,
  Copy,
  Play,
  Trash2,
  Link2,
  Unlink,
  CheckCircle2,
  SignalHigh,
  SignalMedium,
  SignalLow,
} from "lucide-react";

const CollabEditor = ({ isDarkMode, editorContent, onEditorChange }) => {
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [lastReceivedContent, setLastReceivedContent] = useState(null);
  const [output, setOutput] = useState("");
  const peerInstance = useRef(null);
  const connectionRef = useRef(null);
  const editorRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const copyTimeoutRef = useRef(null);
  const [ping, setPing] = useState(null);
  const pingIntervalRef = useRef(null);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Create peer with minimal configuration to reduce connection issues
    const peer = new Peer({
      host: "peerjs-server.herokuapp.com",
      secure: true,
      port: 443,
      config: {
        iceServers: [
          {
            urls: [
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302",
            ],
          },
        ],
      },
    });

    peer.on("open", (id) => {
      console.log("Connected with ID:", id);
      setPeerId(id);
      peerInstance.current = peer;
      setConnectionError(null);
    });

    peer.on("error", (error) => {
      console.error("PeerJS error:", error);
      handlePeerError(error);
    });

    peer.on("connection", handleConnection);

    return () => {
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  const handlePeerError = (error) => {
    let errorMessage = "";
    switch (error.type) {
      case "peer-unavailable":
        errorMessage = "The ID you entered is not online or doesn't exist";
        break;
      case "network":
        errorMessage = "Network error - Please check your internet connection";
        break;
      case "server-error":
        errorMessage = "Server error - Please try again";
        break;
      case "webrtc":
        errorMessage =
          "WebRTC connection failed - Try using a different network";
        break;
      default:
        errorMessage = "Connection failed - Please try again";
    }
    setConnectionError(errorMessage);
    setConnectionStatus("disconnected");
  };

  const handleConnection = (conn) => {
    connectionRef.current = conn;
    setIsConnected(true);
    setConnectionStatus("connected");
    setActiveUsers((prev) => [...prev, conn.peer]);

    conn.on("data", handleData);
    conn.on("close", handleDisconnect);
    conn.on("error", handleConnectionError);
  };

  const handleData = (data) => {
    if (data.type === "content" && data.content !== lastReceivedContent) {
      setLastReceivedContent(data.content);
      onEditorChange(data.content);
    } else if (data.type === "output") {
      setOutput(data.content);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionStatus("disconnected");
    setActiveUsers((prev) =>
      prev.filter((id) => id !== connectionRef.current?.peer)
    );
  };

  const handleConnectionError = (error) => {
    console.error("Connection error:", error);
    setConnectionError("Connection lost - Please try reconnecting");
    setConnectionStatus("disconnected");
  };

  const connectToPeer = async () => {
    if (!remotePeerId.trim()) {
      setConnectionError("Please enter a valid Peer ID");
      return;
    }

    try {
      setConnectionStatus("connecting");
      setConnectionError(null);

      // Add connection timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000);
      });

      const connectionPromise = new Promise((resolve, reject) => {
        const conn = peerInstance.current.connect(remotePeerId, {
          reliable: true,
          serialization: "json",
        });

        conn.on("open", () => {
          resolve(conn);
        });

        conn.on("error", (err) => {
          reject(err);
        });
      });

      // Race between connection and timeout
      const conn = await Promise.race([connectionPromise, timeoutPromise]);
      handleConnection(conn);
    } catch (err) {
      console.error("Connection failed:", err);
      setConnectionError(
        err.message === "Connection timeout"
          ? "Connection timed out - Please try again"
          : "Failed to connect - Please check the ID and try again"
      );
      setConnectionStatus("disconnected");
    }
  };

  const handleEditorChange = (value) => {
    onEditorChange(value);
    if (connectionRef.current && connectionRef.current.open) {
      connectionRef.current.send({
        type: "content",
        content: value,
      });
      setLastReceivedContent(value);
    }
  };

  const handleRunCode = () => {
    try {
      const consoleOutput = [];
      const mockConsole = {
        log: (...args) => {
          args.forEach((arg) => {
            if (typeof arg === "object" && arg !== null) {
              consoleOutput.push(JSON.stringify(arg, null, 2));
            } else {
              consoleOutput.push(String(arg));
            }
          });
        },
        error: (...args) => {
          consoleOutput.push(`Error: ${args.join(" ")}`);
        },
        warn: (...args) => {
          consoleOutput.push(`Warning: ${args.join(" ")}`);
        },
      };

      const func = new Function("console", editorContent);
      func(mockConsole);

      const outputText = consoleOutput.join("\n");
      setOutput(outputText);

      if (connectionRef.current && connectionRef.current.open) {
        connectionRef.current.send({
          type: "output",
          content: outputText,
        });
      }
    } catch (error) {
      const errorOutput = `Error: ${error.message}`;
      setOutput(errorOutput);

      if (connectionRef.current && connectionRef.current.open) {
        connectionRef.current.send({
          type: "output",
          content: errorOutput,
        });
      }
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(peerId);
      setCopySuccess(true);
      setShowCopyToast(true);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopySuccess(false);
        setShowCopyToast(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <SignalHigh className="w-4 h-4 text-green-500" />;
      case "connecting":
        return (
          <SignalMedium className="w-4 h-4 text-yellow-500 animate-pulse" />
        );
      default:
        return <SignalLow className="w-4 h-4 text-gray-500" />;
    }
  };

  const measurePing = async () => {
    if (connectionRef.current && connectionRef.current.open) {
      const startTime = Date.now();
      connectionRef.current.send({ type: "ping" });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 5000);

        const onPong = (data) => {
          if (data.type === "pong") {
            clearTimeout(timeout);
            const endTime = Date.now();
            resolve(endTime - startTime);
          }
        };

        connectionRef.current.once("data", onPong);
      });
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {connectionError && (
        <div className="px-4 py-2 bg-red-500/10 text-red-500 text-sm">
          Connection Error: {connectionError}
        </div>
      )}
      <div
        className={`flex items-center px-3 py-1.5 gap-2 ${
          isDarkMode
            ? "bg-[#1e1e1e] border-b border-[#333333]"
            : "bg-white border-b border-gray-200"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 min-w-[90px] ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {getConnectionStatusIcon()}
          <span className="text-xs">
            {connectionStatus === "connected"
              ? `Connected`
              : connectionStatus === "connecting"
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 max-w-md">
          <Link2 className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={remotePeerId}
            onChange={(e) => setRemotePeerId(e.target.value)}
            placeholder="Enter peer ID to connect"
            disabled={isConnected}
            className={`w-full bg-transparent text-xs border-none outline-none ${
              isDarkMode
                ? "text-gray-300 placeholder-gray-500"
                : "text-gray-700 placeholder-gray-400"
            } ${isConnected ? "opacity-50" : ""}`}
          />
        </div>

        {!isConnected ? (
          <button
            onClick={connectToPeer}
            disabled={connectionStatus === "connecting"}
            className={`px-3 py-1 rounded flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${
              connectionStatus === "connecting"
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {connectionStatus === "connecting" ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5" />
                <span>Connect</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded flex items-center gap-1.5 text-xs font-medium transition-all duration-200"
          >
            <Unlink className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Your ID:</span>
          <div className="relative group flex items-center">
            <code
              className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                isDarkMode
                  ? "bg-[#2d2d2d] text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {peerId.slice(0, 8)}...
            </code>
            <button
              onClick={handleCopyId}
              className={`ml-1 p-1 rounded transition-all duration-200 
                ${isDarkMode ? "hover:bg-[#2d2d2d]" : "hover:bg-gray-100"}`}
              title={copySuccess ? "Copied!" : "Copy ID"}
            >
              {copySuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mr-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {activeUsers.length + 1}
            </span>
          </div>
          {isConnected && ping !== null && (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {ping}ms
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={`fixed top-4 right-4 transition-all duration-300 transform ${
          showCopyToast
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
            isDarkMode
              ? "bg-[#2d2d2d] text-white border border-[#3c3c3c]"
              : "bg-white text-gray-800 border border-gray-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">ID copied to clipboard!</span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          {!isConnected && !connectionStatus === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-black z-10">
              <div
                className={`text-center p-6 rounded-lg ${
                  isDarkMode ? "bg-[#2d2d2d]" : "bg-white"
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">
                  Start Collaborating
                </h3>
                <p className="text-sm text-gray-500">
                  Share your ID with others or enter someone's ID to connect
                </p>
              </div>
            </div>
          )}
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={editorContent}
            onChange={handleEditorChange}
            theme={isDarkMode ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              cursorStyle: "line",
              wordWrap: "on",
            }}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>

        <div
          className={`w-1/3 border-l ${
            isDarkMode
              ? "border-[#333333] bg-[#1e1e1e]"
              : "border-gray-200 bg-white"
          }`}
        >
          <div
            className={`flex items-center justify-between px-4 py-2 border-b ${
              isDarkMode ? "border-[#333333]" : "border-gray-200"
            }`}
          >
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Output
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOutput("")}
                className={`p-1.5 rounded-md transition-colors ${
                  isDarkMode
                    ? "hover:bg-[#2d2d2d] text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                title="Clear Output"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRunCode}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span className="text-sm">Run</span>
              </button>
            </div>
          </div>
          <div
            className={`p-4 font-mono text-sm whitespace-pre-wrap overflow-auto h-[calc(100%-3rem)] ${
              isDarkMode ? "text-gray-300" : "text-gray-800"
            }`}
          >
            {output ||
              "No output to display\nRun your code to see the results here"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabEditor;
