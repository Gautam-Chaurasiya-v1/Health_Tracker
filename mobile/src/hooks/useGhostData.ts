import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import ExerciseGhostCache from '../db/models/ExerciseGhostCache';
import { GhostSnapshot } from '../../../shared/types/entities';
import { useGhostStore } from '../stores/useGhostStore';

export function useGhostData(exerciseId: string | null | undefined): GhostSnapshot | null {
  const memSnapshot = exerciseId ? useGhostStore((s) => s.cache[exerciseId]) || null : null;
  const [dbSnapshot, setDbSnapshot] = useState<GhostSnapshot | null>(null);

  useEffect(() => {
    if (!exerciseId) {
      setDbSnapshot(null);
      return;
    }

    // Check WatermelonDB reactive subscription
    const ghostCollection = database.collections.get<ExerciseGhostCache>('exercise_ghost_cache');
    const query = ghostCollection.query(Q.where('exercise_id', exerciseId));

    const subscription = query.observe().subscribe((records) => {
      if (records && records.length > 0) {
        const record = records[0];
        try {
          const parsedSets = JSON.parse(record.setsSnapshot);
          const snap: GhostSnapshot = {
            sessionDate: record.sessionDate,
            sets: parsedSets,
            totalVolume: record.totalVolume,
          };
          useGhostStore.getState().updateCache(exerciseId, snap);
          setDbSnapshot(snap);
        } catch (e) {
          console.error('Failed to parse ghost sets snapshot:', e);
        }
      } else {
        setDbSnapshot(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [exerciseId]);

  return memSnapshot || dbSnapshot;
}
