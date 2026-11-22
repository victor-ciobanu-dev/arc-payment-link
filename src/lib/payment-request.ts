import { getAddress, isAddress, zeroAddress } from "viem";

export function validatePaymentRequest(
  recipient: unknown,
  amount: unknown,
  note: unknown,
) {
  if (
    typeof recipient !== "string" ||
    !isAddress(recipient) ||
    recipient.toLowerCase() === zeroAddress
  ) {
    return { ok: false, error: "Enter a valid, non-zero wallet address." } as const;
  }

  if (
    typeof amount !== "string" ||
    !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,6})?$/.test(amount) ||
    !/[1-9]/.test(amount)
  ) {
    return {
      ok: false,
      error: "Enter a positive USDC amount with up to 6 decimal places.",
    } as const;
  }

  if (typeof note !== "string" || note.length > 120) {
    return { ok: false, error: "Keep the note to 120 characters or fewer." } as const;
  }

  return { ok: true, recipient: getAddress(recipient), amount, note } as const;
}
