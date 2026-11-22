"use client";

import { useState, type FormEvent } from "react";
import { validatePaymentRequest } from "@/lib/payment-request";

const fieldClass =
  "w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950";

export default function Home() {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLink("");
    setError("");
    setCopyStatus("");

    const fields = new FormData(event.currentTarget);
    const request = validatePaymentRequest(
      fields.get("recipient")?.toString().trim(),
      fields.get("amount")?.toString().trim(),
      fields.get("note")?.toString().trim(),
    );

    if (!request.ok) {
      setError(request.error);
      return;
    }

    const url = new URL("/pay", window.location.origin);
    url.searchParams.set("to", request.recipient);
    url.searchParams.set("amount", request.amount);
    if (request.note) url.searchParams.set("note", request.note);
    setLink(url.toString());
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Link copied.");
    } catch {
      setCopyStatus("Copy the link from the field above.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header>
          <p className="text-sm font-medium text-slate-600">Arc Testnet · Test USDC</p>
          <h1 className="mt-2 text-3xl font-semibold">Create a payment link</h1>
        </header>

        <form className="space-y-4" onSubmit={createLink}>
          <label className="block space-y-1">
            <span>Recipient wallet</span>
            <input className={fieldClass} name="recipient" placeholder="0x…" required />
          </label>
          <label className="block space-y-1">
            <span>Amount (USDC)</span>
            <input className={fieldClass} name="amount" inputMode="decimal" placeholder="12.50" required />
          </label>
          <label className="block space-y-1">
            <span>Note (optional)</span>
            <input className={fieldClass} name="note" maxLength={120} />
            <span className="block text-sm text-slate-600">Anyone with the link can read this note.</span>
          </label>
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white" type="submit">
            Create link
          </button>
        </form>

        {link && (
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <label className="block space-y-1">
              <span>Payment link</span>
              <input className={fieldClass} value={link} readOnly />
            </label>
            <div className="flex flex-wrap gap-4">
              <button className="underline" type="button" onClick={copyLink}>Copy link</button>
              <a className="underline" href={link} target="_blank" rel="noreferrer">
                Open request in new tab
              </a>
            </div>
          </div>
        )}
        <p role="status">{copyStatus}</p>
      </section>
    </main>
  );
}
