import { useState, useEffect } from "react";
import { Plus, Loader2, User, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const token = localStorage.getItem("token");

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://invoiceai-backend-oe0z.onrender.com/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setClients(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSaveClient = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("https://invoiceai-backend-oe0z.onrender.com/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, phone, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      toast.success(`Client "${name}" added!`);
      setName(""); setEmail(""); setPhone(""); setAddress("");
      setShowForm(false);
      fetchClients();
    } catch (e: any) {
      toast.error(e.message || "Failed to save client.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">Manage your clients and their invoice history.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div className="bg-card rounded-xl border p-6 mb-6 animate-fade-in">
          <h2 className="font-semibold mb-4">New Client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Acme Corp" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input placeholder="billing@acme.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="123 Main St, Mumbai" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSaveClient} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {saving ? "Saving..." : "Save Client"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 flex flex-col items-center justify-center min-h-[300px] gap-3">
          <User className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No clients yet. Add your first client!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client.id} className="bg-card rounded-xl border p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{client.name[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground">Added {new Date(client.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {client.phone}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {client.address}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;