import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';

const RC_API_KEY = 'test_fRupYNbZPjhmobrnEKKWceSZJwf';

let configured = false;

export function initializePurchases(): void {
  // RevenueCat disabled until Play Store launch — re-enable with production key
}

export async function loginUser(uid: string): Promise<void> {
  if (!configured || !Purchases) return;
  try {
    await Purchases.logIn(uid);
  } catch (e) {
    console.warn('[RevenueCat] logIn failed:', (e as Error).message);
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured || !Purchases) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function checkIsPremium(): Promise<boolean> {
  if (!configured || !Purchases) return false;
  try {
    const info = await getCustomerInfo();
    return typeof info?.entitlements.active['premium'] !== 'undefined';
  } catch {
    return false;
  }
}
