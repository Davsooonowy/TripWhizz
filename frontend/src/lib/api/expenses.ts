import { toast } from '@/components/ui/use-toast';
import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';

const TRIP_API_URL = `${API_URL}/trips/trip`;

export type SplitMethod = 'equal' | 'percentage' | 'exact' | 'shares';

export interface ExpenseShareDto {
  user_id: number;
  percentage?: number | null;
  shares_count?: number | null;
  owed_amount?: number | null;
}

export interface ExpenseDto {
  id?: number;
  trip?: number;
  description: string;
  amount: number;
  currency?: string;
  paid_by_id: number;
  split_method: SplitMethod;
  shares: ExpenseShareDto[];
  created_at?: string;
  updated_at?: string;
}

export interface SettlementDto {
  id?: number;
  trip?: number;
  payer_id: number;
  payee_id: number;
  amount: number;
  currency?: string;
  note?: string;
  created_at?: string;
}

export class ExpensesApiClient extends BaseApiClient {
  private async handle<T>(res: Response): Promise<T> {
    if (res.ok) return (await res.json()) as T;
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) msg = data.detail;
      else if (typeof data === 'object') msg = JSON.stringify(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load expenses', variant: 'destructive' });
    }
    throw new Error(msg);
  }

  async getExpenses(tripId: number): Promise<any[]> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/expenses/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });
    return this.handle<any[]>(response);
  }

  async createExpense(tripId: number, expense: ExpenseDto): Promise<any> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/expenses/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify(expense),
    });
    return this.handle<any>(response);
  }

  async updateExpense(tripId: number, expenseId: number, partial: Partial<ExpenseDto>): Promise<any> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/expenses/${expenseId}/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(partial),
    });
    return this.handle<any>(response);
  }

  async deleteExpense(tripId: number, expenseId: number) {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/expenses/${expenseId}/`, {
      ...this._requestConfiguration(true),
      method: 'DELETE',
    });
    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try { const data = await response.json(); msg = data?.detail || msg; } catch {
        toast({ title: 'Error', description: 'Failed to delete expense', variant: 'destructive' });
      }
      throw new Error(msg);
    }
    return true;
  }

  async getBalances(tripId: number): Promise<any[]> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/balances/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });
    return this.handle<any[]>(response);
  }

  async getSettlements(tripId: number): Promise<any[]> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/settlements/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });
    return this.handle<any[]>(response);
  }

  async createSettlement(tripId: number, settlement: SettlementDto): Promise<any> {
    const response = await fetch(`${TRIP_API_URL}/${tripId}/settlements/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify(settlement),
    });
    return this.handle<any>(response);
  }
}


