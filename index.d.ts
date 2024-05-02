declare module 'i18next-mf2' {
  import { i18n, ThirdPartyModule } from 'i18next'

  /**
   * @see https://github.com/yahoo/intl-messageformat#user-defined-formats
   * @see https://github.com/i18next/i18next-mf2/issues/12#issuecomment-578893063
   */
  // prettier-ignore
  export interface Mf2Formats {
    number?: {
      [styleName: string]: Intl.NumberFormatOptions;
    },
    date?: {
      [styleName: string]: Intl.DateTimeFormatOptions;
    },
    time?: {
      [styleName: string]: Intl.DateTimeFormatOptions;
    }
  }

  export interface Mf2Config {
    memoize?: boolean
    memoizeFallback?: boolean
    formats?: Mf2Formats
    bindI18n?: string
    bindI18nStore?: string
    parseErrorHandler?: (
      err: Error,
      key: string,
      res: string,
      options: Object
    ) => string
    parseLngForMf2?: (lng: string) => string
  }

  export interface Mf2Instance<TOptions = Mf2Config> extends ThirdPartyModule {
    init(i18next: i18n, options?: TOptions): void
    addUserDefinedFormats(formats: Mf2Formats): void
    clearCache(): void
  }

  interface Mf2Constructor {
    new (config?: Mf2Config): Mf2Instance
    type: 'i18nFormat'
  }

  const Mf2: Mf2Constructor
  export default Mf2
}
