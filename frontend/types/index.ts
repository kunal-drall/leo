// Trust Score Types
export enum TrustTier {
  Newcomer = 0,
  Silver = 1,
  Gold = 2,
  Platinum = 3,
}

export interface TrustMetrics {
  totalPayments: bigint;
  onTimePayments: bigint;
  latePayments: bigint;
  completedCircles: bigint;
  totalCircles: bigint;
  defaultedCircles: bigint;
  trustScore: bigint;
  tier: TrustTier;
}

// Circle Types
export enum CircleStatus {
  Active = 0,
  Completed = 1,
  Defaulted = 2,
}

export interface CircleInfo {
  circleId: bigint;
  creator: string;
  contributionAmount: bigint;
  duration: bigint;
  maxMembers: bigint;
  currentMembers: bigint;
  currentMonth: bigint;
  status: CircleStatus;
  requiredTrustScore: bigint;
  createdAt: bigint;
}

export interface Circle extends CircleInfo {
  members?: string[];
  payoutQueue?: string[];
}

// Insurance Types
export interface InsuranceDetails {
  totalPool: bigint;
  claimsProcessed: bigint;
  bonusPool: bigint;
  distributed: boolean;
}

// Yield Types
export interface YieldInfo {
  deposited: bigint;
  earned: bigint;
  withdrawn: bigint;
  lastUpdateTime: bigint;
  active: boolean;
}

// Collateral Types
export interface CollateralPosition {
  btcDeposited: bigint;
  musdMinted: bigint;
  collateralRatio: bigint;
  liquidationPrice: bigint;
  active: boolean;
}

export interface HealthMetrics {
  isHealthy: boolean;
  isAtRisk: boolean;
  needsAction: boolean;
  currentRatio: bigint;
  safeRatio: bigint;
}

// UI Types
export interface PaymentStatus {
  circleId: bigint;
  month: bigint;
  hasPaid: boolean;
  dueDate?: Date;
  isLate?: boolean;
}

export const getTierName = (tier: TrustTier): string => {
  return ["Newcomer", "Silver", "Gold", "Platinum"][tier];
};

export const getTierColor = (tier: TrustTier): string => {
  return ["gray", "gray", "yellow", "purple"][tier];
};

export const getStatusName = (status: CircleStatus): string => {
  return ["Active", "Completed", "Defaulted"][status];
};

export const getStatusColor = (status: CircleStatus): string => {
  return ["green", "blue", "red"][status];
};
