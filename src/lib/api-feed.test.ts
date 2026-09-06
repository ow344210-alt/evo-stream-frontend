import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api";

function mockFetchOnce(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

const page = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

describe("public discovery feed API methods", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchOnce(page));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getFeed hits /feed", async () => {
    const fetchMock = mockFetchOnce(page);
    vi.stubGlobal("fetch", fetchMock);
    await api.getFeed({ page: 1, pageSize: 20 });
    const [url] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toMatch(/\/feed(\?|$)/);
  });

  it("getFeedLatest hits /feed/latest with pagination params", async () => {
    const fetchMock = mockFetchOnce(page);
    vi.stubGlobal("fetch", fetchMock);
    await api.getFeedLatest({ page: 2, pageSize: 12 });
    const [url] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("/feed/latest");
    expect(String(url)).toContain("page=2");
    expect(String(url)).toContain("pageSize=12");
  });

  it("getFeedTrending hits /feed/trending", async () => {
    const fetchMock = mockFetchOnce(page);
    vi.stubGlobal("fetch", fetchMock);
    await api.getFeedTrending({});
    const [url] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("/feed/trending");
  });

  it("searchVideos hits /feed/search with encoded q", async () => {
    const fetchMock = mockFetchOnce(page);
    vi.stubGlobal("fetch", fetchMock);
    await api.searchVideos({ q: "space odyssey" });
    const [url] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("/feed/search");
    expect(String(url)).toContain("q=space+odyssey");
  });

  it("category filter is passed through as a query param", async () => {
    const fetchMock = mockFetchOnce(page);
    vi.stubGlobal("fetch", fetchMock);
    await api.getFeedLatest({ category: "drama" });
    const [url] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("category=drama");
  });
});