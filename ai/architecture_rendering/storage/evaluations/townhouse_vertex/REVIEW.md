# Agent Platform connection validation

- Gemini 3.1 Flash Image via LangChain, Vertex express mode (`GOOGLE_GENAI_USE_VERTEXAI=true`).
- Real image request: HTTP 200; 21.12 seconds; 2180 × 1920 pixels.
- Original: `source.png`; full prompt and options: `v4.json`; result: `v4.png`.
- Authentication fixed by routing to aiplatform.googleapis.com. No prompt change for this trial.
- Visual review: material depth and tree shadows are present, but result still looks rendered versus the supplied photographic target. It invents visible indoor furniture and road paint despite restrictions. Not accepted as geometry/detail preservation or final quality validation.
