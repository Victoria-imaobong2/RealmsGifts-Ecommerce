"use client";

import { useRef, useState, use } from "react";
import { PenTool, CheckCircle, RotateCcw } from "lucide-react";

/**
 * Staff-only (guarded by proxy.ts): courier captures the recipient's signature
 * and marks the order delivered. Photo proof isn't stored yet, so it isn't offered.
 */
export default function ProofOfDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const point = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    // Scale from CSS pixels to the canvas's drawing buffer.
    return { x: ((clientX - rect.left) * canvas.width) / rect.width, y: ((clientY - rect.top) * canvas.height) / rect.height };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#252923";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/delivery/pod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, signature: canvasRef.current?.toDataURL("image/png") ?? null }),
      });
      if (res.ok) setSubmitted(true);
      else setError((await res.json().catch(() => ({}))).error || "Failed to record delivery.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-3 text-success" size={48} aria-hidden />
        <h1 className="text-3xl text-ink">Delivery recorded</h1>
        <p className="mt-1 text-sm text-muted">Proof of delivery saved for order {id}.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl text-ink">Proof of delivery</h1>
        <p className="text-sm text-muted">Order ID: {id}</p>
      </div>

      <div className="space-y-3 rounded-3xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <PenTool size={14} className="text-forest" aria-hidden /> Recipient signature
          </p>
          <button type="button" onClick={clearSignature} className="flex items-center gap-1 text-xs text-muted hover:text-ink">
            <RotateCcw size={12} aria-hidden /> Clear
          </button>
        </div>
        <div className="touch-none overflow-hidden rounded-2xl border border-line">
          <canvas
            ref={canvasRef}
            width={800}
            height={320}
            aria-label="Signature pad"
            className="block h-40 w-full cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={() => setIsDrawing(false)}
          />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-sale">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasSigned || saving}
        className="h-12 w-full rounded-full bg-forest text-sm font-semibold text-ivory transition hover:bg-forest-dark disabled:opacity-50"
      >
        {saving ? "Saving…" : "Confirm & finalize delivery"}
      </button>
    </div>
  );
}
