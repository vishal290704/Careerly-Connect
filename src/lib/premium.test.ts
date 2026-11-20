import { beforeEach, describe, expect, it, vi } from "vitest";

const { paymentFindOne } = vi.hoisted(() => ({
  paymentFindOne: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn(async () => undefined) }));
vi.mock("@/models/Payment", () => ({
  Payment: {
    findOne: paymentFindOne,
  },
}));

import { getPremiumStatus } from "@/lib/premium";

function paymentQuery(result: { subscriptionExpiresAt?: Date } | null) {
  return {
    sort: () => ({
      lean: vi.fn(async () => result),
    }),
  };
}

describe("Premium subscription access", () => {
  beforeEach(() => {
    paymentFindOne.mockReset();
  });

  it("returns Free for a missing expiration date", async () => {
    const status = await getPremiumStatus({ premiumExpiresAt: undefined } as never, new Date("2026-11-20"));
    expect(status.active).toBe(false);
  });

  it("returns Free for an expired subscription", async () => {
    const status = await getPremiumStatus({
      premiumExpiresAt: new Date("2026-11-01"),
    } as never, new Date("2026-11-20"));
    expect(status.active).toBe(false);
  });

  it("requires an approved payment record", async () => {
    paymentFindOne.mockReturnValue(paymentQuery(null));
    const status = await getPremiumStatus({
      premiumExpiresAt: new Date("2026-12-20"),
    } as never, new Date("2026-11-20"));
    expect(status.active).toBe(false);
  });

  it("returns active Premium within the approved valid period", async () => {
    const expiresAt = new Date("2026-12-20");
    paymentFindOne.mockReturnValue(paymentQuery({ subscriptionExpiresAt: expiresAt }));
    const status = await getPremiumStatus({
      premiumExpiresAt: expiresAt,
    } as never, new Date("2026-11-20"));
    expect(status.active).toBe(true);
    expect(status.remainingDays).toBe(30);
  });

  it("returns Free when the approved subscription has expired", async () => {
    paymentFindOne.mockReturnValue(paymentQuery({ subscriptionExpiresAt: new Date("2026-11-19") }));
    const status = await getPremiumStatus({
      premiumExpiresAt: new Date("2026-11-19"),
    } as never, new Date("2026-11-20"));
    expect(status.active).toBe(false);
  });
});
