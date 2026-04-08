import { DollarSign, FileText, Users, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import RecentInvoices from "@/components/RecentInvoices";

const Dashboard = () => {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's your invoicing overview.</p>
        </div>
        <Link to="/invoices/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value="$24,580" change="+12.5% from last month" changeType="positive" icon={DollarSign} />
        <StatCard title="Invoices Sent" value="18" change="+3 this week" changeType="positive" icon={FileText} />
        <StatCard title="Active Clients" value="12" change="2 new this month" changeType="neutral" icon={Users} />
        <StatCard title="Pending" value="$4,050" change="3 invoices awaiting" changeType="negative" icon={Clock} />
      </div>

      <RecentInvoices />
    </div>
  );
};

export default Dashboard;
