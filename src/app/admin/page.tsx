"use client";

import { useState, useEffect, useMemo, type SubmitEvent } from "react";
import { PlusCircle, Search } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog/taxonomy";
import { formatMoney } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/order-status";

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  description?: string;
  images?: string[];
}

interface Order {
  id: string;
  orderNumber?: string | null;
  total: number;
  status: string;
  email?: string | null;
  createdAt: string;
}

const STAFF_STATUSES = ["PENDING", "PREPARING", "READY_FOR_DELIVERY", "DISPATCHED", "DELIVERED", "CANCELLED"] as const;

type SortOption = "date-desc" | "date-asc" | "amount-high" | "amount-low";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "add-product">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    category: "gift-boxes",
  });

  const refreshData = async () => {
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/orders"),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (orderRes.ok) setOrders(await orderRes.json());
    } catch (err) {
      console.error("Failed to refresh dashboard:", err);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const [prodRes, orderRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/orders"),
        ]);

        if (ignore) return;
        if (prodRes.ok) setProducts(await prodRes.json());
        if (orderRes.ok) setOrders(await orderRes.json());
      } catch (err) {
        console.error("Dashboard initial load failed:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initialFetch();

    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateProduct = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: Number.parseFloat(formData.price),
          stock: Number.parseInt(formData.stock, 10),
          imageUrl: formData.imageUrl,
          category: formData.category,
        }),
      });

      if (res.ok) {
        alert("Product published successfully!");
        setFormData({ title: "", description: "", price: "", stock: "", imageUrl: "", category: "gift-boxes" });
        setActiveTab("products");
        refreshData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add product.");
      }
    } catch {
      alert("Error saving product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update status.");
      }
    } catch {
      alert("Failed to update status.");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Boolean(order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          Boolean(order.email?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "amount-high") return b.total - a.total;
        if (sortBy === "amount-low") return a.total - b.total;
        return 0;
      });
  }, [orders, searchQuery, statusFilter, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-xs text-slate-500">Manage store catalogue, track shipments, and oversee orders</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "products" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "orders" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("add-product")}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "add-product" ? "bg-forest text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <PlusCircle size={14} /> Add Product
          </button>
        </div>
      </div>

      {activeTab === "products" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium">
                <th className="p-4">Title</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-semibold text-slate-800">{prod.title}</td>
                  <td className="p-4 font-medium text-slate-900">{formatMoney(prod.price)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      prod.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {prod.stock > 0 ? `${prod.stock} in stock` : "Out of stock"}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">
                    No products found. Add your first item using the button above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search order number or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-forest"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                aria-label="Filter orders by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none"
              >
                <option value="ALL">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                aria-label="Sort orders"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-high">Amount (High to Low)</option>
                <option value="amount-low">Amount (Low to High)</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-medium">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const statusBadgeColor =
                    order.status === "PAID"
                      ? "bg-forest-soft text-forest"
                      : order.status === "DELIVERED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700";

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-medium text-slate-700">{order.orderNumber ?? order.id.slice(-8)}</td>
                      <td className="p-4 text-slate-600">{order.email || "—"}</td>
                      <td className="p-4 font-semibold text-slate-900">{formatMoney(order.total)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadgeColor}`}>
                          {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ?? order.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <select
                          aria-label={`Update status for order ${order.id}`}
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="text-[11px] border border-slate-200 rounded px-2 py-1 outline-none"
                        >
                          {order.status === "PAID" && <option value="PAID" disabled>Paid (set by Paystack)</option>}
                          {order.status === "PAYMENT_FAILED" && <option value="PAYMENT_FAILED" disabled>Payment failed</option>}
                          {STAFF_STATUSES.map((status) => (
                            <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No orders match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "add-product" && (
        <div className="max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Add Item to Catalog</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div>
              <label htmlFor="product-title" className="block font-semibold text-slate-700 mb-1">
                Product Title
              </label>
              <input
                id="product-title"
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Rose Gold Pendant Necklace"
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-price" className="block font-semibold text-slate-700 mb-1">
                  Price (USD)
                </label>
                <input
                  id="product-price"
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="49.99"
                  step="0.01"
                  min="0.01"
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-forest"
                />
              </div>

              <div>
                <label htmlFor="product-stock" className="block font-semibold text-slate-700 mb-1">
                  Initial Stock
                </label>
                <input
                  id="product-stock"
                  required
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="50"
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-category" className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="product-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-forest bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-image" className="block font-semibold text-slate-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                id="product-image"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://… (must be a photo of this exact product)"
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-forest"
              />
            </div>

            <div>
              <label htmlFor="product-desc" className="block font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="product-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details on pack size, origin, shelf life..."
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-forest hover:bg-forest-dark text-white font-semibold rounded-lg transition"
            >
              Publish Item
            </button>
          </form>
        </div>
      )}
    </div>
  );
}