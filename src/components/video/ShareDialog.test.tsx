import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareDialog } from "@/components/video/ShareDialog";

interface RenderDialogOptions
  extends Partial<Omit<Parameters<typeof ShareDialog>[0], "onClose" | "onShared">> {
  onClose?: Mock<() => void>;
  onShared?: Mock<() => void>;
}

function renderDialog(overrides: RenderDialogOptions = {}) {
  const onClose = overrides.onClose ?? vi.fn<() => void>();
  const onShared = overrides.onShared ?? vi.fn<() => void>();
  const props = {
    open: true,
    title: "Amazing Man",
    url: "http://localhost:3000/watch/v1",
    currentTime: 300.7,
    ...overrides,
    onClose,
    onShared,
  };
  render(<ShareDialog {...props} />);
  return { ...props, onClose, onShared };
}

describe("ShareDialog", () => {
  let writeTextMock: Mock<(data: string) => Promise<void>>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextMock },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const onClose = vi.fn();
    render(<ShareDialog open={false} onClose={onClose} title="T" url="u" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a modal dialog with the canonical URL", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: /share this video/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Share URL")).toHaveValue(
      "http://localhost:3000/watch/v1",
    );
  });

  it("renders all share destinations with encoded hrefs and new-tab safety", () => {
    renderDialog();
    expect(screen.getByRole("link", { name: "X (Twitter)" })).toHaveAttribute(
      "href",
      "https://twitter.com/intent/tweet?url=http%3A%2F%2Flocalhost%3A3000%2Fwatch%2Fv1&text=Amazing%20Man",
    );
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("api.whatsapp.com/send"),
    );
    expect(screen.getByRole("link", { name: "Reddit" })).toHaveAttribute(
      "href",
      expect.stringContaining("reddit.com/submit"),
    );
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("disables the carousel controls until the strip is measured as scrollable", () => {
    renderDialog();
    expect(screen.getByLabelText("Previous share options")).toBeDisabled();
    expect(screen.getByLabelText("Next share options")).toBeDisabled();
  });

  it("copies the link, shows Copied, and records the real share", async () => {
    const { onShared } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Copy$/ }));
    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith("http://localhost:3000/watch/v1"),
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(onShared).toHaveBeenCalledTimes(1);
  });

  it("appends ?t=<seconds> when started-at-the-current-time is checked", async () => {
    renderDialog();
    const input = screen.getByLabelText("Share URL");
    fireEvent.click(screen.getByLabelText("Start at current time"));
    expect(input).toHaveValue("http://localhost:3000/watch/v1?t=300");
    fireEvent.click(screen.getByRole("button", { name: /^Copy$/ }));
    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith(
        "http://localhost:3000/watch/v1?t=300",
      ),
    );
  });

  it("reports a copy failure without recording a share", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    const { onShared } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Copy$/ }));
    expect(
      await screen.findByText(
        "Copy failed. Please select the link and copy it manually.",
      ),
    ).toBeInTheDocument();
    expect(onShared).not.toHaveBeenCalled();
  });

  it("closes on Escape and on backdrop click, but not on internal clicks", () => {
    const { onClose } = renderDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();
    fireEvent.click(screen.getByTestId("share-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("records a share when a destination is opened", () => {
    const { onShared } = renderDialog();
    fireEvent.click(screen.getByRole("link", { name: "Email" }));
    expect(onShared).toHaveBeenCalledTimes(1);
  });
});