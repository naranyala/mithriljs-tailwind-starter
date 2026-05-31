import { signal } from "@preact/signals";

/**
 * Copies text to the system clipboard.
 * @param text The text to copy.
 * @returns A promise that resolves when the copy is successful.
 */
export async function copyToClipboard(text: string): Promise<void> {
	if (!navigator.clipboard) {
		throw new Error("Clipboard API not available");
	}
	await navigator.clipboard.writeText(text);
}

/**
 * A signal that tracks whether the browser is online.
 */
export const isOnline = signal(typeof navigator !== "undefined" ? navigator.onLine : true);

if (typeof window !== "undefined") {
	window.addEventListener("online", () => (isOnline.value = true));
	window.addEventListener("offline", () => (isOnline.value = false));
}

/**
 * A signal that tracks the current window dimensions.
 */
export const windowSize = signal({
	width: typeof window !== "undefined" ? window.innerWidth : 0,
	height: typeof window !== "undefined" ? window.innerHeight : 0,
});

if (typeof window !== "undefined") {
	const handleResize = () => {
		windowSize.value = {
			width: window.innerWidth,
			height: window.innerHeight,
		};
	};
	window.addEventListener("resize", handleResize);
}

/**
 * Creates a signal that tracks a media query.
 * @param query The media query string (e.g., "(max-width: 600px)").
 * @returns A signal containing the boolean result of the media query.
 */
export function useMediaQuery(query: string): import("@preact/signals").Signal<boolean> {
	if (typeof window === "undefined") {
		return signal(false);
	}

	const mq = window.matchMedia(query);
	const result = signal(mq.matches);

	const handler = (event: MediaQueryListEvent) => {
		result.value = event.matches;
	};
	mq.addEventListener("change", handler);

	// Return a function to clean up the listener if needed, 
	// or we can just accept that this is a singleton-ish pattern for simplicity here.
	// In a more robust implementation, we'd use a Mithril component to manage lifecycle.
	
	return result;
}
