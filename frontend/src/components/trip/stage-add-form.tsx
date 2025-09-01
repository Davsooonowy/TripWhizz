import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MapPin, Plus } from 'lucide-react';
import { stageCategories } from '@/components/trip/stage-constants';

import { useState } from 'react';

export interface StageFormData {
  name: string;
  category: string;
  description?: string;
  dateRange?: { from?: Date; to?: Date };
}

function getCategoryDetails(categoryId: string) {
  const found = stageCategories.find((c) => c.id === categoryId);
  return (
    found || {
      id: 'unknown',
      name: 'Unknown',
      icon: MapPin,
      color: 'bg-gray-500',
    }
  );
}

export default function StageAddForm({ onSubmit, submitting }: { onSubmit: (data: StageFormData) => void; submitting?: boolean }) {
  const [form, setForm] = useState<StageFormData>({ name: '', category: '', description: '', dateRange: { from: undefined, to: undefined } });

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stage-name">Stage Name</Label>
            <Input id="stage-name" placeholder="e.g., Paris Exploration" value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage-category">Category</Label>
            <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}>
              <SelectTrigger id="stage-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {stageCategories.map((cat) => {
                  const details = getCategoryDetails(cat.id);
                  const Icon = details.icon as any;
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center">
                        <div className={cn('p-1.5 rounded-md mr-2', details.color)}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        {details.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.category && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {(() => {
              const selected = getCategoryDetails(form.category);
              const Icon = selected.icon as any;
              return (
                <>
                  <div className={cn('p-2 rounded-md', selected.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span>Selected: {selected.name}</span>
                </>
              );
            })()}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="stage-date">Date Range (Optional)</Label>
          <DatePickerWithRange date={form.dateRange as any} setDate={(dateRange) => setForm((prev) => ({ ...prev, dateRange }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage-description">Description (Optional)</Label>
          <Textarea id="stage-description" placeholder="Add details about this stage..." value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="min-h-[80px]" />
        </div>
        <Button className="w-full group" disabled={submitting || !form.name || !form.category} onClick={() => onSubmit(form)}>
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          {submitting ? 'Adding...' : 'Add Stage'}
        </Button>
      </CardContent>
    </Card>
  );
}
