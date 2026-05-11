import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { HelpCircle, X, Send, Trash2, Bot, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING = "Hi! I'm your MTVC Admin Assistant. Ask me anything about how to use the admin panel — adding vans, managing quotes, configuring upgrades, pushing to AutoTradeOS, or anything else.";

export function AdminHelpWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 80);
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/admin/help", {
        messages: next.filter(m => m.role === "user" || m.role === "assistant"),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "No response received." }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I ran into an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([{ role: "assistant", content: GREETING }]);
    setInput("");
  };

  return (
    <>
      {/* Floating toggle button */}
      <div className="fixed bottom-5 right-5 z-50 print:hidden">
        {!open && (
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-[#8bc440] hover:bg-[#7ab035] text-white border-0"
            onClick={() => setOpen(true)}
            data-testid="button-admin-help-open"
            title="Admin Help Assistant"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        )}

        {/* Chat panel */}
        {open && (
          <div
            className="flex flex-col bg-card border rounded-xl shadow-xl overflow-hidden"
            style={{ width: 380, height: 520 }}
            data-testid="admin-help-panel"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#8bc440] text-white flex-shrink-0">
              <Bot className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold text-sm flex-1">MTVC Admin Assistant</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                onClick={clear}
                title="Clear chat"
                data-testid="button-admin-help-clear"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                onClick={() => setOpen(false)}
                title="Minimise"
                data-testid="button-admin-help-close"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[#8bc440] text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground">
                    <span className="inline-flex gap-1 items-center">
                      <span className="animate-bounce delay-0">•</span>
                      <span className="animate-bounce delay-100">•</span>
                      <span className="animate-bounce delay-200">•</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts — show only when just greeting */}
            {messages.length === 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {[
                  "How do I add a van?",
                  "How do I change the van in a quote?",
                  "How do I push to AutoTradeOS?",
                  "What are the admin access levels?",
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      setTimeout(() => inputRef.current?.focus(), 10);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 p-3 border-t flex-shrink-0">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask a question…"
                className="flex-1 h-9 text-sm"
                disabled={loading}
                data-testid="input-admin-help-message"
              />
              <Button
                size="icon"
                onClick={send}
                disabled={!input.trim() || loading}
                className="h-9 w-9 bg-[#8bc440] hover:bg-[#7ab035] text-white border-0 flex-shrink-0"
                data-testid="button-admin-help-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
