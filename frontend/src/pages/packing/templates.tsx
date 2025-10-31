import { useTripContext } from '@/components/util/trip-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { PackingApiClient, PACKING_CATEGORIES } from '@/lib/api/packing';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

import * as React from 'react';

import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type TemplateItem = { name: string; category?: string; quantity?: number };
type TemplateDef = { key: string; name: string; items: TemplateItem[] };

const PRESET_TEMPLATES: TemplateDef[] = [
	{
		key: 'beach_basic',
		name: 'Beach Weekend',
		items: [
			{ name: 'Swimsuit', category: 'Clothing', quantity: 1 },
			{ name: 'Towel', category: 'Clothing', quantity: 1 },
			{ name: 'Sunscreen', category: 'Toiletries', quantity: 1 },
			{ name: 'Sunglasses', category: 'Accessories', quantity: 1 },
			{ name: 'Flip-flops', category: 'Clothing', quantity: 1 },
			{ name: 'Hat', category: 'Accessories', quantity: 1 },
			{ name: 'Water bottle', category: 'Food', quantity: 1 },
		],
	},
	{
		key: 'city_break',
		name: 'City Break',
		items: [
			{ name: 'Comfortable shoes', category: 'Clothing', quantity: 1 },
			{ name: 'Jacket', category: 'Clothing', quantity: 1 },
			{ name: 'Phone charger', category: 'Electronics', quantity: 1 },
			{ name: 'Power bank', category: 'Electronics', quantity: 1 },
			{ name: 'Toothbrush', category: 'Toiletries', quantity: 1 },
			{ name: 'Passport/ID', category: 'Documents', quantity: 1 },
		],
	},
	{
		key: 'hiking_day',
		name: 'Hiking Day Trip',
		items: [
			{ name: 'Hiking boots', category: 'Clothing', quantity: 1 },
			{ name: 'Rain jacket', category: 'Clothing', quantity: 1 },
			{ name: 'Backpack', category: 'Gear', quantity: 1 },
			{ name: 'Snacks', category: 'Food', quantity: 2 },
			{ name: 'Water bottle', category: 'Food', quantity: 2 },
			{ name: 'First aid kit', category: 'Gear', quantity: 1 },
			{ name: 'Map/Offline maps', category: 'Electronics', quantity: 1 },
		],
	},
];

const GLOBAL_TEMPLATES_KEY = 'TW_PACKING_TEMPLATES_GLOBAL';

export default function PackingTemplatesPage() {
	const { selectedTrip, trips, isLoading } = useTripContext();
	const { toast } = useToast();
	const api = React.useMemo(
		() => new PackingApiClient(authenticationProviderInstance),
		[],
	);
	const [currentListId, setCurrentListId] = React.useState<number | null>(null);
	const [userTemplates, setUserTemplates] = React.useState<TemplateDef[]>([]);

	const [draftName, setDraftName] = React.useState('My Template');
	const [draftItems, setDraftItems] = React.useState<TemplateItem[]>([]);
	const [newItemName, setNewItemName] = React.useState('');
	const [newItemCategory, setNewItemCategory] = React.useState<string | undefined>(PACKING_CATEGORIES[0]?.label || 'Clothing');
	const [newItemQty, setNewItemQty] = React.useState<number>(1);

	React.useEffect(() => {
		const init = async () => {
			if (!selectedTrip?.id) return;
			try {
				const privateLists = await api.listPackingLists(selectedTrip.id, 'private');
				let list = privateLists[0];
				if (!list) {
					list = await api.createPackingList(selectedTrip.id, {
						name: 'My Items',
						description: 'Personal packing list',
						list_type: 'private',
					});
				}
				setCurrentListId(list.id);
			} catch {}
		};
		init();
	}, [api, selectedTrip]);

	React.useEffect(() => {
		try {
			const raw = localStorage.getItem(GLOBAL_TEMPLATES_KEY);
			if (raw) setUserTemplates(JSON.parse(raw));
		} catch {}
	}, []);

	const persistUserTemplates = (list: TemplateDef[]) => {
		localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(list));
	};

	const applyTemplate = async (tpl: TemplateDef, listType: 'private' | 'shared') => {
		if (!selectedTrip?.id) return;
		try {
			let targetListId = currentListId;
			if (listType === 'shared') {
				const sharedLists = await api.listPackingLists(selectedTrip.id, 'shared');
				let shared = sharedLists[0];
				if (!shared) {
					shared = await api.createPackingList(selectedTrip.id, {
						name: 'Shared Items',
						description: 'Shared packing list',
						list_type: 'shared',
					});
				}
				targetListId = shared.id;
			}
			if (!targetListId) return;
			for (const it of tpl.items) {
				await api.createItem(selectedTrip.id, targetListId, {
					name: it.name,
					category: it.category,
					quantity: it.quantity || 1,
				});
			}
			toast({ title: 'Template applied', description: `${tpl.name} added to ${listType} list.` });
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			toast({ title: 'Failed to apply template', description: msg, variant: 'destructive' });
		}
	};

	const addDraftItem = () => {
		const name = newItemName.trim();
		if (!name) {
			toast({ title: 'Item name required' });
			return;
		}
		setDraftItems((prev) => [
			...prev,
			{ name, category: newItemCategory, quantity: Math.max(1, Number(newItemQty) || 1) },
		]);
		setNewItemName('');
		setNewItemQty(1);
	};

	const removeDraftItem = (idx: number) => {
		setDraftItems((prev) => prev.filter((_, i) => i !== idx));
	};

	const saveCustomTemplate = () => {
		if (draftItems.length === 0) {
			toast({ title: 'No items', description: 'Add at least one item.' });
			return;
		}
		const tpl: TemplateDef = { key: `user_${Date.now()}`, name: draftName.trim() || 'My Template', items: draftItems };
		const next = [tpl, ...userTemplates];
		setUserTemplates(next);
		persistUserTemplates(next);
		setDraftItems([]);
		setDraftName('My Template');
		toast({ title: 'Template saved' });
	};

	// Show loading state while trips are being fetched
	if (isLoading) {
		return (
			<div className="container mx-auto p-6 max-w-4xl">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Loading...</h1>
					<p className="text-muted-foreground">Loading trip information...</p>
				</div>
			</div>
		);
	}

	if (trips.length === 0) {
		return (
			<div className="container mx-auto p-6 max-w-4xl">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">No Trips Available</h1>
					<p className="text-muted-foreground mb-6">
						You don't have any trips yet. Create a trip first to access the
						packing list.
					</p>
				</div>
			</div>
		);
	}

	if (!selectedTrip) {
		return (
			<div className="container mx-auto p-6 max-w-4xl">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">No Trip Selected</h1>
					<p className="text-muted-foreground mb-6">
						Please select a trip from the trip switcher to view its packing
						list.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<div className="mb-6">
				<Link
					to={`/trip/${selectedTrip.id}/packing`}
					className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Packing List
				</Link>
			</div>

			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">Packing Templates</h1>
				<p className="text-muted-foreground">
					Use pre-made templates for{' '}
					<span className="font-semibold">{selectedTrip.name}</span>
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				{PRESET_TEMPLATES.map((tpl) => (
					<Card key={tpl.key}>
						<CardHeader>
							<CardTitle className="text-base">{tpl.name}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
								{tpl.items.slice(0, 8).map((it, idx) => (
									<span key={idx} className="px-2 py-1 rounded bg-muted">{it.name}</span>
								))}
								{tpl.items.length > 8 && (
									<span className="px-2 py-1 rounded bg-muted">+{tpl.items.length - 8} more</span>
								)}
							</div>
							<div className="flex gap-2">
								<Button size="sm" onClick={() => applyTemplate(tpl, 'private')}>Apply to My List</Button>
								<Button size="sm" variant="secondary" onClick={() => applyTemplate(tpl, 'shared')}>Apply to Shared</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-3">Your Templates</h2>
				{userTemplates.length === 0 ? (
					<p className="text-sm text-muted-foreground">You have no templates yet.</p>
				) : (
					<div className="grid md:grid-cols-2 gap-4">
						{userTemplates.map((tpl) => (
							<Card key={tpl.key}>
								<CardHeader>
									<CardTitle className="text-base">{tpl.name}</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
										{tpl.items.slice(0, 8).map((it, idx) => (
											<span key={idx} className="px-2 py-1 rounded bg-muted">{it.name}</span>
										))}
										{tpl.items.length > 8 && (
											<span className="px-2 py-1 rounded bg-muted">+{tpl.items.length - 8} more</span>
										)}
									</div>
									<div className="flex gap-2">
										<Button size="sm" onClick={() => applyTemplate(tpl, 'private')}>Apply to My List</Button>
										<Button size="sm" variant="secondary" onClick={() => applyTemplate(tpl, 'shared')}>Apply to Shared</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-3">Create Custom Template</h2>
				<div className="grid gap-3">
					<Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Template name" />
					<div className="grid grid-cols-12 gap-2">
						<div className="col-span-6">
							<Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item name" />
						</div>
						<div className="col-span-4">
							<select
								className="w-full border rounded px-2 py-2 text-sm dark:bg-gray-900 dark:border-gray-800"
								value={newItemCategory}
								onChange={(e) => setNewItemCategory(e.target.value)}
							>
								{PACKING_CATEGORIES.map((c) => (
									<option key={c.value} value={c.label}>
										{c.label}
									</option>
								))}
							</select>
						</div>
						<div className="col-span-2">
							<Input
								type="number"
								min={1}
								value={newItemQty}
								onChange={(e) => setNewItemQty(Number(e.target.value))}
								placeholder="Qty"
							/>
						</div>
					</div>
					<div>
						<Button type="button" variant="secondary" onClick={addDraftItem}>
							+ Add item
						</Button>
					</div>
					{draftItems.length > 0 && (
						<div className="mt-3">
							<h3 className="text-sm font-medium mb-2">Items</h3>
							<ul className="space-y-2">
								{draftItems.map((it, idx) => (
									<li key={`${it.name}-${idx}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm dark:border-gray-800">
										<span>
											{it.name}
											{it.category ? ` • ${it.category}` : ''}
											{` • x${it.quantity || 1}`}
										</span>
										<Button size="sm" variant="destructive" onClick={() => removeDraftItem(idx)}>
											Remove
										</Button>
									</li>
								))}
							</ul>
						</div>
					)}
					<div className="mt-2">
						<Button onClick={saveCustomTemplate} disabled={draftItems.length === 0}>Save Template</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
