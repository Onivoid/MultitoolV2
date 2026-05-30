export interface LocalCharacterActions {
  deleteCharacter: (path: string) => Promise<boolean>;
  duplicateCharacter: (path: string, onSuccess?: () => void) => Promise<void>;
  openCharactersFolder: (path: string) => Promise<void>;
  showDuplicateError: () => void;
}
