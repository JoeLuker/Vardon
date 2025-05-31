import type { Entity } from '../types/EntityTypes';
import type {
	AbilitySubsystem,
	SkillSubsystem,
	BonusSubsystem,
	CombatSubsystem,
	AbilityBreakdown
} from '../types/SubsystemTypes';

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

/**
 * Subsystem to explain calculations and provide debugging information
 */
export class CalculationExplainer {
	private validAbilities = [
		'strength',
		'dexterity',
		'constitution',
		'intelligence',
		'wisdom',
		'charisma'
	];
	private validAttackTypes = ['melee', 'ranged', 'initiative', 'cmb', 'cmd'];
	private validSaveTypes = ['fortitude', 'reflex', 'will'];

	constructor(
		private abilitySubsystem: AbilitySubsystem,
		private skillSubsystem: SkillSubsystem,
		private bonusSubsystem: BonusSubsystem,
		private combatSubsystem: CombatSubsystem
	) {}

	/**
	 * Validate the entity exists and has character data
	 */
	private validateEntity(entity: Entity): void {
		if (!entity) {
			throw new ValidationError('Entity is required');
		}

		if (!entity.character) {
			throw new ValidationError('Entity has no character data');
		}
	}

	/**
	 * Explain any character value
	 */
	explainValue(entity: Entity, path: string): any {
		this.validateEntity(entity);

		// Check what type of value we're explaining
		if (path.startsWith('ability.')) {
			const ability = path.split('.')[1];
			if (!this.validAbilities.includes(ability)) {
				throw new ValidationError(`Invalid ability: ${ability}`);
			}
			return this.explainAbility(entity, ability);
		} else if (path.startsWith('skill.')) {
			const skillId = parseInt(path.split('.')[1], 10);
			if (isNaN(skillId)) {
				throw new ValidationError(`Invalid skill ID: ${path.split('.')[1]}`);
			}
			return this.explainSkill(entity, skillId);
		} else if (path.startsWith('combat.ac')) {
			return this.explainAC(entity);
		} else if (path.startsWith('combat.attack.')) {
			const attackType = path.split('.')[2];
			if (!this.validAttackTypes.includes(attackType)) {
				throw new ValidationError(`Invalid attack type: ${attackType}`);
			}
			return this.explainAttack(entity, attackType);
		} else if (path.startsWith('combat.save.')) {
			const saveType = path.split('.')[2];
			if (!this.validSaveTypes.includes(saveType)) {
				throw new ValidationError(`Invalid save type: ${saveType}`);
			}
			return this.explainSave(entity, saveType);
		} else if (path.startsWith('bonus.')) {
			const bonusTarget = path.split('.').slice(1).join('.');
			if (!bonusTarget) {
				throw new ValidationError('Bonus target is required');
			}
			return this.explainBonus(entity, bonusTarget);
		} else {
			return {
				error: `Unknown value path: ${path}`,
				supportedPaths: [
					'ability.<ability_name>',
					'skill.<skill_id>',
					'combat.ac',
					'combat.attack.<attack_type>',
					'combat.save.<save_type>',
					'bonus.<target>'
				]
			};
		}
	}

	/**
	 * Explain ability score calculation
	 */
	explainAbility(entity: Entity, ability: string): AbilityBreakdown {
		this.validateEntity(entity);

		if (!this.validAbilities.includes(ability)) {
			throw new ValidationError(`Invalid ability: ${ability}`);
		}

		return this.abilitySubsystem.getAbilityBreakdown(entity, ability);
	}

	/**
	 * Explain skill bonus calculation
	 */
	explainSkill(entity: Entity, skillId: number): any {
		this.validateEntity(entity);

		if (isNaN(skillId) || skillId < 0) {
			throw new ValidationError(`Invalid skill ID: ${skillId}`);
		}

		return this.skillSubsystem.getSkillBreakdown(entity, skillId);
	}

	/**
	 * Explain armor class calculation
	 */
	explainAC(entity: Entity): any {
		this.validateEntity(entity);
		return this.combatSubsystem.getACBreakdown(entity);
	}

	/**
	 * Explain attack bonus calculation
	 */
	explainAttack(entity: Entity, attackType: string): any {
		this.validateEntity(entity);

		if (!this.validAttackTypes.includes(attackType)) {
			throw new ValidationError(`Invalid attack type: ${attackType}`);
		}

		return this.combatSubsystem.getAttackBreakdown(entity, attackType);
	}

	/**
	 * Explain saving throw calculation
	 */
	explainSave(entity: Entity, saveType: string): any {
		this.validateEntity(entity);

		if (!this.validSaveTypes.includes(saveType)) {
			throw new ValidationError(`Invalid save type: ${saveType}`);
		}

		return this.combatSubsystem.getSaveBreakdown(entity, saveType);
	}

	/**
	 * Explain bonus calculation
	 */
	explainBonus(entity: Entity, target: string): any {
		this.validateEntity(entity);

		if (!target) {
			throw new ValidationError('Bonus target is required');
		}

		return this.bonusSubsystem.getBreakdown(entity, target);
	}

	/**
	 * Get a complete character report
	 */
	getCharacterReport(entity: Entity): any {
		this.validateEntity(entity);

		return {
			id: entity.id,
			name: entity.name,
			abilities: {
				strength: this.explainAbility(entity, 'strength'),
				dexterity: this.explainAbility(entity, 'dexterity'),
				constitution: this.explainAbility(entity, 'constitution'),
				intelligence: this.explainAbility(entity, 'intelligence'),
				wisdom: this.explainAbility(entity, 'wisdom'),
				charisma: this.explainAbility(entity, 'charisma')
			},
			combat: {
				armorClass: this.explainAC(entity),
				initiative: this.explainAttack(entity, 'initiative'),
				meleeAttack: this.explainAttack(entity, 'melee'),
				rangedAttack: this.explainAttack(entity, 'ranged'),
				cmb: this.combatSubsystem.getCMB(entity),
				cmd: this.combatSubsystem.getCMD(entity)
			},
			saves: {
				fortitude: this.explainSave(entity, 'fortitude'),
				reflex: this.explainSave(entity, 'reflex'),
				will: this.explainSave(entity, 'will')
			},
			skills: this.getAllSkillsBreakdown(entity),
			features: this.getFeatureBreakdown(entity),
			allBonuses: this.bonusSubsystem.getAllBonuses(entity)
		};
	}

	/**
	 * Get a breakdown of all skills
	 */
	getAllSkillsBreakdown(entity: Entity): Record<string, any> {
		this.validateEntity(entity);

		const allSkills = this.skillSubsystem.getAllSkills(entity);
		const result: Record<string, any> = {};

		Object.keys(allSkills).forEach((skillId) => {
			result[skillId] = this.skillSubsystem.getSkillBreakdown(entity, parseInt(skillId));
		});

		return result;
	}

	/**
	 * Get a breakdown of all features
	 */
	getFeatureBreakdown(entity: Entity): Record<string, any> {
		this.validateEntity(entity);

		const features: Record<string, any> = {};

		// Feats
		if (entity.character?.feats) {
			features.feats = entity.character.feats.map((feat) => ({
				id: feat.id,
				name: feat.name,
				options: feat.options
			}));
		}

		// Class features
		if (entity.character?.classFeatures) {
			features.classFeatures = entity.character.classFeatures.map((feature) => ({
				id: feature.id,
				name: feature.name,
				classId: feature.classId,
				level: feature.level,
				options: feature.options
			}));
		}

		// Traits
		if (entity.character?.traits) {
			features.traits = entity.character.traits.map((trait) => ({
				id: trait.id,
				name: trait.name,
				type: trait.type,
				options: trait.options
			}));
		}

		// Active conditions
		if (entity.character?.conditions) {
			features.conditions = entity.character.conditions;
		}

		return features;
	}

	/**
	 * Analyze performance of calculations
	 */
	analyzePerformance(entity: Entity): any {
		this.validateEntity(entity);

		const start = performance.now();

		// Run a complete character calculation
		this.getCharacterReport(entity);

		const end = performance.now();
		return {
			totalTimeMs: end - start,
			entityId: entity.id,
			entityComplexity: {
				feats: entity.character?.feats?.length || 0,
				skills: Object.keys(entity.character?.skills || {}).length,
				bonuses: this.countBonuses(entity),
				conditions: entity.character?.conditions?.length || 0
			}
		};
	}

	/**
	 * Count the total number of bonuses applied to a character
	 */
	private countBonuses(entity: Entity): number {
		if (!entity.character?.bonuses) return 0;

		let count = 0;
		Object.values(entity.character.bonuses).forEach((bonusList) => {
			count += bonusList.length;
		});

		return count;
	}
}
