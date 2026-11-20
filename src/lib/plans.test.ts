import { describe, expect, it } from "vitest";
import { plans, type PlanId } from "@/lib/plans";

describe("subscription plans", () => {
  it("contains all supported plans with valid pricing and durations", () => {
    expect(Object.keys(plans)).toEqual(["1-month", "3-months", "6-months"]);
    expect(plans["1-month"]).toEqual({ name: "1 month", amount: 84, referralAmount: 59, days: 30 });
    expect(plans["3-months"]).toEqual({ name: "3 months", amount: 252, referralAmount: 159, days: 90 });
    expect(plans["6-months"]).toEqual({ name: "6 months", amount: 504, referralAmount: 279, days: 180 });

    for (const plan of Object.values(plans)) {
      expect(plan.amount).toBeGreaterThan(0);
      expect(plan.referralAmount).toBeGreaterThan(0);
      expect(plan.referralAmount).toBeLessThan(plan.amount);
      expect(plan.days).toBeGreaterThan(0);
    }
  });

  it("rejects unknown plan identifiers at the type boundary", () => {
    const invalidPlan = "12-months";
    expect(Object.hasOwn(plans, invalidPlan)).toBe(false);
    expect(["1-month", "3-months", "6-months"].includes(invalidPlan as PlanId)).toBe(false);
  });

  it("calculates referral discount and savings without mutating plan values", () => {
    const plan = plans["3-months"];
    const discount = plan.amount - plan.referralAmount;
    expect(discount).toBe(93);
    expect(plan.amount).toBe(252);
    expect(plan.referralAmount).toBe(159);
  });
});
