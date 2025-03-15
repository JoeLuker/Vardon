/**
 * Represents a size modifier effect
 */
export interface SizeModifier {
  source: string;
  value: number; // Number of size steps (positive = larger, negative = smaller)
  priority?: number;
}

/**
 * Comprehensive size data with various modifiers
 */
export interface SizeData {
  baseSize: string;
  effectiveSize: string;
  acModifier: number;
  attackModifier: number;
  cmbModifier: number;
  cmdModifier: number;
  stealthModifier: number;
  flyModifier: number;
  specialSizeModifier: number;
  space: number; // in feet
  reach: number; // in feet
  heightMin: number; // in feet
  heightMax: number; // in feet
  weightMin: number; // in pounds
  weightMax: number; // in pounds
  weightMultiplier: number; // for carrying capacity
  sizeStepChange: number; // total change in size steps
  modifiers: SizeModifier[]; // all applied modifiers
}

// Define a type for valid size categories to make type checking work
type SizeCategory = 'fine' | 'diminutive' | 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan' | 'colossal';

/**
 * Implements Pathfinder's size rules and handles size changes
 */
export class SizeEngine {
  // Size step values (from smallest to largest)
  private readonly sizeSteps = [
    'fine', 'diminutive', 'tiny', 'small', 'medium', 
    'large', 'huge', 'gargantuan', 'colossal'
  ] as const;
  
  // Size modifiers by category
  private readonly modifiers: {
    ac: Record<SizeCategory, number>;
    attack: Record<SizeCategory, number>;
    cmb: Record<SizeCategory, number>;
    stealth: Record<SizeCategory, number>;
    fly: Record<SizeCategory, number>;
  } = {
    // Size modifier to AC
    ac: {
      'fine': 8, 'diminutive': 4, 'tiny': 2, 'small': 1, 
      'medium': 0, 'large': -1, 'huge': -2, 'gargantuan': -4, 'colossal': -8
    },
    // Size modifier to attack rolls
    attack: {
      'fine': -8, 'diminutive': -4, 'tiny': -2, 'small': -1, 
      'medium': 0, 'large': 1, 'huge': 2, 'gargantuan': 4, 'colossal': 8
    },
    // Size modifier to CMB and Special Attacks
    cmb: {
      'fine': -8, 'diminutive': -4, 'tiny': -2, 'small': -1, 
      'medium': 0, 'large': 1, 'huge': 2, 'gargantuan': 4, 'colossal': 8
    },
    // Size modifier to stealth
    stealth: {
      'fine': 16, 'diminutive': 12, 'tiny': 8, 'small': 4, 
      'medium': 0, 'large': -4, 'huge': -8, 'gargantuan': -12, 'colossal': -16
    },
    // Size modifier to fly
    fly: {
      'fine': 8, 'diminutive': 6, 'tiny': 4, 'small': 2, 
      'medium': 0, 'large': -2, 'huge': -4, 'gargantuan': -6, 'colossal': -8
    }
  };

  // Space occupied by size (in feet)
  private readonly space: Record<SizeCategory, number> = {
    'fine': 0.5, 'diminutive': 1, 'tiny': 2.5, 'small': 5, 
    'medium': 5, 'large': 10, 'huge': 15, 'gargantuan': 20, 'colossal': 30
  };

  // Natural reach by size (in feet)
  private readonly reach: Record<SizeCategory, number> = {
    'fine': 0, 'diminutive': 0, 'tiny': 0, 'small': 5, 
    'medium': 5, 'large': 10, 'huge': 15, 'gargantuan': 20, 'colossal': 30
  };

  // Height ranges (feet) by size
  private readonly heightRanges: Record<SizeCategory, [number, number]> = {
    'fine': [0, 0.5], 'diminutive': [0.5, 1], 'tiny': [1, 2], 'small': [2, 4], 
    'medium': [4, 8], 'large': [8, 16], 'huge': [16, 32], 'gargantuan': [32, 64], 'colossal': [64, 128]
  };

  // Weight ranges (pounds) by size
  private readonly weightRanges: Record<SizeCategory, [number, number]> = {
    'fine': [0, 1], 'diminutive': [1, 8], 'tiny': [8, 60], 'small': [60, 120], 
    'medium': [120, 500], 'large': [500, 4000], 'huge': [4000, 32000], 
    'gargantuan': [32000, 250000], 'colossal': [250000, 1000000]
  };

  // Carrying capacity multiplier by size
  private readonly carryingCapacityMultiplier: Record<SizeCategory, number> = {
    'fine': 0.125, 'diminutive': 0.25, 'tiny': 0.5, 'small': 0.75, 
    'medium': 1, 'large': 2, 'huge': 4, 'gargantuan': 8, 'colossal': 16
  };

  /**
   * Calculate all size-related data for a creature
   * 
   * @param baseSize - The creature's natural size
   * @param sizeModifiers - Array of size modifiers to apply
   * @returns Complete size data with all modifiers
   */
  public calculateSizeEffects(
    baseSize: string,
    sizeModifiers: SizeModifier[] = []
  ): SizeData {
    // Normalize the base size to lowercase
    baseSize = baseSize.toLowerCase();
    
    // Default to medium if size not recognized
    if (!this.sizeSteps.includes(baseSize as SizeCategory)) {
      baseSize = 'medium';
    }
    
    // Sort size modifiers by priority (higher first)
    const sortedModifiers = [...sizeModifiers].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );
    
    // Calculate total size steps adjustment
    const sizeStepChange = sortedModifiers.reduce(
      (sum, mod) => sum + mod.value, 
      0
    );
    
    // Calculate new effective size index (clamped to valid range)
    const baseSizeIndex = this.sizeSteps.indexOf(baseSize as SizeCategory);
    const effectiveSizeIndex = Math.max(
      0, 
      Math.min(
        this.sizeSteps.length - 1, 
        baseSizeIndex + sizeStepChange
      )
    );
    
    // Get the new effective size
    const effectiveSize = this.sizeSteps[effectiveSizeIndex] as SizeCategory;
    
    // Create size data result with all calculated values
    return {
      baseSize,
      effectiveSize,
      sizeStepChange,
      
      // AC and attack modifiers
      acModifier: this.modifiers.ac[effectiveSize],
      attackModifier: this.modifiers.attack[effectiveSize],
      cmbModifier: this.modifiers.cmb[effectiveSize],
      cmdModifier: this.modifiers.cmb[effectiveSize], // CMD uses same mod as CMB
      specialSizeModifier: this.modifiers.cmb[effectiveSize],
      stealthModifier: this.modifiers.stealth[effectiveSize],
      flyModifier: this.modifiers.fly[effectiveSize],
      
      // Space and reach
      space: this.space[effectiveSize],
      reach: this.reach[effectiveSize],
      
      // Height and weight
      heightMin: this.heightRanges[effectiveSize][0],
      heightMax: this.heightRanges[effectiveSize][1],
      weightMin: this.weightRanges[effectiveSize][0],
      weightMax: this.weightRanges[effectiveSize][1],
      
      // Carrying capacity multiplier
      weightMultiplier: this.carryingCapacityMultiplier[effectiveSize],
      
      // Keep track of the applied modifiers
      modifiers: sortedModifiers
    };
  }
  
  /**
   * Determines if a creature can use a weapon of a specific size
   * 
   * @param creatureSize - The size of the creature
   * @param weaponSize - The size of the weapon
   * @returns True if the creature can use the weapon
   */
  public canUseWeaponSize(creatureSize: string, weaponSize: string): boolean {
    creatureSize = creatureSize.toLowerCase();
    weaponSize = weaponSize.toLowerCase();
    
    if (!this.sizeSteps.includes(creatureSize as SizeCategory) || 
        !this.sizeSteps.includes(weaponSize as SizeCategory)) {
      return false;
    }
    
    const creatureSizeIndex = this.sizeSteps.indexOf(creatureSize as SizeCategory);
    const weaponSizeIndex = this.sizeSteps.indexOf(weaponSize as SizeCategory);
    
    // For one-handed or two-handed weapons
    // Creatures can use weapons of their size or one size larger (with two hands)
    return (
      weaponSizeIndex <= creatureSizeIndex || // Weapon their size or smaller
      weaponSizeIndex === creatureSizeIndex + 1 // Weapon one size larger
    );
  }
  
  /**
   * Determines how a creature wields a weapon of a specific size
   * 
   * @param creatureSize - The size of the creature
   * @param weaponSize - The size of the weapon
   * @returns 'light', 'one-handed', 'two-handed', or 'unusable'
   */
  public getWeaponHandedness(
    creatureSize: string,
    weaponSize: string,
    baseHandedness: 'light' | 'one-handed' | 'two-handed'
  ): 'light' | 'one-handed' | 'two-handed' | 'unusable' {
    creatureSize = creatureSize.toLowerCase();
    weaponSize = weaponSize.toLowerCase();
    
    if (!this.sizeSteps.includes(creatureSize as SizeCategory) || 
        !this.sizeSteps.includes(weaponSize as SizeCategory)) {
      return 'unusable';
    }
    
    const creatureSizeIndex = this.sizeSteps.indexOf(creatureSize as SizeCategory);
    const weaponSizeIndex = this.sizeSteps.indexOf(weaponSize as SizeCategory);
    const sizeDiff = creatureSizeIndex - weaponSizeIndex;
    
    // Weapon is too large
    if (sizeDiff < -1) {
      return 'unusable';
    }
    
    // Weapon is one size larger than the creature
    if (sizeDiff === -1) {
      return 'two-handed'; // All weapons usable one size larger are two-handed
    }
    
    // Weapon is same size as the creature
    if (sizeDiff === 0) {
      return baseHandedness; // Use base handedness
    }
    
    // Weapon is smaller than the creature
    if (sizeDiff === 1) {
      // Step down one category
      if (baseHandedness === 'two-handed') return 'one-handed';
      if (baseHandedness === 'one-handed') return 'light';
      return 'light'; // Light weapons stay light
    }
    
    // Weapon is much smaller than the creature (2+ sizes smaller)
    if (sizeDiff >= 2) {
      return 'light'; // All weapons 2+ sizes smaller are light
    }
    
    return 'unusable'; // Fallback (shouldn't reach here)
  }
  
  /**
   * Gets the size penalty/bonus for using inappropriately sized weapons
   * 
   * @param creatureSize - The size of the creature
   * @param weaponSize - The size of the weapon
   * @returns Modifier to attack rolls
   */
  public getWeaponSizePenalty(creatureSize: string, weaponSize: string): number {
    creatureSize = creatureSize.toLowerCase();
    weaponSize = weaponSize.toLowerCase();
    
    if (!this.sizeSteps.includes(creatureSize as SizeCategory) || 
        !this.sizeSteps.includes(weaponSize as SizeCategory)) {
      return -8; // Large penalty for unknown sizes
    }
    
    const creatureSizeIndex = this.sizeSteps.indexOf(creatureSize as SizeCategory);
    const weaponSizeIndex = this.sizeSteps.indexOf(weaponSize as SizeCategory);
    const sizeDiff = creatureSizeIndex - weaponSizeIndex;
    
    // Weapon is too large
    if (sizeDiff < -1) {
      return -8; // Unusable
    }
    
    // Weapon is one size larger
    if (sizeDiff === -1) {
      return -2; // -2 penalty for wielding oversized weapons
    }
    
    // Weapon is same size
    if (sizeDiff === 0) {
      return 0; // No penalty for appropriate size
    }
    
    // Weapon is smaller than creature
    if (sizeDiff > 0) {
      return -2; // -2 penalty for wielding undersized weapons
    }
    
    return 0;
  }
} 