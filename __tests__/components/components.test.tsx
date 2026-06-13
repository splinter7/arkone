import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { MediaPlayer } from "@/components/MediaPlayer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ToastProvider, useToast } from "@/components/ToastProvider";
import { UploadZone } from "@/components/UploadZone";
import { API_KEY_STORAGE_KEY } from "@/lib/api-client";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  );
}

describe("ApiKeyGate", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("prompts for API key and stores it", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ assets: [] }), { status: 200 }),
    );

    renderWithProviders(
      <ApiKeyGate>
        <p>Protected content</p>
      </ApiKeyGate>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("API secret")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("API secret"), "my-secret");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByText("Protected content")).toBeInTheDocument();
    });

    expect(sessionStorage.getItem(API_KEY_STORAGE_KEY)).toBe("my-secret");
  });

  it("shows an error for invalid API keys", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    renderWithProviders(
      <ApiKeyGate>
        <p>Protected content</p>
      </ApiKeyGate>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("API secret")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("API secret"), "wrong-secret");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid API secret/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});

describe("MediaPlayer", () => {
  afterEach(() => cleanup());
  it("renders image element for images", () => {
    render(
      <MediaPlayer
        url="https://example.com/image.jpg"
        category="image"
        name="image.jpg"
      />,
    );

    expect(screen.getByRole("img", { name: "image.jpg" })).toHaveAttribute(
      "src",
      "https://example.com/image.jpg",
    );
  });

  it("opens lightbox when image preview is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MediaPlayer
        url="https://example.com/image.jpg"
        category="image"
        name="image.jpg"
      />,
    );

    fireEvent.load(screen.getByRole("img", { name: "image.jpg" }));
    await user.click(
      screen.getByRole("button", { name: "Open image.jpg in lightbox" }),
    );

    expect(screen.getByRole("dialog", { name: "image.jpg full size" })).toBeInTheDocument();
  });

  it("renders video element for videos", () => {
    const { container } = render(
      <MediaPlayer
        url="https://example.com/video.mp4"
        category="video"
        name="video.mp4"
      />,
    );

    expect(container.querySelector("video")).not.toBeNull();
  });

  it("renders audio element for audio", () => {
    const { container } = render(
      <MediaPlayer
        url="https://example.com/audio.mp3"
        category="audio"
        name="audio.mp3"
      />,
    );

    expect(container.querySelector("audio")).not.toBeNull();
  });
});

describe("UploadZone", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders upload area", () => {
    renderWithProviders(<UploadZone onUploaded={() => {}} />);
    expect(screen.getByText(/Drop media here/i)).toBeInTheDocument();
  });

  it("rejects non-media files client-side", () => {
    const { container } = renderWithProviders(
      <UploadZone onUploaded={() => {}} />,
    );

    const input = container.querySelector(
      "input[type='file']",
    ) as HTMLInputElement;
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(
      screen.getByText(/Only image, video, and audio files are supported/i),
    ).toBeInTheDocument();
  });
});

describe("ToastProvider", () => {
  afterEach(() => cleanup());

  it("shows success toast", async () => {
    function ToastTrigger() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.success("photo.jpg uploaded")}>
          Show toast
        </button>
      );
    }

    const user = userEvent.setup();
    renderWithProviders(<ToastTrigger />);

    await user.click(screen.getByRole("button", { name: "Show toast" }));

    expect(screen.getByText("photo.jpg uploaded")).toBeInTheDocument();
  });
});

describe("ScrollToTop", () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  it("appears after scrolling down and hides near the top", () => {
    renderWithProviders(<ScrollToTop />);

    const button = screen.getByRole("button", { name: "Scroll to top" });
    expect(button.className).toContain("opacity-0");

    Object.defineProperty(window, "scrollY", {
      value: 400,
      writable: true,
      configurable: true,
    });
    fireEvent.scroll(window);

    expect(button.className).toContain("opacity-100");

    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });
    fireEvent.scroll(window);

    expect(button.className).toContain("opacity-0");
  });

  it("scrolls to the top when clicked", () => {
    const scrollTo = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, "scrollTo", {
      value: scrollTo,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", {
      value: 400,
      writable: true,
      configurable: true,
    });

    renderWithProviders(<ScrollToTop />);
    fireEvent.scroll(window);

    fireEvent.click(screen.getByRole("button", { name: "Scroll to top" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
