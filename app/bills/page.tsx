"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMessPayment, fetchMessBill, fetchMessPayments, fetchMesses } from "@/lib/api";
import { CalculatedMessBill, MessPaymentInput } from "@/types/billing";
import { Mess } from "@/types/mess";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatPeriod(start: string, end: string) {
  const format = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${format(start)} → ${format(end)}`;
}

function getStatusVariant(status: CalculatedMessBill["status"]): "paid" | "partially_paid" | "unpaid" {
  if (status === "paid") return "paid";
  if (status === "partially_paid") return "partially_paid";
  return "unpaid";
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
    <div className="space-y-4 pt-2 border-t border-white/[0.04]">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="subtle"
          size="sm"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide Payments" : "View Payments"}
        </Button>
        <Button
          variant={open ? "secondary" : "primary"}
          size="sm"
          onClick={() => setOpen(true)}
        >
          + Add Payment
        </Button>
      </div>

      {open && (
        <div className="space-y-5 rounded-xl border border-white/[0.08] bg-[#171C21] p-4 sm:p-5 animate-scaleIn">
          {/* Payment Form */}
          <form onSubmit={submitPayment} className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9AA3AD]">
              Record Payment
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Amount (₹)"
                required
                min="0.01"
                step="0.01"
                type="number"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                leftElement={<span className="text-xs font-medium">₹</span>}
              />
              <Input
                label="Payment Date"
                required
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </div>
            {/* <Input
              label="Notes (Optional)"
              placeholder="e.g. Paid via UPI / Cash"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            /> */}
            <p className="text-[11px] text-[#68717C]">
              Applied to cycle: <span className="text-[#9AA3AD]">{formatPeriod(bill.periodStart, bill.periodEnd)}</span>
            </p>
            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={paymentMutation.isPending}
                disabled={paymentMutation.isPending || !amount}
              >
                Save Payment
              </Button>
            </div>
          </form>

          {paymentMutation.error && (
            <p className="text-xs text-[#F87171] bg-[#F87171]/10 p-2.5 rounded-lg border border-[#F87171]/20">
              {paymentMutation.error.message}
            </p>
          )}

          {/* Payment History */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9AA3AD]">
              Payment History
            </h4>
            {isFetching ? (
              <div className="space-y-1.5 py-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-xs text-[#68717C] py-2">
                No payments recorded yet for this mess.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {payments.map(
                  (payment: {
                    _id: string;
                    amount: number;
                    paymentDate: string;
                    notes?: string;
                  }) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#12161A] border border-white/[0.04] text-xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#F5F7F8] font-medium">
                          {payment.paymentDate}
                        </span>
                        {payment.notes && (
                          <span className="text-[#9AA3AD] text-[11px] truncate">
                            {payment.notes}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-[#2DD4BF] tabular-nums shrink-0">
                        ₹{payment.amount.toLocaleString()}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BillCard({ mess, bill }: { mess: Mess; bill: CalculatedMessBill }) {
  const statusVariant = getStatusVariant(bill.status);

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#12161A] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-[#F5F7F8] tracking-tight">
            {mess.name}
          </h2>
          <p className="text-xs text-[#9AA3AD] font-medium">
            {formatPeriod(bill.periodStart, bill.periodEnd)}
          </p>
        </div>
        <Badge variant={statusVariant} dot>
          {bill.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Bill Figures Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-3 rounded-lg bg-[#171C21] border border-white/[0.04]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9AA3AD]">
            Calculated
          </p>
          <p className="mt-1 text-sm sm:text-base font-semibold text-[#F5F7F8] tabular-nums">
            ₹{bill.calculatedAmount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9AA3AD]">
            Paid
          </p>
          <p className="mt-1 text-sm sm:text-base font-semibold text-[#2DD4BF] tabular-nums">
            ₹{bill.paidAmount.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#9AA3AD]">
            Balance
          </p>
          <p
            className={`mt-1 text-sm sm:text-base font-semibold tabular-nums ${
              bill.balance > 0 ? "text-[#F87171]" : "text-[#2DD4BF]"
            }`}
          >
            ₹{bill.balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Nested Payment Panel */}
      <PaymentPanel mess={mess} bill={bill} />
    </section>
  );
}

export default function BillsPage() {
  const [date, setDate] = useState(today());
  const {
    data: messes = [],
    isFetching: messesLoading,
    error: messesError,
  } = useQuery({
    queryKey: ["messes"],
    queryFn: () => fetchMesses(),
    staleTime: 60_000,
  });

  const billQueries = useQueries({
    queries: messes.map((mess) => ({
      queryKey: ["mess-bills", mess._id, date],
      queryFn: () => fetchMessBill(mess._id, date),
      staleTime: 30_000,
    })),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
            Bills & Payments
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3AD] mt-0.5">
            Food consumed and payment history by mess
          </p>
        </div>

        {/* Date filter */}
        <div className="w-full sm:w-auto">
          <Input
            label="Cycle reference date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      {messesError && (
        <p className="text-xs text-[#F87171] p-3 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20">
          {messesError.message}
        </p>
      )}

      {messesLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : messes.length === 0 ? (
        <EmptyState
          title="No messes found"
          description="Add a mess to start tracking billing cycles and payments."
        />
      ) : (
        <div className="space-y-4">
          {messes.map((mess, index) => {
            const query = billQueries[index];
            if (query?.isFetching) {
              return <Skeleton key={mess._id} className="h-44 w-full" />;
            }
            if (query?.error) {
              return (
                <div
                  key={mess._id}
                  className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-xs text-[#F87171]"
                >
                  <span className="font-semibold">{mess.name}:</span>{" "}
                  {query.error.message}
                </div>
              );
            }
            return query?.data ? (
              <BillCard key={mess._id} mess={mess} bill={query.data} />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
