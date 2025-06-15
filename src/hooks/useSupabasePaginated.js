import { useState, useEffect, useCallback } from 'react';

export function useSupabasePaginated(queryFn, { deps = [], limit = 12 } = {}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (pageIndex) => {
      setLoading(true);
      const { data: results, error } = await queryFn(limit, pageIndex * limit);
      if (error) {
        console.error('Supabase query error:', error);
        setLoading(false);
        return;
      }
      if (pageIndex === 0) {
        setData(results);
      } else {
        setData((prev) => [...prev, ...results]);
      }
      if (!results || results.length < limit) {
        setHasMore(false);
      }
      setLoading(false);
    },
    [queryFn, limit]
  );

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPage(0);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    fetchPage(nextPage);
    setPage(nextPage);
  }, [fetchPage, hasMore, loading, page]);

  return { data, loadMore, loading, hasMore };
}
