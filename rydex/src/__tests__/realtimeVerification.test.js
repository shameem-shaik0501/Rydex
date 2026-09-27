import { RealtimeTransactionVerifier } from "../utils/realtimeVerification";

// Mock Razorpay
jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    // Mock implementation
  }));
});

describe("RealtimeTransactionVerifier", () => {
  let verifier;

  beforeEach(() => {
    verifier = new RealtimeTransactionVerifier();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    verifier.stopAllVerifications();
  });

  test("should initialize with correct default values", () => {
    expect(verifier.pollingInterval).toBe(5000);
    expect(verifier.maxRetries).toBe(12);
    expect(verifier.activePolls.size).toBe(0);
  });

  test("should validate UTR ID format", async () => {
    const result = await verifier.verifyWithRazorpay(
      "INVALID123",
      100,
      "test@upi",
    );
    expect(result.verified).toBe(false);
    expect(result.message).toBe("Invalid UTR ID format");
  });

  test("should accept valid demo UTR IDs", () => {
    const promise = verifier.verifyWithRazorpay(
      "TXN123456789012",
      100,
      "test@upi",
    );
    // Advance timers to complete the simulated delay
    jest.advanceTimersByTime(3000);
    return promise.then((result) => {
      expect(result.verified).toBe(true);
      expect(result.utrId).toBe("TXN123456789012");
      expect(result.amount).toBe(100);
    });
  });

  test("should handle polling timeout", async () => {
    const onStatusUpdate = jest.fn();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    // Start verification with an invalid UTR ID
    const pollId = verifier.startVerification(
      "INVALIDUTR12345",
      100,
      "test@upi",
      onStatusUpdate,
      onSuccess,
      onFailure,
    );

    // Manually advance time to trigger multiple polling attempts
    // Initial delay: 1000ms, then polling every 5000ms
    jest.advanceTimersByTime(1000); // Start first poll
    jest.advanceTimersByTime(5000 * 11); // 11 more polls (total 12 attempts)

    expect(onFailure).toHaveBeenCalledWith(
      "Transaction verification timeout. Please check your UTR ID and try again.",
    );
  });

  test("should stop verification when requested", () => {
    const onStatusUpdate = jest.fn();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    const pollId = verifier.startVerification(
      "TXN123456789012",
      100,
      "test@upi",
      onStatusUpdate,
      onSuccess,
      onFailure,
    );

    verifier.stopVerification(pollId);

    // Should not have called success or failure callbacks
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  test("should handle multiple concurrent verifications", () => {
    const onStatusUpdate1 = jest.fn();
    const onSuccess1 = jest.fn();
    const onFailure1 = jest.fn();

    const onStatusUpdate2 = jest.fn();
    const onSuccess2 = jest.fn();
    const onFailure2 = jest.fn();

    const pollId1 = verifier.startVerification(
      "TXN123456789012",
      100,
      "test@upi",
      onStatusUpdate1,
      onSuccess1,
      onFailure1,
    );
    const pollId2 = verifier.startVerification(
      "UPI123456789013",
      200,
      "test@upi",
      onStatusUpdate2,
      onSuccess2,
      onFailure2,
    );

    expect(verifier.activePolls.size).toBe(2);

    verifier.stopAllVerifications();

    expect(verifier.activePolls.size).toBe(0);
  });
});
