import { useCallback, useEffect, useMemo, useState } from "react";
import { voteService } from "../services/voteService";
import type { Track, VoteDirection } from "../types";

interface TrackVoteState {
  voteKey: string;
  currentVote: VoteDirection | null;
  canVote: boolean;
  voteNote: string;
  castVote: (direction: VoteDirection) => void;
}

export function useTrackVote(track: Track | null): TrackVoteState {
  const [voteNote, setVoteNote] = useState("");
  const [voteRevision, setVoteRevision] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    setVoteNote("");
    setIsSubmitting(false);
  }, [voteKey]);

  const castVote = useCallback(
    (direction: VoteDirection) => {
      if (!voteKey || !track?.allMusicId) {
        setVoteNote("Track id unavailable for voting.");
        return;
      }

      const existingVote = voteService.getVote(voteKey);
      if (existingVote) {
        setVoteNote("Thanks for sharing your thoughts on this track!");
        return;
      }

      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      setVoteNote("");

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
            setVoteNote("");
            return;
          }

          setVoteNote(result.note);
        })
        .catch((error) => {
          setIsSubmitting(false);
          setVoteNote(error instanceof Error ? error.message : "Vote failed.");
        });
    },
    [voteKey, track, isSubmitting]
  );

  return {
    voteKey,
    currentVote,
    canVote,
    voteNote,
    castVote
  };
}
