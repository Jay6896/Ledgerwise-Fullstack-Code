import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "Support", text: "Hello! How can I help you today?", time: "10:30 AM", isUser: false },
    { id: 2, sender: "You", text: "I need help with my inventory", time: "10:32 AM", isUser: true },
    { id: 3, sender: "Support", text: "I'd be happy to help! What specific issue are you experiencing?", time: "10:33 AM", isUser: false },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: messages.length + 1,
      sender: "You",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
    }]);
    setMessage("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Chat Support</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 shadow-card">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Support Team", status: "Active", unread: 2 },
                  { name: "Sales Team", status: "Away", unread: 0 },
                  { name: "Technical Support", status: "Offline", unread: 0 },
                ].map((contact, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.status}</p>
                    </div>
                    {contact.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-card flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">S</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Support Team</CardTitle>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      msg.isUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon">
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
