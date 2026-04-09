import { useState } from "react";
import { Plus, Trash2, Sparkles, Eye, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

const createLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  rate: 0,
});

const NewInvoice = () => {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([createLineItem()]);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => setLineItems((prev) => [...prev, createLineItem()]);

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  const handleAiSuggest = async () => {
    if (!serviceDescription.trim()) {
      toast.error("Enter a brief description first so AI can improve it.");
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch("http://localhost:8000/ai/suggest", {
          method: "POST",
          headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
  body: JSON.stringify({ description: serviceDescription }),
});
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);
      if (data?.suggestion) {
        setServiceDescription(data.suggestion);
        toast.success("Description improved by AI!");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to get AI suggestion.");
    } finally {
      setAiLoading(false);
    }
  };
  const handleSaveDraft = async () => {
  if (!clientName.trim()) { toast.error("Please enter a client name."); return; }
  if (subtotal === 0) { toast.error("Please add a line item with an amount."); return; }
  setSavingDraft(true);
  try {
    const token = localStorage.getItem("token");
    const invoiceNumber = `INV-${Date.now()}`;
    const response = await fetch("http://localhost:8000/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        invoice_number: invoiceNumber,
        description: serviceDescription || lineItems.map(i => i.description).join(", "),
        amount: subtotal,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail);
    setSavedInvoiceId(data.id);
    toast.success(`Draft saved! Invoice #${invoiceNumber}`);  
  } catch (e: any) {
    toast.error(e.message || "Failed to save draft.");
  } finally {
    setSavingDraft(false);
  }
};
const handleDownloadPdf = async () => {
  if (!savedInvoiceId) {
    toast.error("Save the draft first before downloading.");
    return;
  }
  const token = localStorage.getItem("token");
  const response = await fetch(`http://localhost:8000/invoices/${savedInvoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    toast.error("Failed to generate PDF.");
    return;
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${savedInvoiceId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Invoice</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in the details to generate a professional invoice.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Client Details */}
        <section className="bg-card rounded-xl border p-6 animate-fade-in">
          <h2 className="font-semibold tracking-tight mb-4">Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                placeholder="Acme Corp"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="billing@acme.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="clientAddress">Address</Label>
              <Input
                id="clientAddress"
                placeholder="123 Main St, New York, NY 10001"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Service Description */}
        <section className="bg-card rounded-xl border p-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold tracking-tight">Service Description</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiSuggest}
              disabled={aiLoading}
              className="gap-1.5"
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              )}
              {aiLoading ? "Improving..." : "AI Suggest"}
            </Button>
          </div>
          <Textarea
            placeholder="e.g. Website redesign and development for e-commerce platform"
            rows={3}
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Type a brief description and click AI Suggest to make it professional.
          </p>
        </section>

        {/* Line Items */}
        <section className="bg-card rounded-xl border p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold tracking-tight">Line Items</h2>
            <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
          </div>

          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_100px_120px_120px_40px] gap-3 mb-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <span className="text-xs font-medium text-muted-foreground">Qty</span>
            <span className="text-xs font-medium text-muted-foreground">Rate ($)</span>
            <span className="text-xs font-medium text-muted-foreground">Amount</span>
            <span />
          </div>

          <div className="space-y-3">
            {lineItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_120px_40px] gap-3 items-center"
              >
                <Input
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value))}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.rate || ""}
                  placeholder="0.00"
                  onChange={(e) => updateLineItem(item.id, "rate", Number(e.target.value))}
                />
                <div className="flex items-center h-10 px-3 rounded-md bg-secondary text-sm font-mono font-medium">
                  ${(item.quantity * item.rate).toFixed(2)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Due Date & Actions */}
        <section className="bg-card rounded-xl border p-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 w-full md:w-64">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSaveDraft} disabled={savingDraft}>
                {savingDraft ? "Saving..." : "Save Draft"}
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf} disabled={!savedInvoiceId}>
                Download PDF
              </Button>
              <Link to="/invoices/preview">
                <Button className="gap-2">
                  <Eye className="w-4 h-4" />
                  Preview Invoice
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NewInvoice;
