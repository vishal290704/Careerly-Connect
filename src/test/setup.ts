import { afterEach, vi } from "vitest";

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/applyora_test";
process.env.JWT_ACCESS_SECRET = "ci-only-test-secret-not-for-production";
process.env.ADMIN_BOOTSTRAP_USERNAME = "test-admin";
process.env.ADMIN_BOOTSTRAP_PASSWORD = "test-password";
process.env.APP_URL = "http://localhost:3000";

afterEach(() => {
  vi.clearAllMocks();
});
