import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreatorGuard } from "@/components/creator/CreatorGuard";

const { authState, routerReplace, routerPush } = vi.hoisted(() => ({
  authState: {
    user: null as {
      role?: string;
      id?: string;
      email?: string;
      name?: string;
      status?: string;
    } | null,
    isLoading: true,
    isCreator: false,
    isAdmin: false,
  },
  routerReplace: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authState,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: routerPush }),
  usePathname: () => "/creator",
}));

beforeEach(() => {
  routerReplace.mockClear();
  routerPush.mockClear();
});

describe("CreatorGuard", () => {
  it("does not redirect while auth restoration is pending", () => {
    authState.user = null;
    authState.isLoading = true;

    render(
      <CreatorGuard>
        <div>studio</div>
      </CreatorGuard>,
    );

    expect(screen.getByText("Loading Creator Studio...")).toBeInTheDocument();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("redirects to sign-in after auth definitively resolves unauthenticated", () => {
    authState.user = null;
    authState.isLoading = false;

    render(
      <CreatorGuard>
        <div>studio</div>
      </CreatorGuard>,
    );

    expect(routerReplace).toHaveBeenCalledWith("/?auth=signin");
  });

  it("renders creator children once auth resolves as an authenticated creator", () => {
    authState.user = { role: "CREATOR" };
    authState.isLoading = false;
    authState.isCreator = true;

    render(
      <CreatorGuard>
        <div>studio</div>
      </CreatorGuard>,
    );

    expect(screen.getByText("studio")).toBeInTheDocument();
    expect(routerReplace).not.toHaveBeenCalled();
  });
});