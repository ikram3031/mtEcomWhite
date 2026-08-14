import { CreditCard, FileText, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

const BillingPage = () => {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your bills, invoices, and payment transactions</p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <a href="/dashboard/billing/billings">
          <div className="group bg-card border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Bills & Invoices</h2>
            <p className="text-sm text-muted-foreground mb-4">View and manage all customer invoices and billing records</p>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Paid
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3.5 w-3.5" /> Pending
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3.5 w-3.5" /> Failed
              </span>
            </div>
          </div>
        </a>

        <a href="/dashboard/billing/payments">
          <div className="group bg-card border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-violet-500" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Payment Transactions</h2>
            <p className="text-sm text-muted-foreground mb-4">Track all incoming payments via Cash, Card, bKash, and Nagad</p>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3.5 w-3.5" /> Pending
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3.5 w-3.5" /> Failed
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

export default BillingPage;
