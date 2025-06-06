/**
 * Device request codes (like ioctl requests in Unix)
 */
export const REQUEST = {
	INITIALIZE: 0,
	GET_CHARACTER: 1,
	SET_CHARACTER: 2,
	CALC_ABILITY: 3,
	CALC_SKILL: 4,
	CALC_COMBAT: 5,
	APPLY_BONUS: 6,
	APPLY_CONDITION: 7
} as const;
