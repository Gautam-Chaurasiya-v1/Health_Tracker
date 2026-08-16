import { useEffect } from 'react';
import { useMediaStore } from '../stores/useMediaStore';
import { MediaContext } from '../../../shared/types/enums';

export const useMediaStorage = (context: MediaContext, filterId?: string) => {
  const mediaList = useMediaStore((s) => s.mediaList);
  const isLoading = useMediaStore((s) => s.isLoading);
  const loadMediaByContext = useMediaStore((s) => s.loadMediaByContext);
  const captureMedia = useMediaStore((s) => s.captureMedia);
  const deleteMedia = useMediaStore((s) => s.deleteMedia);

  useEffect(() => {
    loadMediaByContext(context, filterId);
  }, [context, filterId, loadMediaByContext]);

  return {
    mediaList,
    isLoading,
    captureMedia,
    deleteMedia,
    refresh: () => loadMediaByContext(context, filterId),
  };
};
