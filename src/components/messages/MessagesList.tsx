import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/utils/translations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Mail, MailOpen, Search, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
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

interface MessageListProps {
  onMessageSelect: (message: Message) => void;
  selectedMessageId?: string;
}

export const MessagesList = ({ onMessageSelect, selectedMessageId }: MessageListProps) => {
  const { language } = useLanguage();
  const trans = translations[language]?.messages || translations.EN.messages;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error(trans.notAuthenticated);
          return;
        }

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMessages(data || []);
      } catch (err: any) {
        console.error("Error fetching messages:", err);
        toast.error(trans.failedToLoadMessages);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("messages_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterUnread ? !msg.is_read : true;
    return matchesSearch && matchesFilter;
  });

  // Mark as read
  const handleMarkAsRead = async (messageId: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({
          is_read: !isRead,
          read_at: !isRead ? new Date().toISOString() : null,
        })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                is_read: !isRead,
                read_at: !isRead ? new Date().toISOString() : undefined,
              }
            : msg
        )
      );

      toast.success(isRead ? trans.markedAsUnread : trans.markedAsRead);
    } catch (err: any) {
      console.error("Error updating message:", err);
      toast.error(trans.failedToUpdate);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  // Delete message after confirmation
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      setDeleteLoading(messageToDelete);
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageToDelete);

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete));
      toast.success(trans.messageDeleted, {
        style: {
          background: "#10b981",
          color: "#ffffff",
          border: "1px solid #059669",
        },
        duration: 3000,
      });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    } catch (err: any) {
      console.error("Error deleting message:", err);
      toast.error(trans.failedToDelete, {
        style: {
          background: "#ef4444",
          color: "#ffffff",
          border: "1px solid #dc2626",
        },
        duration: 4000,
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={trans.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filterUnread ? "default" : "outline"}
            onClick={() => setFilterUnread(!filterUnread)}
            className="whitespace-nowrap"
          >
            {filterUnread ? trans.unread : trans.allMessages}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-2 text-sm text-gray-600">
          <span>{trans.total}: {messages.length}</span>
          <span>•</span>
          <span>{trans.unreadCount}: {messages.filter((m) => !m.is_read).length}</span>
        </div>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {searchTerm ? trans.noMessagesFound : trans.noMessages}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm
              ? trans.tryDifferentSearch
              : trans.adminMessagesHere}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedMessageId === message.id
                  ? "border-2 border-blue-500 bg-blue-50"
                  : message.is_read
                  ? "bg-gray-50"
                  : "bg-blue-50 border-l-4 border-l-blue-500"
              }`}
              onClick={() => onMessageSelect(message)}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {message.is_read ? (
                    <MailOpen className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Mail className="h-5 w-5 text-blue-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={`font-semibold truncate ${
                          message.is_read ? "text-gray-700" : "text-gray-900"
                        }`}
                      >
                        {message.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {message.content}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(message.created_at), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(message.id, message.is_read);
                    }}
                    title={message.is_read ? trans.markAsUnread : trans.markAsRead}
                    className="h-8 w-8 p-0"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        message.is_read ? "text-gray-400" : "text-blue-600"
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteClick(message.id, e)}
                    disabled={deleteLoading === message.id}
                    className="h-8 w-8 p-0 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{trans.deleteMessage}</AlertDialogTitle>
            <AlertDialogDescription>
              {trans.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setMessageToDelete(null);
            }}>
              {trans.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              disabled={deleteLoading === messageToDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading === messageToDelete ? trans.deleting : trans.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
