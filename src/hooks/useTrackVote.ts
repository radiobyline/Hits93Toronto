import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { voteService } from "../services/voteService";
import type { Track, VoteDirection } from "../types";

interface TrackVoteState {
  voteKey: string;
  currentVote: VoteDirection | null;
  canVote: boolean;
  isSubmitting: boolean;
  voteNote: string;
  castVote: (direction: VoteDirection) => void;
}

export function useTrackVote(track: Track | null): TrackVoteState {
  const [voteNote, setVoteNote] = useState("");
  const [voteRevision, setVoteRevision] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const noteTimeoutRef = useRef<number | undefined>();

  const voteKey = useMemo(() => {
    if (!track) {
      return "";
    }

    return `${track.allMusicId ?? track.key}:${track.startMs}`;
  }, [track]);

  const currentVote = useMemo(() => {
    if (!voteKey) {
      return null;
    }

    return voteService.getVote(voteKey);
  }, [voteKey, voteRevision]);

  const canVote = Boolean(track?.allMusicId) && !currentVote && !isSubmitting;

  const showVoteNote = useCallback((message: string) => {
    if (noteTimeoutRef.current) {
      window.clearTimeout(noteTimeoutRef.current);
      noteTimeoutRef.current = undefined;
    }

    setVoteNote(message);
    if (!message) {
      return;
    }

    noteTimeoutRef.current = window.setTimeout(() => {
      setVoteNote("");
      noteTimeoutRef.current = undefined;
    }, 5000);
  }, []);

  useEffect(() => {
    if (noteTimeoutRef.current) {
      window.clearTimeout(noteTimeoutRef.current);
      noteTimeoutRef.current = undefined;
    }
    setVoteNote("");
    setIsSubmitting(false);
  }, [voteKey]);

  useEffect(() => {
    return () => {
      if (noteTimeoutRef.current) {
        window.clearTimeout(noteTimeoutRef.current);
      }
    };
  }, []);

  const castVote = useCallback(
    (direction: VoteDirection) => {
      if (!voteKey || !track?.allMusicId) {
        showVoteNote("Track id unavailable for voting.");
        return;
      }

      const existingVote = voteService.getVote(voteKey);
      if (existingVote) {
        showVoteNote("You have already voted. Thanks for sharing your thoughts on this track.");
        return;
      }

      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      showVoteNote("");

      const submit =
        direction === "up"
          ? voteService.voteUp(voteKey, track.allMusicId)
          : voteService.voteDown(voteKey, track.allMusicId);

      void submit
        .then((result) => {
          setIsSubmitting(false);

          if (result.accepted || voteService.getVote(voteKey)) {
            // Recompute currentVote from session storage without showing a note.
            setVoteRevision((previous) => previous + 1);
            showVoteNote("");
            return;
          }

          showVoteNote(result.note);
        })
        .catch((error) => {
          setIsSubmitting(false);
          showVoteNote(error instanceof Error ? error.message : "Vote failed.");
        });
    },
    [voteKey, track, isSubmitting, showVoteNote]
  );

  return {
    voteKey,
    currentVote,
    canVote,
    isSubmitting,
    voteNote,
    castVote
  };
}
