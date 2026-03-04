const PROBE_TIMEOUT_MS = 10000;

export interface ProbeResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export async function probeServer(url: string): Promise<ProbeResult> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return { ok: true, status: response.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}
