declare module 'split-type' {
  interface SplitTypeOptions {
    types?: string;
    tagName?: string;
    wordClass?: string;
    charClass?: string;
    lineClass?: string;
    absolute?: boolean;
    position?: boolean;
  }
  export default class SplitType {
    constructor(element: string | HTMLElement, options?: SplitTypeOptions);
    words: HTMLElement[];
    chars: HTMLElement[];
    lines: HTMLElement[];
    revert(): void;
  }
}
