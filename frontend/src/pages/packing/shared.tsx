import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTripContext } from '@/components/util/trip-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Trash2, Users, User } from 'lucide-react';
import { PackingApiClient, type PackingItem, type PackingList } from '@/lib/api/packing';
import { TripsApiClient, type TripParticipant } from '@/lib/api/trips';
import { authenticationProviderInstance } from '@/lib/authentication-provider';

interface LocalNewItem {
	name: string;
	category: string;
	quantity: number;
	notes?: string;
	assigned_to_id?: number | null;
}

const defaultCategories = [
	'Clothing',
	'Electronics',
	'Toiletries',
	'Documents',
	'Entertainment',
	'Other',
];

export default function SharedPackingPage() {
	const { selectedTrip, trips, isLoading } = useTripContext();
	const [list, setList] = useState<PackingList | null>(null);
	const [items, setItems] = useState<PackingItem[]>([]);
	const [participants, setParticipants] = useState<TripParticipant[]>([]);
	const [isBusy, setIsBusy] = useState(false);

	const [newItem, setNewItem] = useState<LocalNewItem>({
		name: '',
		category: 'Clothing',
		quantity: 1,
		notes: '',
		assigned_to_id: undefined,
	});

	const api = useMemo(() => new PackingApiClient(authenticationProviderInstance), []);
	const tripsApi = useMemo(() => new TripsApiClient(authenticationProviderInstance), []);

	useEffect(() => {
		const bootstrap = async () => {
			if (!selectedTrip?.id) return;
			setIsBusy(true);
			try {
				// ensure shared list exists
				let lists = await api.listPackingLists(selectedTrip.id, 'shared');
				let current = lists[0];
				if (!current) {
					current = await api.createPackingList(selectedTrip.id, {
						name: 'Shared Items',
						description: 'Shared packing list',
						list_type: 'shared',
					});
				}
				setList(current);
				const fetched = await api.listItems(selectedTrip.id, current.id);
				setItems(fetched);
				// participants for assignment
				const details = await tripsApi.getTripDetails(selectedTrip.id);
				setParticipants(details.participants || []);
			} finally {
				setIsBusy(false);
			}
		};
		bootstrap();
	}, [api, tripsApi, selectedTrip]);

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
					<p className="text-muted-foreground mb-6">Create a trip to access shared packing.</p>
				</div>
			</div>
		);
	}

	if (!selectedTrip || !list) {
		return (
			<div className="container mx-auto p-6 max-w-4xl">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">No Trip Selected</h1>
					<p className="text-muted-foreground mb-6">Select a trip from the switcher.</p>
				</div>
			</div>
		);
	}

	const addItem = async () => {
		if (!newItem.name.trim()) return;
		setIsBusy(true);
		try {
			const created = await api.createItem(selectedTrip.id, list.id, {
				name: newItem.name.trim(),
				description: newItem.notes?.trim() || undefined,
				category: newItem.category,
				priority: 'medium',
				quantity: newItem.quantity,
				assigned_to_id: newItem.assigned_to_id,
			});
			setItems((prev) => [created, ...prev]);
			setNewItem({ name: '', category: 'Clothing', quantity: 1, notes: '', assigned_to_id: undefined });
		} finally {
			setIsBusy(false);
		}
	};

	const togglePacked = async (id: number) => {
		setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_packed: !it.is_packed } : it)));
		try {
			await api.togglePacked(selectedTrip.id, list.id, id);
		} catch {
			setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_packed: !it.is_packed } : it)));
		}
	};

	const deleteItem = async (id: number) => {
		const snapshot = items;
		setItems((prev) => prev.filter((it) => it.id !== id));
		try {
			await api.deleteItem(selectedTrip.id, list.id, id);
		} catch {
			setItems(snapshot);
		}
	};

	const grouped = items.reduce((acc, item) => {
		const key = item.category || 'Other';
		if (!acc[key]) acc[key] = [] as PackingItem[];
		acc[key].push(item);
		return acc;
	}, {} as Record<string, PackingItem[]>);

	const packedCount = items.filter((i) => i.is_packed).length;
	const totalCount = items.length;

	const getUserInitials = (user: { first_name?: string; last_name?: string; username: string }) => {
		if (user.first_name && user.last_name) {
			return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
		}
		return user.username.substring(0, 2).toUpperCase();
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<div className="mb-6">
				<Link
					to={`/trip/${selectedTrip.id}/packing`}
					className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
				>
					<ArrowLeft className="h-4 w-4" /> Back to Packing List
				</Link>
			</div>

			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">Shared Packing Items</h1>
				<p className="text-muted-foreground">
					Collaborate with your companions for <span className="font-semibold">{selectedTrip.name}</span>
				</p>
				<div className="mt-6">
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm font-medium">Progress</span>
						<span className="text-sm text-muted-foreground">
							{packedCount} of {totalCount} items packed
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%` }} />
					</div>
				</div>
			</div>

			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plus className="h-5 w-5" /> Add Shared Item
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
						<div className="md:col-span-2">
							<Input placeholder="Item name..." value={newItem.name} onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
						</div>
						<div>
							<select className="w-full px-3 py-2 border border-input rounded-md bg-background" value={newItem.category} onChange={(e) => setNewItem((s) => ({ ...s, category: e.target.value }))}>
								{defaultCategories.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</div>
						<div>
							<Input type="number" min="1" value={newItem.quantity} onChange={(e) => setNewItem((s) => ({ ...s, quantity: parseInt(e.target.value) || 1 }))} className="text-center" />
						</div>
						<div>
							<select className="w-full px-3 py-2 border border-input rounded-md bg-background" value={newItem.assigned_to_id ?? ''} onChange={(e) => setNewItem((s) => ({ ...s, assigned_to_id: e.target.value ? parseInt(e.target.value) : undefined }))}>
								<option value="">Unassigned</option>
								{participants.map((p) => (
									<option key={p.id} value={p.id}>
										{p.username}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="mt-4">
						<Input placeholder="Notes (optional)" value={newItem.notes} onChange={(e) => setNewItem((s) => ({ ...s, notes: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
					</div>
					<Button onClick={addItem} className="mt-4" disabled={!newItem.name.trim() || isBusy}>
						<Plus className="h-4 w-4 mr-2" /> Add Item
					</Button>
				</CardContent>
			</Card>

			<div className="space-y-6">
				{Object.entries(grouped).map(([category, categoryItems]) => (
					<Card key={category}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span className="text-2xl">{category}</span>
								<Badge variant="secondary" className="ml-auto">
									{categoryItems.filter((item) => item.is_packed).length}/{categoryItems.length}
								</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{categoryItems.map((item) => (
									<div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
										<Checkbox checked={item.is_packed} onCheckedChange={() => togglePacked(item.id)} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<span className={`font-medium ${item.is_packed ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
												{item.quantity > 1 && (
													<Badge variant="outline" className="text-xs">x{item.quantity}</Badge>
												)}
											</div>
											<div className="mt-2 flex items-center gap-2">
												{/* Creator */}
												{item.created_by && (
													<div className="flex items-center gap-1">
														<Avatar className="h-6 w-6">
															<AvatarImage src={item.created_by.avatar_url || undefined} />
															<AvatarFallback className="text-xs bg-blue-100 text-blue-700">
																{getUserInitials(item.created_by)}
															</AvatarFallback>
														</Avatar>
														<span className="text-xs text-muted-foreground">Added by</span>
													</div>
												)}
												
												{/* Assigned to */}
												{item.assigned_to && (
													<div className="flex items-center gap-1">
														<Avatar className="h-6 w-6">
															<AvatarImage src={item.assigned_to.avatar_url || undefined} />
															<AvatarFallback className="text-xs bg-green-100 text-green-700">
																{getUserInitials(item.assigned_to)}
															</AvatarFallback>
														</Avatar>
														<span className="text-xs text-muted-foreground">Assigned to</span>
													</div>
												)}
												
												{/* Packed by */}
												{item.packed_by && (
													<div className="flex items-center gap-1">
														<Avatar className="h-6 w-6">
															<AvatarImage src={item.packed_by.avatar_url || undefined} />
															<AvatarFallback className="text-xs bg-purple-100 text-purple-700">
																{getUserInitials(item.packed_by)}
															</AvatarFallback>
														</Avatar>
														<span className="text-xs text-muted-foreground">Packed by</span>
													</div>
												)}
											</div>
										</div>
										<Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
} 