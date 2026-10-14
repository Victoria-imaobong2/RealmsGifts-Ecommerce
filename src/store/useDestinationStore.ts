import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_DESTINATION } from "@/config/delivery";

interface DestinationState {
  country: string;
  region: string;
  city: string;
  postalCode: string;
  set: (patch: Partial<Pick<DestinationState, "country" | "region" | "city" | "postalCode">>) => void;
}

/** Where the shopper last said they're sending a gift. Defaults to the United States. */
export const useDestinationStore = create<DestinationState>()(
  persist(
    (set) => ({
      country: DEFAULT_DESTINATION,
      region: "",
      city: "",
      postalCode: "",
      set: (patch) => set(patch),
    }),
    {
      name: "rg-destination",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ country, region, city, postalCode }) => ({ country, region, city, postalCode }),
    },
  ),
);
