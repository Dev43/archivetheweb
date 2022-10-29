import * as React from "react";

export const ProviderContext = React.createContext<any>(undefined);

interface StateProviderProps {
  children: React.ReactNode;
  value?: any;
}

export const StateProvider: React.FC<StateProviderProps> = (
  props: StateProviderProps
) => (
  <ProviderContext.Provider value={props.value}>
    {props.children}
  </ProviderContext.Provider>
);

export const useStateProvider = () => React.useContext(ProviderContext);
