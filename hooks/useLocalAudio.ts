import { Asset } from 'expo-asset';
import { createAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { Track, useAudioStore } from '../store/audioStore';

// Single shared AudioPlayer instance for the whole app
const sharedPlayer = createAudioPlayer(null, { updateInterval: 100 });

export const useLocalAudio = () => {
  const {
    setIsPlaying,
    setCurrentTime,
    setDuration,
    currentTrack,
    playlist,
    autoPlayNext,
    repeatMode
  } = useAudioStore();

  // Use the shared player so every hook call controls the same audio
  const player = sharedPlayer;
  const status = useAudioPlayerStatus(player);
  
  // Refs for state management
  const isSeekingRef = useRef(false);
  const currentTrackIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  // Update store state based on player status
  useEffect(() => {
    if (!status) return;

    // Only update position and duration - don't override isPlaying from manual controls
    if (status.currentTime !== undefined) {
      setCurrentTime(status.currentTime * 1000);
    }
    
    if (status.duration && status.duration > 0) {
      setDuration(status.duration * 1000);
    }

    // Sync isPlaying with status, except during manual operations
    if (!isSeekingRef.current && !isInitializingRef.current && status.playing !== undefined) {
      setIsPlaying(status.playing);
    }

    // Handle track end for auto-play next
    if (status.isLoaded && status.didJustFinish) {
      handleTrackEnd();
    }
  }, [status, setCurrentTime, setDuration, setIsPlaying]);

  const handleTrackEnd = async () => {
    console.log('Track ended, checking auto-play next...');
    if (repeatMode === 'one') {
      // Replay current track
      try {
        await seekTo(0);
        await play();
      } catch (error) {
        console.error('Error replaying track:', error);
      }
    } else {
      // Advance store index and immediately switch the underlying player
      autoPlayNext();
      const next = useAudioStore.getState().currentTrack;
      if (next) {
        console.log('AUTO NEXT: switching to track after end:', next.title);
        await switchToTrack(next, { autoPlay: true });
      }
    }
  };

  // Keep lock-screen / notification metadata in sync with the current track
  useEffect(() => {
    if (!currentTrack || !player) return;

    try {
      player.setActiveForLockScreen(true, {
        title: currentTrack.title,
        artist: currentTrack.artist,
      }, {
        showSeekBackward: true,
        showSeekForward: true,
      });
    } catch (error) {
      console.log('Error setting lock screen metadata:', error);
    }
  }, [currentTrack, player]);

  // Explicit track switching for next/prev buttons and track selection
  const switchToTrack = async (track: Track, options: { autoPlay?: boolean } = {}) => {
    const { autoPlay = false } = options;
    console.log('=== EXPLICIT TRACK SWITCH ===', track.title, 'autoPlay:', autoPlay);

    try {
      // Prevent overlapping switches
      if (isInitializingRef.current) {
        console.log('Switch already in progress, ignoring new request');
        return;
      }

      isInitializingRef.current = true;
      setIsPlaying(false);

      // Single clear stop before switching source
      if (player.playing) {
        console.log('SwitchToTrack: pausing current playback before switch');
        await player.pause();
        await new Promise(resolve => setTimeout(resolve, 120));
      }

      currentTrackIdRef.current = null;

      // Load new track source
      await initializePlayer(track);

      isInitializingRef.current = false;

      if (autoPlay) {
        console.log('SwitchToTrack: autoPlay enabled, starting play()');
        await play();
      } else {
        console.log('SwitchToTrack: track ready, not auto-playing');
      }
    } catch (error) {
      console.error('Error in switchToTrack:', error);
      isInitializingRef.current = false;
      setIsPlaying(false);
    }
  };

  const initializePlayer = async (trackOrId: string | Track) => {
    // Don't skip if already initializing - allow concurrent calls to proceed
    // The player will handle the replacement properly
    
    try {
      let track: Track | null = null;
      let trackId: string;
      
      // Handle both track object and track ID
      if (typeof trackOrId === 'string') {
        trackId = trackOrId;
        console.log('=== INITIALIZING PLAYER === (ID):', trackId);
        // Find track in playlist or currentTrack
        track = playlist.find((t: Track) => t.id === trackId) || 
                (currentTrack?.id === trackId ? currentTrack : null);
      } else {
        track = trackOrId;
        trackId = track.id;
        console.log('=== INITIALIZING PLAYER === (Object):', track.title, 'ID:', trackId);
      }
      
      if (!track) {
        console.log('Track not found:', trackId);
        console.log('Available tracks in playlist:', playlist.map(t => t.id));
        console.log('Current track ID:', currentTrack?.id);
        return;
      }

      // Stop any current player (don't worry about cleanup timing here)
      if (player) {
        try {
          await player.pause();
          // Don't replace with null - causes errors
        } catch (error) {
          console.log('Error during player cleanup:', error);
        }
      }

      // Get asset URI
      console.log('Getting asset for track:', track.title, 'URI:', track.uri);
      const asset = Asset.fromModule(track.uri);
      console.log('Asset created:', asset);
      await asset.downloadAsync();
      const source = asset.uri || asset.localUri;
      console.log('Asset source resolved:', source);

      if (!source) {
        console.log('Could not resolve track source');
        return;
      }

      console.log('Loading track source:', source);
      console.log('Previous track ID:', currentTrackIdRef.current);
      
      // Replace player source
      console.log('Calling player.replace with source...');
      await player.replace(source);
      currentTrackIdRef.current = trackId;
      console.log('Player source replaced, currentTrackIdRef set to:', currentTrackIdRef.current);
      
      // Wait for player to be ready - check both status and a minimum time
      let attempts = 0;
      const startTime = Date.now();
      while (attempts < 10 && (!player?.isLoaded || (Date.now() - startTime) < 100)) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
        console.log(`Waiting for player to be ready, attempt ${attempts}, loaded: ${!!player?.isLoaded}, time: ${Date.now() - startTime}ms`);
      }
      
      console.log('Player initialized successfully for:', track.title, 'ID:', trackId, 'Ready:', !!player?.isLoaded);

    } catch (error) {
      console.error('Error initializing player:', error);
    } finally {
      // Don't set isInitializingRef here - let switchToTrack handle it
    }
  };

  const play = async () => {
    try {
      console.log('=== PLAY FUNCTION CALLED ===');
      console.log('Player exists:', !!player, 'Player instance:', player, 'Status loaded:', !!status?.isLoaded, 'Current track ID:', currentTrackIdRef.current);
      
      if (!player) {
        console.log('No player available');
        return false;
      }

      // If no track is loaded, check if we have a current track from store
      if (!player?.isLoaded && !currentTrackIdRef.current) {
        // Check if we have a current track that should be loaded
        if (currentTrack) {
          console.log('No player loaded but have current track, attempting to initialize...');
          await initializePlayer(currentTrack);
          
          // Wait a bit for initialization
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check again
          if (!player?.isLoaded && !currentTrackIdRef.current) {
            console.log('Still no track loaded after initialization attempt');
            return false;
          }
        } else {
          console.log('No track loaded, cannot play');
          return false;
        }
      }

      console.log('Starting playback...');

      // Ensure we never have overlapping playback
      if (player.playing) {
        console.log('Player already playing, forcing stop before new play');
        await player.pause();
        await new Promise(resolve => setTimeout(resolve, 120));
      }

      await player.play();
      setIsPlaying(true);

      // Ensure lock-screen controls are active once playback starts
      try {
        if (currentTrack) {
          player.setActiveForLockScreen(true, {
            title: currentTrack.title,
            artist: currentTrack.artist,
          }, {
            showSeekBackward: true,
            showSeekForward: true,
          });
        }
      } catch (error) {
        console.log('Error enabling lock screen controls on play:', error);
      }
      
      console.log('Play successful');
      return true;
    } catch (error) {
      console.error('Error playing audio:', error);
      isInitializingRef.current = false;
      return false;
    }
  };

  const pause = async () => {
    try {
      console.log('=== PAUSE FUNCTION CALLED ===');
      console.log('Player exists:', !!player, 'Status loaded:', !!status?.isLoaded, 'Status playing:', status?.playing);
      console.log('Player instance status - playing:', player?.playing, 'loaded:', player?.isLoaded);
      
      if (!player) {
        console.log('No player available');
        setIsPlaying(false);
        return true;
      }

      console.log('Pausing player...');
      const wasPlayingBefore = player?.playing;
      
      // Use the player instance directly for more reliable control
      await player.pause();
      
      console.log('After pause - was playing before:', wasPlayingBefore, 'now playing:', player?.playing);
      console.log('After pause - Status playing:', status?.playing);
      
      setIsPlaying(false);
      
      console.log('Player paused successfully');
      return true;
    } catch (error) {
      console.error('Error pausing audio:', error);
      setIsPlaying(false);
      return false;
    }
  };

  const seekTo = async (positionMs: number) => {
    try {
      console.log('=== SEEK FUNCTION CALLED ===', positionMs);
      
      if (!player || !player?.isLoaded) {
        console.log('Player not ready for seeking');
        return;
      }

      isSeekingRef.current = true;
      
      // Pause first to prevent audio overlap during seeking
      const wasPlaying = player?.playing;
      if (wasPlaying) {
        await player.pause();
      }

      // Seek to position (convert from ms to seconds)
      await player.seekTo(positionMs / 1000);
      setCurrentTime(positionMs);

      // Resume if was playing
      if (wasPlaying) {
        await player.play();
        setIsPlaying(true);
      }

      // Clear seeking flag after a delay
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 300);

      console.log('Seek completed');
      
    } catch (error) {
      console.error('Error seeking:', error);
      isSeekingRef.current = false;
    }
  };

  const togglePlayPause = async () => {
    console.log('=== TOGGLE PLAY/PAUSE ===', { isPlaying: status?.playing });
    
    if (status?.playing) {
      await pause();
    } else {
      await play();
    }
  };

  return {
    initializePlayer,
    play,
    pause,
    seekTo,
    togglePlayPause,
    setPlaybackRate: async (rate: number) => {
      try {
        if (player && status?.isLoaded) {
          player.setPlaybackRate(rate);
          console.log('Playback rate set to:', rate);
        }
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    },
    isPlayerReady: !!player?.isLoaded,
    player,
    status,
    switchToTrack
  };
};
