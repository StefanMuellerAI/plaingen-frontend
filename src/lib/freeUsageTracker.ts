interface UsageData {
  count: number;
  date: string;
}

export class FreeUsageTracker {
  private static readonly STORAGE_KEY = 'free_usage';
  private static readonly DAILY_LIMIT = 10;

  static async getRemainingGenerations(): Promise<number> {
    const usage = await this.getTodayUsage();
    return Math.max(0, this.DAILY_LIMIT - usage.count);
  }

  static async canGenerate(): Promise<boolean> {
    const remaining = await this.getRemainingGenerations();
    return remaining > 0;
  }

  static async incrementUsage(): Promise<boolean> {
    const usage = await this.getTodayUsage();
    
    if (usage.count >= this.DAILY_LIMIT) {
      return false;
    }

    usage.count++;
    await this.saveUsage(usage);
    return true;
  }

  private static async getTodayUsage(): Promise<UsageData> {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const data: UsageData = stored ? JSON.parse(stored) : { count: 0, date: today };

    if (data.date !== today) {
      data.count = 0;
      data.date = today;
      await this.saveUsage(data);
    }

    return data;
  }

  private static async saveUsage(usage: UsageData): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
  }
} 