import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ExpenseDto, ExpensesApiClient, SplitMethod } from '@/lib/api/expenses';
import { TripParticipant, TripsApiClient } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import { useEffect, useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';

export default function TripExpensesAddPage() {
  const { tripId } = useParams();
  const { toast } = useToast();

  const api = useMemo(
    () => new ExpensesApiClient(authenticationProviderInstance),
    [],
  );
  const tripsApi = useMemo(
    () => new TripsApiClient(authenticationProviderInstance),
    [],
  );

  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [form, setForm] = useState<ExpenseDto>({
    description: '',
    amount: 0,
    currency: 'PLN',
    paid_by_id: 0,
    split_method: 'equal',
    shares: [],
  });

  useEffect(() => {
    if (!tripId) return;
    (async () => {
      try {
        const trip = await tripsApi.getTripDetails(Number(tripId));
        const people = (trip.participants || []).filter(
          (p: TripParticipant) => p.invitation_status !== 'pending',
        );
        setParticipants(people);
        const baseShares = people.map((p: any) => ({ user_id: p.id }));
        const equalShares = updateShareValues('equal', 0, baseShares);
        setForm((prev) => ({
          ...prev,
          paid_by_id: people[0]?.id || 0,
          split_method: 'equal',
          shares: equalShares,
        }));
      } catch (e: any) {
        toast({
          title: 'Error',
          description: e.message,
          variant: 'destructive',
        });
      }
    })();
  }, [tripId]);

  const updateShareValues = (
    method: SplitMethod,
    total: number,
    shares: any[],
  ) => {
    if (method === 'equal' && shares.length > 0) {
      const per = Math.round((total / shares.length) * 100) / 100;
      return shares.map((s) => ({ ...s, owed_amount: per }));
    }
    return shares;
  };

  const onChangeMethod = (value: SplitMethod) => {
    setForm((prev) => ({
      ...prev,
      split_method: value,
      shares: updateShareValues(value, prev.amount, prev.shares),
    }));
  };

  const onCreateExpense = async () => {
    try {
      if (!tripId) return;
      // Client-side validation to avoid 400
      if (!form.description.trim()) {
        toast({
          title: 'Validation',
          description: 'Description is required.',
          variant: 'destructive',
        });
        return;
      }
      if (!form.paid_by_id) {
        toast({
          title: 'Validation',
          description: 'Select a payer.',
          variant: 'destructive',
        });
        return;
      }
      if (!form.amount || Number(form.amount) <= 0) {
        toast({
          title: 'Validation',
          description: 'Amount must be greater than zero.',
          variant: 'destructive',
        });
        return;
      }
      if (!form.shares || form.shares.length === 0) {
        toast({
          title: 'Validation',
          description: 'Assign shares to at least one participant.',
          variant: 'destructive',
        });
        return;
      }
      if (form.split_method === 'percentage') {
        const total = form.shares.reduce(
          (acc, s: any) => acc + Number(s.percentage || 0),
          0,
        );
        if (Math.round(total * 100) / 100 !== 100) {
          toast({
            title: 'Validation',
            description: 'Percentages must sum to 100%.',
            variant: 'destructive',
          });
          return;
        }
      } else if (form.split_method === 'exact') {
        const total = form.shares.reduce(
          (acc, s: any) => acc + Number(s.owed_amount || 0),
          0,
        );
        if (
          Math.round(total * 100) / 100 !==
          Math.round(Number(form.amount) * 100) / 100
        ) {
          toast({
            title: 'Validation',
            description: 'Exact amounts must sum to the total amount.',
            variant: 'destructive',
          });
          return;
        }
      } else if (form.split_method === 'shares') {
        const totalShares = form.shares.reduce(
          (acc, s: any) => acc + Number(s.shares_count || 0),
          0,
        );
        if (totalShares <= 0) {
          toast({
            title: 'Validation',
            description: 'Total shares must be greater than 0.',
            variant: 'destructive',
          });
          return;
        }
      }

      const payload: ExpenseDto = {
        ...form,
        amount: Number(form.amount),
        paid_by_id: Number(form.paid_by_id),
      };
      await api.createExpense(Number(tripId), payload);
      setForm((prev) => ({ ...prev, description: '', amount: 0 }));
      toast({ title: 'Expense added' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">Add Expense</h2>
      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Payer</Label>
              <Select
                value={String(form.paid_by_id)}
                onValueChange={(v) =>
                  setForm({ ...form, paid_by_id: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Split Method</Label>
              <Select
                value={form.split_method}
                onValueChange={(v) => onChangeMethod(v as SplitMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="exact">Exact</SelectItem>
                  <SelectItem value="shares">Shares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Participants & shares</Label>
            <div className="space-y-2">
              {participants.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="min-w-40">{p.username}</span>
                  {form.split_method === 'percentage' && (
                    <Input
                      type="number"
                      placeholder="%"
                      value={form.shares[idx]?.percentage ?? ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const next = [...form.shares];
                        next[idx] = { user_id: p.id, percentage: val };
                        setForm({ ...form, shares: next });
                      }}
                    />
                  )}
                  {form.split_method === 'exact' && (
                    <Input
                      type="number"
                      placeholder="amount"
                      value={form.shares[idx]?.owed_amount ?? ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const next = [...form.shares];
                        next[idx] = { user_id: p.id, owed_amount: val };
                        setForm({ ...form, shares: next });
                      }}
                    />
                  )}
                  {form.split_method === 'shares' && (
                    <Input
                      type="number"
                      placeholder="shares"
                      value={form.shares[idx]?.shares_count ?? ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const next = [...form.shares];
                        next[idx] = { user_id: p.id, shares_count: val };
                        setForm({ ...form, shares: next });
                      }}
                    />
                  )}
                  {form.split_method === 'equal' && (
                    <span className="text-sm text-muted-foreground">
                      equal split
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onCreateExpense}>Add Expense</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
