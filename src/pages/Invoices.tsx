import { useState, useEffect } from "react";
import { FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  description?: string;
  amount: number;
  status: string;
  due_date?: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-600",
  paid: "bg-green-100 text-green-600",
};

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://invoiceai-backend-oe0z.onrender.com/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setInvoices(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const res = await fetch(`https://invoiceai-backend-oe0z.onrender.com/invoices/${invoice.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to generate PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || "Failed to download PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">All Invoices</h1>
        <p className="text-muted-foreground text-sm">View and manage all your invoices.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 flex flex-col items-center justify-center min-h-[300px] gap-3">
          <FileText className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No invoices yet. Create your first invoice!</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Invoice</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Due Date</span>
            <span></span>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{invoice.invoice_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {invoice.description || "—"}
                  </p>
                </div>
                <div className="font-mono font-semibold text-sm">
                  ${invoice.amount.toFixed(2)}
                </div>
                <div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[invoice.status] || "bg-gray-100 text-gray-600"}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                </div>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice.id}
                  >
                    {downloadingId === invoice.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;