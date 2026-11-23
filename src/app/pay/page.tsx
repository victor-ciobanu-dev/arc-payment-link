import Link from "next/link";
import { Suspense } from "react";
import WalletConnection from "./wallet-connection";
import { validatePaymentRequest } from "@/lib/payment-request";

type PayPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PaymentDetails({ searchParams }: PayPageProps) {
  const { to, amount, note } = await searchParams;
  const request = validatePaymentRequest(to, amount, note ?? "");

  if (!request.ok) {
    return (
      <p role="alert" className="text-red-700">
        Invalid payment link. {request.error}
      </p>
    );
  }

  return (
    <>
      <dl className="space-y-4">
        <div>
          <dt>Requested amount</dt>
          <dd className="text-2xl font-semibold">{request.amount} USDC</dd>
        </div>
        <div>
          <dt>Recipient wallet</dt>
          <dd className="break-all font-mono text-sm">{request.recipient}</dd>
        </div>
        {request.note && (
          <div>
            <dt>Note</dt>
            <dd className="break-words">{request.note}</dd>
          </div>
        )}
      </dl>
      <WalletConnection key={JSON.stringify(request)} recipient={request.recipient} amount={request.amount} />
    </>
  );
}

export default function PayPage({ searchParams }: PayPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-600">Arc Testnet · Test USDC</p>
        <h1 className="text-3xl font-semibold">Payment request</h1>

        <Suspense fallback={<p role="status">Loading payment request…</p>}>
          <PaymentDetails searchParams={searchParams} />
        </Suspense>

        <Link className="inline-block underline" href="/">
          Create a payment link
        </Link>
      </section>
    </main>
  );
}
