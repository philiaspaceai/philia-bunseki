
class LoggerService {
    private logs: string[] = [];

    public log(message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry); // Also log to console for real-time debugging
    }

    private getLogsAsString(): string {
        return this.logs.join('\n');
    }

    public downloadLogs(): void {
        this.log('Memulai unduhan log...');
        const logData = this.getLogsAsString();
        const blob = new Blob([logData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'log.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export a singleton instance
export const logger = new LoggerService();
