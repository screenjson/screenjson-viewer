// Viewer-local facade for the pieces used from screenjson-ui.
//
// Tauri's WebKit runtime can reject the upstream public barrel while Vite is
// serving source modules because that barrel exposes a default re-export. The
// native viewer only uses named exports, so import the concrete source modules
// directly and avoid creating any `default` export on this facade.

import {
  collectDocumentLanguages,
  getLanguageOption,
  getLanguageOptions,
  getUiStrings
} from '../../../node_modules/screenjson-ui/src/lib/i18n/languages';

export { collectDocumentLanguages, getLanguageOption, getLanguageOptions, getUiStrings };

export { default as ScreenJSONViewer } from '../../../node_modules/screenjson-ui/src/lib/components/Viewer.svelte';
export { default as TitlePage } from '../../../node_modules/screenjson-ui/src/lib/components/TitlePage.svelte';

export { paginate } from '../../../node_modules/screenjson-ui/src/lib/services/paginator';
export type {
  Page as PageData,
  PaginatedElement,
  PaginationResult
} from '../../../node_modules/screenjson-ui/src/lib/services/paginator';

export {
  validateDocument,
  isScreenJSONDocument,
  formatValidationErrors
} from '../../../node_modules/screenjson-ui/src/lib/validation/validator';
export type {
  ValidationResult,
  ValidationError
} from '../../../node_modules/screenjson-ui/src/lib/validation/validator';

export {
  hasEncryptedContent,
  decryptDocument,
  decryptText
} from '../../../node_modules/screenjson-ui/src/lib/services/crypto';

export type { LanguageOption, UiStrings } from '../../../node_modules/screenjson-ui/src/lib/i18n/languages';

export type {
  ScreenJSONDocument,
  Scene,
  SceneElement,
  ActionElement,
  DialogueElement,
  CharacterCueElement,
  ParentheticalElement,
  TransitionElement,
  ShotElement,
  GeneralElement,
  Slugline,
  Author,
  Character,
  Bookmark,
  Note,
  Lang,
  Text,
  Name,
  UUID
} from '../../../node_modules/screenjson-ui/src/lib/types/screenjson';
