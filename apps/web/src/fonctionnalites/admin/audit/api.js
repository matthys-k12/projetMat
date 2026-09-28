/**
 * Appels HTTP du journal d'audit (ADMIN, lecture seule).
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

/** @param {{ page?: number, limit?: number, action?: string, entityType?: string }} parametres */
export function listerAudit(parametres) {
  return appelerApi('/admin/audit', { parametres });
}
