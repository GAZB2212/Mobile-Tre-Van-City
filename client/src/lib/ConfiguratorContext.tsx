import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { KitServiceType } from '@shared/schema';

export interface ConfiguratorState {
  vanId: string | null;
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

interface ConfiguratorContextValue {
  state: ConfiguratorState;
  setVan: (vanId: string | null) => void;
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
  setFinanceInputs: (inputs: ConfiguratorState['financeInputs']) => void;
  setPricingSnapshot: (pricing: ConfiguratorState['pricingSnapshot']) => void;
  clearAll: () => void;
  resetFromVan: () => void;
  resetFromServiceType: () => void;
  resetFromKit: () => void;
  resetFromUpgrades: () => void;
  resetFromFinance: () => void;
}

const STORAGE_KEY = 'configurator:v2';

const defaultState: ConfiguratorState = {
  vanId: null,
  serviceType: null,
  kitId: null,
  upgradeIds: [],
  trainingOptionIds: [],
  financePlanId: null,
  financeInputs: null,
  pricingSnapshot: null,
};

const ConfiguratorContext = createContext<ConfiguratorContextValue | undefined>(undefined);

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfiguratorState>(() => {
    // Hydrate from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultState, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load configurator state:', error);
    }
    return defaultState;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save configurator state:', error);
    }
  }, [state]);

  const setVan = (vanId: string | null) => {
    // Clear downstream selections when van changes
    setState(prev => ({
      ...prev,
      vanId,
      serviceType: null,
      kitId: null,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const setServiceType = (serviceType: KitServiceType | null) => {
    // Clear downstream selections when service type changes
    setState(prev => ({
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
    // Clear downstream selections when kit changes
    setState(prev => ({
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
    setState(prev => ({ ...prev, upgradeIds }));
  };

  const addUpgrade = (upgradeId: string) => {
    setState(prev => {
      // Prevent duplicates
      if (prev.upgradeIds.includes(upgradeId)) {
        return prev;
      }
      return {
        ...prev,
        upgradeIds: [...prev.upgradeIds, upgradeId]
      };
    });
  };

  const removeUpgrade = (upgradeId: string) => {
    setState(prev => ({
      ...prev,
      upgradeIds: prev.upgradeIds.filter(id => id !== upgradeId)
    }));
  };

  const replaceUpgrades = (toRemove: string[], toAdd: string) => {
    setState(prev => {
      // Remove all items in toRemove array and add the new item in a single atomic update
      let newUpgradeIds = prev.upgradeIds.filter(id => !toRemove.includes(id));
      
      // Prevent duplicates when adding
      if (!newUpgradeIds.includes(toAdd)) {
        newUpgradeIds = [...newUpgradeIds, toAdd];
      }
      
      return {
        ...prev,
        upgradeIds: newUpgradeIds
      };
    });
  };

  const setTrainingOptions = (trainingOptionIds: string[]) => {
    setState(prev => ({ ...prev, trainingOptionIds }));
  };

  const addTrainingOption = (trainingOptionId: string) => {
    setState(prev => {
      // Prevent duplicates
      if (prev.trainingOptionIds.includes(trainingOptionId)) {
        return prev;
      }
      return {
        ...prev,
        trainingOptionIds: [...prev.trainingOptionIds, trainingOptionId]
      };
    });
  };

  const removeTrainingOption = (trainingOptionId: string) => {
    setState(prev => ({
      ...prev,
      trainingOptionIds: prev.trainingOptionIds.filter(id => id !== trainingOptionId)
    }));
  };

  const setFinancePlan = (financePlanId: string | null) => {
    // Clear finance inputs and pricing when plan changes
    setState(prev => ({
      ...prev,
      financePlanId,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const setFinanceInputs = (financeInputs: ConfiguratorState['financeInputs']) => {
    setState(prev => ({ ...prev, financeInputs }));
  };

  const setPricingSnapshot = (pricingSnapshot: ConfiguratorState['pricingSnapshot']) => {
    setState(prev => ({ ...prev, pricingSnapshot }));
  };

  const clearAll = () => {
    setState(defaultState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear configurator state:', error);
    }
  };

  // Reset later steps when earlier step changes
  const resetFromVan = () => {
    setState(prev => ({
      ...prev,
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
    setState(prev => ({
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
    setState(prev => ({
      ...prev,
      upgradeIds: [],
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const resetFromUpgrades = () => {
    setState(prev => ({
      ...prev,
      trainingOptionIds: [],
      financePlanId: null,
      financeInputs: null,
      pricingSnapshot: null,
    }));
  };

  const resetFromFinance = () => {
    setState(prev => ({
      ...prev,
      pricingSnapshot: null,
    }));
  };

  const value: ConfiguratorContextValue = {
    state,
    setVan,
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
