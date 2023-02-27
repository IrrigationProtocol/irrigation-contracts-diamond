export class ExponentialBackoff {
  callback: () => Promise<any>; // a function that returns a promise
  maxAttempts: number; // the maximum number of attempts
  attempts: number; // the current number of attempts
  delayMs: number; // the delay in milliseconds before retrying
  maxDelayMs: number; // the maximum delay in milliseconds before retrying

  constructor(callback: () => Promise<any>, maxAttempts = 5, delayMs = 1000, maxDelayMs = 5000) {
    this.callback = callback; // sets the callback function
    this.maxAttempts = maxAttempts; // sets the maximum number of attempts
    this.attempts = 0; // initializes the number of attempts to zero
    this.delayMs = delayMs; // sets the delay in milliseconds before retrying
    this.maxDelayMs = maxDelayMs; // sets the maximum delay in milliseconds before retrying
  }

  // a private method that implements the exponential backoff logic
  private backoff(): Promise<void> {
    return new Promise(resolve => {
      const delay = Math.min(this.delayMs * 2 ** this.attempts, this.maxDelayMs);
      setTimeout(resolve, delay);
    });
  }

  // a public method that runs the callback function with exponential backoff
  async execute(): Promise<any> {
    while (this.attempts < this.maxAttempts) {
      try {
        this.attempts++;
        const result = await this.callback();
        return result;
      } catch (error) {
        if (this.attempts === this.maxAttempts) {
          throw error;
        } else {
          await this.backoff();
        }
      }
    }
  }
}
