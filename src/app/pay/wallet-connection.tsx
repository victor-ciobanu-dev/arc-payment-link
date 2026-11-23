"use client";

import { useEffect, useState } from "react";
import { isAddress } from "viem";

type WalletEvent = "accountsChanged" | "chainChanged" | "disconnect";
type Listener = (value: unknown) => void;

type InjectedWallet = {
  request(args: { method: string; params?: readonly unknown[] }): Promise<unknown>;
  on(event: WalletEvent, listener: Listener): void;
  removeListener(event: WalletEvent, listener: Listener): void;
};

const arcTestnet = {
  chainId: `0x${(5042002).toString(16)}`,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
};

const buttonClass =
  "rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60";

function getWallet() {
  return (window as Window & { ethereum?: InjectedWallet }).ethereum;
}

function firstAccount(value: unknown) {
  const address: unknown = Array.isArray(value) ? value[0] : undefined;
  return typeof address === "string" && isAddress(address) ? address : null;
}

function hasErrorCode(error: unknown, code: number) {
  return typeof error === "object" && error !== null &&
    "code" in error && error.code === code;
}

export default function WalletConnection() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const wallet = getWallet();
    if (!wallet) return;

    const onAccountsChanged: Listener = (value) => setAccount(firstAccount(value));
    const onChainChanged: Listener = (value) =>
      setChainId(typeof value === "string" ? value.toLowerCase() : null);
    const onDisconnect = () => {
      setAccount(null);
      setChainId(null);
    };

    wallet.on("accountsChanged", onAccountsChanged);
    wallet.on("chainChanged", onChainChanged);
    wallet.on("disconnect", onDisconnect);

    return () => {
      wallet.removeListener("accountsChanged", onAccountsChanged);
      wallet.removeListener("chainChanged", onChainChanged);
      wallet.removeListener("disconnect", onDisconnect);
    };
  }, []);

  async function updateWallet(action: "connect" | "switch") {
    const wallet = getWallet();
    setError("");

    if (!wallet) {
      setError("Open this page in a browser with an EVM wallet extension.");
      return;
    }

    setPending(true);
    try {
      if (action === "connect") {
        await wallet.request({ method: "eth_requestAccounts" });
      } else {
        const switchChain = () => wallet.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: arcTestnet.chainId }],
        });

        try {
          await switchChain();
        } catch (cause) {
          if (!hasErrorCode(cause, 4902)) throw cause;
          await wallet.request({
            method: "wallet_addEthereumChain",
            params: [arcTestnet],
          });
          if (await wallet.request({ method: "eth_chainId" }) !== arcTestnet.chainId) {
            await switchChain();
          }
        }
      }

      const [accounts, activeChain] = await Promise.all([
        wallet.request({ method: "eth_accounts" }),
        wallet.request({ method: "eth_chainId" }),
      ]);
      setAccount(firstAccount(accounts));
      setChainId(typeof activeChain === "string" ? activeChain.toLowerCase() : null);
    } catch (cause) {
      setError(
        hasErrorCode(cause, 4001)
          ? "The wallet request was canceled."
          : action === "connect"
            ? "Could not connect. Check your wallet and try again."
            : "Could not switch networks. Select Arc Testnet in your wallet and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  const isArcTestnet = chainId === arcTestnet.chainId;

  return (
    <section aria-label="Wallet connection" className="space-y-3 border-t border-slate-200 pt-4">
      {account && (
        <>
          <p className="break-all text-sm">Connected wallet: {account}</p>
          <p role="status" className="text-sm">
            {isArcTestnet ? "Connected to Arc Testnet." : "Switch to Arc Testnet to continue."}
          </p>
        </>
      )}

      {!account ? (
        <button className={buttonClass} type="button" disabled={pending} onClick={() => updateWallet("connect")}>
          {pending ? "Check your wallet…" : "Connect wallet"}
        </button>
      ) : !isArcTestnet ? (
        <button className={buttonClass} type="button" disabled={pending} onClick={() => updateWallet("switch")}>
          {pending ? "Check your wallet…" : "Switch to Arc Testnet"}
        </button>
      ) : (
        <p className="text-sm text-slate-600">Test USDC payments are coming in the next version.</p>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
