# use-deepgram-flux


[![npm version](https://img.shields.io/npm/v/use-deepgram-flux?color=05ef81&labelColor=000000)](https://www.npmjs.com/package/use-deepgram-flux)
[![npm downloads](https://img.shields.io/npm/dm/use-deepgram-flux?color=05ef81&labelColor=000000)](https://www.npmjs.com/package/use-deepgram-flux)
[![license](https://img.shields.io/npm/l/use-deepgram-flux?color=05ef81&labelColor=000000)](https://github.com/s3kfm/use-deepgram-flux/blob/main/LICENSE)

A lightweight, performant React hook for building real-time voice applications using **Deepgram Flux**. This hook manages the complexity of web audio streams and WebSockets, providing a simple event-driven interface for conversational AI.

## Features

- **Turn-Based Events:** Native support for Deepgram Flux `StartOfTurn`, `Update`, and `EndOfTurn` events.
- **Auto-Managed Audio:** Handles `getUserMedia` and `MediaRecorder` setup and cleanup automatically.
- **Optimized for Voice Agents:** Designed for low-latency interactions where knowing when a user is "done" speaking is critical.
- **TypeScript First:** Fully typed parameters and return values.

## Installation

```bash
npm install use-deepgram-flux @deepgram/sdk
```

> **Note:** `@deepgram/sdk` is a peer dependency. Ensure it is installed in your project to keep the hook package lightweight.

## Usage

Integrating Flux into your AI Voice Agent is straightforward:

```tsx
import { useDeepgramFlux } from 'use-deepgram-flux';

function VoiceAssistant() {
  const { 
    connected, 
    listening, 
    interimTranscript, 
    error 
  } = useDeepgramFlux({
    token: 'YOUR_DEEPGRAM_API_KEY',
    onTurnStart: (text) => console.log("User started speaking..."),
    onUpdate: (text) => console.log("Live update:", text),
    onTurnEnd: (text) => {
      console.log("Turn complete. Final text:", text);
      // This is usually where you send the text to your LLM
    },
    onError: (err) => console.error("Flux Error:", err),
  });

  return (
    <div>
      <h3>Status: {connected ? 'Connected' : 'Connecting...'}</h3>
      <p>Mic: {listening ? 'Active' : 'Inactive'}</p>
      <div className="transcript-box">
        <p>{interimTranscript}</p>
      </div>
    </div>
  );
}
```

## API Reference

### Parameters (`UseDeepgramFluxProps`)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Required** | Your Deepgram API Key. |
| `model` | `string` | `'flux-general-en'` | The Flux model variant (`en` or `multi`). |
| `eotThreshold` | `number` | - | Confidence (0.5-0.9) to trigger an EndOfTurn. |
| `eotTimeoutMs` | `number` | - | Max silence (ms) before a turn is forced to end. |
| `sampleIntervalMs`| `number` | `100` | Frequency of audio data chunks sent to Deepgram. |
| `onTurnStart` | `function` | - | Triggered when the model detects a user has started speaking. |
| `onUpdate` | `function` | - | Triggered with live interim transcription updates. |
| `onTurnEnd` | `function` | - | Triggered when a user finishes their turn. |
| `onError` | `function` | **Required** | Error handling callback. |

### Return Value

| Property | Type | Description |
| :--- | :--- | :--- |
| `connected` | `boolean` | True when the WebSocket is open and authenticated. |
| `listening` | `boolean` | True when the browser microphone is successfully recording. |
| `errored` | `boolean` | Flag indicating if a connection or recording error occurred. |
| `error` | `Error` | The raw error object if `errored` is true. |
| `interimTranscript`| `string` | The live, unfinalized text for the current active turn. |

## Why use Flux?

Standard Speech-to-Text models often struggle with "endpointing" (knowing when a user is done talking). **Flux** is a specialized model that uses LLM-powered logic to understand the natural pauses in human speech, making it the ideal choice for real-time LLM orchestrators and Voice AI Agents.

## License

MIT