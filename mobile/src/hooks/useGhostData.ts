import { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../db';
import ExerciseGhostCache from '../db/models/ExerciseGhostCache';
import { GhostSnapshot } from '../../../shared/types/entities';
import { useGhostStore } from '../stores/useGhostStore';

export function useGhostData(exerciseId: string | null | undefined): GhostSnapshot | null {
  const memSnapshot = useGhostStore((s) => (exerciseId && s?.cache ? s.cache[exerciseId] ?? null : null));
  const [dbSnapshot, setDbSnapshot] = useState<GhostSnapshot | null>(null);

  useEffect(() => {
    if (!exerciseId) {
      setDbSnapshot(null);
      return;
    }

    try {
      // Check WatermelonDB reactive subscription
      const ghostCollection = database.get<ExerciseGhostCache>('exercise_ghost_cache');
      const query = ghostCollection.query(Q.where('exercise_id', exerciseId));

      const subscription = query.observe().subscribe((records) => {
        if (records && records.length > 0) {
          const record = records[0];
          try {
            const parsedSets = typeof record.setsSnapshot === 'string'
              ? JSON.parse(record.setsSnapshot)
              : record.setsSnapshot;
            const snap: GhostSnapshot = {
              sessionDate: record.sessionDate,
              sets: Array.isArray(parsedSets) ? parsedSets : [],
              totalVolume: record.totalVolume || 0,
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

      return () => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    } catch (err) {
      console.warn('Ghost cache subscription error:', err);
    }
  }, [exerciseId]);

  return memSnapshot || dbSnapshot;
}
