import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

export const SendMessagePanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [sentCount, setSentCount] = useState(0);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setFetchingUsers(true);
        const { data, error } = await supabase
          .from("users")
          .select("id, email, full_name")
          .eq("role", "client")
          .order("email", { ascending: true });

        if (error) throw error;
        setUsers(data || []);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        toast.error("Failed to load users");
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, []);

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
    if (selectedUserId === "select" || (selectedUserId !== "all" && !selectedUserId)) {
      toast.error("Please select a user or choose 'Send to All Users'");
      return;
    }

    try {
      setLoading(true);

      // Determine which users to send to
      const targetUsers =
        selectedUserId === "all" ? users : users.filter((u) => u.id === selectedUserId);

      if (targetUsers.length === 0) {
        toast.error("No users selected");
        return;
      }

      // Get current admin user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Admin not authenticated");
        return;
      }

      // Store messages in database
      const messagesToInsert = targetUsers.map((user) => ({
        sender_id: session.user.id,
        recipient_id: user.id,
        title: messageTitle,
        content: messageContent,
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("messages")
        .insert(messagesToInsert);

      if (insertError) throw insertError;

      // Success feedback
      setSentCount(targetUsers.length);
      toast.success(
        `Message sent to ${targetUsers.length} ${targetUsers.length === 1 ? "user" : "users"}`
      );

      // Reset form
      setMessageTitle("");
      setMessageContent("");
      setSelectedUserId("all");

      // Clear success message after 3 seconds
      setTimeout(() => setSentCount(0), 3000);
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <div>
            <CardTitle>Send Message to Users</CardTitle>
            <CardDescription className="text-blue-100">
              Communicate directly with your clients
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Success Message */}
          {sentCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Message Sent Successfully!</p>
                <p className="text-sm text-green-700">
                  Sent to {sentCount} {sentCount === 1 ? "user" : "users"}
                </p>
              </div>
            </div>
          )}

          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Send To *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={fetchingUsers || loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="select" disabled>
                {fetchingUsers ? "Loading users..." : "Select recipient..."}
              </option>
              <option value="all">📢 Send to All Users ({users.length})</option>
              <optgroup label="Individual Users">
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Message Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Message Title *
            </label>
            <Input
              type="text"
              placeholder="e.g., Your Order Update, Important Announcement"
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
              disabled={loading || fetchingUsers || !messageTitle.trim() || !messageContent.trim()}
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
                setSelectedUserId("all");
              }}
              disabled={loading}
              variant="outline"
            >
              Clear
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 Tip:</span> Messages are stored in the database and users will see them on their dashboard. Make sure your message is clear and helpful.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
