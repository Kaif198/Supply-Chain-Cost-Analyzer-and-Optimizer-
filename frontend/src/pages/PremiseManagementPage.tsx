import { useState } from 'react';
import { usePremises, useCreatePremise, useUpdatePremise, useDeletePremise } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { getCategoryIcon } from '../utils/utils';
import type { Premise, CreatePremiseRequest } from '../types/types';

const CATEGORIES = ['nightclub', 'gym', 'retail', 'restaurant', 'hotel'] as const;
const ITEMS_PER_PAGE = 15;

const EMPTY_FORM: CreatePremiseRequest = {
    name: '',
    category: 'retail',
    address: '',
    latitude: 47.5,
    longitude: 13.5,
    elevation: 0,
    weeklyDemand: 100,
};

export default function PremiseManagementPage() {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [page, setPage] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingPremise, setEditingPremise] = useState<Premise | null>(null);
    const [form, setForm] = useState<CreatePremiseRequest>(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { data: premises = [], isLoading } = usePremises({
        category: categoryFilter || undefined,
        search: search || undefined,
    });
    const createMutation = useCreatePremise();
    const updateMutation = useUpdatePremise();
    const deleteMutation = useDeletePremise();

    const totalPages = Math.ceil(premises.length / ITEMS_PER_PAGE);
    const paginated = premises.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

    const openCreate = () => {
        setEditingPremise(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (p: Premise) => {
        setEditingPremise(p);
        setForm({
            name: p.name,
            category: p.category,
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
            elevation: p.elevation,
            weeklyDemand: p.weeklyDemand,
        });
        setFormError('');
        setShowModal(true);
    };

    const validateForm = (): string | null => {
        if (!form.name.trim()) return 'Name is required';
        if (!form.address.trim()) return 'Address is required';
        if (form.latitude < 46.4 || form.latitude > 49.0) return 'Latitude must be between 46.4° and 49.0° (Austria)';
        if (form.longitude < 9.5 || form.longitude > 17.2) return 'Longitude must be between 9.5° and 17.2° (Austria)';
        if (form.weeklyDemand < 1) return 'Weekly demand must be a positive integer';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateForm();
        if (error) { setFormError(error); return; }

        try {
            if (editingPremise) {
                await updateMutation.mutateAsync({ id: editingPremise.id, data: form });
            } else {
                await createMutation.mutateAsync(form);
            }
            queryClient.invalidateQueries({ queryKey: ['premises'] });
            setShowModal(false);
        } catch {
            setFormError('Operation failed. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            queryClient.invalidateQueries({ queryKey: ['premises'] });
            setDeleteConfirmId(null);
        } catch {
            alert('Delete failed. Premise may have associated deliveries.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Premise Management</h1>
                    <p className="text-slate-400 mt-1">{premises.length} premises total</p>
                </div>
                <button
                    onClick={openCreate}
                    className="px-5 py-2.5 bg-redbull-red hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-redbull-red/20 hover:shadow-redbull-red/30 text-sm"
                >
                    + Add Premise
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all text-sm"
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all text-sm"
                >
                    <option value="" className="bg-slate-800">All categories</option>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-slate-800 capitalize">{c}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-redbull-red" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 text-xs bg-white/5">
                                    <th className="text-left px-4 py-3">Name</th>
                                    <th className="text-left px-4 py-3">Category</th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">Address</th>
                                    <th className="text-right px-4 py-3">Demand</th>
                                    <th className="text-right px-4 py-3 hidden lg:table-cell">Lat</th>
                                    <th className="text-right px-4 py-3 hidden lg:table-cell">Lng</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((p) => (
                                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/5 transition-all duration-200">
                                        <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                                        <td className="px-4 py-3 text-slate-300">
                                            <span className="flex items-center gap-1.5">
                                                {getCategoryIcon(p.category)} {p.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell truncate max-w-48">{p.address}</td>
                                        <td className="px-4 py-3 text-right text-slate-300">{p.weeklyDemand}</td>
                                        <td className="px-4 py-3 text-right text-slate-500 hidden lg:table-cell">{p.latitude.toFixed(4)}</td>
                                        <td className="px-4 py-3 text-right text-slate-500 hidden lg:table-cell">{p.longitude.toFixed(4)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs transition-all duration-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(p.id)}
                                                    className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-all duration-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginated.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                            No premises found matching your criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                        <span className="text-slate-500 text-xs">
                            Page {page + 1} of {totalPages}
                        </span>
                        <div className="flex gap-1">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors"
                            >
                                ← Prev
                            </button>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 disabled:opacity-30 hover:bg-white/10 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingPremise ? 'Edit Premise' : 'Create Premise'}
                        </h2>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Category *</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c} className="bg-slate-800">{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Address *</label>
                                <input
                                    type="text"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Latitude * (46.4–49.0)</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="46.4"
                                        max="49.0"
                                        value={form.latitude}
                                        onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Longitude * (9.5–17.2)</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="9.5"
                                        max="17.2"
                                        value={form.longitude}
                                        onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Elevation (m)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.elevation}
                                        onChange={(e) => setForm({ ...form, elevation: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Weekly Demand (cases) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.weeklyDemand}
                                        onChange={(e) => setForm({ ...form, weeklyDemand: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-sm hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-2.5 bg-redbull-red hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingPremise ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-white mb-2">Delete Premise?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            This action cannot be undone. The premise and its associations will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-sm hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
