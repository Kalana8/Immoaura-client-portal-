import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import { Mail, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface MessageDetailProps {
  message: Message | null;
  onBack: () => void;
}

export const MessageDetail = ({ message, onBack }: MessageDetailProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.messages || translations.EN.messages;
  // Mark message as read when viewing
  useEffect(() => {
    if (message && !message.is_read) {
      const markAsRead = async () => {
        await supabase
          .from("messages")
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq("id", message.id);
      };
      markAsRead();
    }
  }, [message]);

  if (!message) {
    return (
      <Card className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{trans.selectMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mb-3 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {trans.backToMessages}
              </Button>
              <CardTitle className="text-2xl">{message.title}</CardTitle>
              <CardDescription className="mt-2">
                {trans.received} {format(new Date(message.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
            {message.read_at && (
              <div className="text-right">
                <p className="text-xs text-gray-500">{trans.read}</p>
                <p className="text-xs font-medium">
                  {format(new Date(message.read_at), "MMM d, h:mm a")}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
