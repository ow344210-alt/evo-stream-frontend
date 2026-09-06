"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileVideo,
  X,
} from "lucide-react";
import { CreatorHeader } from "@/components/creator/CreatorHeader";
import { api, Video, Category } from "@/lib/api";

const THUMB_FALLBACK = "/images/shadows_poster.png";

export default function CreatorVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModalVideo, setDeleteModalVideo] = useState<Video | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(THUMB_FALLBACK);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");

  // Real source file upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [videoRes, categoryRes] = await Promise.all([
        api.listMyVideos(),
        api.listCategories(),
      ]);
      setVideos(videoRes.items);
      setCategories(categoryRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStartUpload = () => {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setThumbnailUrl(THUMB_FALLBACK);
    setStatus("DRAFT");
    setSelectedFile(null);
    setUploadMsg(null);
    setIsUploading(false);
    setIsUploadOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadMsg(null);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setIsUploading(!!selectedFile);
    setUploadMsg(null);
    try {
      // 1) Create the metadata record (existing behavior, preserved).
      const created = await api.createVideo({
        title,
        description,
        categoryId: categoryId || undefined,
        thumbnailUrl,
        status, // allow PUBLISHED for Phase-1 metadata publication
      });

      // 2) If a real source file was chosen, upload it to the created video.
      if (selectedFile) {
        const form = new FormData();
        form.append("file", selectedFile);
        if (categoryId) form.append("categoryId", categoryId);
        try {
          const uploaded = await api.uploadVideo(created.id, form);
          setVideos((prev) => [uploaded, ...prev.filter((v) => v.id !== created.id)]);
          setUploadMsg(`Video "${uploaded.title}" saved with source file.`);
        } catch (uploadErr) {
          // Video record persists (metadata-only draft) even if file upload fails.
          setVideos((prev) => [created, ...prev]);
          setUploadMsg(
            `Video "${created.title}" saved, but the source file could not be uploaded.`,
          );
          if (uploadErr instanceof Error) showToast(uploadErr.message);
          setIsUploadOpen(false);
          showToast(`Video "${created.title}" saved (source upload pending).`);
          return;
        }
      } else {
        setVideos((prev) => [created, ...prev]);
      }

      setIsUploadOpen(false);
      showToast(selectedFile ? `Video "${created.title}" published with file.` : `Video "${created.title}" saved.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save video");
    } finally {
      setSaving(false);
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalVideo) return;
    try {
      await api.deleteVideo(deleteModalVideo.id);
      setVideos((prev) => prev.filter((v) => v.id !== deleteModalVideo.id));
      showToast(`Video "${deleteModalVideo.title}" was deleted.`);
      setDeleteModalVideo(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete video");
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <CreatorHeader
        title="Video Management & Studio Ingestion"
        subtitle="Manage video metadata, titles, thumbnails, categories, and draft statuses."
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-950">
              Hub Catalog ({videos.length} Titles)
            </h3>
            <p className="text-xs text-gray-500">
              Manage your video metadata and draft previews.
            </p>
          </div>

          <button
            onClick={handleStartUpload}
            className="inline-flex items-center gap-2 bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold px-6 py-3 rounded-full shadow-evo-button transition-all hover:scale-[1.02]"
            id="creator-open-upload-modal-btn"
          >
            <Upload className="w-4 h-4" />
            <span>Add Video Metadata</span>
          </button>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {error} — Please make sure the API and database are reachable.
            </span>
            <button
              onClick={load}
              className="ml-auto px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow p-16 text-center text-sm text-gray-500">
            Loading videos…
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/90 evo-card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-4 px-6">Video / Title</th>
                    <th className="py-4 px-6">Genre Category</th>
                    <th className="py-4 px-6">Uploaded</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {videos.map((vid) => (
                    <tr key={vid.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5 min-w-[260px]">
                          <div className="relative w-20 h-12 rounded-xl bg-gray-900 overflow-hidden shrink-0 shadow-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={vid.thumbnailUrl ?? THUMB_FALLBACK}
                              alt={vid.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <div className="font-bold text-gray-900">{vid.title}</div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              {vid.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-gray-700">
                        {vid.category?.name ?? "Uncategorized"}
                      </td>

                      <td className="py-4 px-6 text-gray-500 font-mono">
                        {new Date(vid.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              vid.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : vid.status === "HIDDEN"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {vid.status}
                          </span>
                          {vid.processingStatus && (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                vid.processingStatus === "READY"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : vid.processingStatus === "FAILED"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : vid.processingStatus === "PROCESSING"
                                      ? "bg-sky-50 text-sky-700 border-sky-200 animate-pulse"
                                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}
                              title={
                                vid.processingStatus === "FAILED" && vid.processError
                                  ? vid.processError
                                  : undefined
                              }
                            >
                              {vid.processingStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDeleteModalVideo(vid)}
                            className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-7 max-w-xl w-full border border-gray-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-evo-red-light flex items-center justify-center text-evo-red">
                    <FileVideo className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-950">
                      Add Video &amp; Upload Source
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Configure title, category, thumbnail, and optionally upload the source file
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVideo} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Video File
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors">
                      <FileVideo className="w-4 h-4 text-evo-red shrink-0" />
                      <span className="truncate text-gray-700">
                        {selectedFile
                          ? selectedFile.name
                          : "Choose a video file (MP4, MOV, WebM…)"}
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Optional: if you choose a file, it is uploaded as the video source on save.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Video Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Echoes of the Horizon (Episode 1)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Description & Synopsis
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the story, key cast, or creative inspiration..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Thumbnail URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://…/poster.jpg"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-evo-red focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      Publish Immediately
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Set status to Published (metadata only; streaming is a later phase)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={status === "PUBLISHED"}
                    onChange={(e) =>
                      setStatus(e.target.checked ? "PUBLISHED" : "DRAFT")
                    }
                    className="w-5 h-5 accent-evo-red rounded cursor-pointer"
                  />
                </div>

                {uploadMsg && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{uploadMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    disabled={saving || isUploading}
                    className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || isUploading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-evo-red hover:bg-evo-red-hover text-white text-xs font-bold rounded-xl shadow-evo-button disabled:opacity-60"
                  >
                    {isUploading ? (
                      <>
                        <Upload className="w-4 h-4 animate-pulse" />
                        Uploading…
                      </>
                    ) : saving ? (
                      "Saving…"
                    ) : (
                      "Save Video"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteModalVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-7 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-950">
                  Delete Video from Hub?
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-bold text-gray-900">
                    &quot;{deleteModalVideo.title}&quot;
                  </span>
                  ?
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteModalVideo(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
