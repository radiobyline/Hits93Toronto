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
  }, [voteKey, voteNote]);

  const canVote = Boolean(track?.allMusicId) && !currentVote;

  useEffect(() => {
    setVoteNote("");
  }, [voteKey]);

  const castVote = useCallback(
    (direction: VoteDirection) => {
      if (!voteKey || !track?.allMusicId) {
        setVoteNote("Track id unavailable for voting.");
        return;
      }

      const submit =
        direction === "up"
          ? voteService.voteUp(voteKey, track.allMusicId)
          : voteService.voteDown(voteKey, track.allMusicId);

      void submit.then((result) => {
        setVoteNote(result.note);
      });
    },
    [voteKey, track]
  );

  return {
    voteKey,
    currentVote,
    canVote,
    voteNote,
    castVote
  };
}
