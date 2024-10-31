export interface Signal<T> {
  value: T;
  onNext(callback: (val: T, prev: T) => void): () => void;
}

export interface UserAvatar {
  userId?: string;
  username?: string;
  displayName?: string;
  isAnonymous?: boolean;
  url: string;
  urlCompressed?: string;
}

export interface SpacePermission {
  blocked: boolean;
  error?: string;
}

export interface AudioSettings {
  volumeBG: number;
  volume: number;
  muted: boolean;
}

export interface GameSignals {
  userAvatar$?: Signal<UserAvatar>;
  spacePermission$?: Signal<SpacePermission>;
  audioSettings$?: Signal<AudioSettings>;
}
