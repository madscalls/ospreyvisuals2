import { useEffect, useState } from 'react';
import { loadPortfolio } from '../services/portfolio';

/** { loading, data: { covers, items } }: the portfolio shared by the Work page and the galleries. */
export function usePortfolio() {
  const [state, setState] = useState({ loading: true, data: { covers: {}, items: [] } });

  useEffect(() => {
    let live = true;
    loadPortfolio().then((data) => live && setState({ loading: false, data }));
    return () => {
      live = false;
    };
  }, []);

  return state;
}
