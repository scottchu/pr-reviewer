export const createRegistry = () => {
  const routes = new Map<
    string,
    { scope: string; dispose: () => void; cursor: number }
  >();
  const register = (
    id: string,
    scope: string,
    authorized: () => boolean,
    receive: () => void,
  ) => {
    if (routes.has(id)) throw new Error("duplicate_route");
    let active = true;
    const dispose = () => {
      if (!active) return;
      active = false;
      routes.delete(id);
    };
    const record = { scope, dispose, cursor: 0 };
    routes.set(id, record);
    return {
      emit: () => {
        if (!active || !authorized()) return;
        record.cursor++;
        receive();
      },
      dispose,
    };
  };
  return {
    register,
    revoke: (scope: string) => {
      for (const route of routes.values())
        if (route.scope === scope) route.dispose();
    },
    dispose: () => {
      for (const route of routes.values()) route.dispose();
    },
    diagnostics: () =>
      Array.from(routes, ([id, r]) => ({
        id,
        scope: r.scope,
        cursor: r.cursor,
      })),
  };
};
