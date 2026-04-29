import type { TFunction } from 'i18next';
import { isOAuthReauthReason, isRateLimitReason } from '@/utils/account-status';

export function getValidationBlockedStatusLabel(
  status: 'active' | 'rate_limited' | 'expired' | undefined,
  reason: string | undefined,
  t: TFunction,
): string | null {
  const normalizedReason = (reason || '').toLowerCase();
  const hasReason = normalizedReason !== '';
  const isBlockedByStatus = status === 'rate_limited' || status === 'expired';

  if (!isBlockedByStatus && !hasReason) {
    return null;
  }

  if (status === 'rate_limited' || isRateLimitReason(normalizedReason)) {
    return t('cloud.card.validationRiskControlled');
  }

  if (status === 'expired' || isOAuthReauthReason(normalizedReason)) {
    return t('cloud.card.validationOAuthReauthRequired');
  }

  return t('cloud.card.validationRequired');
}
