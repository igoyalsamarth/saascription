import { useAuth } from '@clerk/clerk-react';
import ky, { type BeforeRequestState } from 'ky';
import { useMemo } from 'react';

export const useClient = () => {
  const { getToken } = useAuth();

  const client = useMemo(() => {
    return ky.extend({
      prefix: import.meta.env.VITE_API_URL ?? 'http://localhost:8787/api/v1',
      hooks: {
        beforeRequest: [
          async (ctx: BeforeRequestState) => {
            const token = await getToken?.();
            if (token) {
              ctx.request?.headers.set('Authorization', `Bearer ${token}`);
            }
          },
        ],
      },
    });
  }, [getToken]);

  return client;
};