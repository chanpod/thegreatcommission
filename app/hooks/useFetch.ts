import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router";
import React from "react";
import useRefresh from "./useRefresh";

interface FetchOptions<TArgs extends unknown[]> {
  fetchOnLoad?: boolean;
  suppressError?: boolean;
  refreshAfterLoad?: boolean;
  args?: TArgs;
}

const useFetch = <T, TArgs extends unknown[] = []>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  options: FetchOptions<TArgs> | undefined = undefined,
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const refresh = useRefresh();

  React.useEffect(() => {
    if (options?.fetchOnLoad && typeof window !== "undefined") {
      if (options.args) {
        callFetch(...options.args);
      } else {
        throw new Error("args is required when fetchOnLoad is true");
      }
    }
  }, []);

  async function callFetch(...args: TArgs) {
    setLoading(true);
    setError(null);
    try {
      const response = await asyncFunction(...args);

      setData(response);
      setLoading(false);

      if (options?.refreshAfterLoad) {
        refresh();
      }

      return response;
    } catch (error) {
      if (options?.suppressError !== false) {
        toast.error((error as Error).message);
      }
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    data,
    loading,
    error,
    callFetch,
  };
};

export default useFetch;
