import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpenseForm from '../app/components/ExpenseForm';

describe('ExpenseForm', () => {
  it('renders all form inputs and the submit button', () => {
    render(<ExpenseForm />);

    // Assert Description input exists
    expect(screen.getByLabelText(/description/i)).toBeDefined();
    
    // Assert Amount input exists
    expect(screen.getByLabelText(/amount/i)).toBeDefined();

    // Assert Date input exists
    expect(screen.getByLabelText(/date/i)).toBeDefined();

    // Assert Submit button exists
    expect(screen.getByRole('button', { name: /add expense/i })).toBeDefined();
  });
});