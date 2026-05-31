import { signal, computed, effect, Signal } from "@preact/signals";

// ============================================================================
// Types
// ============================================================================

/** Storage engine interface for persistence */
export interface StorageEngine<T = unknown> {
	getItem(key: string): T | null;
	setItem(key: string, value: T): void;
	removeItem(key: string): void;
	clear(): void;
}

/** Default localStorage engine */
export const localStorageEngine: StorageEngine = {
	getItem(key: string) {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch {
			return null;
		}
	},
	setItem(key: string, value: unknown) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			console.error("Failed to save to localStorage:", e);
		}
	},
	removeItem(key: string) {
		localStorage.removeItem(key);
	},
	clear() {
		localStorage.clear();
	},
};

/** Default sessionStorage engine */
export const sessionStorageEngine: StorageEngine = {
	getItem(key: string) {
		try {
			const item = sessionStorage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch {
			return null;
		}
	},
	setItem(key: string, value: unknown) {
		try {
			sessionStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			console.error("Failed to save to sessionStorage:", e);
		}
	},
	removeItem(key: string) {
		sessionStorage.removeItem(key);
	},
	clear() {
		sessionStorage.clear();
	},
};

/** Middleware context */
export interface MiddlewareContext<T = unknown> {
	store: Store<T>;
	action: string;
	state: T;
	nextState: T;
	payload: unknown;
}

/** Middleware function type */
export type Middleware<T = unknown> = (context: MiddlewareContext<T>) => void | Promise<void>;

/** Store configuration */
export interface StoreConfig<T> {
	/** Initial state */
	initialState: T;
	/** Store name for persistence and devtools */
	name?: string;
	/** Persistence configuration */
	persist?: {
		/** Storage engine (default: localStorage) */
		engine?: StorageEngine<T>;
		/** Key to use for storage */
		key?: string;
		/** Whitelist of keys to persist (if empty, persists all) */
		whitelist?: (keyof T)[];
		/** Blacklist of keys to NOT persist */
		blacklist?: (keyof T)[];
	};
	/** Array of middleware functions */
	middleware?: Middleware<T>[];
	/** Enable devtools integration (default: true in development) */
	devtools?: boolean;
}

/** Store instance */
export interface Store<T> {
	// State access
	getState(): T;
	get state(): T;
	
	// State updates
	setState(nextState: Partial<T> | ((current: T) => Partial<T>)): void;
	reset(): void;
	
	// Subscriptions
	subscribe(callback: (state: T, prevState: T) => void): () => void;
	subscribeKey<K extends keyof T>(
		key: K,
		callback: (value: T[K], prevValue: T[K]) => void
	): () => void;
	
	// Derived values
	computed<U>(fn: (state: T) => U): Signal<U>;
	
	// Persistence
	hydrate(): void;
	persist(): void;
	clearPersist(): void;
	
	// Devtools
	devtoolsLabel: string;
}

// ============================================================================
// Store Implementation
// ============================================================================

/** Global middleware registry for all stores */
const globalMiddleware: Middleware[] = [];

/** Register global middleware that runs on all stores */
export function addGlobalMiddleware(middleware: Middleware) {
	globalMiddleware.push(middleware);
}

/** Check if running in development mode */
function isDevelopment(): boolean {
	if (typeof window === "undefined") return false;
	return import.meta.env?.MODE !== "production" && import.meta.env?.PROD !== true;
}

/** Create a new store */
export function createStore<T>(config: StoreConfig<T>): Store<T> {
	const {
		initialState,
		name = "anonymous",
		persist: persistConfig,
		middleware: storeMiddleware = [],
		devtools = isDevelopment(),
	} = config;

	// Reactive state signal
	const stateSignal = signal<T>(initialState);

	// Subscribers
	const subscribers = new Set<(state: T, prevState: T) => void>();
	const keySubscribers = new Map<keyof T, Set<(value: unknown, prevValue: unknown) => void>>();

	// Devtools integration
	let devtoolsHook: { send: (action: string, state: T, prevState?: T, type?: string) => void; init: (state: T) => void } | null = null;
	if (devtools) {
		try {
			const ext = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
			if (ext) {
				devtoolsHook = {
					init(state: T) { ext.init(state); },
					send(action: string, state: T, prevState?: T, type?: string) {
						ext.send({ type: action, payload: state, prevState, action: type });
					}
				};
				devtoolsHook.init(stateSignal.value);
			}
		} catch {
			// DevTools not available
		}
	}

	// Persistence
	const persistenceKey = persistConfig?.key ?? `store:${name}`;
	const shouldPersist = !!persistConfig;
	const storageEngine = persistConfig?.engine ?? localStorageEngine;
	const whitelist = persistConfig?.whitelist ?? [];
	const blacklist = persistConfig?.blacklist ?? [];

	/** Filter state for persistence based on whitelist/blacklist */
	function filterStateForPersistence(state: T): Partial<T> {
		if (whitelist.length > 0) {
			const filtered: Partial<T> = {};
			for (const key of whitelist) {
				if (Object.prototype.hasOwnProperty.call(state, key)) {
					(filtered as any)[key] = (state as any)[key];
				}
			}
			return filtered;
		}
		if (blacklist.length > 0) {
			const filtered: Partial<T> = { ...state };
			for (const key of blacklist) {
				delete (filtered as any)[key];
			}
			return filtered;
		}
		return state;
	}

	/** Load persisted state */
	function loadPersistedState(): T | null {
		if (!shouldPersist) return null;
		try {
			const persisted = storageEngine.getItem(persistenceKey);
			return persisted ? { ...initialState, ...persisted as T } : null;
		} catch {
			return null;
		}
	}

	/** Persist current state */
	function saveState(state: T) {
		if (!shouldPersist) return;
		try {
			const toPersist = filterStateForPersistence(state);
			(storageEngine as StorageEngine<Partial<T>>).setItem(persistenceKey, toPersist);
		} catch (e) {
			console.error(`Failed to persist store "${name}":`, e);
		}
	}

	/** Clear persisted state */
	function doClearPersist() {
		if (shouldPersist) {
			storageEngine.removeItem(persistenceKey);
		}
	}

	// Initialize with persisted state if available
	const persistedState = loadPersistedState();
	if (persistedState) {
		stateSignal.value = persistedState;
	}

	// All middleware (global + store-specific)
	const allMiddleware = [...globalMiddleware, ...storeMiddleware];

	// Create the store object (forward declaration for middleware)
	let storeRef: Store<T>;

	// Define setState with access to storeRef
	function doSetState(nextState: Partial<T> | ((current: T) => Partial<T>)) {
		const currentState = stateSignal.value;
		const partial = typeof nextState === "function" 
			? (nextState as Function)(currentState) 
			: nextState;
		
		const newState = { ...currentState, ...partial };
		
		// Update signals
		const prev = stateSignal.value;
		stateSignal.value = newState;
		
		// Run middleware
		for (const mw of allMiddleware) {
			try {
				mw({
					store: storeRef,
					action: "SET_STATE",
					state: prev,
					nextState: newState,
					payload: partial,
				});
			} catch (e) {
				console.error(`Middleware error in "${name}":`, e);
			}
		}
		
		// Persist state
		saveState(newState);
		
		// Devtools
		if (devtoolsHook) {
			devtoolsHook.send("SET_STATE", newState, prev, "SET_STATE");
		}
		
		// Notify subscribers
		const finalState = stateSignal.value;
		for (const sub of subscribers) {
			try {
				sub(finalState, prev);
			} catch (e) {
				console.error(`Subscriber error in "${name}":`, e);
			}
		}
		
		// Notify key subscribers
		for (const [key, subs] of keySubscribers) {
			if (Object.prototype.hasOwnProperty.call(partial, key)) {
				const newValue = (finalState as any)[key];
				const oldValue = (prev as any)[key];
				for (const sub of subs) {
					try {
						sub(newValue, oldValue);
					} catch (e) {
						console.error(`Key subscriber error in "${name}" for key "${String(key)}":`, e);
					}
				}
			}
		}
	}

	// Define reset
	function doReset() {
		const current = stateSignal.value;
		stateSignal.value = { ...initialState };
		
		// Clear persisted state
		doClearPersist();
		
		// Notify subscribers
		for (const sub of subscribers) {
			try {
				sub(stateSignal.value, current);
			} catch (e) {
				console.error(`Subscriber error in "${name}" on reset:`, e);
			}
		}
		
		// Devtools
		if (devtoolsHook) {
			devtoolsHook.send("RESET", stateSignal.value, current, "RESET");
		}
	}

	// Create the store object
	const store: Store<T> = {
		getState() {
			return stateSignal.value;
		},
		
		get state() {
			return stateSignal.value;
		},
		
		setState: doSetState,
		
		reset: doReset,
		
		subscribe(callback: (state: T, prevState: T) => void) {
			subscribers.add(callback);
			// Immediately invoke with current state
			callback(stateSignal.value, stateSignal.value);
			return () => subscribers.delete(callback);
		},
		
		subscribeKey<K extends keyof T>(key: K, callback: (value: T[K], prevValue: T[K]) => void) {
			if (!keySubscribers.has(key)) {
				keySubscribers.set(key, new Set());
			}
			const subs = keySubscribers.get(key)!;
			subs.add(callback as (value: unknown, prevValue: unknown) => void);
			// Immediately invoke with current value
			callback(stateSignal.value[key], stateSignal.value[key]);
			return () => subs.delete(callback as any);
		},
		
		computed<U>(fn: (state: T) => U) {
			return computed(() => fn(stateSignal.value));
		},
		
		hydrate() {
			const persisted = loadPersistedState();
			if (persisted) {
				stateSignal.value = persisted;
				saveState(stateSignal.value);
			}
		},
		
		persist() {
			saveState(stateSignal.value);
		},
		
		clearPersist: doClearPersist,
		
		devtoolsLabel: name,
	};

	// Set the reference for middleware
	storeRef = store;

	// Run middleware on initialization
	for (const mw of allMiddleware) {
		try {
			mw({
				store: storeRef,
				action: "@@INIT",
				state: initialState,
				nextState: stateSignal.value,
				payload: persistedState ?? initialState,
			});
		} catch (e) {
			console.error(`Middleware error in "${name}" on init:`, e);
		}
	}

	// Devtools: send initial state
	if (devtoolsHook) {
		devtoolsHook.send("@@INIT", stateSignal.value);
	}

	// Persist state changes automatically via effect
	effect(() => {
		stateSignal.value; // Track the signal
		if (shouldPersist) {
			saveState(stateSignal.value);
		}
	});

	return store;
}

// ============================================================================
// Built-in Middleware
// ============================================================================

/** Logger middleware - logs all state changes */
export function loggerMiddleware<T>(config?: { collapsed?: boolean; prefix?: string }) {
	const { collapsed = false, prefix = "[Store]" } = config ?? {};
	
	return (context: MiddlewareContext<T>) => {
		if (collapsed && console.groupCollapsed) {
			console.groupCollapsed(
				`%c${prefix} ${context.store.devtoolsLabel}`,
				"color: #646cff; font-weight: bold",
				context.action
			);
			console.log("Payload:", context.payload);
			console.log("Prev State:", context.state);
			console.log("Next State:", context.nextState);
			console.groupEnd();
		} else {
			console.log(
				`%c${prefix} ${context.store.devtoolsLabel} ${context.action}`,
				"color: #646cff; font-weight: bold"
			);
		}
	};
}

/** Validation middleware - validates state changes */
export function validationMiddleware<T>(validator: (state: T) => string | null) {
	return (context: MiddlewareContext<T>) => {
		if (context.action !== "@@INIT") {
			const error = validator(context.nextState);
			if (error) {
				console.error(`Validation failed in store "${context.store.devtoolsLabel}":`, error);
				// Revert to previous state
				context.store.setState(context.state);
				throw new Error(error);
			}
		}
	};
}

/** Throttle persistence middleware - debounce persistence to avoid excessive writes */
export function throttlePersistenceMiddleware<T>(waitMs: number = 1000) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	
	return (context: MiddlewareContext<T>) => {
		if (context.action !== "@@INIT" && context.store.persist) {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				context.store.persist();
			}, waitMs);
		}
	};
}

// ============================================================================
// DevTools Enhancements
// ============================================================================

/** Connect store to Redux DevTools manually */
export function connectDevTools<T>(store: Store<T>, name?: string) {
	if (typeof window === "undefined") return;
	
	try {
		const devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
		if (!devtools) {
			console.warn("Redux DevTools Extension not available");
			return;
		}
		
		const connection = devtools.connect({ name: name ?? store.devtoolsLabel });
		connection.init(store.getState());
		
		store.subscribe((state) => {
			connection.send({ type: "STATE_UPDATE", payload: state });
		});
		
		// Handle DevTools actions
		connection.subscribe((message: any) => {
			if (message.type === "DISPATCH") {
				if (message.payload.type === "RESET") {
					store.reset();
				} else if (message.payload.type === "COMMIT" && message.payload.state) {
					store.setState(message.payload.state);
				}
			}
		});
	} catch (e) {
		console.error("Failed to connect to DevTools:", e);
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Create a selector hook for a store */
export function createSelector<T>(store: Store<T>) {
	return <K extends keyof T>(key: K): Signal<T[K]> => {
		return computed(() => store.state[key]);
	};
}

/** Combine multiple stores into one */
export function combineStores<T extends Record<string, any>>(
	stores: { [K in keyof T]: Store<T[K]> }
): Store<{ [K in keyof T]: T[K] }> {
	const initialCombinedState = Object.fromEntries(
		Object.entries(stores).map(([key, store]) => [key, store.getState()])
	) as { [K in keyof T]: T[K] };
	
	const combinedStore = createStore<{ [K in keyof T]: T[K] }>({
		name: "combined",
		initialState: initialCombinedState,
	});

	// Subscribe to all stores and update combined state
	const unsubscribers = Object.entries(stores).map(([key, store]) =>
		store.subscribe((state: any) => {
			combinedStore.setState({ [key]: state } as any);
		})
	);

	// Add cleanup method
	(combinedStore as any).cleanup = () => {
		unsubscribers.forEach(unsub => unsub());
	};

	return combinedStore as Store<{ [K in keyof T]: T[K] }>;
}

// ============================================================================
// Exports
// ============================================================================

export { signal, computed, effect } from "@preact/signals";
export type { Signal };
