"use client";

import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import { PlusCircle, Search, UploadCloud, Loader2 } from "lucide-react";
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

  // Inline Stock Editing State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        alert(data.error || "Failed to upload image.");
        setImagePreview(null);
      }
    } catch {
      alert("Error uploading image file.");
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: FormEvent<HTMLFormElement>) => {
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
        setImagePreview(null);
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

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, stock: newStock }),
      });

      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
        setEditingStockId(null);
      } else {
        alert("Failed to update stock quantity.");
      }
    } catch {
      alert("Error updating stock quantity.");
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-xs text-slate-500">Manage store catalogue, track shipments, and oversee orders</p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "products" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("add-product")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${
              activeTab === "add-product" ? "bg-forest text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <PlusCircle size={14} /> Add Product
          </button>
        </div>
      </div>

      {activeTab === "products" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-medium uppercase text-slate-500">
                <th className="p-4">Title</th>
                <th className="p-4">Price (NGN)</th>
                <th className="p-4 text-right">Stock Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="transition hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-800">{prod.title}</td>
                  <td className="p-4 font-medium text-slate-900">{formatMoney(prod.price)}</td>
                  <td className="p-4 text-right">
                    {editingStockId === prod.id ? (
                      <div className="inline-flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={tempStockValue}
                          onChange={(e) => setTempStockValue(parseInt(e.target.value, 10) || 0)}
                          className="w-20 rounded border border-slate-300 px-2 py-1 text-center text-xs outline-none focus:border-forest"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateStock(prod.id, tempStockValue)}
                          className="rounded bg-forest px-2.5 py-1 text-[11px] font-bold text-white hover:bg-forest-dark"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStockId(null)}
                          className="rounded bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-end gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            prod.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {prod.stock > 0 ? `${prod.stock} units` : "Out of stock"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStockId(prod.id);
                            setTempStockValue(prod.stock);
                          }}
                          className="text-[11px] font-semibold text-forest hover:underline"
                        >
                          Edit Stock
                        </button>
                      </div>
                    )}
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
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search order number or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-forest"
              />
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <select
                aria-label="Filter orders by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
              >
                <option value="ALL">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sort orders"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-high">Amount (High to Low)</option>
                <option value="amount-low">Amount (Low to High)</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-medium uppercase text-slate-500">
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
                    <tr key={order.id} className="transition hover:bg-slate-50">
                      <td className="p-4 font-mono font-medium text-slate-700">
                        {order.orderNumber ?? order.id.slice(-8)}
                      </td>
                      <td className="p-4 text-slate-600">{order.email || "—"}</td>
                      <td className="p-4 font-semibold text-slate-900">{formatMoney(order.total)}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadgeColor}`}>
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
                          className="rounded border border-slate-200 px-2 py-1 text-[11px] outline-none"
                        >
                          {order.status === "PAID" && (
                            <option value="PAID" disabled>
                              Paid (set by Paystack)
                            </option>
                          )}
                          {order.status === "PAYMENT_FAILED" && (
                            <option value="PAYMENT_FAILED" disabled>
                              Payment failed
                            </option>
                          )}
                          {STAFF_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
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
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Add Item to Catalog</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div>
              <label htmlFor="product-title" className="mb-1 block font-semibold text-slate-700">
                Product Title
              </label>
              <input
                id="product-title"
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Red Velvet Deluxe Celebration Cake"
                className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-forest"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-price" className="mb-1 block font-semibold text-slate-700">
                  Price (NGN ₦)
                </label>
                <input
                  id="product-price"
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="45000"
                  step="0.01"
                  min="0.01"
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-forest"
                />
              </div>

              <div>
                <label htmlFor="product-stock" className="mb-1 block font-semibold text-slate-700">
                  Initial Stock Quantity
                </label>
                <input
                  id="product-stock"
                  required
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="25"
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-forest"
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-category" className="mb-1 block font-semibold text-slate-700">
                Category
              </label>
              <select
                id="product-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 outline-none focus:border-forest"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Device Image Picker Area */}
            <div>
              <label className="mb-1 block font-semibold text-slate-700">Product Photo</label>
              <div className="relative flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition hover:border-forest">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />

                {uploadingImage ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-forest">
                    <Loader2 size={18} className="animate-spin" /> Uploading image...
                  </div>
                ) : imagePreview ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                    <Image src={imagePreview} alt="Upload preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-500">
                    <UploadCloud size={22} className="mx-auto mb-1 text-slate-400" />
                    <p className="font-semibold text-slate-700">Click to select photo from device</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, or WEBP</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="product-image" className="mb-1 block font-semibold text-slate-700">
                Image URL (Auto-filled or manual)
              </label>
              <input
                id="product-image"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://… (auto-fills when you pick a photo above)"
                className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-forest"
              />
            </div>

            <div>
              <label htmlFor="product-desc" className="mb-1 block font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="product-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details on pack size, origin, shelf life..."
                className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-forest"
              />
            </div>

            <button
              type="submit"
              disabled={uploadingImage}
              className="w-full rounded-lg bg-forest py-2.5 font-semibold text-white transition hover:bg-forest-dark disabled:opacity-50"
            >
              Publish Item
            </button>
          </form>
        </div>
      )}
    </div>
  );
}