/**
 * Simple toast notification utility
 * Displays temporary notifications at the bottom of the screen
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    duration?: number;
    position?: 'top' | 'bottom';
}

class ToastManager {
    private container: HTMLDivElement | null = null;

    private ensureContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    private show(message: string, type: ToastType, options: ToastOptions = {}) {
        const { duration = 3000 } = options;
        const container = this.ensureContainer();

        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            pointer-events: auto;
            animation: slideIn 0.2s ease-out;
            max-width: 400px;
            ${this.getTypeStyles(type)}
        `;

        toast.textContent = message;
        container.appendChild(toast);

        // Add animation styles if not already added
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Auto-dismiss
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.2s ease-out';
            setTimeout(() => {
                container.removeChild(toast);
            }, 200);
        }, duration);
    }

    private getTypeStyles(type: ToastType): string {
        const styles = {
            success: 'background-color: #10b981; color: white;',
            error: 'background-color: #ef4444; color: white;',
            warning: 'background-color: #f59e0b; color: white;',
            info: 'background-color: #3b82f6; color: white;',
        };
        return styles[type];
    }

    success(message: string, options?: ToastOptions) {
        this.show(message, 'success', options);
    }

    error(message: string, options?: ToastOptions) {
        this.show(message, 'error', options);
    }

    warning(message: string, options?: ToastOptions) {
        this.show(message, 'warning', options);
    }

    info(message: string, options?: ToastOptions) {
        this.show(message, 'info', options);
    }
}

// Export singleton instance
export const toast = new ToastManager();
