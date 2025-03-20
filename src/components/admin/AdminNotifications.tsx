import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Clock, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  content: {
    doctor_id?: string;
    doctor_name?: string;
    doctor_email?: string;
    timestamp?: string;
  };
  related_id: string;
  is_read: boolean;
  created_at: string;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      // Try to get notifications, handle if table doesn't exist yet
      try {
        const { data, error } = await supabase
          .rpc('get_admin_notifications', { limit_count: 10 });

        if (error) {
          console.error("Error loading notifications:", error);
          return;
        }

        if (data) {
          const typedData = data as unknown as Notification[];
          setNotifications(typedData);
          setUnreadCount(typedData.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.log("Admin notifications not available yet:", err);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error in loadNotifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Set up channel for real-time notifications
    const setupRealtimeSubscription = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No active session, skipping realtime subscription");
          return;
        }

        // Create a simple channel without presence
        const channel = supabase
          .channel('admin_notification_changes')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'admin_notifications' 
          }, () => {
            loadNotifications();
            toast.info("New doctor registration requires approval");
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to admin notifications');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to admin notifications');
            }
          });
          
        return () => {
          if (channel) {
            channel.unsubscribe();
          }
        };
      } catch (err) {
        console.error("Error setting up realtime subscription:", err);
        return () => {};
      }
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      try {
        await supabase.rpc('mark_notification_read', { 
          notification_id: notificationId 
        });
      } catch (err) {
        console.error("Error marking notification as read via RPC:", err);
        return;
      }

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, is_read: true} : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error in markAsRead:", err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate based on type
    if (notification.type === 'new_doctor_registration') {
      navigate("/new-admin?section=doctor-approvals");
    }
    
    // Close popover
    setOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b bg-secondary/10">
          <h3 className="font-medium text-sm">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-3 border-b cursor-pointer hover:bg-secondary/10 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {notification.type === 'new_doctor_registration' ? (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{notification.title}</span>
                      <span className="text-xs text-muted-foreground ml-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs h-8"
              onClick={() => {
                // Mark all as read
                notifications.forEach(n => {
                  if (!n.is_read) markAsRead(n.id);
                });
              }}
            >
              <Check className="h-3 w-3 mr-1" /> Mark all as read
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotifications;
