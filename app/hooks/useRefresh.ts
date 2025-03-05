import { useLocation, useNavigate } from "react-router";
import { useCallback } from "react";

const useRefresh = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const refresh = useCallback(() => {
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      preventScrollReset: true,
    });
  }, [navigate, location.pathname, location.search]);

  return refresh;
};

export default useRefresh;
