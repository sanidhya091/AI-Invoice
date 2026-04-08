import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: "paid" | "pending" | "overdue";
}

const invoices: Invoice[] = [
  { id: "INV-001", client: "Acme Corp", amount: "$4,500.00", date: "Apr 5, 2026", status: "paid" },
  { id: "INV-002", client: "Globex Inc", amount: "$2,250.00", date: "Apr 3, 2026", status: "pending" },
  { id: "INV-003", client: "Stark Industries", amount: "$8,100.00", date: "Mar 28, 2026", status: "paid" },
  { id: "INV-004", client: "Wayne Enterprises", amount: "$1,800.00", date: "Mar 25, 2026", status: "overdue" },
  { id: "INV-005", client: "Umbrella Corp", amount: "$3,400.00", date: "Mar 20, 2026", status: "paid" },
];

const statusVariant: Record<Invoice["status"], "default" | "secondary" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  overdue: "destructive",
};

const RecentInvoices = () => {
  return (
    <div className="bg-card rounded-xl border animate-fade-in">
      <div className="p-6 border-b">
        <h2 className="font-semibold tracking-tight">Recent Invoices</h2>
        <p className="text-sm text-muted-foreground mt-1">Your latest generated invoices</p>
      </div>
      <div className="divide-y">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground w-20">{inv.id}</span>
              <div>
                <p className="text-sm font-medium">{inv.client}</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold font-mono">{inv.amount}</span>
              <Badge variant={statusVariant[inv.status]} className="capitalize text-xs">
                {inv.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentInvoices;
