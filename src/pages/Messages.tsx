import { useState } from "react";
import { MessagesList } from "@/components/messages/MessagesList";
import { MessageDetail } from "@/components/messages/MessageDetail";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { LanguageButtonSmall } from "@/components/LanguageButtonSmall";

interface Message {
  id: string;
  sender_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

const MessagesPage = () => {
  const { language } = useLanguage();
  const trans = translations[language]?.messages || translations.EN.messages;
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsMobileDetailView(true);
  };

  const handleBackToList = () => {
    setIsMobileDetailView(false);
    setSelectedMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{trans.title}</h1>
          </div>
          <p className="text-gray-600">
            {trans.subtitle}
          </p>
        </div>
        <LanguageButtonSmall />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {/* Messages List - Left Column */}
        <Card className="md:col-span-1 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">{trans.inbox}</h2>
          <MessagesList
            onMessageSelect={handleSelectMessage}
            selectedMessageId={selectedMessage?.id}
          />
        </Card>

        {/* Message Detail - Right Columns */}
        <Card className="md:col-span-2 p-4">
          <MessageDetail
            message={selectedMessage}
            onBack={handleBackToList}
          />
        </Card>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {isMobileDetailView && selectedMessage ? (
          <MessageDetail
            message={selectedMessage}
            onBack={handleBackToList}
          />
        ) : (
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4">{trans.inbox}</h2>
            <MessagesList
              onMessageSelect={handleSelectMessage}
              selectedMessageId={selectedMessage?.id}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
