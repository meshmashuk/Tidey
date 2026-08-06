import { useEffect, useState } from "react";
import { fetchAllStations } from "../api";
import type { Station } from "../types";

interface StationsState {
  stations: Station[];
  loading: boolean;
  error: string | null;
}

export function useStations(): StationsState {
  const [state, setState] = useState<StationsState>({ stations: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    fetchAllStations()
      .then((stations) => {
        if (!cancelled) setState({ stations, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            stations: [],
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load stations",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
