import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Bell, BellRing, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  reportId?: {
    _id: string;
    title: string;
    status: string;
  };
}

interface NotificationBellProps {
  token: string;
  apiUrl?: string;
}

export function NotificationBell({ token, apiUrl = "http://localhost:5000" }: NotificationBellProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Connect to socket and fetch initial notifications
  useEffect(() => {
    if (!token) return;

    // Initialize Socket.io connection
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    newSocket.on("connect", () => {
      console.log("Notification socket connected");
    });

    newSocket.on("notification", (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on("disconnect", () => {
      console.log("Notification socket disconnected");
    });

    setSocket(newSocket);

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [token, apiUrl]);

  const fetchNotifications = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/reports/notifications?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/reports/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/reports/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "report_created":
        return "📝";
      case "report_updated":
        return "🔄";
      case "report_resolved":
        return "✅";
      case "report_assigned":
        return "👤";
      case "support_added":
        return "❤️";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "report_created":
        return "text-blue-500";
      case "report_resolved":
        return "text-green-500";
      case "support_added":
        return "text-red-500";
      default:
        return "text-amber-500";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      <span className="text-xs">Mark all read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={cn(
                        "p-3 hover:bg-accent/50 transition-colors",
                        !notification.read && "bg-accent/30"
                      )}
                    >
                      <div className="flex gap-3">
                        <span className="text-xl" role="img">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              "font-medium text-sm truncate",
                              !notification.read && "text-foreground"
                            )}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => markAsRead(notification._id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
