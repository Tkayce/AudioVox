

import { Asset } from 'expo-asset';
import { createAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useMemo } from 'react';
import { Track, useAudioStore } from '../store/audioStore';

const player = createAudioPlayer(null, { updateInterval: 150 });
const assetCache = new Map<number, string>();

const runtime = {
  isSeeking: false,
  currentTrackId: null as string | null,
  isInitializing: false,
  switchRequestId: 0,
  bufferingToken: 0,
  lastProgressUpdate: 0,
  lastDurationValue: 0,
};

const syncBufferingState = (value: boolean) => {
  const store = useAudioStore.getState();
  if (store.isBuffering !== value) {
    store.setIsBuffering(value);
  }
};

const beginBuffering = () => {
  const token = runtime.bufferingToken + 1;
  runtime.bufferingToken = token;
  syncBufferingState(true);
  return token;
};

const endBuffering = (token: number) => {
  if (runtime.bufferingToken === token) {
    syncBufferingState(false);
  }
};

const resolveTrackFromInput = (trackOrId: string | Track): Track | null => {
  const { playlist, currentTrack } = useAudioStore.getState();
  if (typeof trackOrId === 'string') {
    return (
      playlist.find((t) => t.id === trackOrId) ||
      (currentTrack?.id === trackOrId ? currentTrack : null) ||
      null
    );
  }
  return trackOrId ?? null;
};

const resolveTrackSource = async (track: Track): Promise<string | null> => {
  if (typeof track.uri === 'number') {
    if (assetCache.has(track.uri)) {
      return assetCache.get(track.uri) ?? null;
    }
    const asset = Asset.fromModule(track.uri);
    await asset.downloadAsync();
    const resolved = asset.localUri || asset.uri || null;
    if (resolved) {
      assetCache.set(track.uri, resolved);
    }
    return resolved;
  }
  if (typeof track.uri === 'string') {
    return track.uri;
  }
  return null;
};

const stopAndResetPlayer = async () => {
  try {
    if (player?.isLoaded) {
      await player.pause();
      await player.seekTo(0);
    }
  } catch {
    // ignore
  } finally {
    const { setIsPlaying, setCurrentTime, setDuration } = useAudioStore.getState();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    runtime.currentTrackId = null;
    runtime.isSeeking = false;
    runtime.lastProgressUpdate = 0;
    runtime.lastDurationValue = 0;
    runtime.bufferingToken += 1;
    syncBufferingState(false);
  }
};

const initializePlayer = async (trackOrId: string | Track): Promise<boolean> => {
  try {
    const track = resolveTrackFromInput(trackOrId);
    if (!track) {
      return false;
    }

    try {
      if (player?.isLoaded || player?.playing) {
        await player.pause();
      }
    } catch {
      // ignore pause errors while reloading
    }

    const source = await resolveTrackSource(track);
    if (!source) {
      return false;
    }

    await player.replace(source);
    runtime.currentTrackId = track.id;

    let attempts = 0;
    const startTime = Date.now();
    while (attempts < 10 && (!player?.isLoaded || Date.now() - startTime < 80)) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      attempts++;
    }

    return true;
  } catch {
    return false;
  }
};

const switchToTrack = async (track: Track, options: { autoPlay?: boolean } = {}) => {
  const { autoPlay = false } = options;
  const requestId = ++runtime.switchRequestId;
  const bufferToken = beginBuffering();

  try {
    runtime.isInitializing = true;
    const { setIsPlaying, setCurrentTime, setDuration } = useAudioStore.getState();
    setIsPlaying(false);
    const initialDuration = track.duration || 0;
    setCurrentTime(0);
    setDuration(initialDuration);
    runtime.lastProgressUpdate = 0;
    runtime.lastDurationValue = initialDuration;
    runtime.currentTrackId = null;

    const loaded = await initializePlayer(track);
    if (!loaded || runtime.switchRequestId !== requestId) {
      return;
    }

    if (autoPlay) {
      await play({ skipBuffering: true });
    }
  } catch {
    useAudioStore.getState().setIsPlaying(false);
  } finally {
    if (runtime.switchRequestId === requestId) {
      runtime.isInitializing = false;
      endBuffering(bufferToken);
    }
  }
};

const play = async (options?: { skipBuffering?: boolean }) => {
  const { skipBuffering = false } = options ?? {};
  const bufferToken = skipBuffering ? null : beginBuffering();

  try {
    if (!player) {
      return false;
    }

    const { currentTrack, setIsPlaying } = useAudioStore.getState();

    if (!player?.isLoaded && !runtime.currentTrackId) {
      if (currentTrack) {
        const initialized = await initializePlayer(currentTrack);
        if (!initialized) {
          return false;
        }
      } else {
        return false;
      }
    }

    if (player.playing) {
      await player.pause();
      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    await player.play();
    setIsPlaying(true);

    if (currentTrack) {
      try {
        player.setActiveForLockScreen(
          true,
          {
            title: currentTrack.title,
            artist: currentTrack.artist,
          },
          {
            showSeekBackward: true,
            showSeekForward: true,
          }
        );
      } catch {
        // ignore
      }
    }

    return true;
  } catch {
    return false;
  } finally {
    if (!skipBuffering && bufferToken) {
      endBuffering(bufferToken);
    }
  }
};

const pause = async () => {
  try {
    if (!player) {
      useAudioStore.getState().setIsPlaying(false);
      return true;
    }

    await player.pause();
    useAudioStore.getState().setIsPlaying(false);
    return true;
  } catch {
    useAudioStore.getState().setIsPlaying(false);
    return false;
  }
};

const seekTo = async (positionMs: number) => {
  const bufferToken = beginBuffering();
  try {
    if (!player || !player?.isLoaded) {
      endBuffering(bufferToken);
      return;
    }

    runtime.isSeeking = true;
    const wasPlaying = player.playing;
    if (wasPlaying) {
      await player.pause();
    }

    const clamped = Math.max(0, positionMs);
    await player.seekTo(clamped / 1000);
    useAudioStore.getState().setCurrentTime(clamped);
    runtime.lastProgressUpdate = clamped;

    if (wasPlaying) {
      await player.play();
      useAudioStore.getState().setIsPlaying(true);
    }
  } catch {
    // ignore
  } finally {
    runtime.isSeeking = false;
    endBuffering(bufferToken);
  }
};

const togglePlayPause = async () => {
  if (player?.playing) {
    await pause();
  } else {
    await play();
  }
};

const handleTrackEnd = async () => {
  const { repeatMode, autoPlayNext, currentIndex } = useAudioStore.getState();
  if (repeatMode === 'one') {
    await seekTo(0);
    await play();
    return;
  }

  const previousIndex = currentIndex;
  autoPlayNext();
  const { currentTrack, currentIndex: nextIndex } = useAudioStore.getState();
  if (currentTrack && nextIndex !== previousIndex) {
    void switchToTrack(currentTrack, { autoPlay: true });
  } else {
    await stopAndResetPlayer();
  }
};

const setPlaybackRate = async (rate: number) => {
  try {
    if (player && player.isLoaded) {
      player.setPlaybackRate(rate);
      useAudioStore.getState().setPlaybackRate(rate);
    }
  } catch {
    // ignore
  }
};

export const useLocalAudio = () => {
  return useMemo(
    () => ({
      initializePlayer,
      play,
      pause,
      seekTo,
      togglePlayPause,
      setPlaybackRate,
      switchToTrack,
      player,
      isPlayerReady: () => !!player?.isLoaded,
    }),
    []
  );
};

export const AudioStatusBridge = () => {
  const status = useAudioPlayerStatus(player);
  const currentTrack = useAudioStore((state) => state.currentTrack);

  useEffect(() => {
    if (!status) return;

    if (status.currentTime !== undefined) {
      const newTime = Math.max(0, status.currentTime * 1000);
      if (Math.abs(newTime - runtime.lastProgressUpdate) >= 200) {
        runtime.lastProgressUpdate = newTime;
        useAudioStore.getState().setCurrentTime(newTime);
      }
    }

    if (status.duration && status.duration > 0) {
      const newDuration = status.duration * 1000;
      if (Math.abs(newDuration - runtime.lastDurationValue) >= 500) {
        runtime.lastDurationValue = newDuration;
        useAudioStore.getState().setDuration(newDuration);
      }
    }

    if (!runtime.isSeeking && !runtime.isInitializing && status.playing !== undefined) {
      const store = useAudioStore.getState();
      if (store.isPlaying !== status.playing) {
        store.setIsPlaying(status.playing);
      }
    }

    if (status.isLoaded && status.didJustFinish) {
      void handleTrackEnd();
    }
  }, [status]);

  useEffect(() => {
    if (!currentTrack || !player) return;

    try {
      player.setActiveForLockScreen(
        true,
        {
          title: currentTrack.title,
          artist: currentTrack.artist,
        },
        {
          showSeekBackward: true,
          showSeekForward: true,
        }
      );
    } catch {
      // ignore
    }
  }, [currentTrack]);

  return null;
};
