import { DeepgramClient } from "@deepgram/sdk";
import { useEffect, useRef, useState } from "react";
export function useDeepgramFlux({
  token,
  eotThreshold,
  eotTimeoutMs,
  onTurnStart,
  onUpdate,
  onTurnEnd,
  onError,
  sampleIntervalMs = 100,
  model = "flux-general-en",
}: {
  token: string;
  eotThreshold?: number;
  eotTimeoutMs?: number;
  onTurnStart?: (transcript: string) => void;
  onUpdate?: (transcript: string) => void;
  onTurnEnd?: (transcript: string) => void;
  onError: (err: Error) => void;
  sampleIntervalMs?: number;
  model?: "flux-general-en" | "flux-general-multi";
}) {
  const deepgram = new DeepgramClient({ accessToken: token });
  type V2Socket = Awaited<ReturnType<typeof deepgram.listen.v2.connect>>;

  const [connected, setConnected] = useState(false);
  const [interimTranscript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  const [errored, setErrored] = useState(false);
  const isConnectingRef = useRef(false);
  const [error, setError] = useState<Error>();
  const socketRef = useRef<V2Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    async function initializeSocket() {
      isConnectingRef.current = true;
      socketRef.current = await deepgram.listen.v2.connect({
        eot_threshold: eotThreshold,
        eot_timeout_ms: eotTimeoutMs,
        model,
        Authorization: token,
      });
      socketRef.current.connect();
      socketRef.current.on("error", (e) => {
        setError(e);
        setErrored(true);
      });
      socketRef.current.on("message", (data) => {
        setErrored(false);
        setError(undefined);

        if (data.type === "TurnInfo") {
          if (data.event === "StartOfTurn") {
            onTurnStart?.(data.transcript);
          }
          if (data.event === "Update") {
            if (data.transcript) {
              setTranscript(data.transcript);
              onUpdate?.(data.transcript);
            }
          }
          if (data.event === "EndOfTurn") {
            console.log("END OF TURN DETECTED");
            onTurnEnd?.(data.transcript);
            setTranscript("");
          }
        }
      });

      socketRef.current.on("error", (e) => {
        onError(e);
        setError(e);
      });
      socketRef.current.on("open", async () => {
        setConnected(true);

        //Handle Error
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          mediaRecorderRef.current = new MediaRecorder(stream);

          mediaRecorderRef.current.addEventListener(
            "dataavailable",
            (event) => {
              if (
                socketRef.current &&
                event.data.size > 0 &&
                socketRef.current.readyState === WebSocket.OPEN
              ) {
                socketRef.current.sendMedia(event.data);
              }
            },
          );

          mediaRecorderRef.current.start(sampleIntervalMs);
          setListening(true);
        } catch (e) {
          setErrored(true);
          setError(e as Error);
        }
      });
    }
    if (!isConnectingRef.current) initializeSocket();
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (socketRef.current) socketRef.current.close();
    };
  }, []);
  return { connected, listening, errored, error, interimTranscript };
}
