import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const API_BASE = "http://localhost:5000";

type ChatMsg = { id: number; role: 'user' | 'assistant'; content: string; time?: string };

const Chat = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([{
    id: 1,
    role: 'assistant',
    content: "Hello! I’m your Business AI Assistant. Ask me about your sales, expenses, taxes, or growth strategies.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMsg: ChatMsg = {
      id: messages.length + 1,
      role: 'user',
      content: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message: userMsg.content })
      });

      const data = await res.json();
      const replyText = res.ok && data?.reply ? data.reply : (
        data?.error || "Sorry, I couldn't reach the AI service right now."
      );

      const aiMsg: ChatMsg = {
        id: userMsg.id + 1,
        role: 'assistant',
        content: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const aiMsg: ChatMsg = {
        id: messages.length + 2,
        role: 'assistant',
        content: "Network error contacting AI service.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Business AI Chat</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Business AI Assistant</p>
                  <p className="text-xs text-muted-foreground">Ask about your business</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-card flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Business AI Assistant</CardTitle>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.time && (
                        <p className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {msg.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={loading ? "Thinking..." : "Type your message..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                  disabled={loading}
                />
                <Button onClick={handleSend} className="w-10 h-10 p-0" disabled={loading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
