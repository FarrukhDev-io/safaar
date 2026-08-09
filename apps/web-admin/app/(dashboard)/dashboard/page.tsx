"use client";

import { StatCard } from "@/components/ui/Card";
import Card from "@/components/ui/Card";
import { AdminApi } from "@/lib/api/admin-api";
import { formatPrice, timeAgo } from "@/lib/utils";
import {
  Users, Building2, CalendarCheck, Wallet, TrendingUp, XCircle,
  UserPlus, CalendarPlus, Building, AlertTriangle, ArrowRight,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { ActivityLogItem, DashboardStat, QuickAction, ServiceDistribution } from "@/types/admin";

const STAT_ICONS: Record<string, ReactNode> = {
  Users: <Users size={20} />,
  Building2: <Building2 size={20} />,
  CalendarCheck: <CalendarCheck size={20} />,
  Wallet: <Wallet size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  XCircle: <XCircle size={20} />,
};

const ACTIVITY_ICONS: Record<string, ReactNode> = {
  UserPlus: <UserPlus size={16} />,
  CalendarPlus: <CalendarPlus size={16} />,
  Building: <Building size={16} />,
  Wallet: <Wallet size={16} />,
  XCircle: <XCircle size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  user_registered: "#3498DB",
  booking_created: "#2ECC71",
  partner_request: "#9B59B6",
  payment_request: "#F39C12",
  booking_cancelled: "#E74C3C",
  complaint: "#E74C3C",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalPartners: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityLogItem[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const [overviewData, activities, summary, hotelBookings, busBookings] = await Promise.all([
        AdminApi.getDashboardStats(),
        AdminApi.getActivity(),
        AdminApi.getNotificationSummary(),
        AdminApi.getBookings(),
        AdminApi.getBusBookings(),
      ]);
      const totalServiceBookings = hotelBookings.length + busBookings.length;

      setOverview(overviewData);
      setRecentActivities(activities);
      setQuickActions([
        {
          label: "Yangi hamkor arizalari",
          count: summary.partnerRequests,
          color: "#9B59B6",
          href: "/partners/requests",
        },
        {
          label: "Ochiq support murojaatlari",
          count: summary.supportOpen,
          color: "#E74C3C",
          href: "/support",
        },
      ]);
      setServiceDistribution(
        totalServiceBookings > 0
          ? [
              {
                name: "Mehmonxona",
                value: Math.round((hotelBookings.length / totalServiceBookings) * 100),
                color: "#1E3A5F",
              },
              {
                name: "Mashina Ijarasi",
                value: Math.round((busBookings.length / totalServiceBookings) * 100),
                color: "#2ECC71",
              },
            ]
          : [],
      );
    }

    loadDashboard().finally(() => setLoading(false));
  }, []);

  const dashboardStats: DashboardStat[] = [
    {
      label: "Foydalanuvchilar",
      value: String(overview.totalUsers),
      icon: "Users",
      color: "#3498DB",
    },
    {
      label: "Hamkorlar",
      value: String(overview.totalPartners),
      icon: "Building2",
      color: "#9B59B6",
    },
    {
      label: "Bronlar",
      value: String(overview.totalBookings),
      icon: "CalendarCheck",
      color: "#2ECC71",
    },
    {
      label: "Daromad",
      value: formatPrice(overview.revenue),
      icon: "Wallet",
      color: "#F39C12",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            icon={STAT_ICONS[stat.icon] ?? <Users size={20} />}
            color={stat.color}
          />
        ))}
      </div>

      {/* Main Content Area without Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent activity */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Activity size={18} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                So'nggi harakatlar
              </h3>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium px-2.5 py-1 bg-[var(--accent)]/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Jonli rejim
            </span>
          </div>
          
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {recentActivities.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                Harakatlar topilmadi
              </div>
            ) : recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/20 hover:shadow-md transition-all bg-white"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: (ACTIVITY_COLORS[activity.type] ?? "#94A3B8") + "15",
                    color: ACTIVITY_COLORS[activity.type] ?? "#94A3B8",
                  }}
                >
                  {ACTIVITY_ICONS[activity.icon] ?? <CalendarPlus size={18} />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center h-10">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{activity.message}</p>
                  <p className="text-xs text-[var(--text-muted)] font-medium">{timeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column: Quick Actions & Distribution */}
        <div className="flex flex-col gap-6">
          
          {/* Quick actions */}
          <Card padding="lg">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
              Tezkor harakatlar
            </h3>
            <div className="flex flex-col gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-sm transition-all group bg-[var(--bg-secondary)] hover:bg-white"
                >
                  <span
                    className="text-lg font-bold min-w-[40px] h-10 flex items-center justify-center rounded-xl"
                    style={{ color: action.color, backgroundColor: action.color + "15" }}
                  >
                    {action.count}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {action.label}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--primary)]/20 group-hover:bg-[var(--primary)]/5 transition-all">
                    <ArrowRight
                      size={14}
                      className="text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Service Distribution (Replaced Donut Chart with Progress Bars) */}
          <Card padding="lg">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5">
              Xizmatlar ulushi
            </h3>
            <div className="flex flex-col gap-5">
              {serviceDistribution.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Xizmatlar bo'yicha bron ma'lumoti topilmadi
                </p>
              ) : serviceDistribution.map((service) => (
                <div key={service.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{service.name}</span>
                    <span className="text-sm font-bold" style={{ color: service.color }}>{service.value}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${service.value}%`, backgroundColor: service.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Ushbu ko'rsatkichlar platformadagi barcha faol bronlar va so'rovlar asosida hisoblangan.
              </p>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
