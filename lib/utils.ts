export function calculateTotal(expenses: { amount: number }[]): number {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

export type DateFilter = 'this_month' | 'last_month' | 'this_year' | 'all';

export function getDateRange(filter: DateFilter): { startDate: string; endDate: string } {
    const now = new Date();

    switch (filter) {
        case 'this_month':
            return {
                startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
            };
        case 'last_month':
            return {
                startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
                endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
            };
        case 'this_year':
            return {
                startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
                endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
            };
        case 'all':
        default:
            return {
                startDate: '1970-01-01',
                endDate: new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0],
            };
    }
}