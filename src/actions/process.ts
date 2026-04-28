import { ipc } from '@/ipc/manager';

export function isProcessRunning() {
  return ipc.client.proc.isProcessRunning();
}

export function closeGeminiNexus() {
  return ipc.client.proc.closeGeminiNexus();
}

export function startGeminiNexus() {
  return ipc.client.proc.startGeminiNexus();
}
