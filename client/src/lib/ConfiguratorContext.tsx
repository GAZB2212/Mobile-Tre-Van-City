import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { KitServiceType } from '@shared/schema';

export interface ConfiguratorSlotState {
  vanId: string | null;
  customVanDescription: string | null;
  customVanValue: number | null; // in pence
  vanReg: string | null;
  serviceType: KitServiceType | null;
  kitId: string | null;
  upgradeIds: string[];
  trainingOptionIds: string[];
  financePlanId: string | null;
  financeInputs: {
    deposit?: number;
    term?: number;
    balloon?: number;
  } | null;
  pricingSnapshot: {
    subtotal: number;
    vat: number;
    total: number;
  } | null;
}

// Legacy alias for backwards compatibility
export type ConfiguratorState = ConfiguratorSlotState;

interface ConfiguratorContextValue {
  state: ConfiguratorSlotState; // always reflects the active slot
  slotA: ConfiguratorSlotState;
  slotB: ConfiguratorSlotState;
  compareMode: boolean;
  activeSlot: 'A' | 'B';
  enableCompareMode: () => void;
  setActiveSlot: (slot: 'A' | 'B') => void;
  clearSlotA: () => void;
  clearSlotB: () => void;
  setVan: (vanId: string | null) => void;
  setCustomVan: (description: string, valueInPence: number) => void;
  setCustomVanValue: (valueInPence: number | null) => void;
  setVanReg: (reg: string | null) => void;
  setServiceType: (serviceType: KitServiceType | null) => void;
  setKit: (kitId: string | null) => void;
  setUpgrades: (upgradeIds: string[]) => void;
  addUpgrade: (upgradeId: string) => void;
  removeUpgrade: (upgradeId: string) => void;
  replaceUpgrades: (toRemove: string[], toAdd: string) => void;
  setTrainingOptions: (trainingOptionIds: string[]) => void;
  addTrainingOption: (trainingOptionId: string) => void;
  removeTrainingOption: (trainingOptionId: string) => void;
  setFinancePlan: (financePlanId: string | null) => void;
  setFinanceInputs: (inputs: ConfiguratorSlotState['financeInputs']) => void;
  setPricingSnapshot: (pricing: ConfiguratorSlotState['pricingSnapshot']) => void;
  clearAll: () => void;
  resetFromVan: () => void;
  resetFromServiceType: () => void;
  resetFromKit: () => void;
  resetFromUpgrades: () => void;
  resetFromFinance: () => void;
}

const STORAGE_KEY = 'configurator:v5';

const defaultSlotState: ConfiguratorSlotState = {
  vanId: null,
  customVanDescription: null,
  customVanValue: null,
  vanReg: null,
  serviceType: null,
  kitId: null,
  upgradeIds: [],
  trainingOptionIds: [],
  financePlanId: null,
  financeInputs: null,
  pricingSnapshot: null,
};

interface FullState {
  slotA: ConfiguratorSlotState;
  slotB: ConfiguratorSlotState;
  compareMode: boolean;
  activeSlot: 'A' | 'B';
}

const defaultFullState: FullState = {
  slotA: defaultSlotState,
  slotB: defaultSlotState,
  compareMode: false,
  activeSlot: 'A',
};

const ConfiguratorContext = createContext<ConfiguratorContextValue | undefined>(undefined);

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [fullState, setFullState] = useState<FullState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultFullState,
          slotA: { ...defaultSlotState, ...(parsed.slotA || parsed) },
          slotB: { ...defaultSlotState, ...(parsed.slotB || {}) },
          compareMode: parsed.compareMode ?? false,
          activeSlot: parsed.activeSlot ?? 'A',
        };
      }
      // Try upgrading from old v4 key
      const oldStored = localStorage.getItem('configurator:v4');
      if (oldStored) {
        const parsed = JSON.parse(oldStored);
        return {
          ...defaultFullState,
          slotA: { ...defaultSlotState, ...parsed },
        };
      }
    } catch (error) {
      console.error('Failed to load configurator state:', error);
    }
    return defaultFullState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
    } catch (error) {
      console.error('Failed to save configurator state:', error);
    }
  }, [fullState]);

  // Helper to update the currently active slot
  const updateActiveSlot = (updater: (prev: ConfiguratorSlotState) => ConfiguratorSlotState) => {
    setFullState(prev => {
      if (prev.activeSlot === 'A') {
        return { ...prev, slotA: updater(prev.slotA) };
      } else {
        return { ...prev, slotB: updater(prev.slotB) };
      }
    });
  };

  const enableCompareMode = () => {
    setFullState(prev => ({
      ...prev,
      compareMode: true,
      slotB: defaultSlotState,
      activeSlot: 'B',
    }));
  };

  const setActiveSlot = (slot: 'A' | 'B') => {
    setFullState(prev => ({ ...prev, activeSlot: slot }));
  };

  const clearSlotA = () => {
    // Resets slot A config back to default while keeping compare mode active
    setFullState(prev => ({
      ...prev,
      slotA: defaultSlotState,
      activeSlot: 'A',
    }));
  };

  const clearSlotB = () => {
    setFullState(prev => ({
      ...prev,
      compareMode: false,
      slotB: defaultSlotState,
      activeSlot: 'A',
    }));
  };

  const setVan = (vanId: string | null) => {
    updateActiveSlot(prev => ({
      ...prev,
      vanId,
      customVanDescription: null,
      customVanValue: null,
      serviceType: null,
      kitId: null,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const setCustomVan = (description: string, valueInPence: number) => {
    updateActiveSlot(prev => ({
      ...prev,
      vanId: null,
      customVanDescription: description,
      customVanValue: valueInPence,
      serviceType: null,
      kitId: null,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const setCustomVanValue = (valueInPence: number | null) => {
    updateActiveSlot(prev => ({ ...prev, customVanValue: valueInPence }));
  };

  const setVanReg = (reg: string | null) => {
    updateActiveSlot(prev => ({ ...prev, vanReg: reg }));
  };

  const setServiceType = (serviceType: KitServiceType | null) => {
    updateActiveSlot(prev => ({
      ...prev,
      serviceType,
      kitId: null,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const setKit = (kitId: string | null) => {
    updateActiveSlot(prev => ({
      ...prev,
      kitId,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const setUpgrades = (upgradeIds: string[]) => {
    updateActiveSlot(prev => ({ ...prev, upgradeIds }));
  };

  const addUpgrade = (upgradeId: string) => {
    updateActiveSlot(prev => {
      if (prev.upgradeIds.includes(upgradeId)) return prev;
      return { ...prev, upgradeIds: [...prev.upgradeIds, upgradeId] };
    });
  };

  const removeUpgrade = (upgradeId: string) => {
    updateActiveSlot(prev => ({
      ...prev,
      upgradeIds: prev.upgradeIds.filter(id => id !== upgradeId),
    }));
  };

  const replaceUpgrades = (toRemove: string[], toAdd: string) => {
    updateActiveSlot(prev => {
      let newUpgradeIds = prev.upgradeIds.filter(id => !toRemove.includes(id));
      if (!newUpgradeIds.includes(toAdd)) {
        newUpgradeIds = [...newUpgradeIds, toAdd];
      }
      return { ...prev, upgradeIds: newUpgradeIds };
    });
  };

  const setTrainingOptions = (trainingOptionIds: string[]) => {
    updateActiveSlot(prev => ({ ...prev, trainingOptionIds }));
  };

  const addTrainingOption = (trainingOptionId: string) => {
    updateActiveSlot(prev => {
      if (prev.trainingOptionIds.includes(trainingOptionId)) return prev;
      return { ...prev, trainingOptionIds: [...prev.trainingOptionIds, trainingOptionId] };
    });
  };

  const removeTrainingOption = (trainingOptionId: string) => {
    updateActiveSlot(prev => ({
      ...prev,
      trainingOptionIds: prev.trainingOptionIds.filter(id => id !== trainingOptionId),
    }));
  };

  const setFinancePlan = (financePlanId: string | null) => {
    updateActiveSlot(prev => ({
      ...prev,
      financePlanId,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const setFinanceInputs = (financeInputs: ConfiguratorSlotState['financeInputs']) => {
    updateActiveSlot(prev => ({ ...prev, financeInputs }));
  };

  const setPricingSnapshot = (pricingSnapshot: ConfiguratorSlotState['pricingSnapshot']) => {
    updateActiveSlot(prev => ({ ...prev, pricingSnapshot }));
  };

  const clearAll = () => {
    setFullState(defaultFullState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear configurator state:', error);
    }
  };

  const resetFromVan = () => {
    updateActiveSlot(prev => ({
      ...prev,
      customVanDescription: null,
      customVanValue: null,
      vanReg: null,
      serviceType: null,
      kitId: null,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const resetFromServiceType = () => {
    updateActiveSlot(prev => ({
      ...prev,
      kitId: null,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const resetFromKit = () => {
    updateActiveSlot(prev => ({
      ...prev,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const resetFromUpgrades = () => {
    updateActiveSlot(prev => ({
      ...prev,
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const resetFromFinance = () => {
    updateActiveSlot(prev => ({
      ...prev,
      pricingSnapshot: null,
    }));
  };

  const activeSlotState = fullState.activeSlot === 'A' ? fullState.slotA : fullState.slotB;

  const value: ConfiguratorContextValue = {
    state: activeSlotState,
    slotA: fullState.slotA,
    slotB: fullState.slotB,
    compareMode: fullState.compareMode,
    activeSlot: fullState.activeSlot,
    enableCompareMode,
    setActiveSlot,
    clearSlotA,
    clearSlotB,
    setVan,
    setCustomVan,
    setCustomVanValue,
    setVanReg,
    setServiceType,
    setKit,
    setUpgrades,
    addUpgrade,
    removeUpgrade,
    replaceUpgrades,
    setTrainingOptions,
    addTrainingOption,
    removeTrainingOption,
    setFinancePlan,
    setFinanceInputs,
    setPricingSnapshot,
    clearAll,
    resetFromVan,
    resetFromServiceType,
    resetFromKit,
    resetFromUpgrades,
    resetFromFinance,
  };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
}

export function useConfigurator() {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error('useConfigurator must be used within ConfiguratorProvider');
  }
  return context;
}
