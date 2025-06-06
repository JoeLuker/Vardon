import { logger } from '$lib/utils/Logger';

export const LoaderState = {
	INITIAL: 'initial',
	WAITING_FOR_RESOURCES: 'waiting_for_resources',
	LOADING: 'loading',
	LOADED: 'loaded',
	ERROR: 'error'
} as const;

export type LoaderStateType = (typeof LoaderState)[keyof typeof LoaderState];

export interface LoaderStateMachineOptions {
	maxLoadingAttempts?: number;
	debug?: boolean;
}

export interface StateTransitionResult {
	success: boolean;
	newState: LoaderStateType;
	error?: Error;
}

/**
 * State machine for managing character loading states
 */
export class LoaderStateMachine {
	private currentState: LoaderStateType = LoaderState.INITIAL;
	private loadingAttempts: number = 0;
	private readonly maxLoadingAttempts: number;
	private readonly debug: boolean;
	private stateChangeListeners: Array<(state: LoaderStateType) => void> = [];

	constructor(options: LoaderStateMachineOptions = {}) {
		this.maxLoadingAttempts = options.maxLoadingAttempts || 3;
		this.debug = options.debug || false;
	}

	/**
	 * Get current state
	 */
	getState(): LoaderStateType {
		return this.currentState;
	}

	/**
	 * Get loading attempts count
	 */
	getLoadingAttempts(): number {
		return this.loadingAttempts;
	}

	/**
	 * Check if can retry loading
	 */
	canRetry(): boolean {
		return this.loadingAttempts < this.maxLoadingAttempts;
	}

	/**
	 * Subscribe to state changes
	 */
	onStateChange(listener: (state: LoaderStateType) => void): () => void {
		this.stateChangeListeners.push(listener);
		return () => {
			const index = this.stateChangeListeners.indexOf(listener);
			if (index >= 0) {
				this.stateChangeListeners.splice(index, 1);
			}
		};
	}

	/**
	 * Transition to waiting for resources state
	 */
	transitionToWaitingForResources(): StateTransitionResult {
		if (!this.canTransitionTo(LoaderState.WAITING_FOR_RESOURCES)) {
			return {
				success: false,
				newState: this.currentState,
				error: new Error(
					`Cannot transition from ${this.currentState} to ${LoaderState.WAITING_FOR_RESOURCES}`
				)
			};
		}

		this.setState(LoaderState.WAITING_FOR_RESOURCES);
		logger.info('LoaderStateMachine', 'transitionToWaitingForResources', 'State changed', {
			newState: this.currentState
		});

		return {
			success: true,
			newState: this.currentState
		};
	}

	/**
	 * Transition to loading state
	 */
	transitionToLoading(): StateTransitionResult {
		if (!this.canTransitionTo(LoaderState.LOADING)) {
			return {
				success: false,
				newState: this.currentState,
				error: new Error(`Cannot transition from ${this.currentState} to ${LoaderState.LOADING}`)
			};
		}

		this.loadingAttempts++;
		this.setState(LoaderState.LOADING);

		logger.info('LoaderStateMachine', 'transitionToLoading', 'State changed', {
			newState: this.currentState,
			attempt: this.loadingAttempts
		});

		return {
			success: true,
			newState: this.currentState
		};
	}

	/**
	 * Transition to loaded state
	 */
	transitionToLoaded(): StateTransitionResult {
		if (!this.canTransitionTo(LoaderState.LOADED)) {
			return {
				success: false,
				newState: this.currentState,
				error: new Error(`Cannot transition from ${this.currentState} to ${LoaderState.LOADED}`)
			};
		}

		this.setState(LoaderState.LOADED);
		logger.info('LoaderStateMachine', 'transitionToLoaded', 'State changed', {
			newState: this.currentState,
			totalAttempts: this.loadingAttempts
		});

		return {
			success: true,
			newState: this.currentState
		};
	}

	/**
	 * Transition to error state
	 */
	transitionToError(error: Error): StateTransitionResult {
		this.setState(LoaderState.ERROR);

		logger.error('LoaderStateMachine', 'transitionToError', 'State changed to error', {
			newState: this.currentState,
			error: error.message,
			attempts: this.loadingAttempts
		});

		return {
			success: true,
			newState: this.currentState,
			error
		};
	}

	/**
	 * Reset state machine
	 */
	reset(): void {
		this.currentState = LoaderState.INITIAL;
		this.loadingAttempts = 0;
		this.notifyListeners();

		logger.debug('LoaderStateMachine', 'reset', 'State machine reset');
	}

	/**
	 * Check if can transition to a state
	 */
	private canTransitionTo(targetState: LoaderStateType): boolean {
		const transitions: Record<LoaderStateType, LoaderStateType[]> = {
			[LoaderState.INITIAL]: [LoaderState.WAITING_FOR_RESOURCES, LoaderState.LOADING],
			[LoaderState.WAITING_FOR_RESOURCES]: [LoaderState.LOADING, LoaderState.ERROR],
			[LoaderState.LOADING]: [
				LoaderState.LOADED,
				LoaderState.ERROR,
				LoaderState.WAITING_FOR_RESOURCES
			],
			[LoaderState.LOADED]: [LoaderState.LOADING], // Can reload
			[LoaderState.ERROR]: [LoaderState.WAITING_FOR_RESOURCES, LoaderState.LOADING] // Can retry
		};

		const allowedTransitions = transitions[this.currentState] || [];
		return allowedTransitions.includes(targetState);
	}

	/**
	 * Set state and notify listeners
	 */
	private setState(newState: LoaderStateType): void {
		this.currentState = newState;
		this.notifyListeners();
	}

	/**
	 * Notify all state change listeners
	 */
	private notifyListeners(): void {
		for (const listener of this.stateChangeListeners) {
			try {
				listener(this.currentState);
			} catch (error) {
				logger.error('LoaderStateMachine', 'notifyListeners', 'Listener error', { error });
			}
		}
	}
}
