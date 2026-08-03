export const SHIPPING_STATE_TIERS: Record<string, number> = {
    // Tier 1: Local/Nearby States (40 INR)
    'TAMIL NADU': 40,
    'KERALA': 40,
    'KARNATAKA': 40,
    'ANDHRA PRADESH': 40,
    'TELANGANA': 40,
    'PUDUCHERRY': 40,
    'LAKSHADWEEP': 40,

    // Tier 2: Regional/Medium Distance (60 INR)
    'MAHARASHTRA': 60,
    'GOA': 60,
    'GUJARAT': 60,
    'MADHYA PRADESH': 60,
    'CHHATTISGARH': 60,
    'ODISHA': 60,
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 60,

    // Tier 3: Distant States (80 INR)
    'DELHI': 80,
    'HARYANA': 80,
    'PUNJAB': 80,
    'RAJASTHAN': 80,
    'UTTAR PRADESH': 80,
    'UTTARAKHAND': 80,
    'WEST BENGAL': 80,
    'BIHAR': 80,
    'JHARKHAND': 80,
    'JAMMU AND KASHMIR': 80,
    'LADAKH': 80,
    'HIMACHAL PRADESH': 80,
    'ASSAM': 80,
    'ARUNACHAL PRADESH': 80,
    'MANIPUR': 80,
    'MEGHALAYA': 80,
    'MIZORAM': 80,
    'NAGALAND': 80,
    'SIKKIM': 80,
    'TRIPURA': 80,
    'CHANDIGARH': 80,
    'ANDAMAN AND NICOBAR ISLANDS': 80
};

export const DEFAULT_SHIPPING_FEE = 99;

/**
 * Fallback to map Indian pincode prefix to normalized state name.
 */
export function getStateFromPincode(pincode: string): string | null {
    if (!pincode || pincode.length < 2) return null;
    const prefix2 = pincode.substring(0, 2);
    const prefix3 = pincode.substring(0, 3);

    if (prefix3 === '403') return 'GOA';
    if (prefix3 === '744') return 'ANDAMAN AND NICOBAR ISLANDS';

    const p2 = parseInt(prefix2, 10);
    if (isNaN(p2)) return null;

    if (p2 === 11) return 'DELHI';
    if (p2 >= 12 && p2 <= 13) return 'HARYANA';
    if (p2 >= 14 && p2 <= 15) return 'PUNJAB';
    if (p2 === 16) return 'CHANDIGARH';
    if (p2 === 17) return 'HIMACHAL PRADESH';
    if (p2 >= 18 && p2 <= 19) return 'JAMMU AND KASHMIR';
    if (p2 >= 20 && p2 <= 28) return 'UTTAR PRADESH';
    if (p2 >= 30 && p2 <= 34) return 'RAJASTHAN';
    if (p2 >= 36 && p2 <= 39) return 'GUJARAT';
    if (p2 >= 40 && p2 <= 44) return 'MAHARASHTRA';
    if (p2 >= 45 && p2 <= 48) return 'MADHYA PRADESH';
    if (p2 === 49) return 'CHHATTISGARH';
    if (p2 >= 50 && p2 <= 53) return 'TELANGANA';
    if (p2 >= 56 && p2 <= 59) return 'KARNATAKA';
    if (p2 >= 60 && p2 <= 64) return 'TAMIL NADU';
    if (p2 >= 67 && p2 <= 69) return 'KERALA';
    if (p2 >= 70 && p2 <= 74) return 'WEST BENGAL';
    if (p2 >= 75 && p2 <= 77) return 'ODISHA';
    if (p2 === 78) return 'ASSAM';
    if (p2 === 79) return 'SIKKIM';
    if (p2 >= 80 && p2 <= 85) return 'BIHAR';

    return null;
}
