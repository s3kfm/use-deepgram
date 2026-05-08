import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useDeepgramFlux } from "./use-deepgram-flux.js"; // adjust path

// 1. Mock the Deepgram SDK
const mockConnect = vi.fn();
const mockOn = vi.fn();
const mockSendMedia = vi.fn();
const mockClose = vi.fn();

vi.mock("@deepgram/sdk", () => ({
  DeepgramClient: vi.fn(
    class {
      constructor() {}
      listen = {
        v2: {
          connect: vi.fn().mockResolvedValue({
            on: mockOn,
            connect: mockConnect,
            sendMedia: mockSendMedia,
            close: mockClose,
            readyState: 1, // WebSocket.OPEN
          }),
        },
      };
    },
  ),
}));

// 2. Mock Browser APIs
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  configurable: true, // Allows us to redefine it or clean it up
  writable: true,
});
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  state: "inactive",
})) as any;

describe("useDeepgramFlux", () => {
  const defaultProps = {
    token: "test-token",
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize the Deepgram connection on mount", async () => {
    const { result } = renderHook(() => useDeepgramFlux(defaultProps));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it("should setup listeners for TurnInfo messages", async () => {
    renderHook(() => useDeepgramFlux(defaultProps));

    await waitFor(() => {
      // Check if it registered the 'message' listener
      const messageListener = mockOn.mock.calls.find(
        (call) => call[0] === "message",
      );
      expect(messageListener).toBeDefined();
    });
  });

  it("should handle EndOfTurn and clear transcript", async () => {
    const onTurnEnd = vi.fn();
    const { result } = renderHook(() =>
      useDeepgramFlux({ ...defaultProps, onTurnEnd }),
    );

    await waitFor(() => {
      const messageHandler = mockOn.mock.calls.find(
        (call) => call[0] === "message",
      )![1];

      // Simulate Deepgram sending an EndOfTurn
      messageHandler({
        type: "TurnInfo",
        event: "EndOfTurn",
        transcript: "Hello world",
      });
    });

    expect(onTurnEnd).toHaveBeenCalledWith("Hello world");
    expect(result.current.interimTranscript).toBe("");
  });

  it("should cleanup on unmount", async () => {
    const { unmount } = renderHook(() => useDeepgramFlux(defaultProps));

    await waitFor(() => expect(mockConnect).toHaveBeenCalled());

    unmount();

    expect(mockClose).toHaveBeenCalled();
  });
});
