export const plans = {
  "1-month": { name: "1 month", amount: 84, referralAmount: 59, days: 30 },
  "3-months": { name: "3 months", amount: 252, referralAmount: 159, days: 90 },
  "6-months": { name: "6 months", amount: 504, referralAmount: 279, days: 180 },
} as const;

export type PlanId = keyof typeof plans;
