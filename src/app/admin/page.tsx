"use client";

import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import { PlusCircle, Search, UploadCloud, Loader2, Edit, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog/taxonomy";
import { formatMoney } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/order-status";

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category?: string;
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

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Inline Stock Edit
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  // Full Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
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
        console.error("Load failed:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    initialFetch();
    return () => { ignore = true; };
  }, []);

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>, isModal = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
      const data = await res.json();

      if (res.ok && data.url) {
        if (isModal && editingProduct) {
          setEditingProduct({ ...editingProduct, images: [data.url] });
        } else {
          setFormData((prev) => ({ ...prev, imageUrl: data.url }));
        }
      } else {
        alert(data.error || "Image upload failed. Ensure Vercel Blob storage is configured.");
        setImagePreview(null);
      }
    } catch {
      alert("Error uploading file.");
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
        alert("Product published!");
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

  const handleSaveFullProductEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          title: editingProduct.title,
          price: editingProduct.price,
          stock: editingProduct.stock,
          description: editingProduct.description,
          imageUrl: editingProduct.images?.[0] ?? "",
          category: editingProduct.category,
        }),
      });

      if (res.ok) {
        alert("Product updated!");
        setEditingProduct(null);
        refreshData();
      } else {
        alert("Failed to update product details.");
      }
    } catch {
      alert("Error saving updates.");
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
      }
    } catch {
      alert("Error updating stock.");
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
      }
    } catch {
      alert("Failed to update order status.");
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
          <p className="text-xs text-slate-500">Manage store catalogue, update prices, track stock, and manage orders</p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`rounded-lg px-4 py-2 transition ${activeTab === "products" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`rounded-lg px-4 py-2 transition ${activeTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("add-product")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${activeTab === "add-product" ? "bg-forest text-white shadow-sm" : "text-slate-500"}`}
          >
            <PlusCircle size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-medium uppercase text-slate-500">
                <th className="p-4">Product</th>
                <th className="p-4">Price (NGN)</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="transition hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-800">{prod.title}</td>
                  <td className="p-4 font-medium text-slate-900">{formatMoney(prod.price)}</td>
                  <td className="p-4 text-center">
                    {editingStockId === prod.id ? (
                      <div className="inline-flex items-center gap-2">
                        <input
                          type="number"
                          value={tempStockValue}
                          onChange={(e) => setTempStockValue(parseInt(e.target.value, 10) || 0)}
                          className="w-16 rounded border border-slate-300 p-1 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateStock(prod.id, tempStockValue)}
                          className="rounded bg-forest px-2 py-1 font-bold text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${prod.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {prod.stock > 0 ? `${prod.stock} units` : "Out of stock"}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prod)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Edit size={12} /> Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingStockId(prod.id); setTempStockValue(prod.stock); }}
                      className="text-[11px] font-semibold text-forest hover:underline"
                    >
                      Edit Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none"
              />
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
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50">
                    <td className="p-4 font-mono">{order.orderNumber ?? order.id.slice(-8)}</td>
                    <td className="p-4 text-slate-600">{order.email || "—"}</td>
                    <td className="p-4 font-semibold text-slate-900">{formatMoney(order.total)}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-bold text-forest">
                        {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] ?? order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        aria-label={`Update status for order ${order.id}`}
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                      >
                        {STAFF_STATUSES.map((status) => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD PRODUCT TAB */}
      {activeTab === "add-product" && (
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Add Item to Catalog</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div>
              <label className="mb-1 block font-semibold text-slate-700">Product Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Luxury Gift Set"
                className="w-full rounded-lg border border-slate-200 p-2.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Price (NGN ₦)</label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="45000"
                  className="w-full rounded-lg border border-slate-200 p-2.5"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Initial Stock</label>
                <input
                  required
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="25"
                  className="w-full rounded-lg border border-slate-200 p-2.5"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-700">Product Photo</label>
              <div className="relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
                <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e)} className="absolute inset-0 opacity-0" />
                {uploadingImage ? (
                  <Loader2 className="animate-spin text-forest" size={20} />
                ) : imagePreview ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <UploadCloud size={20} className="mx-auto text-slate-400" />
                    <span className="font-semibold text-slate-700">Click to pick photo from device</span>
                  </div>
                )}
              </div>
            </div>
            <button type="submit" disabled={uploadingImage} className="w-full rounded-lg bg-forest py-2.5 font-semibold text-white">
              Publish Item
            </button>
          </form>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h3 className="font-serif text-lg font-bold text-slate-900">Edit Product: {editingProduct.title}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveFullProductEdit} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Price (NGN ₦)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 p-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Change Photo</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, true)} className="w-full text-xs" />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingProduct(null)} className="rounded-lg border px-4 py-2 font-semibold text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-forest px-4 py-2 font-semibold text-white">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}