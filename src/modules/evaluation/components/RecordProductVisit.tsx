"use client";

import * as React from "react";
import { useRecentlyViewed } from "../lib/recentActivity";

/**
 * Não renderiza nada — só grava a visita no histórico local ao montar.
 * Componente client separado (em vez de lógica na página, que é Server
 * Component) para manter o resto de `/creatina/[slug]` sem JS.
 */
export function RecordProductVisit({ slug }: { slug: string }) {
  const { push } = useRecentlyViewed();
  const pushRef = React.useRef(push);
  pushRef.current = push;

  React.useEffect(() => {
    // Só quando o slug muda (navegar para outro produto) — `pushRef` é
    // uma ref (não reativa), por isso não entra nas deps: incluir
    // `push` diretamente causaria loop, já que ele é recriado a cada
    // render de `useLocalStorageList`.
    pushRef.current({ slug, viewedAt: Date.now() });
  }, [slug]);

  return null;
}
