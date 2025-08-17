import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ExpensesApiClient, ExpenseDto, SplitMethod, SettlementDto } from '@/lib/api/expenses';
import { TripsApiClient, TripParticipant } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function TripExpensesPage() {
  const { tripId } = useParams();
  const { toast } = useToast();

  const api = useMemo(() => new ExpensesApiClient(authenticationProviderInstance), []);
  const tripsApi = useMemo(() => new TripsApiClient(authenticationProviderInstance), []);

  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

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
        const people = (trip.participants || []).filter((p: TripParticipant) => p.invitation_status !== 'pending');
        setParticipants(people);
        setForm((prev) => ({ ...prev, paid_by_id: people[0]?.id || 0, shares: people.map((p) => ({ user_id: p.id })) }));

        const [exp, bal, setl] = await Promise.all([
          api.getExpenses(Number(tripId)),
          api.getBalances(Number(tripId)),
          api.getSettlements(Number(tripId)),
        ]);
        setExpenses(exp);
        setBalances(bal);
        setSettlements(setl);
      } catch (e: any) {
        toast({ title: 'Błąd', description: e.message, variant: 'destructive' });
      }
    })();
  }, [tripId]);

  const updateShareValues = (method: SplitMethod, total: number, shares: any[]) => {
    if (method === 'equal' && shares.length > 0) {
      const per = Math.round((total / shares.length) * 100) / 100;
      return shares.map((s) => ({ ...s, owed_amount: per }));
    }
    return shares;
  };

  const onChangeMethod = (value: SplitMethod) => {
    setForm((prev) => ({ ...prev, split_method: value, shares: updateShareValues(value, prev.amount, prev.shares) }));
  };

  const onCreateExpense = async () => {
    try {
      if (!tripId) return;
      const payload: ExpenseDto = { ...form, amount: Number(form.amount), paid_by_id: Number(form.paid_by_id) };
      const created = await api.createExpense(Number(tripId), payload);
      setExpenses((prev) => [created, ...prev]);
      toast({ title: 'Dodano wydatek' });
    } catch (e: any) {
      toast({ title: 'Błąd', description: e.message, variant: 'destructive' });
    }
  };

  const onCreateSettlement = async (payerId: number, payeeId: number, amount: number) => {
    try {
      if (!tripId) return;
      const payload: SettlementDto = { payer_id: payerId, payee_id: payeeId, amount };
      const created = await api.createSettlement(Number(tripId), payload);
      setSettlements((prev) => [created, ...prev]);
      const bal = await api.getBalances(Number(tripId));
      setBalances(bal);
      toast({ title: 'Dodano rozliczenie' });
    } catch (e: any) {
      toast({ title: 'Błąd', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Wydatki</TabsTrigger>
          <TabsTrigger value="balances">Salda</TabsTrigger>
          <TabsTrigger value="settlements">Rozliczenia</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Dodaj wydatek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Opis</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>Kwota</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Płatnik</Label>
                  <Select value={String(form.paid_by_id)} onValueChange={(v) => setForm({ ...form, paid_by_id: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Metoda podziału</Label>
                  <Select value={form.split_method} onValueChange={(v) => onChangeMethod(v as SplitMethod)}>
                    <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Po równo</SelectItem>
                      <SelectItem value="percentage">Procentowo</SelectItem>
                      <SelectItem value="exact">Kwotowo</SelectItem>
                      <SelectItem value="shares">Udziały</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Uczestnicy i udziały</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {participants.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="min-w-24">{p.username}</span>
                      {form.split_method === 'percentage' && (
                        <Input type="number" placeholder="%" value={form.shares[idx]?.percentage ?? ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = [...form.shares];
                            next[idx] = { user_id: p.id, percentage: val };
                            setForm({ ...form, shares: next });
                          }} />
                      )}
                      {form.split_method === 'exact' && (
                        <Input type="number" placeholder="kwota" value={form.shares[idx]?.owed_amount ?? ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = [...form.shares];
                            next[idx] = { user_id: p.id, owed_amount: val };
                            setForm({ ...form, shares: next });
                          }} />
                      )}
                      {form.split_method === 'shares' && (
                        <Input type="number" placeholder="udziały" value={form.shares[idx]?.shares_count ?? ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = [...form.shares];
                            next[idx] = { user_id: p.id, shares_count: val };
                            setForm({ ...form, shares: next });
                          }} />
                      )}
                      {form.split_method === 'equal' && (
                        <span className="text-sm text-muted-foreground">po równo</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={onCreateExpense}>Dodaj</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {expenses.map((e) => (
              <Card key={e.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.description}</div>
                    <div className="text-sm text-muted-foreground">{e.amount} {e.currency} — zapłacił: {e.paid_by?.username}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Salda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {balances.map((b) => (
                <div key={b.user.id} className="flex items-center justify-between">
                  <span>{b.user.username}</span>
                  <span className={Number(b.balance) < 0 ? 'text-red-500' : 'text-green-600'}>{b.balance.toFixed(2)} PLN</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <CardTitle>Dodaj rozliczenie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Płaci</Label>
                  <Select onValueChange={(v) => setForm((prev) => ({ ...prev, paid_by_id: Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem value={String(p.id)} key={p.id}>{p.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Odbiera</Label>
                  <Select onValueChange={(v) => setForm((prev) => ({ ...prev, shares: [{ user_id: Number(v) }] }))}>
                    <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem value={String(p.id)} key={p.id}>{p.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kwota</Label>
                  <Input type="number" onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))} />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => onCreateSettlement(form.paid_by_id, form.shares[0]?.user_id || 0, Number(form.amount))}>Dodaj</Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                {settlements.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span>{s.payer?.username} → {s.payee?.username}</span>
                    <span>{s.amount} {s.currency}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


