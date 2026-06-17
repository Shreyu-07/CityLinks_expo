import React, { createContext, useContext, useState } from "react";
import { UserRole } from "../types";

interface AppContextType {
  currentUser: any | null;
  currentRole: UserRole;
  setCurrentUser: (u: any | null) => void;
  setCurrentRole: (r: UserRole) => void;
  tempProdPhoto: string | null;
  setTempProdPhoto: (v: string | null) => void;
}

export const AppContext = createContext<AppContextType>({
  currentUser: null,
  currentRole: null,
  setCurrentUser: () => {},
  setCurrentRole: () => {},
  tempProdPhoto: null,
  setTempProdPhoto: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(null);
  const [tempProdPhoto, setTempProdPhoto] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentUser,
        setCurrentRole,
        tempProdPhoto,
        setTempProdPhoto,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
