import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';

const RC_API_KEY = 'test_fRupYNbZPjhmobrnEKKWceSZJwf';

export function initializePurchases(): void {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey: RC_API_KEY });
}

export async function loginUser(uid: string): Promise<void> {
  await Purchases.logIn(uid);
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function checkIsPremium(): Promise<boolean> {
  try {
    const info = await getCustomerInfo();
    return typeof info.entitlements.active['premium'] !== 'undefined';
  } catch {
    return false;
  }
}
