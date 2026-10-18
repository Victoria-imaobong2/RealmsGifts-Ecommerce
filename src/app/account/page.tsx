import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, MapPin, Package, Settings, LogOut, ArrowRight, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { asLines, STATUS_LABELS, type ShippingAddress } from "@/lib/orders";
import { RecipientsManager } from "@/components/account/RecipientsManager";
import { SignOutButton } from "@/components/account/SignOutButton";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My Account | Realms Gifts", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account");

  const [orders, recipients] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id, status: { notIn: ["CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.recipient.findMany({ 
      where: { userId: user.id }, 
      orderBy: { createdAt: "desc" } 
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#FBF9F4] pb-16 pt-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* User Header Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1C3A30]/10 text-[#1C3A30] flex items-center justify-center shrink-0 font-serif text-xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1C3A30]">My Account</p>
              <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 font-bold mt-0.5">
                {user.name ? user.name : "Welcome back"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>
          
          <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center justify-start sm:justify-end">
            <SignOutButton />
          </div>
        </div>

        {/* Quick Mobile Access Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <a
            href="#orders"
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform hover:border-[#1C3A30]"
          >
            <Package size={20} className="text-[#1C3A30]" />
            <span className="text-xs font-medium text-slate-800">My Orders</span>
          </a>

          <a
            href="#recipients"
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform hover:border-[#1C3A30]"
          >
            <MapPin size={20} className="text-[#1C3A30]" />
            <span className="text-xs font-medium text-slate-800">Recipients</span>
          </a>

          <Link
            href="/wishlist"
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform hover:border-[#1C3A30]"
          >
            <Heart size={20} className="text-[#1C3A30]" />
            <span className="text-xs font-medium text-slate-800">Wishlist</span>
          </Link>

          <a
            href="#settings"
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-transform hover:border-[#1C3A30]"
          >
            <Settings size={20} className="text-[#1C3A30]" />
            <span className="text-xs font-medium text-slate-800">Settings</span>
          </a>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          
          {/* Section 1: Orders */}
          <section id="orders" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm scroll-mt-28">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif text-slate-900 font-bold">My Orders & Gift History</h2>
                <p className="text-xs text-slate-500 mt-0.5">Track and review your recent gift orders.</p>
              </div>
              <Link href="/track-order" className="text-xs font-medium text-[#1C3A30] hover:underline hidden sm:inline-block">
                Track order
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-[#FBF9F4]/50">
                <Package size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 mb-4">You haven&apos;t sent any gifts yet.</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1C3A30] text-white text-xs font-medium rounded-full hover:bg-[#152C24] transition"
                >
                  Find a gift <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const lines = asLines(order.items);
                  const to = order.shippingAddress as unknown as ShippingAddress | null;
                  return (
                    <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-xs text-slate-900">
                            #{order.orderNumber ?? order.id.slice(-8)}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#1C3A30]/10 text-[#1C3A30]">
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {lines.map((l) => l.name).join(", ") || "Gift order"}
                          {to?.firstName ? ` · for ${to.firstName}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                        <span className="text-xs font-bold text-slate-900">{formatMoney(order.total, order.currency)}</span>
                        <Link href={`/orders/${order.id}`} className="text-xs font-medium text-[#1C3A30] hover:underline flex items-center gap-1">
                          View details <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Recipients */}
          <section id="recipients" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm scroll-mt-28">
            <div className="mb-6">
              <h2 className="text-xl font-serif text-slate-900 font-bold">Saved Recipients</h2>
              <p className="text-xs text-slate-500 mt-0.5">Save addresses for Mom, Dad, or partners to check out faster.</p>
            </div>
            
            <RecipientsManager
              initial={recipients.map((r) => ({
                id: r.id,
                nickname: r.nickname,
                firstName: r.firstName,
                lastName: r.lastName,
                city: r.city,
                country: r.country,
              }))}
            />
          </section>

          {/* Section 3: Account Settings */}
          <section id="settings" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm scroll-mt-28">
            <h2 className="text-xl font-serif text-slate-900 font-bold mb-4">Account Settings</h2>
            
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-500">Full Name</span>
                <span className="font-medium text-slate-900">{user.name || "Not set"}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-500">Email Address</span>
                <span className="font-medium text-slate-900">{user.email}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-500">Sign-in Method</span>
                <span className="font-medium text-slate-900">Email & Password</span>
              </div>
            </div>

            <p className="mt-6 text-[11px] text-slate-400 border-t border-slate-100 pt-4">
              Need to update your account details or request account deletion?{" "}
              <Link href="/contact" className="text-[#1C3A30] underline font-medium">
                Contact Support
              </Link>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}