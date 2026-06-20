import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../lib/utils';

describe('calculateTotal', () => {
    it('should return 0 for an empty array', () => {
        expect(calculateTotal([])).toBe(0);
    });

    it('should calculate the correct total for multiple expenses', () => {
        const expenses = [
            { amount: 10.5 },
            { amount: 20.0 },
            { amount: 5.25 }
        ];
        expect(calculateTotal(expenses)).toBe(35.75);
    });

    it('should handle stringified numbers (e.g. from database)', () => {
        const expenses = [
            { amount: '100' as unknown as number },
            { amount: '50.5' as unknown as number }
        ];
        expect(calculateTotal(expenses)).toBe(150.5);
    });
});