import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, MessageCircle, Upload, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusChangeDropdown } from "./StatusChangeDropdown";
import { SlotAssignmentModal } from "./SlotAssignmentModal";
import { MessageClientModal } from "@/components/admin/messaging/MessageClientModal";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  client_id: string;
  services_selected: string[];
  status: string;
  total_excl_vat: number;
  vat_rate: number;
  total_incl_vat: number;
  price_breakdown: Record<string, any>;
  config_video: any;
  config_2d: any;
  config_3d: any;
  admin_notes: string;
  calendar_slot_id: string | null;
  created_at: string;
  client?: {
    email: string;
    full_name: string;
    business_name: string;
    phone: string;
  };
}

interface OrderDetailPanelProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const OrderDetailPanel = ({
  order,
  isOpen,
  onClose,
  onUpdate,
}: OrderDetailPanelProps) => {
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Update state when order changes
  useEffect(() => {
    if (order) {
      setStatus(order.status || "");
      setAdminNotes(order.admin_notes || "");
    }
  }, [order.id, order.status, order.admin_notes]);

  useEffect(() => {
    if (!isOpen || !order?.id) {
      setFiles([]);
      setClientFiles([]);
      return;
    }

    const fetchFiles = async () => {
      try {
        // Fetch admin-uploaded files
        const { data: filesData, error } = await supabase
          .from("file_uploads")
          .select("*")
          .eq("order_id", order.id)
          .eq("upload_type", "admin-upload")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching admin files:", error);
        } else {
          setFiles(filesData || []);
        }

        // Fetch client-uploaded files (2D and 3D plan documents)
        const { data: clientFilesData, error: clientError } = await supabase
          .from("file_uploads")
          .select("*")
          .eq("order_id", order.id)
          .in("upload_type", ["plan2d-uploads", "plan3d-uploads"])
          .order("created_at", { ascending: false });

        if (clientError) {
          console.error("Error fetching client files:", clientError);
          console.error("Client files query error details:", clientError);
        } else {
          console.log("Client files fetched:", clientFilesData);
          setClientFiles(clientFilesData || []);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
        setFiles([]);
        setClientFiles([]);
      }
    };

    fetchFiles();
  }, [isOpen, order.id]);

  if (!isOpen) return null;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    onUpdate();
  };

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("orders")
        .update({ admin_notes: adminNotes })
        .eq("id", order.id);

      if (error) throw error;

      // Log the action
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_activity_log").insert({
          admin_id: session.user.id,
          action: "admin_notes_update",
          target_table: "orders",
          target_id: order.id,
          new_values: { admin_notes: adminNotes },
        });
      }

      toast.success("Notes saved");
      onUpdate();
    } catch (err: any) {
      console.error("Error saving notes:", err);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !order.id) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${order.id}/admin-uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName; // Store relative path without bucket name

      const { error: uploadError } = await supabase.storage
        .from('admin-order-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get current admin user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Admin not authenticated");
      }

      const { error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          order_id: order.id,
          user_id: session.user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          upload_type: 'admin-upload',
        });

      if (dbError) throw dbError;

      // Log the action
      await supabase.from("admin_activity_log").insert({
        admin_id: session.user.id,
        action: "file_upload",
        target_table: "file_uploads",
        target_id: order.id,
        new_values: { file_name: file.name, upload_type: 'admin-upload' },
      });

      toast.success("File uploaded successfully");
      
      // Refresh files
      const { data: filesData } = await supabase
        .from("file_uploads")
        .select("*")
        .eq("order_id", order.id)
        .eq("upload_type", "admin-upload")
        .order("created_at", { ascending: false });
      setFiles(filesData || []);
      
      // Reset file input
      e.target.value = '';
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string, uploadType: string) => {
    try {
      // Determine which bucket to use based on upload type
      const bucket = uploadType === 'admin-upload' ? 'admin-order-files' : 'order-files';
      
      // The filePath should be relative to the bucket root (no bucket name prefix)
      // Strip "order-files/" prefix if present (for backward compatibility)
      let downloadPath = filePath;
      if (filePath.startsWith('order-files/')) {
        downloadPath = filePath.replace('order-files/', '');
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(downloadPath);

      if (error) {
        console.error("Download error:", error);
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error(error.message || "Failed to download file");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
      <div className="h-full w-full max-w-2xl bg-white overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b flex items-center justify-between p-6 z-10">
          <div>
            <h2 className="text-2xl font-bold">{order.order_number}</h2>
            <p className="text-sm text-gray-600">
              {order.client?.full_name || order.client?.business_name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Management</h3>
            <div className="space-y-3">
              <StatusChangeDropdown
                orderId={order.id}
                currentStatus={status}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>

          <Separator />

          {/* Client Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Client Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">
                  {order.client?.full_name || order.client?.business_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{order.client?.email}</p>
              </div>
              {order.client?.phone && (
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{order.client.phone}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Details Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="notes">Admin Notes</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Created</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Services</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {order.services_selected?.join(", ") || "None"}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Price Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {order.price_breakdown && (
                    <>
                      {order.price_breakdown.services && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Services:</span>
                          <span>€{Object.values(order.price_breakdown.services).reduce((a: any, b: any) => a + b, 0).toFixed(2)}</span>
                        </div>
                      )}
                      {order.price_breakdown.addons && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Add-ons:</span>
                          <span>€{Object.values(order.price_breakdown.addons).reduce((a: any, b: any) => a + b, 0).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>€{order.total_excl_vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">VAT ({(order.vat_rate * 100).toFixed(0)}%):</span>
                    <span>€{(order.total_incl_vat - order.total_excl_vat).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span className="text-green-600">€{order.total_incl_vat.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Calendar Slot - Only show if status is "Planned" */}
              {status === "planned" && (
                <Button
                  onClick={() => setSlotModalOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  {order.calendar_slot_id ? "Change Calendar Slot" : "Assign Calendar Slot"}
                </Button>
              )}
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-4">
              {order.config_video && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Video Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-600">Package:</span>
                      <p className="font-medium">{order.config_video.package}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Property Type:</span>
                      <p className="font-medium">{order.config_video.propertyType}</p>
                    </div>
                    {order.config_video.voiceOver && (
                      <Badge variant="outline">Voice Over ({order.config_video.voiceOverLanguage})</Badge>
                    )}
                    {order.config_video.twilight && <Badge variant="outline">Twilight</Badge>}
                    {order.config_video.extraSocialCut && <Badge variant="outline">Extra Social Cut</Badge>}
                  </CardContent>
                </Card>
              )}

              {order.config_2d && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">2D Floor Plan Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-600">Levels:</span>
                      <p className="font-medium">{order.config_2d.levels}</p>
                    </div>
                    {order.config_2d.editableDWG && <Badge variant="outline">Editable DWG</Badge>}
                  </CardContent>
                </Card>
              )}

              {order.config_3d && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">3D Floor Plan Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-600">Quality:</span>
                      <p className="font-medium">{order.config_3d.quality}</p>
                    </div>
                    {order.config_3d.twilight && <Badge variant="outline">Twilight</Badge>}
                    {order.config_3d.flyThrough && <Badge variant="outline">Fly Through</Badge>}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Admin Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  className="w-full mt-2 p-3 border rounded-lg text-sm"
                  rows={6}
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="mt-3 w-full"
                >
                  {isSaving ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Client Uploaded Files Section */}
          {clientFiles.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Client Uploaded Documents</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">2D & 3D Plan Documents</CardTitle>
                    <CardDescription>Files uploaded by the client during order placement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {clientFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{file.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.file_size / 1024 / 1024).toFixed(2)} MB • {file.upload_type === 'plan2d-uploads' ? '2D Plan' : '3D Plan'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(file.file_path, file.file_name, file.upload_type)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Separator />
            </>
          )}

          {/* Files Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Files for Client</h3>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Uploaded Files</CardTitle>
                    <CardDescription>Files uploaded for the client to download</CardDescription>
                  </div>
                  <div>
                    <Input
                      type="file"
                      id="admin-file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept="*/*"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={uploading}
                      type="button"
                      className="cursor-pointer"
                      onClick={() => {
                        const fileInput = document.getElementById('admin-file-upload') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Add Files"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">No files uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(file.file_path, file.file_name, file.upload_type)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setMessageModalOpen(true)}
            >
              <MessageCircle className="h-4 w-4" />
              Message Client
            </Button>
          </div>
        </div>
      </div>

      {/* Slot Assignment Modal */}
      {slotModalOpen && (
        <SlotAssignmentModal
          orderId={order.id}
          isOpen={slotModalOpen}
          onClose={() => setSlotModalOpen(false)}
          onSlotAssigned={onUpdate}
        />
      )}

      {/* Message Client Modal */}
      <MessageClientModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        clientId={order.client_id}
        clientName={order.client?.full_name || order.client?.business_name}
        orderNumber={order.order_number}
      />
    </div>
  );
};
