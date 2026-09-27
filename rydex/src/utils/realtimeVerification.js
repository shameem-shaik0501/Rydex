// Real-time verification utility
// Note: For client-side payments, simulated verification is used for demo and testing.

export class RealtimeTransactionVerifier {
  constructor() {
    this.pollingInterval = 5000; // 5 seconds
    this.maxRetries = 12; // Max 1 minute of polling
    this.activePolls = new Map();
  }

  /**
   * Start real-time verification of a UTR ID
   * @param {string} utrId - The UTR ID to verify
   * @param {number} expectedAmount - Expected payment amount
   * @param {string} upiId - UPI ID used for payment
   * @param {function} onStatusUpdate - Callback for status updates
   * @param {function} onSuccess - Callback when verification succeeds
   * @param {function} onFailure - Callback when verification fails
   * @returns {string} - Poll ID for tracking
   */
  startVerification(
    utrId,
    expectedAmount,
    upiId,
    onStatusUpdate,
    onSuccess,
    onFailure,
  ) {
    const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let retryCount = 0;

    const poll = async () => {
      try {
        onStatusUpdate(
          `Checking transaction status... (Attempt ${retryCount + 1}/${this.maxRetries})`,
        );

        // In production, this would call Razorpay's API to verify the transaction
        // For demo, we'll simulate real-time verification
        const result = await this.verifyWithRazorpay(
          utrId,
          expectedAmount,
          upiId,
        );

        if (result.verified) {
          onSuccess(result);
          this.activePolls.delete(pollId);
          return;
        } else if (retryCount >= this.maxRetries - 1) {
          onFailure(
            "Transaction verification timeout. Please check your transaction ID and try again.",
          );
          this.activePolls.delete(pollId);
          return;
        }

        retryCount++;
        this.activePolls.set(pollId, setTimeout(poll, this.pollingInterval));
      } catch (error) {
        console.error("Verification error:", error);
        onFailure("Unable to verify transaction. Please try again later.");
        this.activePolls.delete(pollId);
      }
    };

    // Start polling
    this.activePolls.set(pollId, setTimeout(poll, 1000)); // Start after 1 second

    return pollId;
  }

  /**
   * Stop a specific verification poll
   * @param {string} pollId - The poll ID to stop
   */
  stopVerification(pollId) {
    if (this.activePolls.has(pollId)) {
      clearTimeout(this.activePolls.get(pollId));
      this.activePolls.delete(pollId);
    }
  }

  /**
   * Stop all active verification polls
   */
  stopAllVerifications() {
    for (const timeoutId of this.activePolls.values()) {
      clearTimeout(timeoutId);
    }
    this.activePolls.clear();
  }

  /**
   * Verify transaction with Razorpay API
   * @param {string} utrId - UTR ID to verify
   * @param {number} expectedAmount - Expected amount
   * @param {string} upiId - UPI ID
   * @returns {Promise<Object>} - Verification result
   */
  async verifyWithRazorpay(utrId, expectedAmount, upiId) {
    // Basic validation first
    const upiUtrRegex = /^[A-Za-z0-9]{12,18}$/;
    if (!upiUtrRegex.test(utrId)) {
      return {
        verified: false,
        message: "Invalid UTR ID format",
      };
    }

    try {
      // In production, you would:
      // 1. Use Razorpay's payment verification API
      // 2. Check payment status via webhook or API polling
      // 3. Verify amount, UPI ID, and transaction details

      // For demo purposes, simulate API call with realistic delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000),
      );

      // Simulate successful verification for demo transaction IDs
      const isDemoValid =
        utrId.length >= 12 &&
        (utrId.toUpperCase().startsWith("TXN") ||
          utrId.toUpperCase().startsWith("UPI"));

      if (isDemoValid) {
        return {
          verified: true,
          utrId,
          amount: expectedAmount,
          upiId,
          timestamp: new Date().toISOString(),
          paymentId: `pay_${Date.now()}`,
          status: "captured",
        };
      } else {
        return {
          verified: false,
          message: "Transaction not found or payment not completed",
        };
      }
    } catch (error) {
      console.error("Razorpay API error:", error);
      return {
        verified: false,
        message: "Unable to verify transaction with payment gateway",
      };
    }
  }
}

// Export singleton instance
export const realtimeVerifier = new RealtimeTransactionVerifier();
