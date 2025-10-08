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
import { useToast } from '@/components/ui/use-toast';
import { ExpensesApiClient, SettlementDto } from '@/lib/api/expenses';
import { TripParticipant, TripsApiClient } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import { useEffect, useMemo, useState } from 'react';

import { useParams, useSearchParams } from 'react-router-dom';

export default function TripExpensesSplitPage() {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
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
  const [payerId, setPayerId] = useState<number>(0);
  const [payeeId, setPayeeId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [showAllSettlements, setShowAllSettlements] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    (async () => {
      try {
        const trip = await tripsApi.getTripDetails(Number(tripId));
        const people = (trip.participants || []).filter(
          (p: TripParticipant) => p.invitation_status !== 'pending',
        );
        setParticipants(people);
        const qpPayer = Number(searchParams.get('payer') || 0);
        const qpPayee = Number(searchParams.get('payee') || 0);
        const qpAmount = Number(searchParams.get('amount') || 0);
        setPayerId(qpPayer || people[0]?.id || 0);
        setPayeeId(qpPayee || people[1]?.id || people[0]?.id || 0);
        setAmount(qpAmount || 0);
        const existing: any[] = await api.getSettlements(Number(tripId));
        setSettlements(existing as any[]);
      } catch (e: any) {
        toast({
          title: 'Error',
          description: e.message,
          variant: 'destructive',
        });
      }
    })();
  }, [tripId]);

  const onCreateSettlement = async () => {
    try {
      if (!tripId) return;
      if (!payerId || !payeeId || payerId === payeeId) {
        toast({
          title: 'Validation',
          description: 'Please select two different participants.',
          variant: 'destructive',
        });
        return;
      }
      if (amount <= 0) {
        toast({
          title: 'Validation',
          description: 'Amount must be positive.',
          variant: 'destructive',
        });
        return;
      }
      const payload: SettlementDto = {
        payer_id: payerId,
        payee_id: payeeId,
        amount,
      };
      const created = await api.createSettlement(Number(tripId), payload);
      setSettlements((prev) => [created, ...prev]);
      toast({ title: 'Settlement added' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">Settle Up</h2>
      <Card>
        <CardHeader>
          <CardTitle>Add Settlement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Payer</Label>
              <Select
                value={String(payerId)}
                onValueChange={(v) => setPayerId(Number(v))}
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
              <Label>Payee</Label>
              <Select
                value={String(payeeId)}
                onValueChange={(v) => setPayeeId(Number(v))}
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
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={onCreateSettlement}>Add</Button>
            </div>
          </div>

          <div className="space-y-3">
            {(showAllSettlements ? settlements : settlements.slice(0, 5)).map(
              (s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span>
                    {s.payer?.username} → {s.payee?.username}
                  </span>
                  <span>
                    {s.amount} {s.currency}
                  </span>
                </div>
              ),
            )}
            {settlements.length > 5 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllSettlements((v) => !v)}
                >
                  {showAllSettlements ? 'Show less' : 'Show all'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
