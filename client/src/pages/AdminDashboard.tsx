import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/language-context";
import { formatPriceByCountry } from "@/lib/pricing";
const API = import.meta.env.VITE_API_URL || "";

const ORDER_STATUSES = ["Ordered", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_COLORS: Record<OrderStatus, string> = {
  Ordered: "bg-blue-100 text-blue-800 border-blue-200",
  Processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Shipped: "bg-purple-100 text-purple-800 border-purple-200",
  Delivered: "bg-green-100 text-green-800 border-green-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
};

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface Order {
  id: string;
  order_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  product_ordered?: string;
  product?: string;
  quantity: number;
  total_price: string;
  status: string;
  payment_status: string;
  created_at: string;
  issue_note: string | null;
  items: OrderItem[];
  country?: string;
  state?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const statusKey = status as OrderStatus;
  const className = STATUS_COLORS[statusKey] ?? "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

function fetchOrders(): Promise<Order[]> {
  return fetch(`${API}/api/admin/orders`).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  });
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [issueOrder, setIssueOrder] = useState<Order | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const loadOrders = () => {
    setLoading(true);
    fetchOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!orderId) return;
    setStatusUpdating(orderId);
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch {
      // revert or show toast
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleEdit = (order: Order) => {
    setEditOrder(order);
  };

  const handleDeleteClick = (order: Order) => {
    setDeleteOrder(order);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOrder?.id) return;
    const idToDelete = deleteOrder.id;
    try {
      const res = await fetch(`${API}/api/orders/${idToDelete}`, { method: "DELETE" });
      if (!res.ok) return;
      setOrders((prev) => prev.filter((o) => o.id !== idToDelete));
      setDeleteOrder(null);
    } catch {
      // error
    }
  };

  const handleViewIssue = (order: Order) => {
    setIssueOrder(order);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="px-6 py-8 pt-28 max-w-450 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t.admin.dashboard}</h1>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t.admin.addOrder}
          </button>
        </div>

        <h2 className="text-lg font-semibold mb-4">{t.admin.orders}</h2>

        {loading ? (
          <p className="text-gray-500">{t.admin.loadingOrders}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.orderId}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.customerName}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.email}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.phone}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.address}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">State</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.productOrdered}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.quantity}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.totalPrice}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.status}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.createdAt}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{t.admin.table.actions}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{order.order_id ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{order.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.email ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-45 truncate" title={order.address || undefined}>{order.address || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.state?.trim() ? order.state : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-40 truncate" title={(order.product_ordered || order.product) || undefined}>{(order.product_ordered || order.product) ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{order.quantity ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatPriceByCountry(Number(order.total_price ?? 0), order.country)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        order.payment_status === "paid" ? "bg-green-100 text-green-800" : 
                        order.payment_status === "failed" ? "bg-red-100 text-red-800" : 
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.payment_status?.toUpperCase() ?? "PENDING"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status ?? "Ordered"} />
                        <select
                          value={order.status ?? "Ordered"}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={statusUpdating === order.id}
                          className="rounded border border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(order)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium cursor-pointer"
                        >
                          {t.admin.actions.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(order)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                        >
                          {t.admin.actions.delete}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewIssue(order)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium cursor-pointer"
                        >
                          {t.admin.actions.viewIssue}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length === 0 && !loading && (
          <p className="text-gray-500 mt-4">{t.admin.noOrders}</p>
        )}
      </main>

      {/* Add Order Modal */}
      {addOpen && (
        <AddOrderModal
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setAddOpen(false);
            loadOrders();
          }}
        />
      )}

      {/* Edit Order Modal */}
      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSuccess={() => {
            setEditOrder(null);
            loadOrders();
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteOrder(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-gray-700 mb-4">{t.admin.modals.deleteConfirm}</p>
            <p className="text-sm text-gray-500 mb-6">Order ID: {deleteOrder.order_id}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOrder(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t.admin.modals.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t.admin.actions.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Issue Modal */}
      {issueOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIssueOrder(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">{t.admin.modals.issueTitle}</h3>
            <p className="text-sm text-gray-500 mb-2">Order ID: {issueOrder.order_id}</p>
            <div className="rounded border border-gray-200 bg-gray-50 p-4 min-h-20 text-gray-700">
              {issueOrder.issue_note || t.admin.modals.noIssue}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIssueOrder(null)}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                {t.admin.modals.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddOrderModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<OrderStatus>("Ordered");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/admin/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
          product,
          quantity,
          price: parseFloat(price) || 0,
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Failed to create order");
        return;
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{t.admin.modals.addTitle}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.customerName}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.phone}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.address}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.productOrdered}</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.quantity}</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.totalPrice} (€)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.status}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t.admin.modals.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "..." : t.admin.addOrder}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditOrderModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const first = order.items?.[0];
  const [address, setAddress] = useState(order.address);
  const [product, setProduct] = useState(first?.product_name ?? "");
  const [quantity, setQuantity] = useState(first?.quantity ?? 1);
  const [unitPrice, setUnitPrice] = useState(first ? String(first.unit_price) : "");
  const [status, setStatus] = useState(order.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order.id) {
      setError("Order id is missing");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          city: "-",
          postalCode: "-",
          country: "-",
          product,
          quantity,
          unitPrice: parseFloat(unitPrice) || 0,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to update order");
        return;
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{t.admin.modals.editTitle}</h3>
        <p className="text-sm text-gray-500 mb-4">{t.admin.table.orderId}: {order.order_id}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.address}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.productOrdered}</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.quantity}</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.totalPrice} (€)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.admin.table.status}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t.admin.modals.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "..." : t.admin.modals.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
