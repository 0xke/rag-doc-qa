"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  Send,
  Bot,
  User,
  Loader2,
  X,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: number[];
}

interface ParseResult {
  chunks: string[];
  fileName: string;
  totalChunks: number;
}

const SUGGESTIONS = [
  "What is this document about?",
  "Summarize the key points",
  "What are the main conclusions?",
];

export default function Home() {
  const [chunks, setChunks] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [highlightedChunks, setHighlightedChunks] = useState<number[]>([]);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chunkRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uploaded = chunks.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setError("");
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data: ParseResult & { error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to parse PDF");
        return;
      }

      setChunks(data.chunks);
      setFileName(data.fileName);
      setMessages([]);
      setHighlightedChunks([]);
    } catch {
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const question = (text ?? input).trim();
      if (!question || isSending) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setIsSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, chunks }),
        });
        const data = await res.json();

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.error || "Something went wrong." },
          ]);
          return;
        }

        const sourceIndices: number[] = [];
        if (data.relevantChunks) {
          for (const rc of data.relevantChunks as string[]) {
            const idx = chunks.indexOf(rc);
            if (idx !== -1) sourceIndices.push(idx);
          }
        }

        setHighlightedChunks(sourceIndices);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, sources: sourceIndices },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Failed to get a response. Please try again.",
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, chunks]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const scrollToChunk = (index: number) => {
    chunkRefs.current
      .get(index)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resetUpload = () => {
    setChunks([]);
    setFileName("");
    setMessages([]);
    setHighlightedChunks([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload View ──
  if (!uploaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8 text-center">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-glow)] mb-2">
              <FileText className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              DocMind AI
            </h1>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto">
              Upload a PDF document and ask questions about its content
            </p>
          </div>

          {/* Drop Zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {isParsing ? (
            <div className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
              <p className="text-[var(--text-secondary)] text-sm">
                Parsing document...
              </p>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-2xl p-12 cursor-pointer
                transition-all duration-200 flex flex-col items-center gap-4
                ${
                  dragOver
                    ? "border-[var(--accent)] bg-[var(--accent-glow)] animate-upload-pulse"
                    : "border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--accent-glow)]"
                }
              `}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Upload className="w-6 h-6 text-[var(--text-secondary)]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  PDF files up to 10MB
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="animate-message-enter flex items-center gap-2 justify-center text-red-400 text-sm">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Chat View ──
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Document Info */}
      <aside className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col max-h-[40vh] lg:max-h-screen">
        {/* File Header */}
        <div className="p-4 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {fileName}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {chunks.length} chunks extracted
              </p>
            </div>
          </div>
        </div>

        {/* Chunks List */}
        <div className="p-4 overflow-y-auto flex-1">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Document Chunks
          </h3>
          <div className="space-y-2">
            {chunks.map((chunk, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) chunkRefs.current.set(i, el);
                }}
                className={`
                  p-3 rounded-lg text-xs leading-relaxed transition-all duration-200
                  ${
                    highlightedChunks.includes(i)
                      ? "border border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--text-primary)]"
                      : "border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  }
                `}
              >
                <span className="font-mono font-medium text-[var(--accent)] mr-1.5">
                  #{i + 1}
                </span>
                {chunk.length > 100 ? chunk.slice(0, 100) + "..." : chunk}
              </div>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <div className="p-4 border-t border-[var(--border-color)] shrink-0">
          <button
            onClick={resetUpload}
            className="w-full py-2 px-4 text-sm rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] transition-all duration-200"
          >
            Upload New Document
          </button>
        </div>
      </aside>

      {/* Right Panel — Chat */}
      <main className="flex-1 flex flex-col min-h-[60vh] lg:min-h-screen">
        {/* Chat Header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <ChevronRight className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)]">Ask about:</span>
            <span className="text-[var(--text-primary)] font-medium truncate">
              {fileName}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-glow)] flex items-center justify-center">
                <Bot className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-[var(--text-primary)] font-medium">
                  Ready to answer
                </p>
                <p className="text-[var(--text-secondary)] text-sm">
                  Ask any question about your document
                </p>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="flex-1 text-left text-xs px-3 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] transition-all duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="animate-message-enter">
              <div
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] space-y-2 ${
                    msg.role === "user" ? "order-first" : ""
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[var(--accent)] text-white rounded-br-md"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Sources */}
                  {msg.role === "assistant" &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pl-1">
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
                          Sources:
                        </span>
                        {msg.sources.map((idx) => (
                          <button
                            key={idx}
                            onClick={() => scrollToChunk(idx)}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-glow)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                          >
                            #{idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-[var(--text-secondary)]" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="animate-message-enter flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--bg-tertiary)]">
                <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the document..."
              rows={1}
              className="flex-1 resize-none bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending}
              className="p-3 rounded-xl bg-[var(--accent)] text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
