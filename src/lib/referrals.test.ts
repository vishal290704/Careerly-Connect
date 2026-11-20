import { describe, expect, it, vi } from "vitest";

const {
  findOneReferral,
  findByIdUser,
  findOneUser,
  createReferral,
  updateOneUser,
  existsUser,
} = vi.hoisted(() => ({
  findOneReferral: vi.fn(),
  findByIdUser: vi.fn(),
  findOneUser: vi.fn(),
  createReferral: vi.fn(),
  updateOneUser: vi.fn(),
  existsUser: vi.fn(),
}));

vi.mock("@/models/Referral", () => ({
  Referral: {
    findOne: findOneReferral,
    create: createReferral,
  },
}));
vi.mock("@/models/User", () => ({
  User: {
    findById: findByIdUser,
    findOne: findOneUser,
    exists: existsUser,
    updateOne: updateOneUser,
  },
}));

import { processReferralReward } from "@/lib/referrals";

describe("referral rewards", () => {
  it("does not reward a user who was not referred", async () => {
    findByIdUser.mockReturnValue({
      session: vi.fn(async () => ({ referredBy: undefined })),
    });
    await processReferralReward(
      { toString: () => "user-1" } as never,
      { toString: () => "payment-1" } as never,
      {} as never,
    );
    expect(createReferral).not.toHaveBeenCalled();
  });

  it("does not create duplicate referral records", async () => {
    findByIdUser.mockReturnValueOnce({
      session: vi.fn(async () => ({ referredBy: "referrer-1" })),
    }).mockReturnValueOnce({
      session: vi.fn(async () => ({
        referralCode: "TESTREF",
        successfulReferralCount: 0,
        save: vi.fn(),
      })),
    });
    findOneReferral.mockReturnValue({
      session: vi.fn(async () => ({ _id: "existing-referral" })),
    });

    await processReferralReward(
      { toString: () => "user-1" } as never,
      { toString: () => "payment-1" } as never,
      {} as never,
    );
    expect(createReferral).not.toHaveBeenCalled();
  });
});
