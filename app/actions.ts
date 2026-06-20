'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addExpense(formData: FormData) {
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const dateStr = formData.get('date') as string;
    const date = dateStr ? dateStr : new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('expenses').insert([{ amount, description, date }]);

    if (error) {
        throw new Error(error.message);
    }

    revadatePath('/'); // Refresh the page with updated data
}

export async function getMonthlyExpenses() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error.message);
        return [];
    }

    return data || [];
}

export async function deleteExpense(id: string) {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/');
}

export async function updateExpense(id: string, formData: FormData) {
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const dateStr = formData.get('date') as string;

    const { error } = await supabase
        .from('expenses')
        .update({ amount, description, date: dateStr })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/');
}