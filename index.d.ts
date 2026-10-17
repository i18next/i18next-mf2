declare module 'i18next-mf2' {
  import { i18n, ThirdPartyModule } from 'i18next';
  import { MessageFunction } from 'messageformat/functions';

  export interface MF2Config {
    memoize?: boolean;
    memoizeFallback?: boolean;
    bindI18n?: string;
    bindI18nStore?: string;
    mf2DraftFunctions?: boolean;
    mf2Functions?: Record<string, MessageFunction<string>>;
    /** Set to 'none' to drop the U+2068/U+2069 isolation marks around placeholders. */
    bidiIsolation?: 'default' | 'none';
    parseErrorHandler?: (err: Error, key: string, msgsrc: string, options: Object) => string;
    parseLngForMf2?: (lng: string) => string;
    /** @deprecated use parseLngForMf2 */
    parseLngForMF2?: (lng: string) => string;
  }

  export interface MF2Instance<TOptions = MF2Config> extends ThirdPartyModule {
    init(i18next: i18n, options?: TOptions): void;
    clearCache(): void;
  }

  interface Mf2Constructor {
    new (config?: MF2Config): MF2Instance;
    type: 'i18nFormat';
  }

  const Mf2: Mf2Constructor;
  export default Mf2;
}
