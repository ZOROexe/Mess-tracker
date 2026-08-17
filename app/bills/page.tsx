"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/app/components/Header";
import { MessListSkeleton } from "@/app/components/Skeletons";
import { createMessPayment, fetchMessBill, fetchMessPayments, fetchMesses } from "@/lib/api";
import { CalculatedMessBill, MessPaymentInput } from "@/types/billing";
import { Mess } from "@/types/mess";

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatPeriod(start: string, end: string) {
  const format = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
  return `${format(start)} → ${format(end)}`;
}

function statusClass(status: CalculatedMessBill["status"]) {
  if (status === "paid") return "bg-green-500/15 text-green-300";
  if (status === "partially_paid") return "bg-amber-500/15 text-amber-300";
  return "bg-red-500/15 text-red-300";
}

function PaymentPanel({ mess, bill }: { mess: Mess; bill: CalculatedMessBill }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { data: payments = [], isFetching } = useQuery({
    queryKey: ["mess-payments", mess._id],
    queryFn: () => fetchMessPayments(mess._id),
    enabled: open,
  });
  const paymentMutation = useMutation({
    mutationFn: (payload: MessPaymentInput) => createMessPayment(mess._id, payload),
    onSuccess: () => {
      setAmount("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["mess-payments", mess._id] });
      queryClient.invalidateQueries({ queryKey: ["mess-bills", mess._id] });
    },
  });

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    paymentMutation.mutate({
      amount: Number(amount),
      paymentDate,
      billingPeriodStart: bill.periodStart,
      billingPeriodEnd: bill.periodEnd,
      notes: notes || undefined,
    });
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setOpen((value) => !value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition">
          {open ? "Hide payments" : "View payments"}
        </button>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 transition">
          Add Payment
        </button>
      </div>

      {open && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-black/10 p-4">
          <form onSubmit={submitPayment} className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-gray-300">Amount
              <input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" />
            </label>
            <label className="text-sm text-gray-300">Payment date
              <input required type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" />
            </label>
            <label className="text-sm text-gray-300 sm:col-span-2">Notes (optional)
              <input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white" />
            </label>
            <p className="text-xs text-gray-400 sm:col-span-2">Applied to {formatPeriod(bill.periodStart, bill.periodEnd)}.</p>
            <button type="submit" disabled={paymentMutation.isPending} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {paymentMutation.isPending ? "Adding…" : "Save payment"}
            </button>
          </form>
          {paymentMutation.error && <p className="text-sm text-red-400">{paymentMutation.error.message}</p>}
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment history</p>
            {isFetching ? <p className="text-sm text-gray-400">Loading payments…</p> : payments.length === 0 ? <p className="text-sm text-gray-400">No payments yet.</p> : payments.map((payment: { _id: string; amount: number; paymentDate: string; notes?: string }) => (
              <div key={payment._id} className="flex justify-between gap-4 text-sm text-gray-300">
                <span>{payment.paymentDate}{payment.notes ? ` · ${payment.notes}` : ""}</span><span>₹{payment.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BillCard({ mess, bill }: { mess: Mess; bill: CalculatedMessBill }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/10 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-medium">{mess.name}</h2><p className="text-sm text-gray-400">{formatPeriod(bill.periodStart, bill.periodEnd)}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(bill.status)}`}>{bill.status.replace("_", " ")}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div><p className="text-gray-400">Bill</p><p className="mt-1 font-medium">₹{bill.calculatedAmount}</p></div>
        <div><p className="text-gray-400">Paid</p><p className="mt-1 font-medium">₹{bill.paidAmount}</p></div>
        <div><p className="text-gray-400">Balance</p><p className="mt-1 font-medium">₹{bill.balance}</p></div>
      </div>
      <PaymentPanel mess={mess} bill={bill} />
    </section>
  );
}

export default function BillsPage() {
  const [date, setDate] = useState(today());
  const { data: messes = [], isFetching: messesLoading, error: messesError } = useQuery({ queryKey: ["messes"], queryFn: () => fetchMesses(), staleTime: 60_000 });
  const billQueries = useQueries({
    queries: messes.map((mess) => ({ queryKey: ["mess-bills", mess._id, date], queryFn: () => fetchMessBill(mess._id, date), staleTime: 30_000 })),
  });

  if (messesLoading) return <MessListSkeleton />;
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PageHeader title="Bills" subtitle="Food consumed and payments by mess" actions={[{ label: "Calendar", href: "/" }, { label: "Messes", href: "/settings/messes" }]} />
      <label className="block max-w-xs text-sm text-gray-300">Billing period containing
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white" />
      </label>
      {messesError && <p className="text-sm text-red-400">{messesError.message}</p>}
      {messes.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-400">Add a mess to start tracking bills.</div> : (
        <div className="space-y-4">
          {messes.map((mess, index) => {
            const query = billQueries[index];
            if (query.isFetching) return <div key={mess._id} className="h-52 rounded-2xl bg-white/10 skeleton-shimmer" />;
            if (query.error) return <p key={mess._id} className="text-sm text-red-400">{mess.name}: {query.error.message}</p>;
            return query.data ? <BillCard key={mess._id} mess={mess} bill={query.data} /> : null;
          })}
        </div>
      )}
    </div>
  );
}
