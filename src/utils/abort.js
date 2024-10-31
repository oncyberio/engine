// @ts-check

export const ABORT_MSG = "ABORT_IF_SPACE_WAS_DISPOSED";

/**
 *
 * @param { Error } err
 */
export function IS_ABORT_ERROR(err) {
  return err.message === ABORT_MSG;
}

/**
 *
 * @param { AbortSignal } signal
 */
export function CHECK_ABORT_SIGNAL(signal) {
  if (signal?.aborted) {
    throw new Error(ABORT_MSG);
  }
}

/**
 * @param { AbortSignal } signal
 * @param { (x: any) => void } reject
 */
export function REJECT_IF_ABORTED(signal, reject) {
  if (signal?.aborted) {
    reject(new Error(ABORT_MSG));

    return true;
  }

  return false;
}

/**
 *
 * @param { AbortSignal[] } signals
 * @returns
 */
export function combineAbortSignals(signals) {
  const controller = new AbortController();

  function onAbort() {
    controller.abort();

    // Cleanup
    for (const signal of signals) {
      signal?.removeEventListener("abort", onAbort);
    }
  }

  for (const signal of signals) {
    if (signal?.aborted) {
      onAbort();

      break;
    }
    signal?.addEventListener("abort", onAbort);
  }

  return controller.signal;
}
