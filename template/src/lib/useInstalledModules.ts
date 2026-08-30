"use client";

import { useEffect, useState } from "react";

export function useInstalledModules() {
  const [modules, setModules] = useState<string[] | null>(null);
    
  useEffect(() => {
    fetch("/api/system/modules")
      .then((res) => res.json())
      .then((data) => setModules(data.modules ?? []))
      .catch(() => setModules([]));
  }, []);

  return modules; // null while loading,    array once loaded
}