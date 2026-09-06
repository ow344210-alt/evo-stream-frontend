"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  Reply,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { VideoComment } from "@/lib/api";

interface CommentsSectionProps {
  videoId: string;
  isAuthenticated: boolean;
  /** Invoked when an anonymous user tries to comment/reply. */
  onRequireAuth: () => void;
  /** Show an EVO toast message. */
  notify: (message: string) => void;
  /** Report count changes up (create +1, delete -1) so the summary stays real. */
  onCountChange: (delta: number) => void;
}

const PAGE_SIZE = 20;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {(name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

interface CommentRowProps {
  comment: VideoComment;
  currentUserId: string | null;
  busy: boolean;
  canReply: boolean;
  onStartReply: () => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onDeleteReply: (replyId: string, parentId: string) => void;
  repliesExpanded: boolean;
  onToggleReplies: (id: string, expand: boolean) => void;
  replies?: VideoComment[];
  repliesLoading?: boolean;
}

function CommentRow({
  comment,
  currentUserId,
  busy,
  canReply,
  onStartReply,
  onEdit,
  onDelete,
  onDeleteReply,
  repliesExpanded,
  onToggleReplies,
  replies = [],
  repliesLoading = false,
}: CommentRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const isOwner = currentUserId != null && currentUserId === comment.userId;

  return (
    <li className="space-y-2.5">
      <div className="flex items-start gap-3">
        <Avatar name={comment.user.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {comment.user.name || "Viewer"}
            </span>
            <span className="text-[11px] text-gray-500">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = draft.trim();
                if (!trimmed) return;
                onEdit(comment.id, trimmed);
                setEditing(false);
              }}
              className="mt-1 flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                className="flex-1 bg-gray-800 text-sm text-white rounded-lg px-3 py-1.5 border border-gray-700 focus:border-evo-red focus:outline-none"
                aria-label="Edit comment"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Save edit"
                className="p-1.5 text-emerald-400 hover:bg-gray-800 rounded disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Cancel edit"
                className="p-1.5 text-gray-400 hover:bg-gray-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-200 leading-relaxed break-words">
              {comment.content}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-3">
            {isOwner && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing((v) => !v)}
                  className="text-[11px] font-semibold text-gray-400 hover:text-white flex items-center gap-1 disabled:opacity-40"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(comment.id)}
                  className="text-[11px] font-semibold text-gray-400 hover:text-evo-red flex items-center gap-1 disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            )}
            <button
              type="button"
              disabled={!canReply}
              onClick={onStartReply}
              className="text-[11px] font-semibold text-gray-400 hover:text-white flex items-center gap-1 disabled:opacity-40"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          </div>
        </div>
      </div>

      {comment._count?.replies > 0 && (
        <button
          type="button"
          onClick={() => onToggleReplies(comment.id, !repliesExpanded)}
          className="ml-11 text-[11px] font-semibold text-gray-400 hover:text-white"
        >
          {repliesExpanded
            ? "Hide replies"
            : `View ${comment._count.replies} ${
                comment._count.replies === 1 ? "reply" : "replies"
              }`}
        </button>
      )}

      {repliesExpanded && (
        <div className="ml-11 space-y-2.5">
          {repliesLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading replies…
            </div>
          ) : (
            replies.map((r) => (
              <div key={r.id} className="flex items-start gap-2.5">
                <Avatar name={r.user.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {r.user.name || "Viewer"}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed break-words">
                    {r.content}
                  </p>
                  {currentUserId != null && currentUserId === r.userId && (
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          onDeleteReply(r.id, comment.id)
                        }
                        className="text-[11px] font-semibold text-gray-400 hover:text-evo-red flex items-center gap-1 disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Real comments thread for a video. Reads from the real P2-7 API, supports
 * creating a comment, replying to an existing comment (single level, no
 * infinite nesting), and editing/deleting your own comment (ownership enforced
 * by the backend). Paginated/load-more; never fetches unlimited comments.
 */
export function CommentsSection({
  videoId,
  isAuthenticated,
  onRequireAuth,
  notify,
  onCountChange,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedAll, setLoadedAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, VideoComment[]>>(
    {},
  );
  const [repliesExpanded, setRepliesExpanded] = useState<
    Record<string, boolean>
  >({});
  const [repliesLoading, setRepliesLoading] = useState<
    Record<string, boolean>
  >({});
  const [replyTarget, setReplyTarget] = useState<VideoComment | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyPosting, setReplyPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setComments([]);
    setTotal(0);
    setLoadedAll(false);
    setReplyTarget(null);
    setReplyDraft("");
    setRepliesMap({});
    setRepliesExpanded({});
    setRepliesLoading({});

    api
      .listComments(videoId, { page: 1, pageSize: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setComments(data.items);
        setTotal(data.total);
        setLoadedAll(data.items.length >= data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load comments.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Track the logged-in user id (from the stored session) to gate ownership UI.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("evo_user");
      if (stored) {
        const u = JSON.parse(stored) as { id: string };
        setCurrentUserId(u.id ?? null);
      } else {
        setCurrentUserId(null);
      }
    } catch {
      setCurrentUserId(null);
    }
  }, [isAuthenticated]);

  const requireAuthOrBlock = useCallback((): boolean => {
    if (!isAuthenticated) {
      onRequireAuth();
      return true;
    }
    return false;
  }, [isAuthenticated, onRequireAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (requireAuthOrBlock()) return;
    setPosting(true);
    try {
      const created = await api.createComment(videoId, content);
      setComments((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      setDraft("");
      onCountChange(1);
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not post your comment.",
      );
    } finally {
      setPosting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;
    const content = replyDraft.trim();
    if (!content) return;
    if (requireAuthOrBlock()) return;
    setReplyPosting(true);
    const parentId = replyTarget.id;
    try {
      await api.createComment(videoId, content, parentId);
      setReplyDraft("");
      setReplyTarget(null);
      notify("Reply posted.");
      setRepliesExpanded((prev) => ({ ...prev, [parentId]: true }));
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, _count: { replies: c._count.replies + 1 } }
            : c,
        ),
      );
      setTotal((t) => t + 1);
      onCountChange(1);
      // Refresh the reply list so the new reply shows in real data.
      const data = await api.listComments(videoId, { parentId });
      setRepliesMap((prev) => ({ ...prev, [parentId]: data.items }));
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not post your reply.",
      );
    } finally {
      setReplyPosting(false);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    if (requireAuthOrBlock()) return;
    setMutating(true);
    try {
      await api.updateComment(commentId, content);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content } : c)),
      );
      notify("Comment updated.");
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not update your comment.",
      );
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (requireAuthOrBlock()) return;
    setMutating(true);
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setRepliesMap((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      setTotal((t) => Math.max(0, t - 1));
      notify("Comment deleted.");
      onCountChange(-1);
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not delete your comment.",
      );
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteReply = async (replyId: string, parentId: string) => {
    if (requireAuthOrBlock()) return;
    setMutating(true);
    try {
      await api.deleteComment(replyId);
      setRepliesMap((prev) => ({
        ...prev,
        [parentId]: (prev[parentId] ?? []).filter((r) => r.id !== replyId),
      }));
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, _count: { replies: Math.max(0, c._count.replies - 1) } }
            : c,
        ),
      );
      setTotal((t) => Math.max(0, t - 1));
      notify("Reply deleted.");
      onCountChange(-1);
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not delete your reply.",
      );
    } finally {
      setMutating(false);
    }
  };

  const handleToggleReplies = async (commentId: string, expand: boolean) => {
    setRepliesExpanded((prev) => ({ ...prev, [commentId]: expand }));
    if (expand && repliesMap[commentId] === undefined) {
      setRepliesLoading((prev) => ({ ...prev, [commentId]: true }));
      try {
        const data = await api.listComments(videoId, {
          parentId: commentId,
          pageSize: 50,
        });
        setRepliesMap((prev) => ({ ...prev, [commentId]: data.items }));
      } catch {
        notify("Could not load replies.");
      } finally {
        setRepliesLoading((prev) => ({ ...prev, [commentId]: false }));
      }
    }
  };

  const handleLoadMore = async () => {
    const nextPage = Math.floor(comments.length / PAGE_SIZE) + 1;
    setLoading(true);
    try {
      const data = await api.listComments(videoId, {
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setComments((prev) => [...prev, ...data.items]);
      setLoadedAll(comments.length + data.items.length >= data.total);
    } catch (err) {
      notify(
        err instanceof ApiError ? err.message : "Could not load more comments.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading comments…
      </div>
    );
  }

  if (error && comments.length === 0) {
    return <p className="py-6 text-sm text-gray-400">{error}</p>;
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder={
            isAuthenticated
              ? "Add a comment…"
              : "Sign in to join the discussion…"
          }
          aria-label="Add a comment"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-evo-red focus:outline-none"
        />
        <button
          type="submit"
          disabled={posting || !draft.trim()}
          aria-label="Post comment"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold disabled:opacity-40"
        >
          {posting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Post</span>
        </button>
      </form>

      {replyTarget && (
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Replying to {replyTarget.user.name || "Viewer"}
            </span>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              aria-label="Cancel reply"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmitReply} className="flex items-center gap-3">
            <input
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              maxLength={2000}
              autoFocus
              placeholder="Write a reply…"
              aria-label="Write a reply"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-evo-red focus:outline-none"
            />
            <button
              type="submit"
              disabled={replyPosting || !replyDraft.trim()}
              aria-label="Post reply"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-evo-red hover:bg-evo-red-hover text-white text-sm font-semibold disabled:opacity-40"
            >
              {replyPosting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageSquare className="w-8 h-8 text-gray-600" aria-hidden />
          <p className="text-sm text-gray-400">No comments yet.</p>
          <p className="text-xs text-gray-600">Be the first to comment.</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              busy={mutating || replyPosting}
              canReply={isAuthenticated}
              onStartReply={() => {
                if (requireAuthOrBlock()) return;
                setReplyTarget(c);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDeleteReply={handleDeleteReply}
              repliesExpanded={Boolean(repliesExpanded[c.id])}
              onToggleReplies={handleToggleReplies}
              replies={repliesMap[c.id]}
              repliesLoading={Boolean(repliesLoading[c.id])}
            />
          ))}
        </ul>
      )}

      {!loadedAll && comments.length > 0 && (
        <button
          type="button"
          disabled={loading}
          onClick={handleLoadMore}
          className="w-full py-2.5 rounded-xl border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-900 disabled:opacity-40"
        >
          {loading ? "Loading…" : "Load more comments"}
        </button>
      )}
    </div>
  );
}
