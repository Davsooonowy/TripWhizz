import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ExpensesApiClient } from '@/lib/api/expenses';
import { TripsApiClient, TripParticipant } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

export default function TripExpensesOverviewPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const api = useMemo(() => new ExpensesApiClient(authenticationProviderInstance), []);
  const tripsApi = useMemo(() => new TripsApiClient(authenticationProviderInstance), []);

  const [tripName, setTripName] = useState<string>('');
  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [details, setDetails] = useState<{ other: TripParticipant; amount: number; direction: 'owes' | 'owed' }[]>([]);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const formatAmount = (v: number) => {
    const x = Math.abs(v) < 0.005 ? 0 : v;
    return Number(x).toFixed(2);
  };

  useEffect(() => {
    if (!tripId) return;
    (async () => {
      try {
        const trip = await tripsApi.getTripDetails(Number(tripId));
        setTripName(trip?.name || 'Trip');
        const accepted = (trip.participants || []).filter((p: TripParticipant) => p.invitation_status !== 'pending');
        setParticipants(accepted);
        const [exp, bal, setl]: [any[], any[], any[]] = await Promise.all([
          api.getExpenses(Number(tripId)),
          api.getBalances(Number(tripId)),
          api.getSettlements(Number(tripId)),
        ]);
        setExpenses(exp);
        setBalances(bal);
        setSettlements(setl);
      } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
      }
    })();
  }, [tripId]);

  const computeDetails = (userId: number) => {
    // pairNet[u][v] = amount u owes v (>0 means u owes v)
    const pairNet = new Map<number, Map<number, number>>();
    const addOwes = (u: number, v: number, amount: number) => {
      if (!pairNet.has(u)) pairNet.set(u, new Map());
      const inner = pairNet.get(u)!;
      inner.set(v, (inner.get(v) || 0) + amount);
    };

    for (const e of expenses) {
      const payerId = e.paid_by?.id || e.paid_by_id;
      if (!payerId) continue;
      for (const s of e.shares || []) {
        const shareUserId = s.user?.id ?? s.user_id;
        const owed = Number(s.owed_amount || 0);
        if (!shareUserId || !owed) continue;
        if (shareUserId === payerId) continue; // payer doesn't owe themselves
        addOwes(shareUserId, payerId, owed);
      }
    }

    for (const s of settlements) {
      const payer = s.payer?.id ?? s.payer_id;
      const payee = s.payee?.id ?? s.payee_id;
      const amount = Number(s.amount || 0);
      if (!payer || !payee || !amount) continue;
      // Settlement reduces payer->payee debt
      addOwes(payer, payee, -amount);
    }

    // Build per-other user net vs selected user
    const out: { other: TripParticipant; amount: number; direction: 'owes' | 'owed' }[] = [];

    for (const p of participants) {
      if (p.id === userId) continue;
      const a = (pairNet.get(userId)?.get(p.id) || 0) - (pairNet.get(p.id)?.get(userId) || 0);
      if (a > 0.005) {
        // user owes other
        out.push({ other: p, amount: Math.round(a * 100) / 100, direction: 'owes' });
      } else if (a < -0.005) {
        // other owes user
        out.push({ other: p, amount: Math.round(-a * 100) / 100, direction: 'owed' });
      }
    }

    setDetails(out);
  };

  const onSelectUser = (userId: number) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setDetails([]);
      return;
    }
    setSelectedUserId(userId);
    computeDetails(userId);
  };

  const onSettleUp = (otherUserId: number, direction: 'owes' | 'owed', amount: number) => {
    if (!tripId || !selectedUserId) return;
    const payer = direction === 'owes' ? selectedUserId : otherUserId;
    const payee = direction === 'owes' ? otherUserId : selectedUserId;
    navigate(`/trip/${tripId}/expenses/split?payer=${payer}&payee=${payee}&amount=${amount}`);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Expenses Overview</h2>
        <p className="text-sm text-muted-foreground">{tripName}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {balances.length === 0 && (
            <p className="text-sm text-muted-foreground">No balances yet.</p>
          )}
          {balances.map((b) => (
            <button
              type="button"
              key={b.user.id}
              onClick={() => onSelectUser(b.user.id)}
              className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-accent ${selectedUserId === b.user.id ? 'bg-accent' : ''}`}
            >
              <span>{b.user.username}</span>
              <span className={Number(b.balance) < 0 ? 'text-red-500' : 'text-green-600'}>
                {formatAmount(Number(b.balance))} PLN
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {details.length === 0 && (
              <p className="text-sm text-muted-foreground">No outstanding pairwise balances.</p>
            )}
            {details.map((d) => (
              <div key={d.other.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {d.direction === 'owes' ? (
                    <span>You owe {d.other.username}</span>
                  ) : (
                    <span>{d.other.username} owes you</span>
                  )}
                  <span className="font-medium">{formatAmount(d.amount)} PLN</span>
                </div>
                <Button size="sm" onClick={() => onSettleUp(d.other.id, d.direction, d.amount)}>Settle Up</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenses.length === 0 && (
            <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
          )}
          {(showAllExpenses ? expenses : expenses.slice(0, 5)).map((e) => (
            <div key={e.id} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">{e.description}</div>
                <div className="text-sm text-muted-foreground">Paid by {e.paid_by?.username}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{e.amount} {e.currency}</div>
                <div className="text-xs text-muted-foreground uppercase">{e.split_method}</div>
              </div>
            </div>
          ))}
          {expenses.length > 5 && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAllExpenses((v) => !v)}>
                {showAllExpenses ? 'Show less' : 'Show all'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">Tip: Use "Settle Up" to add settlements, or "Add Expense" to record a new bill split.</p>
    </div>
  );
}


