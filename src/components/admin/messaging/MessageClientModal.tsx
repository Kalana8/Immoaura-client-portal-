import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface MessageClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  orderNumber?: string;
}

export const MessageClientModal = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  orderNumber,
}: MessageClientModalProps) => {
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendMessage = async () => {
    // Validation
    if (!messageTitle.trim()) {
      toast.error("Please enter a message title");
      return;
    }
    if (!messageContent.trim()) {
      toast.error("Please enter message content");
      return;
    }

    try {
      setLoading(true);

      // Get current admin user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Admin not authenticated");
        return;
      }

      // Store message in database
      const { error: insertError } = await supabase
        .from("messages")
        .insert({
          sender_id: session.user.id,
          recipient_id: clientId,
          title: messageTitle,
          content: messageContent,
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Success feedback
      setSent(true);
      toast.success("Message sent successfully");

      // Reset form
      setMessageTitle("");
      setMessageContent("");

      // Close modal after 2 seconds
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessageTitle("");
      setMessageContent("");
      setSent(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Pre-fill title with order number if available
  const defaultTitle = orderNumber ? `Update on Order ${orderNumber}` : "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <div>
                <CardTitle>Message Client</CardTitle>
                <CardDescription className="text-blue-100">
                  {clientName ? `Send message to ${clientName}` : "Send message to client"}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={loading}
              className="text-white hover:bg-blue-500"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Success Message */}
            {sent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Message Sent Successfully!</p>
                  <p className="text-sm text-green-700">
                    The client will receive this message in their inbox.
                  </p>
                </div>
              </div>
            )}

            {/* Client Info */}
            {clientName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">To:</span> {clientName}
                </p>
                {orderNumber && (
                  <p className="text-sm text-blue-900 mt-1">
                    <span className="font-semibold">Order:</span> {orderNumber}
                  </p>
                )}
              </div>
            )}

            {/* Message Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Message Title *
              </label>
              <Input
                type="text"
                placeholder={defaultTitle || "e.g., Order Update, Important Information"}
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                disabled={loading}
                className="w-full"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{messageTitle.length}/100 characters</p>
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Message Content *
              </label>
              <textarea
                placeholder="Enter your message here... Be clear and concise."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
                rows={6}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{messageContent.length}/1000 characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSendMessage}
                disabled={loading || !messageTitle.trim() || !messageContent.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setMessageTitle("");
                  setMessageContent("");
                }}
                disabled={loading}
                variant="outline"
              >
                Clear
              </Button>
              <Button
                onClick={handleClose}
                disabled={loading}
                variant="outline"
                className="text-gray-600"
              >
                Close
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 Tip:</span> This message will appear in the
                client's Messages inbox. Make sure your message is clear and helpful.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

