import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';

export interface PackingUser {
	id: number;
	username: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	avatar_url?: string | null;
}

export interface PackingList {
	id: number;
	trip: number;
	name: string;
	description?: string;
	list_type: 'private' | 'shared';
	created_by: PackingUser;
	total_items: number;
	packed_items: number;
	completion_percentage: number;
	created_at: string;
	updated_at: string;
}

export interface PackingItem {
	id: number;
	name: string;
	description?: string;
	category?: string;
	priority: 'low' | 'medium' | 'high';
	quantity: number;
	is_packed: boolean;
	assigned_to?: PackingUser | null;
	created_by: PackingUser;
	packed_by?: PackingUser | null;
	packed_at?: string | null;
	created_at: string;
	updated_at: string;
}

export class PackingApiClient extends BaseApiClient {
	private url(tripId: number | string) {
		return `${API_URL}/trips/trip/${tripId}/packing-lists`;
	}

	async listPackingLists(tripId: number, listType?: 'private' | 'shared') {
		const query = listType ? `?list_type=${listType}` : '';
		const response = await fetch(`${this.url(tripId)}/${query}`, {
			...this._requestConfiguration(true),
			method: 'GET',
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return (await response.json()) as PackingList[];
	}

	async createPackingList(tripId: number, data: { name: string; description?: string; list_type: 'private' | 'shared' }) {
		const response = await fetch(`${this.url(tripId)}/`, {
			...this._requestConfiguration(true),
			method: 'POST',
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return (await response.json()) as PackingList;
	}

	async listItems(tripId: number, listId: number, filters?: { category?: string; is_packed?: boolean; search?: string }) {
		const params = new URLSearchParams();
		if (filters?.category) params.append('category', filters.category);
		if (filters?.is_packed !== undefined) params.append('is_packed', String(filters.is_packed));
		if (filters?.search) params.append('search', filters.search);
		const qs = params.toString();
		const response = await fetch(`${this.url(tripId)}/${listId}/items/${qs ? `?${qs}` : ''}`, {
			...this._requestConfiguration(true),
			method: 'GET',
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return (await response.json()) as PackingItem[];
	}

	async createItem(tripId: number, listId: number, data: { name: string; description?: string; category?: string; priority?: 'low' | 'medium' | 'high'; quantity?: number; assigned_to_id?: number | null; }) {
		const response = await fetch(`${this.url(tripId)}/${listId}/items/`, {
			...this._requestConfiguration(true),
			method: 'POST',
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return (await response.json()) as PackingItem;
	}

	async updateItem(tripId: number, listId: number, itemId: number, data: Partial<{ name: string; description: string; category: string; priority: 'low' | 'medium' | 'high'; quantity: number; assigned_to_id: number | null; is_packed: boolean; }>) {
		const response = await fetch(`${this.url(tripId)}/${listId}/items/${itemId}/`, {
			...this._requestConfiguration(true),
			method: 'PATCH',
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return (await response.json()) as PackingItem;
	}

	async deleteItem(tripId: number, listId: number, itemId: number) {
		const response = await fetch(`${this.url(tripId)}/${listId}/items/${itemId}/`, {
			...this._requestConfiguration(true),
			method: 'DELETE',
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return true;
	}

	async togglePacked(tripId: number, listId: number, itemId: number) {
		const response = await fetch(`${this.url(tripId)}/${listId}/items/${itemId}/toggle/`, {
			...this._requestConfiguration(true),
			method: 'POST',
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return (await response.json()) as PackingItem;
	}
}

export const PACKING_CATEGORIES = [
  { value: "clothing", label: "Clothing" },
  { value: "toiletries", label: "Toiletries" },
  { value: "electronics", label: "Electronics" },
  { value: "documents", label: "Documents" },
  { value: "medications", label: "Medications" },
  { value: "accessories", label: "Accessories" },
  { value: "gear", label: "Gear & Equipment" },
  { value: "food", label: "Food & Snacks" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
]

export const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
]

export const TEMPLATE_TYPES = [
  { value: "beach", label: "Beach Vacation" },
  { value: "city", label: "City Trip" },
  { value: "hiking", label: "Hiking/Outdoor" },
  { value: "business", label: "Business Travel" },
  { value: "winter", label: "Winter Vacation" },
  { value: "camping", label: "Camping" },
  { value: "festival", label: "Festival/Event" },
  { value: "general", label: "General Travel" },
]
