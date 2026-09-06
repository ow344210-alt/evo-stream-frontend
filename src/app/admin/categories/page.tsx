"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Film,
  AlertTriangle,
  X,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { api, Category } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListCategories({ page: 1, pageSize: 100 });
      setCategories(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setName("");
    setSlug("");
    setDescription("");
    setFeatured(true);
    setEditingCategory(null);
    setModalMode("create");
  };

  const handleOpenEdit = (cat: Category) => {
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setFeatured(cat.featured);
    setEditingCategory(cat);
    setModalMode("edit");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === "create") {
        const created = await api.adminCreateCategory({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
          description,
          featured,
        });
        setCategories((prev) => [...prev, created]);
        showToast(`Category "${name}" created successfully.`);
      } else if (modalMode === "edit" && editingCategory) {
        const updated = await api.adminUpdateCategory(editingCategory.id, {
          name,
          slug,
          description,
          featured,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updated : c)),
        );
        showToast(`Category "${name}" updated.`);
      }
      setModalMode(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCategory) return;
    try {
      await api.adminDeleteCategory(deleteCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteCategory.id));
      showToast(`Category "${deleteCategory.name}" removed.`);
      setDeleteCategory(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Category Architecture"
        subtitle="Organize streaming genres, featured landing filters, and content classification tags."
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-950">
              Active Video Categories ({categories.length})
            </h3>
            <p className="text-xs text-gray-500">
              These categories appear on the web portal and content filters.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold shadow-evo-button transition-all hover:scale-[1.02]"
            id="admin-create-category-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Category</span>
          </button>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error} — Please make sure the API and database are reachable.
            </span>
            <button
              onClick={loadCategories}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading categories…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-3xl p-6 border border-gray-200/90 evo-card-shadow flex flex-col justify-between group hover:border-evo-red/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-evo-red-light border border-red-100 flex items-center justify-center text-evo-red">
                      <Film className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cat.featured && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          Featured
                        </span>
                      )}
                      {!cat.isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-gray-950 mb-1">
                    {cat.name}
                  </h4>
                  <div className="text-[11px] text-gray-400 font-mono mb-3">
                    /{cat.slug}
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">
                    {cat._count?.videos ?? 0}{" "}
                    <span className="text-gray-400 font-normal">Videos</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteCategory(cat)}
                      className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-7 max-w-md w-full border border-gray-200 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-950">
                  {modalMode === "create"
                    ? "Create New Category"
                    : "Edit Category"}
                </h3>
                <button
                  onClick={() => setModalMode(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyberpunk & Sci-Fi"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (modalMode === "create") {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-"),
                        );
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cyberpunk-sci-fi"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium font-mono focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of this genre category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="featured-checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 accent-evo-red rounded cursor-pointer"
                  />
                  <label
                    htmlFor="featured-checkbox"
                    className="text-xs font-semibold text-gray-700 cursor-pointer"
                  >
                    Show as Featured Tab on Content Library
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-evo-red hover:bg-evo-red-hover rounded-xl shadow-evo-button disabled:opacity-60"
                  >
                    {saving
                      ? "Saving…"
                      : modalMode === "create"
                        ? "Create Category"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-7 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-gray-950">
                Delete Category &quot;{deleteCategory.name}&quot;?
              </h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete this category? Associated videos
                and Hubs will be reclassified as uncategorized.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteCategory(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
