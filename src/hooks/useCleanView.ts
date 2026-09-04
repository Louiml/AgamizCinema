import { useEffect, useRef, type RefObject } from "react";

export function useCleanView(
  active: boolean,
  iframeRef?: RefObject<HTMLIFrameElement | null>,
): void {
  const iframeRefRef = useRef(iframeRef);
  iframeRefRef.current = iframeRef;

  useEffect(() => {
    const target = iframeRefRef.current?.current;
    if (!target) return;

    const post = (value: boolean) => {
      try {
        target.contentWindow?.postMessage({ __agamizCleanView: value }, "*");
      } catch {
        /* cross-origin safety — ignore */
      }
    };

    post(active);

    return () => {
      post(false);
    };
  }, [active]);
}