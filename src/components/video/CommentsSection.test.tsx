import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { CommentsSection } from "@/components/video/CommentsSection";
import type { VideoComment } from "@/lib/api";

const c1: VideoComment = {
  id: "c1",
  content: "Great video!",
  videoId: "v1",
  parentId: null,
  userId: "u1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  user: { id: "u1", name: "Alice" },
  _count: { replies: 0 },
};

vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    status = 0;
    details?: string[];
  }
  const api = {
    listComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };
  return { api, ApiError };
});

import { api, ApiError } from "@/lib/api";

const mockApi = api as unknown as {
  listComments: ReturnType<typeof vi.fn>;
  createComment: ReturnType<typeof vi.fn>;
  updateComment: ReturnType<typeof vi.fn>;
  deleteComment: ReturnType<typeof vi.fn>;
};

function renderSection(overrides: { isAuthenticated?: boolean } = {}) {
  const props = {
    videoId: "v1",
    isAuthenticated: overrides.isAuthenticated ?? true,
    onRequireAuth: vi.fn(),
    notify: vi.fn(),
    onCountChange: vi.fn(),
  };
  render(
    <CommentsSection
      videoId={props.videoId}
      isAuthenticated={props.isAuthenticated}
      onRequireAuth={props.onRequireAuth}
      notify={props.notify}
      onCountChange={props.onCountChange}
    />,
  );
  return props;
}

describe("CommentsSection", () => {
  beforeEach(() => {
    localStorage.setItem("evo_user", JSON.stringify({ id: "u1", name: "Alice" }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders real comments from the backend", async () => {
    mockApi.listComments.mockResolvedValue({
      items: [c1],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
    renderSection();
    expect(
      await screen.findByText("Great video!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(mockApi.listComments).toHaveBeenCalledWith("v1", { page: 1, pageSize: 20 });
  });

  it("shows an empty state when there are no comments", async () => {
    mockApi.listComments.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
    renderSection();
    expect(await screen.findByText("No comments yet.")).toBeInTheDocument();
  });

  it("blocks empty submission (no API call for blank input)", async () => {
    mockApi.listComments.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
    renderSection();
    // Input starts disabled-free but the submit button is disabled when empty.
    const post = await screen.findByLabelText("Post comment");
    expect(post).toBeDisabled();
    fireEvent.click(post);
    expect(mockApi.createComment).not.toHaveBeenCalled();
  });

  it("submits a trimmed comment via the backend", async () => {
    mockApi.listComments.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
    mockApi.createComment.mockResolvedValue({
      ...c1,
      id: "c2",
      content: "Nice!",
    });
    const props = renderSection();
    const input = await screen.findByLabelText("Add a comment");
    fireEvent.change(input, { target: { value: "  Nice!  " } });
    fireEvent.click(screen.getByLabelText("Post comment"));
    await waitFor(() => expect(mockApi.createComment).toHaveBeenCalledWith("v1", "Nice!"));
    expect(props.onCountChange).toHaveBeenCalledWith(1);
  });

  it("prompts anonymous users to sign in instead of posting", async () => {
    mockApi.listComments.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
    const props = renderSection({ isAuthenticated: false });
    const input = await screen.findByLabelText("Add a comment");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(screen.getByLabelText("Post comment"));
    expect(props.onRequireAuth).toHaveBeenCalled();
    expect(mockApi.createComment).not.toHaveBeenCalled();
  });

  it("renders an error state when loading comments fails", async () => {
    mockApi.listComments.mockRejectedValue(new ApiError("boom", 500));
    renderSection();
    expect(await screen.findByText("boom")).toBeInTheDocument();
  });

  it("renders ownership controls only for the current user's comment", async () => {
    const other: VideoComment = {
      ...c1,
      id: "c9",
      content: "Nice one!",
      userId: "u999",
      user: { id: "u999", name: "Bob" },
    };
    mockApi.listComments.mockResolvedValue({
      items: [c1, other],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
    renderSection();
    await screen.findByText("Great video!");
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Nice one!")).toBeInTheDocument();
  });

  it("deletes an owned comment through the backend", async () => {
    mockApi.listComments.mockResolvedValue({
      items: [c1],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
    mockApi.deleteComment.mockResolvedValue({ message: "Comment deleted" });
    const props = renderSection();
    await screen.findByText("Great video!");
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockApi.deleteComment).toHaveBeenCalledWith("c1"));
    expect(props.onCountChange).toHaveBeenCalledWith(-1);
  });
});
