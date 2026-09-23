import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api";

function mockFetchOnce(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("viewer social API methods", () => {
  beforeEach(() => {
    localStorage.setItem("evo_access_token", "test-token");
    localStorage.setItem("evo_refresh_token", "test-refresh");
    localStorage.setItem("evo_user", JSON.stringify({ id: "u1", name: "A" }));
    vi.stubGlobal("fetch", mockFetchOnce({ ok: true }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getSocialSummary calls the public summary endpoint with the token", async () => {
    const fetchMock = mockFetchOnce({
      videoId: "v1",
      likeCount: 3,
      commentCount: 2,
      shareCount: 1,
      channelFollowerCount: 5,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await api.getSocialSummary("v1");
    expect(res.likeCount).toBe(3);
    expect(res.channelFollowerCount).toBe(5);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/videos/v1/social-summary");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-token",
    );
  });

  it("likeVideo POSTs to the like endpoint", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ liked: true, likeCount: 1 }));
    const res = await api.likeVideo("v1");
    expect(res).toEqual({ liked: true, likeCount: 1 });
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(String(url)).toContain("/videos/v1/like");
    expect(init.method).toBe("POST");
  });

  it("unlikeVideo DELETEs to the like endpoint", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ liked: false, likeCount: 0 }));
    const res = await api.unlikeVideo("v1");
    expect(res.liked).toBe(false);
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(init.method).toBe("DELETE");
  });

  it("saveVideo/unsaveVideo hit the save endpoint", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ saved: true }));
    await api.saveVideo("v1");
    let [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe("POST");

    vi.stubGlobal("fetch", mockFetchOnce({ saved: false }));
    await api.unsaveVideo("v1");
    [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe("DELETE");
  });

  it("follow/unfollow hit the channel follow endpoint", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ following: true, followerCount: 9 }));
    const res = await api.followChannel("c1");
    expect(res.followerCount).toBe(9);
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain("/channels/c1/follow");

    vi.stubGlobal("fetch", mockFetchOnce({ following: false, followerCount: 8 }));
    await api.unfollowChannel("c1");
    const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(init.method).toBe("DELETE");
  });

  it("recordProgress POSTs position and percent", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({}));
    await api.recordProgress("v1", 45, 75);
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      positionSeconds: 45,
      progressPercent: 75,
    });
  });

  it("listComments uses the public (non-auth) request", async () => {
    localStorage.removeItem("evo_access_token");
    vi.stubGlobal("fetch", mockFetchOnce({ items: [], total: 0 }));
    await api.listComments("v1", { parentId: "c1" });
    const [url] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("parentId=c1");
  });

  it("collection methods hit /me/* endpoints", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchOnce({ items: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }),
    );
    await api.getSavedVideos({ page: 1, pageSize: 12 });
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain("/me/saved");

    await api.getLikedVideos({ page: 1, pageSize: 12 });
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1][0])).toContain("/me/likes");

    await api.getWatchHistory({ page: 1, pageSize: 12 });
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[2][0])).toContain("/me/history");
  });

  it("createComment sends content and optional parentId", async () => {
    vi.stubGlobal("fetch", mockFetchOnce({ id: "c1", content: "hi" }));
    await api.createComment("v1", "hi", "p1");
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      content: "hi",
      parentId: "p1",
    });
  });
});
