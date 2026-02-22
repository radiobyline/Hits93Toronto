import { buildApiUrl } from "./apiClient";
import type { VoteDirection } from "../types";

const VOTE_STORAGE_KEY = "hits93toronto:votes";

interface VoteMap {
  [trackKey: string]: VoteDirection;
}

interface VoteApiResponse {
  up?: number;
  down?: number;
  result?: string;
}

interface VoteResult {
  accepted: boolean;
  note: string;
}

function readVotes(): VoteMap {
  try {
    const rawValue = sessionStorage.getItem(VOTE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    return JSON.parse(rawValue) as VoteMap;
  } catch {
    return {};
  }
}

function writeVotes(votes: VoteMap): void {
  sessionStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votes));
}

function setVote(trackKey: string, direction: VoteDirection): void {
  const votes = readVotes();
  votes[trackKey] = direction;
  writeVotes(votes);
}

function formatVoteResultMessage(payload: VoteApiResponse): string {
  const up = typeof payload.up === "number" ? payload.up : null;
  const down = typeof payload.down === "number" ? payload.down : null;

  if (up === null || down === null) {
    return "Vote recorded.";
  }

  return `Vote recorded. Up ${up} / Down ${down}.`;
}

async function submitVote(
  trackKey: string,
  direction: VoteDirection,
  allMusicId: number
): Promise<VoteResult> {
  if (readVotes()[trackKey]) {
    return {
      accepted: false,
      note: "Vote already recorded in this browser session."
    };
  }

  const action = direction === "up" ? "like" : "dislike";
  const response = await fetch(buildApiUrl(`/music/${allMusicId}/${action}/`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: "{}"
  });

  let payload: VoteApiResponse = {};
  try {
    payload = (await response.json()) as VoteApiResponse;
  } catch {
    payload = {};
  }

  if (response.ok) {
    setVote(trackKey, direction);
    return {
      accepted: true,
      note: formatVoteResultMessage(payload)
    };
  }

  if (payload.result === "already_voted") {
    setVote(trackKey, direction);
    return {
      accepted: false,
      note: "Server reports this track has already been voted from this client."
    };
  }

  return {
    accepted: false,
    note: `Vote failed (${response.status}).`
  };
}

export const voteService = {
  getVote(trackKey: string): VoteDirection | null {
    const votes = readVotes();
    return votes[trackKey] ?? null;
  },

  hasVoted(trackKey: string): boolean {
    return Boolean(this.getVote(trackKey));
  },

  async voteUp(trackKey: string, allMusicId: number): Promise<VoteResult> {
    return submitVote(trackKey, "up", allMusicId);
  },

  async voteDown(trackKey: string, allMusicId: number): Promise<VoteResult> {
    return submitVote(trackKey, "down", allMusicId);
  }
};
